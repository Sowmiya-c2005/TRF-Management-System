from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.schemas.audit_schema import AuditLogResponse
from backend.services import audit_service
from backend.middleware.auth_middleware import get_current_user, RoleChecker
from backend.models.user_model import User

router = APIRouter(prefix="/audits", tags=["Audit Trails"])


@router.get("/", response_model=list[AuditLogResponse])
def get_audits(
    limit: int = Query(100, ge=1, le=500, description="Maximum number of records to return"),
    offset: int = Query(0, ge=0, description="Number of records to skip"),
    action: Optional[str] = Query(None, description="Filter by action type (e.g. CREATE_TRF)"),
    username: Optional[str] = Query(None, description="Filter by username"),
    search: Optional[str] = Query(None, description="Search in action and details fields"),
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Admin"]))
):
    """Retrieve system audit logs with optional filtering. Accessible by Admin only."""
    logs = audit_service.get_audit_logs(
        db,
        limit=limit,
        offset=offset,
        action_filter=action,
        username_filter=username,
        search=search
    )

    response_data = []
    for log in logs:
        response_data.append({
            "id": log.id,
            "user_id": log.user_id,
            "username": log.user.username if log.user else "System",
            "action": log.action,
            "details": log.details,
            "ip_address": log.ip_address,
            "created_at": log.created_at
        })
    return response_data
