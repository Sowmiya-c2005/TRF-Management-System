"""
File Service — uses the configured storage root from storage_service.
All file paths are resolved via get_storage_root(db) so they
automatically use whatever the Admin has configured in Settings.
"""
import os
import mimetypes
from typing import Optional

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from backend.models.file_model import FileRecord, FileVersion
from backend.models.folder_model import Folder
from backend.models.user_model import User
from backend.repositories.file_repository import FileRepository
from backend.repositories.folder_repository import FolderRepository
from backend.repositories.trf_repository import TRFRepository
from backend.services.sharepoint_service import SharePointService
from backend.services import audit_service, notification_service
from backend.services.storage_service import get_storage_root
from backend.utils.logging_config import get_logger

logger = get_logger("file_service")

file_repo          = FileRepository()
folder_repo        = FolderRepository()
trf_repo           = TRFRepository()
sharepoint_service = SharePointService()

ALLOWED_EXTENSIONS = {
    "pdf","doc","docx","xls","xlsx","ppt","pptx",
    "txt","csv","png","jpg","jpeg","gif","webp",
    "zip","rar","7z","dwg","dxf","msg","eml",
}


# ─── private helpers ──────────────────────────────────────────────────────────

def _folder_path(db: Session, trf_number: str, folder_name: str) -> str:
    """Return the absolute local directory for a TRF subfolder."""
    return os.path.join(get_storage_root(db), trf_number, folder_name)


def _get_folder(db: Session, trf_number: str, folder_name: str) -> Folder:
    folder = folder_repo.get_by_trf_number_and_name(db, trf_number, folder_name)
    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Folder '{folder_name}' not found for TRF '{trf_number}'"
        )
    return folder


# ─── public API ───────────────────────────────────────────────────────────────

def list_files(db: Session, trf_number: str, folder_name: str) -> list[dict]:
    folder = _get_folder(db, trf_number, folder_name)
    return [
        {
            "id":            f.id,
            "filename":      f.filename,
            "size_bytes":    f.size_bytes,
            "uploaded_at":   f.uploaded_at.isoformat(),
            "uploaded_by":   f.uploader.username if f.uploader else "System",
            "sharepoint_id": f.sharepoint_id,
            "version_count": len(f.versions),
        }
        for f in folder.files
    ]


def save_file(
    db: Session,
    trf_number: str,
    folder_name: str,
    file: UploadFile,
    current_user: Optional[User] = None,
) -> str:
    folder = _get_folder(db, trf_number, folder_name)

    # ── Validate extension ────────────────────────────────────────────────────
    raw_ext = (file.filename.rsplit(".", 1)[-1] if "." in file.filename else "").lower()
    if raw_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '.{raw_ext}' not allowed.",
        )

    # ── Read content & validate size ──────────────────────────────────────────
    file_content = file.file.read()
    max_bytes    = int(os.getenv("MAX_FILE_SIZE_MB", "50")) * 1024 * 1024
    if len(file_content) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large ({len(file_content)//1048576} MB). Limit: {max_bytes//1048576} MB.",
        )

    # ── Resolve destination ───────────────────────────────────────────────────
    local_dir = _folder_path(db, trf_number, folder_name)
    os.makedirs(local_dir, exist_ok=True)

    # ── SharePoint upload (non-blocking) ──────────────────────────────────────
    sp_id = sharepoint_service.upload_file(trf_number, folder_name, file.filename, file_content)

    # ── Save to disk & DB ─────────────────────────────────────────────────────
    existing = file_repo.get_by_folder_and_name(db, folder.id, file.filename)
    user_id   = current_user.id       if current_user else None
    user_name = current_user.username if current_user else "System"

    if existing:
        latest = (db.query(FileVersion)
                  .filter(FileVersion.file_record_id == existing.id)
                  .order_by(FileVersion.version_number.desc())
                  .first())
        next_ver  = (latest.version_number + 1) if latest else 2
        base, ext = os.path.splitext(file.filename)
        ver_name  = f"{base}_v{next_ver}{ext}"
        dest_path = os.path.join(local_dir, ver_name)
        with open(dest_path, "wb") as fh:
            fh.write(file_content)
        db.add(FileVersion(
            file_record_id=existing.id, version_number=next_ver,
            filename=file.filename, file_path=dest_path,
            size_bytes=len(file_content),
            uploaded_by_id=user_id or existing.uploaded_by_id,
            sharepoint_id=sp_id,
        ))
        existing.size_bytes    = len(file_content)
        existing.file_path     = dest_path
        existing.sharepoint_id = sp_id
        if user_id:
            existing.uploaded_by_id = user_id
        db.commit()
        version_label = next_ver
        logger.info(f"Versioned upload v{next_ver}: '{file.filename}' → {dest_path}")
    else:
        dest_path = os.path.join(local_dir, file.filename)
        with open(dest_path, "wb") as fh:
            fh.write(file_content)
        new_rec = FileRecord(
            filename=file.filename, file_path=dest_path,
            folder_id=folder.id, size_bytes=len(file_content),
            uploaded_by_id=user_id, sharepoint_id=sp_id,
        )
        file_repo.create(db, new_rec)
        db.add(FileVersion(
            file_record_id=new_rec.id, version_number=1,
            filename=file.filename, file_path=dest_path,
            size_bytes=len(file_content),
            uploaded_by_id=new_rec.uploaded_by_id,
            sharepoint_id=sp_id,
        ))
        db.commit()
        version_label = 1
        logger.info(f"New file v1: '{file.filename}' → {dest_path}")

    audit_service.log_action(db, user_id=user_id, action="UPLOAD_FILE",
        details=f"Uploaded '{file.filename}' (v{version_label}, {len(file_content)} B) to '{trf_number}/{folder_name}'. Path: {dest_path}")
    notification_service.create_notification(db, user_id=None, title="File Uploaded",
        body=f"'{file.filename}' v{version_label} uploaded to '{trf_number}/{folder_name}' by '{user_name}'.",
        notif_type="file")
    return file.filename


def remove_file(
    db: Session,
    trf_number: str,
    folder_name: str,
    file_name: str,
    current_user: Optional[User] = None,
) -> None:
    folder = _get_folder(db, trf_number, folder_name)
    record = file_repo.get_by_folder_and_name(db, folder.id, file_name)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"File '{file_name}' not found.")

    for ver in record.versions:
        if os.path.isfile(ver.file_path):
            try: os.remove(ver.file_path)
            except Exception as e: logger.error(f"Remove version error: {e}")
        if ver.sharepoint_id:
            sharepoint_service.delete_file(ver.sharepoint_id)

    if os.path.isfile(record.file_path):
        try: os.remove(record.file_path)
        except Exception as e: logger.error(f"Remove main file error: {e}")
    if record.sharepoint_id:
        sharepoint_service.delete_file(record.sharepoint_id)

    file_repo.delete(db, record)

    user_id   = current_user.id       if current_user else None
    user_name = current_user.username if current_user else "System"
    audit_service.log_action(db, user_id=user_id, action="DELETE_FILE",
        details=f"Deleted '{file_name}' from '{trf_number}/{folder_name}'.")
    notification_service.create_notification(db, user_id=None, title="File Deleted",
        body=f"'{file_name}' deleted from '{trf_number}/{folder_name}' by '{user_name}'.",
        notif_type="file")


def get_file_path(db: Session, trf_number: str, folder_name: str, file_name: str) -> str:
    folder = _get_folder(db, trf_number, folder_name)
    record = file_repo.get_by_folder_and_name(db, folder.id, file_name)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"File '{file_name}' not found.")
    if os.path.isfile(record.file_path):
        return record.file_path
    # fallback: try configured storage path
    fallback = os.path.join(_folder_path(db, trf_number, folder_name), file_name)
    if os.path.isfile(fallback):
        return fallback
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"File '{file_name}' not found on disk.")


def preview_file(db: Session, trf_number: str, folder_name: str, file_name: str) -> tuple[str, str]:
    path  = get_file_path(db, trf_number, folder_name, file_name)
    mime, _ = mimetypes.guess_type(path)
    return path, mime or "application/octet-stream"


def get_file_versions(db: Session, trf_number: str, folder_name: str, file_name: str) -> list[dict]:
    folder = _get_folder(db, trf_number, folder_name)
    record = file_repo.get_by_folder_and_name(db, folder.id, file_name)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"File '{file_name}' not found.")
    return [
        {
            "id":            v.id,
            "version_number": v.version_number,
            "filename":      v.filename,
            "size_bytes":    v.size_bytes,
            "uploaded_at":   v.uploaded_at.isoformat(),
            "uploaded_by":   v.uploader.username if v.uploader else "System",
            "sharepoint_id": v.sharepoint_id,
        }
        for v in record.versions
    ]


def get_version_file_path(db: Session, trf_number: str, folder_name: str, file_name: str, version_number: int) -> str:
    folder = _get_folder(db, trf_number, folder_name)
    record = file_repo.get_by_folder_and_name(db, folder.id, file_name)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"File '{file_name}' not found.")
    ver = (db.query(FileVersion)
           .filter(FileVersion.file_record_id == record.id,
                   FileVersion.version_number == version_number)
           .first())
    if not ver or not os.path.isfile(ver.file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"Version {version_number} not found.")
    return ver.file_path


def sync_local_and_sharepoint(db: Session, trf_number: str, folder_name: str) -> int:
    folder    = _get_folder(db, trf_number, folder_name)
    local_dir = _folder_path(db, trf_number, folder_name)
    os.makedirs(local_dir, exist_ok=True)
    synced = 0

    for fname in os.listdir(local_dir):
        fpath = os.path.join(local_dir, fname)
        if os.path.isdir(fpath) or ("_v" in fname and not fname.startswith("v")):
            continue
        if not file_repo.get_by_folder_and_name(db, folder.id, fname):
            size = os.path.getsize(fpath)
            rec  = FileRecord(filename=fname, file_path=fpath, folder_id=folder.id,
                              size_bytes=size, sharepoint_id=f"local-{trf_number}-{folder_name}-{fname}".replace(" ","_"))
            file_repo.create(db, rec)
            db.add(FileVersion(file_record_id=rec.id, version_number=1,
                               filename=fname, file_path=fpath, size_bytes=size,
                               sharepoint_id=rec.sharepoint_id))
            db.commit()
            synced += 1

    for remote in sharepoint_service.list_remote_files(trf_number, folder_name):
        if not file_repo.get_by_folder_and_name(db, folder.id, remote["name"]):
            logger.info(f"Remote SP file '{remote['name']}' not tracked locally — skip auto-download.")
            synced += 1

    audit_service.log_action(db, user_id=None, action="SYNC_FILES",
        details=f"Synced '{trf_number}/{folder_name}' — {synced} file(s). Storage: {local_dir}")
    return synced
