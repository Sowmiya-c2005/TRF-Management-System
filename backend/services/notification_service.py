import asyncio
from sqlalchemy.orm import Session
from backend.models.notification_model import Notification
from backend.repositories.notification_repository import NotificationRepository
from backend.utils.logging_config import get_logger
from backend.utils.websocket_manager import manager
from backend.services.email_service import send_system_email

logger = get_logger("notification_service")
notif_repo = NotificationRepository()


def create_notification(
    db: Session,
    user_id: int | None,
    title: str,
    body: str,
    notif_type: str = "trf"
) -> Notification:
    """Create, database-record, email-dispatch, and WebSocket-broadcast a notification."""
    notification = Notification(
        user_id=user_id,
        title=title,
        body=body,
        type=notif_type,
        read=False
    )
    notif_repo.create(db, notification)
    logger.info(f"Notification created: {title} (Type: {notif_type}) for user_id: {user_id}")

    # 1. Real-time WebSocket Broadcast
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(
            manager.broadcast({
                "id": notification.id,
                "title": notification.title,
                "body": notification.body,
                "type": notification.type,
                "read": notification.read,
                "created_at": notification.created_at.isoformat()
            })
        )
    except RuntimeError:
        # No running loop, fallback
        asyncio.run(
            manager.broadcast({
                "id": notification.id,
                "title": notification.title,
                "body": notification.body,
                "type": notification.type,
                "read": notification.read,
                "created_at": notification.created_at.isoformat()
            })
        )
    except Exception as ws_err:
        logger.error(f"WebSocket broadcast failed: {str(ws_err)}")

    # 2. Email Notifications (Admins for global/trf/user events; targeted user otherwise)
    try:
        from backend.models.user_model import User
        target_emails = []
        
        if user_id:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                email = user.email or f"{user.username}@trfportal.com"
                target_emails.append(email)
        else:
            # System-wide events: notify all Admin users
            admins = db.query(User).filter(User.role == "Admin").all()
            for admin in admins:
                email = admin.email or f"{admin.username}@trfportal.com"
                target_emails.append(email)

        for email in target_emails:
            send_system_email(
                to_email=email,
                subject=f"TRF Alert: {title}",
                body=(
                    f"TRF Portal Notification Alert\n"
                    f"=================================\n\n"
                    f"Event: {title}\n"
                    f"Details: {body}\n"
                    f"Type: {notif_type.upper()}\n"
                    f"Timestamp: {notification.created_at}\n\n"
                    f"Please log into the portal to review details.\n\n"
                    f"Best Regards,\n"
                    f"TRF Management System"
                )
            )
    except Exception as email_err:
        logger.error(f"Email notifications dispatch failed: {str(email_err)}")

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
