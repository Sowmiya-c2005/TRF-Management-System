from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.schemas.trf_schema import (
    TRFCreate,
    TRFUpdate,
    TRFResponse,
    TRFDetailResponse,
    MessageResponse,
    DashboardStats,
    SharePointStatusResponse,
)
from backend.services import trf_service
from backend.services.sharepoint_service import SharePointService
from backend.middleware.auth_middleware import get_current_user, RoleChecker, check_trf_access
from backend.models.user_model import User

router   = APIRouter(prefix="/trfs", tags=["TRF Records"])
_sp_svc  = SharePointService()


# ── Read ───────────────────────────────────────────────────────────────────────

@router.get("/", response_model=list[TRFResponse])
def get_all_trfs(
    search:   Optional[str] = Query(None, description="Filter by TRF number or project name"),
    sp_status: Optional[str] = Query(None, alias="sharepoint_status", description="Filter by SharePoint status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all TRF records with optional search and SharePoint status filter."""
    from backend.services.assignment_service import get_user_assigned_trfs
    trfs = get_user_assigned_trfs(db, current_user.id, current_user.role)

    if search:
        q = search.lower()
        trfs = [t for t in trfs if q in t.trf_number.lower() or q in t.project_name.lower()]

    if sp_status:
        trfs = [t for t in trfs if t.sharepoint_status == sp_status]

    return trfs


@router.get("/stats", response_model=DashboardStats)
def dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return aggregate statistics for the dashboard."""
    return trf_service.get_dashboard_stats(db)


@router.get("/sharepoint-status", response_model=SharePointStatusResponse)
def sharepoint_status(current_user: User = Depends(get_current_user)):
    """Return SharePoint Graph API connectivity status (health check)."""
    return _sp_svc.get_status()


@router.get("/{trf_number}", response_model=TRFDetailResponse)
def get_trf(
    trf_number: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch a single TRF by number, including folders and files."""
    check_trf_access(db, current_user, trf_number)
    return trf_service.get_trf_by_number(db, trf_number)


# ── Write ──────────────────────────────────────────────────────────────────────

@router.post("/", response_model=TRFResponse, status_code=status.HTTP_201_CREATED)
def create_trf(
    payload: TRFCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Admin", "Engineer"])),
):
    """
    Create a new TRF record.

    - Validates unique trf_number.
    - Creates local folder structure (5 subfolders).
    - Attempts SharePoint folder creation; falls back to local on failure.
    - Response includes sharepoint_status and sharepoint_message.
    """
    return trf_service.create_trf(db, payload, current_user=current_user)


@router.put("/{trf_number}", response_model=TRFResponse)
def update_trf(
    trf_number: str,
    payload: TRFUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Admin", "Engineer"])),
):
    """Update the project name of an existing TRF."""
    check_trf_access(db, current_user, trf_number)
    return trf_service.update_trf(db, trf_number, payload.project_name, current_user=current_user)



@router.delete("/{trf_number}", response_model=MessageResponse)
def delete_trf(
    trf_number: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Admin"])),
):
    """Permanently delete a TRF record. Admin only."""
    trf_service.delete_trf(db, trf_number, current_user=current_user)
    return {"message": f"TRF '{trf_number}' deleted successfully."}
