import os
import shutil
from typing import Optional
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from backend.models.file_model import FileRecord
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

file_repo = FileRepository()
folder_repo = FolderRepository()
trf_repo = TRFRepository()
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


def list_files(db: Session, trf_number: str, folder_name: str) -> list[str]:
    """List all file names inside a TRF folder from the database."""
    folder = _resolve_folder_db(db, trf_number, folder_name)
    # Fetch from database (Database Normalization)
    return [f.filename for f in folder.files]


def save_file(
    db: Session,
    trf_number: str,
    folder_name: str,
    file: UploadFile,
    current_user: Optional[User] = None
) -> str:
    """Save an uploaded file to local disk, upload to SharePoint, and record metadata."""
    folder = _resolve_folder_db(db, trf_number, folder_name)
    
    # 1. Resolve path and create locally if missing (fallback)
    local_dir = _resolve_physical_path(trf_number, folder_name)
    if not os.path.exists(local_dir):
        os.makedirs(local_dir)
        
    local_file_path = os.path.join(local_dir, file.filename)

    # Read content once so we can copy it locally and upload it to SharePoint
    file_content = file.file.read()

    # 2. Write to local storage
    with open(local_file_path, "wb") as buffer:
        buffer.write(file_content)

    # 3. Upload to SharePoint
    sp_id = sharepoint_service.upload_file(trf_number, folder_name, file.filename, file_content)

    # 4. Check if file already exists in DB
    existing_file = file_repo.get_by_folder_and_name(db, folder.id, file.filename)
    if existing_file:
        # Update existing metadata
        existing_file.size_bytes = len(file_content)
        existing_file.sharepoint_id = sp_id
        existing_file.uploaded_by_id = current_user.id if current_user else existing_file.uploaded_by_id
        file_repo.commit(db)
        logger.info(f"Updated existing file metadata for '{file.filename}' in DB.")
    else:
        # Create new FileRecord in DB
        new_file = FileRecord(
            filename=file.filename,
            file_path=local_file_path,
            folder_id=folder.id,
            size_bytes=len(file_content),
            uploaded_by_id=current_user.id if current_user else None,
            sharepoint_id=sp_id
        )
        file_repo.create(db, new_file)
        logger.info(f"Created new file record '{file.filename}' in DB.")

    # 5. Log Audit Trail
    user_id = current_user.id if current_user else None
    user_name = current_user.username if current_user else "System"
    audit_service.log_action(
        db,
        user_id=user_id,
        action="UPLOAD_FILE",
        details=f"Uploaded file '{file.filename}' ({len(file_content)} bytes) to '{trf_number}/{folder_name}'."
    )

    # 6. Trigger notification
    notification_service.create_notification(
        db,
        user_id=None,
        title="File Uploaded",
        body=f"File '{file.filename}' uploaded to '{trf_number}/{folder_name}' by '{user_name}'.",
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
    """Delete file from disk, SharePoint, and database."""
    folder = _resolve_folder_db(db, trf_number, folder_name)
    
    # 1. Retrieve file record from DB
    file_record = file_repo.get_by_folder_and_name(db, folder.id, file_name)
    if not file_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File '{file_name}' not found in database."
        )

    # 2. Delete locally
    if os.path.exists(file_record.file_path):
        os.remove(file_record.file_path)
    else:
        # If path mismatch, fallback to direct path resolution
        fallback_path = os.path.join(_resolve_physical_path(trf_number, folder_name), file_name)
        if os.path.exists(fallback_path):
            os.remove(fallback_path)

    # 3. Delete from SharePoint
    if file_record.sharepoint_id:
        sharepoint_service.delete_file(file_record.sharepoint_id)

    # 4. Delete DB record
    file_repo.delete(db, file_record)

    # 5. Log Audit Trail
    user_id = current_user.id if current_user else None
    user_name = current_user.username if current_user else "System"
    audit_service.log_action(
        db,
        user_id=user_id,
        action="DELETE_FILE",
        details=f"Deleted file '{file_name}' from '{trf_number}/{folder_name}'."
    )

    # 6. Trigger notification
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
