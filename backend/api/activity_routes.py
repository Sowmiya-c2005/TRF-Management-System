"""
Activity API routes.
Prefix: /activities
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.services import activity_service
from backend.middleware.auth_middleware import get_current_user
from backend.models.user_model import User

router = APIRouter(prefix="/activities", tags=["Activities"])


@router.get("/trf/{trf_id}")
def get_trf_timeline(
    trf_id: int,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get activity timeline for a specific TRF."""
    activities = activity_service.get_trf_timeline(db, trf_id, limit)
    return {"trf_id": trf_id, "activities": activities, "count": len(activities)}


@router.get("/my-activities")
def get_my_activities(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get activities performed by the current user."""
    activities = activity_service.get_user_activities(db, current_user.id, limit)
    return {"activities": activities, "count": len(activities)}


@router.get("/recent")
def get_recent_activities(
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get recent activities across all TRFs."""
    activities = activity_service.get_recent_activities(db, limit)
    return {"activities": activities, "count": len(activities)}
