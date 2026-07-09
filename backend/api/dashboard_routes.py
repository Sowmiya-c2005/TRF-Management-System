"""
Dashboard API routes.
Prefix: /dashboard
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.schemas.dashboard_schema import DashboardResponse, TRFStatusDistribution, RecentActivity
from backend.services import dashboard_service
from backend.middleware.auth_middleware import get_current_user, require_admin
from backend.models.user_model import User

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=dict)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get dashboard statistics based on user role."""
    if current_user.role == "Admin":
        stats = dashboard_service.get_admin_dashboard_stats(db)
    elif current_user.role == "Manager":
        stats = dashboard_service.get_manager_dashboard_stats(db, current_user.id)
    elif current_user.role == "Engineer":
        stats = dashboard_service.get_engineer_dashboard_stats(db, current_user.id)
    else:
        stats = {}
    
    # Add unread notification count
    stats["unread_notifications"] = dashboard_service.get_unread_notification_count(db, current_user.id)
    
    return stats


@router.get("/status-distribution")
def get_status_distribution(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get TRF status distribution."""
    distribution = dashboard_service.get_status_distribution(db)
    return {"distribution": distribution}


@router.get("/recent-activities")
def get_recent_activities(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get recent activities."""
    activities = dashboard_service.get_recent_activities(db, limit)
    return {"activities": activities, "count": len(activities)}


@router.get("/admin")
def get_admin_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Get comprehensive admin dashboard data."""
    stats = dashboard_service.get_admin_dashboard_stats(db)
    stats["unread_notifications"] = dashboard_service.get_unread_notification_count(db, current_user.id)
    distribution = dashboard_service.get_status_distribution(db)
    activities = dashboard_service.get_recent_activities(db, 10)
    
    return {
        "stats": stats,
        "status_distribution": distribution,
        "recent_activities": activities
    }


@router.get("/manager")
def get_manager_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get comprehensive manager dashboard data."""
    if current_user.role != "Manager" and current_user.role != "Admin":
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    stats = dashboard_service.get_manager_dashboard_stats(db, current_user.id)
    stats["unread_notifications"] = dashboard_service.get_unread_notification_count(db, current_user.id)
    distribution = dashboard_service.get_status_distribution(db)
    activities = dashboard_service.get_recent_activities(db, 10)
    
    return {
        "stats": stats,
        "status_distribution": distribution,
        "recent_activities": activities
    }


@router.get("/engineer")
def get_engineer_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get comprehensive engineer dashboard data."""
    if current_user.role != "Engineer" and current_user.role != "Admin":
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    stats = dashboard_service.get_engineer_dashboard_stats(db, current_user.id)
    stats["unread_notifications"] = dashboard_service.get_unread_notification_count(db, current_user.id)
    distribution = dashboard_service.get_status_distribution(db)
    activities = dashboard_service.get_recent_activities(db, 10)
    
    return {
        "stats": stats,
        "status_distribution": distribution,
        "recent_activities": activities
    }
