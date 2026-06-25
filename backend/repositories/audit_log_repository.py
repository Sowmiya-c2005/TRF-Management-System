from sqlalchemy.orm import Session
from backend.models.audit_log_model import AuditLog
from backend.repositories.base_repository import BaseRepository


class AuditLogRepository(BaseRepository[AuditLog]):
    def __init__(self):
        super().__init__(AuditLog)

    def get_logs(self, db: Session, limit: int = 100, offset: int = 0) -> list[AuditLog]:
        return db.query(self.model).order_by(self.model.created_at.desc()).limit(limit).offset(offset).all()
