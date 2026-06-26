"""
TRF Service — business logic for TRF record lifecycle.

Folder creation flow on TRF creation:
  1. Validate unique trf_number
  2. Persist TRFRecord to DB
  3. For each of the 5 standard subfolders:
       a. Create DB Folder record
       b. Create local directory (UPLOADS_ROOT/<trf_number>/<folder>)
       c. Attempt SharePoint folder creation (graceful fallback to local)
  4. Set sharepoint_status on TRFRecord based on results
  5. Log audit trail
  6. Dispatch notification
"""
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

trf_repo         = TRFRepository()
folder_repo      = FolderRepository()
sharepoint_svc   = SharePointService()


def _trf_folder_path(trf_number: str) -> str:
    return os.path.join(UPLOADS_ROOT, trf_number)


# ── Read operations ────────────────────────────────────────────────────────────

def get_all_trfs(db: Session) -> list[TRFRecord]:
    return trf_repo.get_all(db)


def get_trf_by_number(db: Session, trf_number: str) -> TRFRecord:
    trf = trf_repo.get_by_number(db, trf_number)
    if not trf:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"TRF '{trf_number}' not found",
        )
    return trf


def get_dashboard_stats(db: Session) -> dict:
    total_trfs = trf_repo.count_all(db)
    return {
        "total_trfs":         total_trfs,
        "sharepoint_enabled": sharepoint_svc.is_configured,
    }


# ── Write operations ───────────────────────────────────────────────────────────

def create_trf(
    db: Session,
    payload: TRFCreate,
    current_user: Optional[User] = None,
) -> TRFRecord:
    """
    Create a TRF record, local folder structure, and SharePoint folders.

    Raises:
        409 if trf_number already exists.
    """
    # ── Uniqueness check ───────────────────────────────────────────────────────
    if trf_repo.get_by_number(db, payload.trf_number):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"TRF '{payload.trf_number}' already exists in the database.",
        )

    # ── 1. Persist TRF record ──────────────────────────────────────────────────
    new_trf = TRFRecord(
        trf_number=payload.trf_number,
        project_name=payload.project_name,
        sharepoint_status="pending",
    )
    trf_repo.create(db, new_trf)
    logger.info(f"TRF DB record created: {payload.trf_number}")

    # ── 2. Local root directory ────────────────────────────────────────────────
    root_path = _trf_folder_path(payload.trf_number)
    os.makedirs(root_path, exist_ok=True)

    # ── 3. Create subfolders ───────────────────────────────────────────────────
    sp_results: list[dict] = []

    for folder_name in TRF_SUBFOLDERS:
        # a. DB record
        db_folder = Folder(name=folder_name, trf_id=new_trf.id)
        folder_repo.create(db, db_folder)

        # b. Local directory
        local_path = os.path.join(root_path, folder_name)
        os.makedirs(local_path, exist_ok=True)

        # c. SharePoint (non-blocking — failure never aborts TRF creation)
        sp_result = sharepoint_svc.create_folder(payload.trf_number, folder_name)
        sp_results.append({
            "folder":  folder_name,
            "success": sp_result["success"],
            "mode":    sp_result["mode"],
            "message": sp_result["message"],
            "sp_id":   sp_result["sharepoint_folder_id"],
        })

        if sp_result["success"]:
            logger.debug(f"  Folder '{folder_name}' ready ({sp_result['mode']} mode).")
        else:
            logger.warning(
                f"  Folder '{folder_name}' SharePoint creation failed: {sp_result['message']}"
            )

    # ── 4. Derive aggregate SharePoint status ─────────────────────────────────
    sp_successes = sum(1 for r in sp_results if r["success"])
    total_folders = len(TRF_SUBFOLDERS)

    if sp_successes == total_folders:
        mode = sp_results[0]["mode"] if sp_results else "local"
        new_trf.sharepoint_status  = "success"
        new_trf.sharepoint_message = (
            "All folders created on SharePoint."
            if mode == "live"
            else "All folders created on local storage (SharePoint not configured)."
        )
    elif sp_successes == 0:
        new_trf.sharepoint_status  = "failed"
        new_trf.sharepoint_message = (
            f"SharePoint folder creation failed for all {total_folders} subfolders. "
            "Files will be stored locally only."
        )
    else:
        new_trf.sharepoint_status  = "partial"
        failed_names = [r["folder"] for r in sp_results if not r["success"]]
        new_trf.sharepoint_message = (
            f"{sp_successes}/{total_folders} subfolders created on SharePoint. "
            f"Failed: {', '.join(failed_names)}"
        )

    trf_repo.commit(db)
    logger.info(
        f"TRF '{payload.trf_number}' created — SharePoint status: "
        f"{new_trf.sharepoint_status}"
    )

    # ── 5. Audit log ───────────────────────────────────────────────────────────
    user_id   = current_user.id       if current_user else None
    user_name = current_user.username if current_user else "System"
    audit_service.log_action(
        db,
        user_id=user_id,
        action="CREATE_TRF",
        details=(
            f"TRF '{payload.trf_number}' (project: '{payload.project_name}') created by '{user_name}'. "
            f"SharePoint: {new_trf.sharepoint_status}. {new_trf.sharepoint_message}"
        ),
    )

    # ── 6. Notification ────────────────────────────────────────────────────────
    notification_service.create_notification(
        db,
        user_id=None,
        title=f"TRF Created: {payload.trf_number}",
        body=(
            f"TRF '{payload.trf_number}' for project '{payload.project_name}' "
            f"was created by '{user_name}'. "
            f"Folder status: {new_trf.sharepoint_status}."
        ),
        notif_type="trf",
    )

    return new_trf


def update_trf(
    db: Session,
    trf_number: str,
    project_name: str,
    current_user: Optional[User] = None,
) -> TRFRecord:
    trf = get_trf_by_number(db, trf_number)
    old_name = trf.project_name
    trf.project_name = project_name
    trf_repo.commit(db)

    user_id   = current_user.id       if current_user else None
    user_name = current_user.username if current_user else "System"

    audit_service.log_action(
        db,
        user_id=user_id,
        action="UPDATE_TRF",
        details=f"TRF '{trf_number}' project name changed from '{old_name}' → '{project_name}' by '{user_name}'.",
    )
    notification_service.create_notification(
        db,
        user_id=None,
        title=f"TRF Updated: {trf_number}",
        body=f"Project name changed to '{project_name}' by '{user_name}'.",
        notif_type="trf",
    )
    return trf


def delete_trf(
    db: Session,
    trf_number: str,
    current_user: Optional[User] = None,
) -> None:
    trf = get_trf_by_number(db, trf_number)

    user_id   = current_user.id       if current_user else None
    user_name = current_user.username if current_user else "System"

    audit_service.log_action(
        db,
        user_id=user_id,
        action="DELETE_TRF",
        details=f"TRF '{trf_number}' deleted by '{user_name}'.",
    )
    notification_service.create_notification(
        db,
        user_id=None,
        title=f"TRF Deleted: {trf_number}",
        body=f"TRF '{trf_number}' was permanently deleted by '{user_name}'.",
        notif_type="trf",
    )
    trf_repo.delete(db, trf)
