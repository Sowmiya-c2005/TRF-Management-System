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


def _enrich_trf(db: Session, trf) -> dict:
    from backend.models.user_model import User as UserModel
    from backend.models.activity_model import Activity

    # 1. Created By
    created_by = None
    if trf.created_by_id:
        creator = db.query(UserModel).filter(UserModel.id == trf.created_by_id).first()
        if creator:
            created_by = creator.display_name or creator.username
    if not created_by and trf.creator:
        created_by = trf.creator.display_name or trf.creator.username
    if not created_by:
        created_by = "System"

    # 2. Assigned By
    assigned_by = None
    assign_act = db.query(Activity).filter(Activity.trf_id == trf.id, Activity.action_type == "TRF_ASSIGNED").order_by(Activity.created_at.desc()).first()
    if assign_act and assign_act.user:
        assigned_by = assign_act.user.display_name or assign_act.user.username

    # 3. Last Updated By & Last Updated Time
    last_updated_by = None
    last_updated_time = None
    latest_act = db.query(Activity).filter(Activity.trf_id == trf.id).order_by(Activity.created_at.desc()).first()
    if latest_act:
        last_updated_time = latest_act.created_at
        if latest_act.user:
            last_updated_by = latest_act.user.display_name or latest_act.user.username

    if not last_updated_by:
        last_updated_by = created_by
    if not last_updated_time:
        last_updated_time = trf.updated_at or trf.created_at

    # 4. Completion Pct
    pct_map = {
        "Draft": 0,
        "Assigned": 15,
        "In Progress": 40,
        "Under Review": 70,
        "Approved": 90,
        "Completed": 100,
        "Archived": 100
    }
    completion_pct = pct_map.get(trf.status, 0)

    return {
        "id": trf.id,
        "trf_number": trf.trf_number,
        "project_name": trf.project_name,
        "created_at": trf.created_at,
        "sharepoint_status": trf.sharepoint_status,
        "sharepoint_message": trf.sharepoint_message,
        "status": trf.status,
        "status_updated_at": trf.status_updated_at,
        "assigned_manager_id": trf.assigned_manager_id,
        "engineer_ids": trf.engineer_ids,
        "priority": trf.priority,
        "due_date": trf.due_date,
        "remarks": trf.remarks,
        "created_by": created_by,
        "assigned_by": assigned_by,
        "last_updated_by": last_updated_by,
        "last_updated_time": last_updated_time,
        "completion_pct": completion_pct,
    }


# ── Read ───────────────────────────────────────────────────────────────────────

@router.get("/", response_model=dict)
def get_all_trfs(
    search:     Optional[str] = Query(None,  description="Search by TRF number or project name"),
    sp_status:  Optional[str] = Query(None,  alias="sharepoint_status"),
    status:     Optional[str] = Query(None,  description="Filter by TRF status"),
    priority:   Optional[str] = Query(None,  description="Filter by priority"),
    sort_by:    Optional[str] = Query("created_at", description="Sort field: trf_number|project_name|status|priority|created_at|due_date"),
    sort_order: Optional[str] = Query("desc", description="asc or desc"),
    page:       int           = Query(1,     ge=1,  description="Page number (1-based)"),
    per_page:   int           = Query(10,    ge=1, le=100, description="Records per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return paginated TRF records with optional search, filter, and sort."""
    from backend.services.assignment_service import get_user_assigned_trfs
    trfs = get_user_assigned_trfs(db, current_user.id, current_user.role)

    # ── Search ────────────────────────────────────────────────────────────────
    if search:
        q = search.lower()
        trfs = [t for t in trfs if q in (t.trf_number or "").lower() or q in (t.project_name or "").lower()]

    # ── Filter ────────────────────────────────────────────────────────────────
    if sp_status:
        trfs = [t for t in trfs if t.sharepoint_status == sp_status]
    if status:
        trfs = [t for t in trfs if (t.status or "").lower() == status.lower()]
    if priority:
        trfs = [t for t in trfs if (t.priority or "").lower() == priority.lower()]

    # ── Sort ──────────────────────────────────────────────────────────────────
    valid_sort_fields = {"trf_number", "project_name", "status", "priority", "created_at", "due_date"}
    if sort_by not in valid_sort_fields:
        sort_by = "created_at"
    reverse = sort_order.lower() != "asc"
    trfs = sorted(
        trfs,
        key=lambda t: (getattr(t, sort_by) or "") if sort_by != "priority" else (
            {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}.get(t.priority or "Low", 4)
        ),
        reverse=reverse,
    )

    # ── Paginate ──────────────────────────────────────────────────────────────
    total = len(trfs)
    pages = max(1, (total + per_page - 1) // per_page)
    page  = min(page, pages)
    start = (page - 1) * per_page
    page_items = trfs[start : start + per_page]

    return {
        "items":    [_enrich_trf(db, t) for t in page_items],
        "total":    total,
        "page":     page,
        "pages":    pages,
        "per_page": per_page,
    }


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
    trf = trf_service.get_trf_by_number(db, trf_number)
    enriched = _enrich_trf(db, trf)
    enriched["folders"] = trf.folders
    return enriched


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
