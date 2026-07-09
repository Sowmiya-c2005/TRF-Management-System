from sqlalchemy.orm import Session
from backend.models.notification_model import Notification
from backend.repositories.base_repository import BaseRepository


class NotificationRepository(BaseRepository[Notification]):
    def __init__(self):
        super().__init__(Notification)

    def get_user_notifications(self, db: Session, user_id: int | None = None, include_read: bool = True) -> list[Notification]:
        # Fetch notifications that either belong specifically to this user or are global (user_id is NULL)
        query = db.query(self.model).filter(
            (self.model.user_id == user_id) | (self.model.user_id.is_(None))
        )
        if not include_read:
            query = query.filter(self.model.read.is_(False))
        return query.order_by(self.model.created_at.desc()).all()

    def mark_all_as_read(self, db: Session, user_id: int) -> None:
        db.query(self.model).filter(
            (self.model.user_id == user_id) | (self.model.user_id.is_(None)),
            self.model.read.is_(False)
        ).update({"read": True}, synchronize_session=False)
        db.commit()

    def get_unread_count(self, db: Session, user_id: int) -> int:
        return db.query(self.model).filter(
            (self.model.user_id == user_id) | (self.model.user_id.is_(None)),
            self.model.read.is_(False)
        ).count()
