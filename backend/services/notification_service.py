from sqlalchemy.orm import Session
from backend.models.notification_model import Notification
from backend.repositories.notification_repository import NotificationRepository
from backend.utils.logging_config import get_logger

logger = get_logger("notification_service")
notif_repo = NotificationRepository()


def create_notification(
    db: Session,
    user_id: int | None,
    title: str,
    body: str,
    notif_type: str = "trf"
) -> Notification:
    """Create and dispatch a notification."""
    notification = Notification(
        user_id=user_id,
        title=title,
        body=body,
        type=notif_type,
        read=False
    )
    notif_repo.create(db, notification)
    logger.info(f"Notification created: {title} (Type: {notif_type}) for user_id: {user_id}")
    return notification


def get_user_notifications(db: Session, user_id: int, include_read: bool = True) -> list[Notification]:
    """Retrieve notifications for a user."""
    return notif_repo.get_user_notifications(db, user_id, include_read)


def mark_all_as_read(db: Session, user_id: int) -> None:
    """Mark all notifications as read."""
    notif_repo.mark_all_as_read(db, user_id)
    logger.info(f"Marked all notifications as read for user_id: {user_id}")


def mark_as_read(db: Session, notification_id: int) -> Notification:
    """Mark a single notification as read."""
    notification = notif_repo.get(db, notification_id)
    if not notification:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    notification.read = True
    notif_repo.commit(db)
    logger.info(f"Marked notification {notification_id} as read.")
    return notification
