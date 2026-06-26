import asyncio
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.schemas.notification_schema import NotificationResponse
from backend.schemas.trf_schema import MessageResponse
from backend.services import notification_service
from backend.middleware.auth_middleware import get_current_user
from backend.models.user_model import User
from backend.utils.websocket_manager import manager
from backend.utils.logging_config import get_logger

logger = get_logger("notification_routes")
router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.websocket("/ws")
async def notifications_websocket(websocket: WebSocket):
    """WebSocket endpoint for real-time notification streaming."""
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive — receive any client pings
            data = await websocket.receive_text()
            # Optionally handle client -> server messages if needed
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        manager.disconnect(websocket)


@router.get("/", response_model=list[NotificationResponse])
def get_my_notifications(
    include_read: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve notifications for the currently logged-in user."""
    return notification_service.get_user_notifications(db, current_user.id, include_read)


@router.put("/read-all", response_model=MessageResponse)
def read_all_my_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark all notifications as read for the logged-in user."""
    notification_service.mark_all_as_read(db, current_user.id)
    return {"message": "All notifications marked as read."}


@router.put("/{notification_id}/read", response_model=NotificationResponse)
def read_single_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a single notification as read."""
    return notification_service.mark_as_read(db, notification_id)
