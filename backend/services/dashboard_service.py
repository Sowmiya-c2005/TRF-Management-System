"""
Dashboard service - provide role-specific statistics and data.
"""
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List

from backend.models.trf_model import TRFRecord
from backend.models.user_model import User
from backend.models.activity_model import Activity
from backend.models.notification_model import Notification
from backend.models.trf_assignment_model import TRFEngineerAssignment
from backend.repositories.notification_repository import NotificationRepository
from backend.utils.logging_config import get_logger

logger = get_logger("dashboard_service")
notif_repo = NotificationRepository()


def get_admin_dashboard_stats(db: Session) -> dict:
    """Get dashboard statistics for Admin role."""
    # Total TRFs
    total_trfs = db.query(func.count(TRFRecord.id)).scalar() or 0
    
    # Pending reviews (Under Review status)
    pending_reviews = db.query(func.count(TRFRecord.id)).filter(
        TRFRecord.status == "Under Review"
    ).scalar() or 0
    
    # Active projects (not Draft, not Archived, not Completed)
    active_projects = db.query(func.count(TRFRecord.id)).filter(
        TRFRecord.status.in_(["Assigned", "In Progress", "Under Review", "Approved"])
    ).scalar() or 0
    
    # Completed projects
    completed_projects = db.query(func.count(TRFRecord.id)).filter(
        TRFRecord.status == "Completed"
    ).scalar() or 0
    
    # Active engineers
    active_engineers = db.query(func.count(User.id)).filter(
        User.role == "Engineer",
        User.is_active == True
    ).scalar() or 0
    
    # Active managers
    active_managers = db.query(func.count(User.id)).filter(
        User.role == "Manager",
        User.is_active == True
    ).scalar() or 0

    # Active admins
    active_admins = db.query(func.count(User.id)).filter(
        User.role == "Admin",
        User.is_active == True
    ).scalar() or 0
    
    # Total active users (all roles)
    total_users = db.query(func.count(User.id)).filter(
        User.is_active == True
    ).scalar() or 0

    # Total users including inactive
    total_all_users = db.query(func.count(User.id)).scalar() or 0
    
    # Recent activities (last 7 days)
    from datetime import datetime, timedelta
    week_ago = datetime.now() - timedelta(days=7)
    recent_activities = db.query(func.count(Activity.id)).filter(
        Activity.created_at >= week_ago
    ).scalar() or 0
    
    # Unique project names
    unique_projects = db.query(func.count(func.distinct(TRFRecord.project_name))).scalar() or 0

    return {
        "total_trfs": total_trfs,
        "pending_reviews": pending_reviews,
        "active_projects": active_projects,
        "unique_projects": unique_projects,
        "completed_projects": completed_projects,
        "active_engineers": active_engineers,
        "active_managers": active_managers,
        "active_admins": active_admins,
        "total_users": total_users,
        "total_all_users": total_all_users,
        "recent_activities": recent_activities,
    }


def get_manager_dashboard_stats(db: Session, manager_id: int) -> dict:
    """Get dashboard statistics for Manager role."""
    # TRFs assigned to this manager OR created by this manager
    assigned_ids = {
        r[0] for r in
        db.query(TRFRecord.id).filter(TRFRecord.assigned_manager_id == manager_id).all()
    }
    created_ids = {
        r[0] for r in
        db.query(TRFRecord.id).filter(TRFRecord.created_by_id == manager_id).all()
    }
    all_ids = list(assigned_ids | created_ids)
    assigned_projects = len(all_ids)

    if all_ids:
        pending_reviews = db.query(func.count(TRFRecord.id)).filter(
            TRFRecord.id.in_(all_ids),
            TRFRecord.status == "Under Review"
        ).scalar() or 0

        active_projects = db.query(func.count(TRFRecord.id)).filter(
            TRFRecord.id.in_(all_ids),
            TRFRecord.status.in_(["Assigned", "In Progress", "Under Review", "Approved"])
        ).scalar() or 0

        completed_projects = db.query(func.count(TRFRecord.id)).filter(
            TRFRecord.id.in_(all_ids),
            TRFRecord.status == "Completed"
        ).scalar() or 0

        completed_or_approved = db.query(func.count(TRFRecord.id)).filter(
            TRFRecord.id.in_(all_ids),
            TRFRecord.status.in_(["Approved", "Completed"])
        ).scalar() or 0

        unique_projects = db.query(func.count(func.distinct(TRFRecord.project_name))).filter(
            TRFRecord.id.in_(all_ids)
        ).scalar() or 0
    else:
        pending_reviews = active_projects = completed_projects = completed_or_approved = unique_projects = 0

    team_progress = round((completed_or_approved / max(assigned_projects, 1)) * 100, 2)

    from datetime import datetime, timedelta
    week_ago = datetime.now() - timedelta(days=7)
    if all_ids:
        recent_activities = db.query(func.count(Activity.id)).filter(
            Activity.trf_id.in_(all_ids),
            Activity.created_at >= week_ago
        ).scalar() or 0
    else:
        recent_activities = 0

    return {
        "assigned_projects": assigned_projects,
        "total_trfs": assigned_projects,
        "pending_reviews": pending_reviews,
        "active_projects": active_projects,
        "unique_projects": unique_projects,
        "completed_projects": completed_projects,
        "team_progress": team_progress,
        "recent_activities": recent_activities,
    }


def get_engineer_dashboard_stats(db: Session, engineer_id: int) -> dict:
    """Get dashboard statistics for Engineer role."""
    # TRFs formally assigned to this engineer via trf_engineer_assignments
    assignments = db.query(TRFEngineerAssignment).filter(
        TRFEngineerAssignment.engineer_id == engineer_id
    ).all()
    assigned_ids = {a.trf_id for a in assignments}

    # TRFs created by this engineer (even if not formally assigned)
    from backend.models.trf_model import TRFRecord as TRF
    created_ids = {
        r[0] for r in
        db.query(TRF.id).filter(TRF.created_by_id == engineer_id).all()
    }

    # Union — all TRF IDs visible to this engineer
    trf_ids = list(assigned_ids | created_ids)
    my_assigned_trfs = len(trf_ids)

    if trf_ids:
        pending_tasks = db.query(func.count(TRFRecord.id)).filter(
            TRFRecord.id.in_(trf_ids),
            TRFRecord.status.in_(["In Progress", "Under Review"])
        ).scalar() or 0

        active_projects = db.query(func.count(TRFRecord.id)).filter(
            TRFRecord.id.in_(trf_ids),
            TRFRecord.status.in_(["Assigned", "In Progress", "Under Review", "Approved"])
        ).scalar() or 0

        completed_projects = db.query(func.count(TRFRecord.id)).filter(
            TRFRecord.id.in_(trf_ids),
            TRFRecord.status == "Completed"
        ).scalar() or 0

        unique_projects = db.query(func.count(func.distinct(TRFRecord.project_name))).filter(
            TRFRecord.id.in_(trf_ids)
        ).scalar() or 0
    else:
        pending_tasks = active_projects = completed_projects = unique_projects = 0

    # Upload history (count of files uploaded by this engineer)
    from backend.models.file_model import FileRecord
    upload_history = db.query(func.count(FileRecord.id)).filter(
        FileRecord.uploaded_by_id == engineer_id
    ).scalar() or 0

    # Recent activities
    from datetime import datetime, timedelta
    week_ago = datetime.now() - timedelta(days=7)
    if trf_ids:
        recent_activities = db.query(func.count(Activity.id)).filter(
            Activity.trf_id.in_(trf_ids),
            Activity.created_at >= week_ago
        ).scalar() or 0
    else:
        recent_activities = 0

    return {
        "my_assigned_trfs": my_assigned_trfs,
        "total_trfs": my_assigned_trfs,
        "my_pending_tasks": pending_tasks,
        "active_projects": active_projects,
        "unique_projects": unique_projects,
        "completed_projects": completed_projects,
        "upload_history": upload_history,
        "recent_activities": recent_activities,
    }


def get_status_distribution(db: Session, manager_id: int = None, engineer_id: int = None) -> List[dict]:
    """Get distribution of TRFs by status."""
    statuses = ["Draft", "Assigned", "In Progress", "Under Review", "Approved", "Completed", "Archived"]
    distribution = []
    
    for status in statuses:
        query = db.query(func.count(TRFRecord.id)).filter(TRFRecord.status == status)
        if manager_id is not None:
            query = query.filter(TRFRecord.assigned_manager_id == manager_id)
        elif engineer_id is not None:
            query = query.join(TRFEngineerAssignment, TRFEngineerAssignment.trf_id == TRFRecord.id).filter(
                TRFEngineerAssignment.engineer_id == engineer_id
            )
        count = query.scalar() or 0
        distribution.append({"status": status, "count": count})
    
    return distribution


def get_unread_notification_count(db: Session, user_id: int) -> int:
    """Get unread notification count for a user."""
    return notif_repo.get_unread_count(db, user_id)


def get_recent_activities(db: Session, limit: int = 10, current_user: User = None) -> List[Activity]:
    """Get recent activities based on role — uses joinedload to avoid N+1 queries."""
    from sqlalchemy.orm import joinedload

    if not current_user or current_user.role in ("Admin", "Administrator"):
        return (
            db.query(Activity)
            .options(joinedload(Activity.user))
            .order_by(Activity.created_at.desc())
            .limit(limit)
            .all()
        )

    from backend.models.trf_assignment_model import TRFEngineerAssignment
    if current_user.role == "Manager":
        return (
            db.query(Activity)
            .options(joinedload(Activity.user))
            .join(TRFRecord, Activity.trf_id == TRFRecord.id)
            .filter(TRFRecord.assigned_manager_id == current_user.id)
            .order_by(Activity.created_at.desc())
            .limit(limit)
            .all()
        )
    elif current_user.role == "Engineer":
        return (
            db.query(Activity)
            .options(joinedload(Activity.user))
            .join(TRFRecord, Activity.trf_id == TRFRecord.id)
            .join(TRFEngineerAssignment, TRFEngineerAssignment.trf_id == TRFRecord.id)
            .filter(TRFEngineerAssignment.engineer_id == current_user.id)
            .order_by(Activity.created_at.desc())
            .limit(limit)
            .all()
        )
    return []

