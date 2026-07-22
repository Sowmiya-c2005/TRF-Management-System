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
from backend.services.email_service import email_status_changed, email_project_assigned
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
        current_user.id,
        priority=payload.priority,
        due_date=payload.due_date,
        remarks=payload.remarks,
    )
    
    # Log activity
    activity_service.log_activity(
        db,
        trf_id=payload.trf_id,
        user_id=current_user.id,
        action_type="TRF_ASSIGNED",
        description=f"TRF {trf.trf_number} assigned to manager ID {payload.manager_id} and {len(payload.engineer_ids)} engineer(s)"
    )
    
    audit_service.log_action(
        db,
        user_id=current_user.id,
        action="ASSIGN_TRF",
        details=f"Admin '{current_user.username}' assigned TRF {trf.trf_number} — priority: {payload.priority}, due: {payload.due_date}"
    )

    # Fire in-app notifications to assigned users
    try:
        notification_service.notify_trf_assigned(
            db, trf.trf_number, payload.manager_id, payload.engineer_ids, current_user.display_name or current_user.username
        )
    except Exception as notif_err:
        import logging; logging.getLogger("assignment_routes").warning(f"Assignment notification error: {notif_err}")
    
    # Email admins on assignment if actor is Manager/Engineer
    try:
        email_project_assigned(
            db, trf.trf_number, payload.manager_id, payload.engineer_ids,
            current_user.username, current_user.role
        )
    except Exception as email_err:
        import logging; logging.getLogger("assignment_routes").warning(f"Assignment email error: {email_err}")
    
    return {"message": "TRF assigned successfully", "trf_number": trf.trf_number, "status": trf.status}


@router.get("/trf/{trf_id}")
def get_trf_assignments(
    trf_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get assignments for a specific TRF."""
    data = assignment_service.get_trf_assignments(db, trf_id)
    # Serialize engineer_assignments ORM objects
    eng_assignments = data.get("engineer_assignments", [])
    data["engineer_assignments"] = [
        {
            "id":             ea.id,
            "trf_id":         ea.trf_id,
            "engineer_id":    ea.engineer_id,
            "assigned_by_id": ea.assigned_by_id,
            "assigned_at":    ea.assigned_at.isoformat() if ea.assigned_at else None,
        }
        for ea in eng_assignments
    ]
    return data


@router.get("/my-trfs")
def get_my_assigned_trfs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get TRFs assigned to the current user based on their role."""
    trfs = assignment_service.get_user_assigned_trfs(db, current_user.id, current_user.role)
    serialized = [
        {
            "id":                  t.id,
            "trf_number":          t.trf_number,
            "project_name":        t.project_name,
            "status":              t.status,
            "priority":            t.priority,
            "due_date":            t.due_date.isoformat() if t.due_date else None,
            "remarks":             t.remarks,
            "sharepoint_status":   t.sharepoint_status,
            "sharepoint_message":  t.sharepoint_message,
            "assigned_manager_id": t.assigned_manager_id,
            "engineer_ids":        t.engineer_ids,
            "created_at":          t.created_at.isoformat() if t.created_at else None,
            "updated_at":          t.updated_at.isoformat() if t.updated_at else None,
        }
        for t in trfs
    ]
    return {"trfs": serialized, "count": len(serialized)}


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


@router.get("/users")
def get_assignable_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Return all Managers and Engineers for assignment dropdowns. Admin only."""
    from backend.models.user_model import User as UserModel
    managers  = db.query(UserModel).filter(UserModel.role == "Manager",  UserModel.is_active == True).all()
    engineers = db.query(UserModel).filter(UserModel.role == "Engineer", UserModel.is_active == True).all()
    return {
        "managers":  [{"id": u.id, "username": u.username, "display_name": u.display_name or u.username, "email": u.email} for u in managers],
        "engineers": [{"id": u.id, "username": u.username, "display_name": u.display_name or u.username, "email": u.email} for u in engineers],
    }


@router.get("/trf-detail/{trf_id}")
def get_trf_assignment_detail(
    trf_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get full TRF assignment details including manager, engineers, priority, due date."""
    from backend.models.trf_model import TRFRecord
    from backend.models.user_model import User as UserModel
    trf = db.query(TRFRecord).filter(TRFRecord.id == trf_id).first()
    if not trf:
        from fastapi import HTTPException, status as http_status
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="TRF not found")

    manager = None
    if trf.assigned_manager_id:
        m = db.query(UserModel).filter(UserModel.id == trf.assigned_manager_id).first()
        if m:
            manager = {"id": m.id, "username": m.username, "display_name": m.display_name or m.username, "email": m.email}

    engineers = []
    for ea in trf.engineer_assignments:
        e = db.query(UserModel).filter(UserModel.id == ea.engineer_id).first()
        if e:
            engineers.append({"id": e.id, "username": e.username, "display_name": e.display_name or e.username, "email": e.email})

    return {
        "id":           trf.id,
        "trf_number":   trf.trf_number,
        "project_name": trf.project_name,
        "status":       trf.status,
        "priority":     trf.priority,
        "due_date":     trf.due_date.isoformat() if trf.due_date else None,
        "remarks":      trf.remarks,
        "manager":      manager,
        "engineers":    engineers,
        "created_at":   trf.created_at.isoformat() if trf.created_at else None,
        "updated_at":   trf.updated_at.isoformat() if trf.updated_at else None,
    }
