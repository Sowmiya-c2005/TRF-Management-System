import asyncio
import re
from typing import Optional
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.schemas.notification_schema import NotificationResponse
from backend.schemas.trf_schema import MessageResponse
from backend.services import notification_service
from backend.middleware.auth_middleware import get_current_user
from backend.models.user_model import User
from backend.models.trf_model import TRFRecord
from backend.models.activity_model import Activity
from backend.utils.websocket_manager import manager
from backend.utils.logging_config import get_logger

logger = get_logger("notification_routes")
router = APIRouter(prefix="/notifications", tags=["Notifications"])


def _enrich_notification(db: Session, notif) -> dict:
    trf_match = re.search(r'(TRF-\d{4}-\d+|TRF-[A-Z0-9-]+)', notif.title + " " + notif.body)
    trf_number = trf_match.group(1) if trf_match else None
    
    actor_username = None
    actor_role = None
    
    if trf_number:
        trf = db.query(TRFRecord).filter(TRFRecord.trf_number == trf_number).first()
        if trf:
            act = db.query(Activity).filter(
                Activity.trf_id == trf.id
            ).order_by(Activity.created_at.desc()).first()
            if act and act.user:
                actor_username = act.user.display_name or act.user.username
                actor_role = act.user.role
            
    return {
        "id": notif.id,
        "user_id": notif.user_id,
        "title": notif.title,
        "body": notif.body,
        "read": notif.read,
        "type": notif.type,
        "created_at": notif.created_at,
        "trf_number": trf_number,
        "actor_username": actor_username,
        "actor_role": actor_role
    }


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


@router.get("/", response_model=dict)
def get_my_notifications(
    include_read: bool = True,
    page: int = 1,
    limit: int = 10,
    type: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    page = page if isinstance(page, int) else 1
    limit = limit if isinstance(limit, int) else 10
    type = type if isinstance(type, str) else None
    search = search if isinstance(search, str) else None

    notifs = notification_service.get_user_notifications(db, current_user.id, include_read)
    
    if type and type.strip() and type.strip().lower() != "all":
        t = type.strip().lower()
        if t == "assignments":
            notifs = [n for n in notifs if n.type == "assignment"]
        elif t == "trfs":
            notifs = [n for n in notifs if n.type in ("trf", "status", "approval", "rejection")]
        elif t == "documents":
            notifs = [n for n in notifs if n.type in ("document", "file")]
        elif t == "system":
            notifs = [n for n in notifs if n.type not in ("assignment", "trf", "status", "approval", "rejection", "document", "file")]
        else:
            notifs = [n for n in notifs if (n.type or "").lower() == t]

    if search and search.strip():
        q = search.strip().lower()
        notifs = [
            n for n in notifs
            if q in (n.title or "").lower()
            or q in (n.body or "").lower()
        ]
            
    enriched = [_enrich_notification(db, n) for n in notifs]
    
    total = len(enriched)
    pages = max(1, (total + limit - 1) // limit)
    page_num = min(page, pages)
    start = (page_num - 1) * limit
    page_items = enriched[start : start + limit]

    return {
        "items": page_items,
        "total": total,
        "page": page_num,
        "pages": pages,
        "limit": limit
    }


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
    read: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a single notification as read or unread."""
    notif = notification_service.update_read_status(db, notification_id, read)
    return _enrich_notification(db, notif)


@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get count of unread notifications."""
    count = notification_service.get_unread_count(db, current_user.id)
    return {"unread_count": count}
