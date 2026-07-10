from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime

from backend.repositories.search_repository import SearchRepository
from backend.schemas.search_schema import SearchRequest, SearchResponse
from backend.utils.logging_config import get_logger

logger = get_logger("search_service")
from backend.models.user_model import User

search_repo = SearchRepository()


def search_trfs(db: Session, search_request: SearchRequest, current_user: User) -> dict:
    """Search TRFs with advanced filters and role-based project isolation."""
    filters = search_request.filters or {}
    
    # Enforce role-based access filtering
    forced_manager_id = filters.assigned_manager_id
    forced_engineer_id = filters.assigned_engineer_id
    
    if current_user.role == "Manager":
        forced_manager_id = current_user.id
    elif current_user.role == "Engineer":
        forced_engineer_id = current_user.id

    results, total = search_repo.search_trfs(
        db=db,
        query=search_request.query,
        status=filters.status,
        project_name=filters.project_name,
        trf_number=filters.trf_number,
        assigned_manager_id=forced_manager_id,
        assigned_engineer_id=forced_engineer_id,
        created_by_id=filters.created_by_id,
        date_from=filters.date_from,
        date_to=filters.date_to,
        sharepoint_status=filters.sharepoint_status,
        sort_by=search_request.sort_by,
        sort_order=search_request.sort_order,
        page=search_request.page,
        page_size=search_request.page_size
    )
    
    # Calculate total pages
    total_pages = (total + search_request.page_size - 1) // search_request.page_size
    
    # Convert results to dict format
    results_dict = []
    for trf in results:
        results_dict.append({
            "id": trf.id,
            "trf_number": trf.trf_number,
            "project_name": trf.project_name,
            "status": trf.status,
            "created_at": trf.created_at,
            "assigned_manager_id": trf.assigned_manager_id,
            "created_by_id": trf.created_by_id,
            "sharepoint_status": trf.sharepoint_status,
            "sharepoint_message": trf.sharepoint_message,
        })
    
    return {
        "results": results_dict,
        "total": total,
        "page": search_request.page,
        "page_size": search_request.page_size,
        "total_pages": total_pages
    }
