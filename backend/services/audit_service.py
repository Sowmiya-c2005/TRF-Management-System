from typing import Optional
from sqlalchemy.orm import Session
from backend.models.audit_log_model import AuditLog
from backend.repositories.audit_log_repository import AuditLogRepository
from backend.utils.logging_config import get_logger

logger = get_logger("audit_service")
audit_repo = AuditLogRepository()


def log_action(
    db: Session,
    user_id: int | None,
    action: str,
    details: str | None = None,
    ip_address: str | None = None
) -> AuditLog:
    """Create a new audit log entry."""
    log_entry = AuditLog(
        user_id=user_id,
        action=action,
        details=details,
        ip_address=ip_address
    )
    audit_repo.create(db, log_entry)
    logger.info(f"Audit Log - User {user_id} - Action: {action} - Details: {details}")
    return log_entry


def get_audit_logs(
    db: Session,
    limit: int = 100,
    offset: int = 0,
    action_filter: Optional[str] = None,
    username_filter: Optional[str] = None,
    search: Optional[str] = None
) -> list[AuditLog]:
    """Retrieve audit logs with optional filters."""
    return audit_repo.get_logs(
        db,
        limit=limit,
        offset=offset,
        action_filter=action_filter,
        username_filter=username_filter,
        search=search
    )
