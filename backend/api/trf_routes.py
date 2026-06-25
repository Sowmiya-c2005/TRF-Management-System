from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.schemas.trf_schema import (
    TRFCreate,
    TRFUpdate,
    TRFResponse,
    TRFDetailResponse,
    MessageResponse,
    DashboardStats,
)
from backend.services import trf_service
from backend.middleware.auth_middleware import get_current_user, RoleChecker
from backend.models.user_model import User

router = APIRouter(prefix="/trfs", tags=["TRF Records"])


@router.get("/", response_model=list[TRFResponse])
def get_all_trfs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Return all TRF records. Accessible by all authenticated users."""
    return trf_service.get_all_trfs(db)


@router.get("/stats", response_model=DashboardStats)
def dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Return aggregate statistics for the dashboard. Accessible by all authenticated users."""
    return trf_service.get_dashboard_stats(db)


@router.get("/{trf_number}", response_model=TRFDetailResponse)
def get_trf(
    trf_number: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch a single TRF by its TRF number, including folders/files. Accessible by all authenticated users."""
    return trf_service.get_trf_by_number(db, trf_number)


@router.post("/", response_model=TRFResponse, status_code=status.HTTP_201_CREATED)
def create_trf(
    payload: TRFCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Admin", "Engineer"]))
):
    """Create a new TRF record and its folder structure. Accessible by Admin and Engineer."""
    return trf_service.create_trf(db, payload, current_user=current_user)


@router.put("/{trf_number}", response_model=TRFResponse)
def update_trf(
    trf_number: str,
    payload: TRFUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Admin", "Engineer"]))
):
    """Update the project name of an existing TRF. Accessible by Admin and Engineer."""
    return trf_service.update_trf(db, trf_number, payload.project_name, current_user=current_user)


@router.delete("/{trf_number}", response_model=MessageResponse)
def delete_trf(
    trf_number: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Admin"]))
):
    """Delete a TRF record from the database. Accessible by Admin only."""
    trf_service.delete_trf(db, trf_number, current_user=current_user)
    return {"message": f"TRF '{trf_number}' deleted successfully"}
