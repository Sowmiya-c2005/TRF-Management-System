import os
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import Optional

from backend.models.trf_model import TRFRecord
from backend.models.folder_model import Folder
from backend.models.user_model import User
from backend.schemas.trf_schema import TRFCreate
from backend.repositories.trf_repository import TRFRepository
from backend.repositories.folder_repository import FolderRepository
from backend.services.sharepoint_service import SharePointService
from backend.services import audit_service, notification_service
from backend.utils.logging_config import get_logger

logger = get_logger("trf_service")
UPLOADS_ROOT = os.getenv("UPLOADS_ROOT", "uploads")

TRF_SUBFOLDERS = [
    "Documents",
    "Reports",
    "Drawings",
    "Approvals",
    "Final Submission",
]

trf_repo = TRFRepository()
folder_repo = FolderRepository()
sharepoint_service = SharePointService()


def _trf_folder_path(trf_number: str) -> str:
    return os.path.join(UPLOADS_ROOT, trf_number)


def get_all_trfs(db: Session) -> list[TRFRecord]:
    return trf_repo.get_all(db)


def get_trf_by_number(db: Session, trf_number: str) -> TRFRecord:
    trf = trf_repo.get_by_number(db, trf_number)
    if not trf:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"TRF '{trf_number}' not found"
        )
    return trf


def create_trf(db: Session, payload: TRFCreate, current_user: Optional[User] = None) -> TRFRecord:
    existing = trf_repo.get_by_number(db, payload.trf_number)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="TRF already exists in database"
        )

    # 1. Create TRF database record
    new_trf = TRFRecord(
        trf_number=payload.trf_number,
        project_name=payload.project_name,
    )
    trf_repo.create(db, new_trf)
    logger.info(f"TRF database record created: {payload.trf_number}")

    # 2. Create local directory structure & folder database records
    root_path = _trf_folder_path(payload.trf_number)
    if not os.path.exists(root_path):
        os.makedirs(root_path)

    for folder_name in TRF_SUBFOLDERS:
        # Create DB Folder record (Database Normalization)
        db_folder = Folder(
            name=folder_name,
            trf_id=new_trf.id
        )
        folder_repo.create(db, db_folder)

        # Create physical directory
        local_folder_path = os.path.join(root_path, folder_name)
        if not os.path.exists(local_folder_path):
            os.makedirs(local_folder_path)

        # Create folder in SharePoint (SharePoint Integration)
        sharepoint_service.create_folder(payload.trf_number, folder_name)

    # 3. Log Audit trail
    user_id = current_user.id if current_user else None
    user_name = current_user.username if current_user else "System"
    audit_service.log_action(
        db,
        user_id=user_id,
        action="CREATE_TRF",
        details=f"TRF '{payload.trf_number}' with project name '{payload.project_name}' created."
    )

    # 4. Trigger notification
    notification_service.create_notification(
        db,
        user_id=None,  # System-wide alert
        title="TRF Created",
        body=f"TRF '{payload.trf_number}' was created by '{user_name}'.",
        notif_type="trf"
    )

    return new_trf


def update_trf(db: Session, trf_number: str, project_name: str, current_user: Optional[User] = None) -> TRFRecord:
    trf = get_trf_by_number(db, trf_number)
    old_project_name = trf.project_name
    trf.project_name = project_name
    trf_repo.commit(db)

    # Log Audit
    user_id = current_user.id if current_user else None
    user_name = current_user.username if current_user else "System"
    audit_service.log_action(
        db,
        user_id=user_id,
        action="UPDATE_TRF",
        details=f"TRF '{trf_number}' updated project name from '{old_project_name}' to '{project_name}'."
    )

    # Trigger notification
    notification_service.create_notification(
        db,
        user_id=None,
        title="TRF Updated",
        body=f"TRF '{trf_number}' was updated by '{user_name}'.",
        notif_type="trf"
      )

    return trf


def delete_trf(db: Session, trf_number: str, current_user: Optional[User] = None) -> None:
    trf = get_trf_by_number(db, trf_number)
    
    # Log Audit before deletion
    user_id = current_user.id if current_user else None
    user_name = current_user.username if current_user else "System"
    audit_service.log_action(
        db,
        user_id=user_id,
        action="DELETE_TRF",
        details=f"TRF '{trf_number}' deleted."
    )

    # Trigger notification
    notification_service.create_notification(
        db,
        user_id=None,
        title="TRF Deleted",
        body=f"TRF '{trf_number}' was deleted by '{user_name}'.",
        notif_type="trf"
    )

    trf_repo.delete(db, trf)


def get_dashboard_stats(db: Session) -> dict:
    total_trfs = trf_repo.count_all(db)
    return {"total_trfs": total_trfs}
