from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.schemas.audit_schema import AuditLogResponse
from backend.services import audit_service
from backend.middleware.auth_middleware import get_current_user, RoleChecker
from backend.models.user_model import User

router = APIRouter(prefix="/audits", tags=["Audit Trails"])


@router.get("/", response_model=list[AuditLogResponse])
def get_audits(
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Admin"]))
):
    """Retrieve system audit logs. Accessible by Admin only."""
    logs = audit_service.get_audit_logs(db, limit, offset)
    
    # Map logs with username to conform with the schema
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
