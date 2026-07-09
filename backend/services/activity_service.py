"""
Activity service - track all TRF-related activities for timeline.
"""
from datetime import datetime, timezone
from typing import Optional, Dict, Any
import json

from sqlalchemy.orm import Session

from backend.models.activity_model import Activity
from backend.repositories.activity_repository import ActivityRepository
from backend.utils.logging_config import get_logger

logger = get_logger("activity_service")

activity_repo = ActivityRepository()


def log_activity(
    db: Session,
    trf_id: int,
    user_id: Optional[int],
    action_type: str,
    description: str,
    metadata: Optional[Dict[str, Any]] = None
) -> Activity:
    """Log an activity for the activity timeline."""
    activity = Activity(
        trf_id=trf_id,
        user_id=user_id,
        action_type=action_type,
        description=description,
        extra_data=json.dumps(metadata) if metadata else None
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    logger.info(f"Activity logged: {action_type} for TRF {trf_id}")
    return activity


def get_trf_timeline(db: Session, trf_id: int, limit: int = 100) -> list[Activity]:
    """Get the activity timeline for a specific TRF."""
    return activity_repo.get_by_trf_id(db, trf_id, limit)


def get_user_activities(db: Session, user_id: int, limit: int = 50) -> list[Activity]:
    """Get activities performed by a specific user."""
    return activity_repo.get_by_user_id(db, user_id, limit)


def get_recent_activities(db: Session, limit: int = 100) -> list[Activity]:
    """Get recent activities across all TRFs."""
    return activity_repo.get_recent(db, limit)
