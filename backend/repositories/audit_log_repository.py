from typing import Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from backend.models.audit_log_model import AuditLog
from backend.models.user_model import User
from backend.repositories.base_repository import BaseRepository


class AuditLogRepository(BaseRepository[AuditLog]):
    def __init__(self):
        super().__init__(AuditLog)

    def get_logs(
        self,
        db: Session,
        limit: int = 100,
        offset: int = 0,
        action_filter: Optional[str] = None,
        username_filter: Optional[str] = None,
        search: Optional[str] = None
    ) -> list[AuditLog]:
        query = db.query(self.model).options(joinedload(self.model.user))

        if action_filter:
            query = query.filter(self.model.action.ilike(f"%{action_filter}%"))

        if username_filter:
            query = query.join(User, AuditLog.user_id == User.id, isouter=True).filter(
                User.username.ilike(f"%{username_filter}%")
            )

        if search:
            query = query.filter(
                or_(
                    self.model.details.ilike(f"%{search}%"),
                    self.model.action.ilike(f"%{search}%")
                )
            )

        return query.order_by(self.model.created_at.desc()).limit(limit).offset(offset).all()
