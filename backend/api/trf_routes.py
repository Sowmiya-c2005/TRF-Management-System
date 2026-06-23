from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.schemas.trf_schema import (
    TRFCreate,
    TRFUpdate,
    TRFResponse,
    MessageResponse,
    DashboardStats,
)
from backend.services import trf_service

router = APIRouter(prefix="/trfs", tags=["TRF Records"])


@router.get("/", response_model=list[TRFResponse])
def get_all_trfs(db: Session = Depends(get_db)):
    """Return all TRF records."""
    return trf_service.get_all_trfs(db)


@router.get("/stats", response_model=DashboardStats)
def dashboard_stats(db: Session = Depends(get_db)):
    """Return aggregate statistics for the dashboard."""
    return trf_service.get_dashboard_stats(db)


@router.get("/{trf_number}", response_model=TRFResponse)
def get_trf(trf_number: str, db: Session = Depends(get_db)):
    """Fetch a single TRF by its TRF number."""
    return trf_service.get_trf_by_number(db, trf_number)


@router.post("/", response_model=TRFResponse, status_code=status.HTTP_201_CREATED)
def create_trf(payload: TRFCreate, db: Session = Depends(get_db)):
    """Create a new TRF record and its folder structure."""
    return trf_service.create_trf(db, payload)


@router.put("/{trf_number}", response_model=TRFResponse)
def update_trf(trf_number: str, payload: TRFUpdate, db: Session = Depends(get_db)):
    """Update the project name of an existing TRF."""
    return trf_service.update_trf(db, trf_number, payload.project_name)


@router.delete("/{trf_number}", response_model=MessageResponse)
def delete_trf(trf_number: str, db: Session = Depends(get_db)):
    """Delete a TRF record from the database."""
    trf_service.delete_trf(db, trf_number)
    return {"message": f"TRF '{trf_number}' deleted successfully"}
