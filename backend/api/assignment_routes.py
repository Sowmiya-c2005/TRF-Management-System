"""
Assignment API routes.
Prefix: /assignments
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.schemas.assignment_schema import (
    TRFAssignmentRequest, TRFAssignmentResponse,
    TRFStatusUpdateRequest, TRFStatusResponse
)
from backend.services import assignment_service, audit_service, activity_service, notification_service
from backend.services.email_service import email_status_changed
from backend.middleware.auth_middleware import get_current_user, require_admin
from backend.models.user_model import User
from backend.models.trf_model import TRFRecord

router = APIRouter(prefix="/assignments", tags=["Assignments"])


@router.post("/assign", response_model=dict)
def assign_trf(
    payload: TRFAssignmentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Assign a TRF to a manager and engineers. Admin only."""
    trf = assignment_service.assign_trf(
        db,
        payload.trf_id,
        payload.manager_id,
        payload.engineer_ids,
        current_user.id
    )
    
    # Log activity
    activity_service.log_activity(
        db,
        trf_id=payload.trf_id,
        user_id=current_user.id,
        action_type="TRF_ASSIGNED",
        description=f"TRF {trf.trf_number} assigned to manager ID {payload.manager_id} and {len(payload.engineer_ids)} engineers"
    )
    
    audit_service.log_action(
        db,
        user_id=current_user.id,
        action="ASSIGN_TRF",
        details=f"Admin '{current_user.username}' assigned TRF {trf.trf_number}"
    )
    
    return {"message": "TRF assigned successfully", "trf_number": trf.trf_number}


@router.get("/trf/{trf_id}")
def get_trf_assignments(
    trf_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get assignments for a specific TRF."""
    return assignment_service.get_trf_assignments(db, trf_id)


@router.get("/my-trfs")
def get_my_assigned_trfs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get TRFs assigned to the current user based on their role."""
    trfs = assignment_service.get_user_assigned_trfs(db, current_user.id, current_user.role)
    return {"trfs": trfs, "count": len(trfs)}


@router.put("/trf/{trf_id}/status", response_model=TRFStatusResponse)
def update_trf_status(
    trf_id: int,
    payload: TRFStatusUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update TRF status with workflow validation."""
    from backend.services.assignment_service import get_trf_assignments

    # Capture old status before update
    from backend.repositories.trf_repository import TRFRepository
    old_trf = TRFRepository().get(db, trf_id)
    old_status = old_trf.status if old_trf else "Unknown"

    trf = assignment_service.update_trf_status(db, trf_id, payload.status)

    # Log activity
    activity_service.log_activity(
        db,
        trf_id=trf_id,
        user_id=current_user.id,
        action_type="STATUS_CHANGED",
        description=f"TRF {trf.trf_number} status changed from {old_status} to {payload.status}"
    )

    audit_service.log_action(
        db,
        user_id=current_user.id,
        action="UPDATE_TRF_STATUS",
        details=f"User '{current_user.username}' changed TRF {trf.trf_number} status from '{old_status}' to '{payload.status}'"
    )

    # In-app notifications for assigned users
    try:
        assignments = get_trf_assignments(db, trf_id)
        manager_id = assignments.get("manager_id") if assignments else None
        eng_assignments = assignments.get("engineer_assignments", []) if assignments else []
        engineer_ids = [ea.engineer_id for ea in eng_assignments] if eng_assignments else []
        notification_service.notify_status_changed(
            db, trf.trf_number, old_status, payload.status, manager_id, engineer_ids
        )
    except Exception as notif_err:
        import logging; logging.getLogger("assignment_routes").warning(f"Status notification error: {notif_err}")

    # Email admins on status change
    try:
        actor_role = current_user.role
        email_status_changed(db, trf.trf_number, old_status, payload.status,
                             current_user.username, actor_role)
    except Exception as email_err:
        import logging; logging.getLogger("assignment_routes").warning(f"Status email error: {email_err}")

    return trf
