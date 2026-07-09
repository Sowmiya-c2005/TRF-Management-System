from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class DashboardStats(BaseModel):
    total_trfs: int
    pending_reviews: int
    active_projects: int
    completed_projects: int
    recent_activities: int
    unread_notifications: int


class AdminDashboardStats(DashboardStats):
    active_engineers: int
    active_managers: int
    total_users: int


class ManagerDashboardStats(DashboardStats):
    assigned_projects: int
    team_progress: float  # percentage


class EngineerDashboardStats(DashboardStats):
    my_assigned_trfs: int
    my_pending_tasks: int
    upload_history: int


class TRFStatusDistribution(BaseModel):
    status: str
    count: int


class RecentActivity(BaseModel):
    id: int
    action_type: str
    description: str
    created_at: datetime
    username: Optional[str] = None

    model_config = {"from_attributes": True}


class DashboardResponse(BaseModel):
    stats: DashboardStats
    status_distribution: List[TRFStatusDistribution]
    recent_activities: List[RecentActivity]
