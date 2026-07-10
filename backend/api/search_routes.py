"""
Search API routes.
Prefix: /search
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.schemas.search_schema import SearchRequest, SearchResponse
from backend.services.search_service import search_trfs
from backend.middleware.auth_middleware import get_current_user
from backend.models.user_model import User

router = APIRouter(prefix="/search", tags=["Search"])


@router.post("/trfs", response_model=dict)
def search_trf_records(
    search_request: SearchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Search TRF records with advanced filters."""
    return search_trfs(db, search_request, current_user)


@router.get("/filters/statuses")
def get_available_statuses(
    current_user: User = Depends(get_current_user),
):
    """Get available TRF statuses for filter dropdown."""
    return {
        "statuses": [
            "Draft",
            "Assigned",
            "In Progress",
            "Under Review",
            "Approved",
            "Completed",
            "Archived"
        ]
    }


@router.get("/filters/sort-options")
def get_sort_options(
    current_user: User = Depends(get_current_user),
):
    """Get available sort options."""
    return {
        "options": [
            {"value": "created_at", "label": "Created Date"},
            {"value": "trf_number", "label": "TRF Number"},
            {"value": "project_name", "label": "Project Name"},
            {"value": "status", "label": "Status"},
        ]
    }
