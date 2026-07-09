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
from backend.services.email_service import (
    send_system_email, email_trf_created, email_trf_updated
)
from backend.services.storage_service import get_storage_root
from backend.repositories.user_repository import UserRepository
from backend.utils.logging_config import get_logger

logger = get_logger("trf_service")

TRF_SUBFOLDERS = ["Documents", "Reports", "Drawings", "Approvals", "Final Submission"]

trf_repo       = TRFRepository()
folder_repo    = FolderRepository()
sharepoint_svc = SharePointService()
user_repo_inst = UserRepository()


def get_all_trfs(db: Session) -> list[TRFRecord]:
    return trf_repo.get_all(db)


def get_trf_by_number(db: Session, trf_number: str) -> TRFRecord:
    trf = trf_repo.get_by_number(db, trf_number)
    if not trf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail=f"TRF '{trf_number}' not found")
    return trf


def get_dashboard_stats(db: Session) -> dict:
    return {
        "total_trfs":         trf_repo.count_all(db),
        "sharepoint_enabled": sharepoint_svc.is_configured,
    }


def create_trf(db: Session, payload: TRFCreate, current_user: Optional[User] = None) -> TRFRecord:
    import re
    if not re.match(r'^TRF-\d{4}-\d+$', payload.trf_number.strip()):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid TRF Number. Please use the format: TRF-YYYY-Number (Example: TRF-2026-1)"
        )

    if trf_repo.get_by_number(db, payload.trf_number):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail=f"TRF '{payload.trf_number}' already exists.")

    new_trf = TRFRecord(trf_number=payload.trf_number,
                        project_name=payload.project_name,
                        sharepoint_status="pending")
    trf_repo.create(db, new_trf)

    # ── Use configured storage root ──
    storage_root = get_storage_root(db)
    root_path    = os.path.join(storage_root, payload.trf_number)
    os.makedirs(root_path, exist_ok=True)
    logger.info(f"TRF folder root: {root_path}")

    sp_results = []
    for folder_name in TRF_SUBFOLDERS:
        folder_repo.create(db, Folder(name=folder_name, trf_id=new_trf.id))
        os.makedirs(os.path.join(root_path, folder_name), exist_ok=True)
        sp = sharepoint_svc.create_folder(payload.trf_number, folder_name)
        sp_results.append(sp)

    sp_ok = sum(1 for r in sp_results if r["success"])
    total = len(TRF_SUBFOLDERS)
    if sp_ok == total:
        mode = sp_results[0]["mode"] if sp_results else "local"
        new_trf.sharepoint_status  = "success"
        new_trf.sharepoint_message = (
            "All folders on SharePoint." if mode == "live"
            else f"All folders created at: {root_path}"
        )
    elif sp_ok == 0:
        new_trf.sharepoint_status  = "failed"
        new_trf.sharepoint_message = f"SharePoint failed. Files stored locally at: {root_path}"
    else:
        failed = [sp_results[i]["message"] for i in range(total) if not sp_results[i]["success"]]
        new_trf.sharepoint_status  = "partial"
        new_trf.sharepoint_message = f"{sp_ok}/{total} on SharePoint. Local: {root_path}"
    trf_repo.commit(db)

    user_id   = current_user.id       if current_user else None
    user_name = current_user.username if current_user else "System"
    audit_service.log_action(db, user_id=user_id, action="CREATE_TRF",
        details=f"TRF '{payload.trf_number}' created by '{user_name}'. Storage: {root_path}. SP: {new_trf.sharepoint_status}.")
    notification_service.create_notification(db, user_id=None,
        title=f"TRF Created: {payload.trf_number}",
        body=f"'{payload.trf_number}' created by '{user_name}'. Folders at: {root_path}",
        notif_type="trf")

    # Send email to all admins (uses live DB email — picks up email changes immediately)
    try:
        actor_role = current_user.role if current_user else "System"
        email_trf_created(db, payload.trf_number, payload.project_name, user_name, actor_role)
    except Exception as e:
        logger.warning(f"TRF creation email error: {e}")

    return new_trf


def update_trf(db: Session, trf_number: str, project_name: str, current_user: Optional[User] = None) -> TRFRecord:
    trf = get_trf_by_number(db, trf_number)
    old = trf.project_name
    trf.project_name = project_name
    trf_repo.commit(db)
    user_id   = current_user.id       if current_user else None
    user_name = current_user.username if current_user else "System"
    audit_service.log_action(db, user_id=user_id, action="UPDATE_TRF",
        details=f"TRF '{trf_number}': '{old}' → '{project_name}' by '{user_name}'.")
    notification_service.create_notification(db, user_id=None,
        title=f"TRF Updated: {trf_number}",
        body=f"Project name changed to '{project_name}' by '{user_name}'.", notif_type="trf")
    # Email admins on update (only for Engineer/Manager actions)
    try:
        actor_role = current_user.role if current_user else "System"
        if actor_role in ("Engineer", "Manager"):
            email_trf_updated(db, trf_number, old, project_name, user_name, actor_role)
    except Exception as e:
        logger.warning(f"TRF update email error: {e}")
    return trf


def delete_trf(db: Session, trf_number: str, current_user: Optional[User] = None) -> None:
    trf = get_trf_by_number(db, trf_number)
    user_id   = current_user.id       if current_user else None
    user_name = current_user.username if current_user else "System"
    audit_service.log_action(db, user_id=user_id, action="DELETE_TRF",
        details=f"TRF '{trf_number}' deleted by '{user_name}'.")
    notification_service.create_notification(db, user_id=None,
        title=f"TRF Deleted: {trf_number}",
        body=f"TRF '{trf_number}' deleted by '{user_name}'.", notif_type="trf")
    trf_repo.delete(db, trf)
