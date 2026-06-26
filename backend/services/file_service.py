import os
import shutil
import mimetypes
from typing import Optional
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from backend.models.file_model import FileRecord, FileVersion
from backend.models.folder_model import Folder
from backend.models.trf_model import TRFRecord
from backend.models.user_model import User
from backend.repositories.file_repository import FileRepository
from backend.repositories.folder_repository import FolderRepository
from backend.repositories.trf_repository import TRFRepository
from backend.services.sharepoint_service import SharePointService
from backend.services import audit_service, notification_service
from backend.utils.logging_config import get_logger

logger = get_logger("file_service")

UPLOADS_ROOT = os.getenv("UPLOADS_ROOT", "uploads")

file_repo   = FileRepository()
folder_repo = FolderRepository()
trf_repo    = TRFRepository()
sharepoint_service = SharePointService()


def _resolve_folder_db(db: Session, trf_number: str, folder_name: str) -> Folder:
    """Finds the folder record in the DB, raising 404 if not found."""
    folder = folder_repo.get_by_trf_number_and_name(db, trf_number, folder_name)
    if not folder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Folder '{folder_name}' not found for TRF '{trf_number}'"
        )
    return folder


def _resolve_physical_path(trf_number: str, folder_name: str) -> str:
    """Returns the local path where folders are stored."""
    path = os.path.join(UPLOADS_ROOT, trf_number, folder_name)
    return path


def list_files(db: Session, trf_number: str, folder_name: str) -> list[dict]:
    """List all file records inside a TRF folder from the database with metadata."""
    folder = _resolve_folder_db(db, trf_number, folder_name)
    return [
        {
            "id": f.id,
            "filename": f.filename,
            "size_bytes": f.size_bytes,
            "uploaded_at": f.uploaded_at.isoformat(),
            "uploaded_by": f.uploader.username if f.uploader else "System",
            "sharepoint_id": f.sharepoint_id,
            "version_count": len(f.versions)
        }
        for f in folder.files
    ]


def save_file(
    db: Session,
    trf_number: str,
    folder_name: str,
    file: UploadFile,
    current_user: Optional[User] = None
) -> str:
    """Save an uploaded file supporting versioning, local storage, SharePoint, and audit logging."""
    folder = _resolve_folder_db(db, trf_number, folder_name)
    
    # 1. Resolve path and create locally if missing
    local_dir = _resolve_physical_path(trf_number, folder_name)
    if not os.path.exists(local_dir):
        os.makedirs(local_dir)

    file_content = file.file.read()
    sp_id = sharepoint_service.upload_file(trf_number, folder_name, file.filename, file_content)

    existing_file = file_repo.get_by_folder_and_name(db, folder.id, file.filename)
    
    if existing_file:
        # Determine next version number
        latest_version = db.query(FileVersion).filter(FileVersion.file_record_id == existing_file.id).order_by(FileVersion.version_number.desc()).first()
        next_ver = (latest_version.version_number + 1) if latest_version else 2
        
        # Save locally with version suffix
        base, ext = os.path.splitext(file.filename)
        ver_filename = f"{base}_v{next_ver}{ext}"
        local_file_path = os.path.join(local_dir, ver_filename)

        with open(local_file_path, "wb") as buffer:
            buffer.write(file_content)

        # Create new FileVersion record
        new_version = FileVersion(
            file_record_id=existing_file.id,
            version_number=next_ver,
            filename=file.filename,
            file_path=local_file_path,
            size_bytes=len(file_content),
            uploaded_by_id=current_user.id if current_user else existing_file.uploaded_by_id,
            sharepoint_id=sp_id
        )
        db.add(new_version)

        # Update main record
        existing_file.size_bytes = len(file_content)
        existing_file.file_path = local_file_path
        existing_file.sharepoint_id = sp_id
        if current_user:
            existing_file.uploaded_by_id = current_user.id

        db.commit()
        logger.info(f"Uploaded version {next_ver} of file '{file.filename}'.")
        version_label = next_ver
    else:
        # Save standard local file
        local_file_path = os.path.join(local_dir, file.filename)
        with open(local_file_path, "wb") as buffer:
            buffer.write(file_content)

        # Create new FileRecord
        new_file = FileRecord(
            filename=file.filename,
            file_path=local_file_path,
            folder_id=folder.id,
            size_bytes=len(file_content),
            uploaded_by_id=current_user.id if current_user else None,
            sharepoint_id=sp_id
        )
        file_repo.create(db, new_file)

        # Create FileVersion v1
        v1 = FileVersion(
            file_record_id=new_file.id,
            version_number=1,
            filename=file.filename,
            file_path=local_file_path,
            size_bytes=len(file_content),
            uploaded_by_id=new_file.uploaded_by_id,
            sharepoint_id=sp_id
        )
        db.add(v1)
        db.commit()
        logger.info(f"Created new file record '{file.filename}' in DB (Version 1).")
        version_label = 1

    # Log Audit Trail
    user_id = current_user.id if current_user else None
    user_name = current_user.username if current_user else "System"
    audit_service.log_action(
        db,
        user_id=user_id,
        action="UPLOAD_FILE",
        details=f"Uploaded file '{file.filename}' (v{version_label}, {len(file_content)} bytes) to '{trf_number}/{folder_name}'."
    )

    # Trigger notification
    notification_service.create_notification(
        db,
        user_id=None,
        title="File Uploaded",
        body=f"File '{file.filename}' (v{version_label}) uploaded to '{trf_number}/{folder_name}' by '{user_name}'.",
        notif_type="file"
    )

    return file.filename


def remove_file(
    db: Session,
    trf_number: str,
    folder_name: str,
    file_name: str,
    current_user: Optional[User] = None
) -> None:
    """Delete file, all its versions from disk, SharePoint, and database."""
    folder = _resolve_folder_db(db, trf_number, folder_name)
    file_record = file_repo.get_by_folder_and_name(db, folder.id, file_name)
    
    if not file_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File '{file_name}' not found in database."
        )

    # 1. Delete all versions physically
    for version in file_record.versions:
        if os.path.exists(version.file_path):
            try:
                os.remove(version.file_path)
            except Exception as e:
                logger.error(f"Error removing version file {version.file_path}: {e}")
        if version.sharepoint_id:
            sharepoint_service.delete_file(version.sharepoint_id)

    # Delete main file path if different
    if os.path.exists(file_record.file_path):
        try:
            os.remove(file_record.file_path)
        except Exception as e:
            logger.error(f"Error removing main file {file_record.file_path}: {e}")
    if file_record.sharepoint_id:
        sharepoint_service.delete_file(file_record.sharepoint_id)

    # 2. Delete database records (Cascades FileVersion deletion)
    file_repo.delete(db, file_record)

    # 3. Log Audit
    user_id = current_user.id if current_user else None
    user_name = current_user.username if current_user else "System"
    audit_service.log_action(
        db,
        user_id=user_id,
        action="DELETE_FILE",
        details=f"Deleted file '{file_name}' and all its versions from '{trf_number}/{folder_name}'."
    )

    # 4. Notification
    notification_service.create_notification(
        db,
        user_id=None,
        title="File Deleted",
        body=f"File '{file_name}' was deleted from '{trf_number}/{folder_name}' by '{user_name}'.",
        notif_type="file"
    )


def get_file_path(db: Session, trf_number: str, folder_name: str, file_name: str) -> str:
    """Retrieve absolute file path from database, validating it exists on disk."""
    folder = _resolve_folder_db(db, trf_number, folder_name)
    file_record = file_repo.get_by_folder_and_name(db, folder.id, file_name)
    
    if not file_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File '{file_name}' not found."
        )

    if not os.path.isfile(file_record.file_path):
        # Fallback check
        fallback_path = os.path.join(_resolve_physical_path(trf_number, folder_name), file_name)
        if os.path.isfile(fallback_path):
            return fallback_path
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File '{file_name}' not found on local storage disk."
        )

    return file_record.file_path


def preview_file(db: Session, trf_number: str, folder_name: str, file_name: str) -> tuple[str, str]:
    """Retrieve file path and MIME type for inline preview."""
    file_path = get_file_path(db, trf_number, folder_name, file_name)
    mime_type, _ = mimetypes.guess_type(file_path)
    if not mime_type:
        mime_type = "application/octet-stream"
    return file_path, mime_type


def get_file_versions(db: Session, trf_number: str, folder_name: str, file_name: str) -> list[dict]:
    """Get all versions of a file."""
    folder = _resolve_folder_db(db, trf_number, folder_name)
    file_record = file_repo.get_by_folder_and_name(db, folder.id, file_name)
    if not file_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File '{file_name}' not found."
        )
    return [
        {
            "id": v.id,
            "version_number": v.version_number,
            "filename": v.filename,
            "size_bytes": v.size_bytes,
            "uploaded_at": v.uploaded_at.isoformat(),
            "uploaded_by": v.uploader.username if v.uploader else "System",
            "sharepoint_id": v.sharepoint_id
        }
        for v in file_record.versions
    ]


def get_version_file_path(db: Session, trf_number: str, folder_name: str, file_name: str, version_number: int) -> str:
    """Retrieve absolute file path for a specific file version."""
    folder = _resolve_folder_db(db, trf_number, folder_name)
    file_record = file_repo.get_by_folder_and_name(db, folder.id, file_name)
    if not file_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File '{file_name}' not found."
        )
    version = db.query(FileVersion).filter(
        FileVersion.file_record_id == file_record.id,
        FileVersion.version_number == version_number
    ).first()
    if not version or not os.path.isfile(version.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Version {version_number} of file '{file_name}' not found."
        )
    return version.file_path


def sync_local_and_sharepoint(db: Session, trf_number: str, folder_name: str) -> int:
    """
    Synchronizes DB and local storage folder, registering untracked local files
    and simulating SharePoint mock files download.
    """
    folder = _resolve_folder_db(db, trf_number, folder_name)
    local_dir = _resolve_physical_path(trf_number, folder_name)
    
    if not os.path.exists(local_dir):
        os.makedirs(local_dir)
        
    local_files = os.listdir(local_dir)
    synced_count = 0

    # 1. Scan local files and register untracked ones in DB
    for filename in local_files:
        # Ignore versioned files directly if they are suffix-named, we'll sync by actual files
        if "_v" in filename and not filename.startswith("v"):
            # Check if main file exists, if so skip sync of this version as it's registered through file record
            continue
            
        file_path = os.path.join(local_dir, filename)
        if os.path.isdir(file_path):
            continue
            
        existing = file_repo.get_by_folder_and_name(db, folder.id, filename)
        if not existing:
            size_bytes = os.path.getsize(file_path)
            new_file = FileRecord(
                filename=filename,
                file_path=file_path,
                folder_id=folder.id,
                size_bytes=size_bytes,
                sharepoint_id=f"sp-{trf_number}-{folder_name}-{filename}".replace(" ", "_")
            )
            file_repo.create(db, new_file)
            
            # Create FileVersion v1
            v1 = FileVersion(
                file_record_id=new_file.id,
                version_number=1,
                filename=filename,
                file_path=file_path,
                size_bytes=size_bytes,
                sharepoint_id=new_file.sharepoint_id
            )
            db.add(v1)
            db.commit()
            synced_count += 1

    # 2. Pull from SharePoint: register any files that exist on SharePoint but not locally
    sp_remote_files = sharepoint_service.list_remote_files(trf_number, folder_name)
    for remote in sp_remote_files:
        # Only register if not already tracked in DB
        existing = file_repo.get_by_folder_and_name(db, folder.id, remote["name"])
        if not existing:
            # File is on SharePoint but not in DB/local — log for manual resolution
            logger.info(
                f"SharePoint file '{remote['name']}' found remotely for "
                f"'{trf_number}/{folder_name}' but not tracked locally. "
                "Skipping auto-download (requires explicit pull workflow)."
            )
            synced_count += 1

    # Audit log
    audit_service.log_action(
        db,
        user_id=None,
        action="SYNC_FILES",
        details=f"Synchronized local storage and SharePoint for folder '{trf_number}/{folder_name}'. Synced {synced_count} file(s)."
    )

    return synced_count
