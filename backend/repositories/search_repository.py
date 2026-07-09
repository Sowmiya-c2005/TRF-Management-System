from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from typing import Optional, List
from datetime import datetime

from backend.models.trf_model import TRFRecord
from backend.models.trf_assignment_model import TRFEngineerAssignment
from backend.models.user_model import User
from backend.repositories.base_repository import BaseRepository


class SearchRepository(BaseRepository[TRFRecord]):
    def __init__(self):
        super().__init__(TRFRecord)

    def search_trfs(
        self,
        db: Session,
        query: Optional[str] = None,
        status: Optional[str] = None,
        project_name: Optional[str] = None,
        trf_number: Optional[str] = None,
        assigned_manager_id: Optional[int] = None,
        assigned_engineer_id: Optional[int] = None,
        created_by_id: Optional[int] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        sharepoint_status: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        page: int = 1,
        page_size: int = 20
    ) -> tuple[List[TRFRecord], int]:
        """Search TRFs with filters and pagination."""
        
        # Build base query
        q = db.query(TRFRecord)
        
        # Text search
        if query:
            search_pattern = f"%{query}%"
            q = q.filter(
                or_(
                    TRFRecord.trf_number.ilike(search_pattern),
                    TRFRecord.project_name.ilike(search_pattern),
                )
            )
        
        # Status filter
        if status:
            q = q.filter(TRFRecord.status == status)
        
        # Project name filter
        if project_name:
            q = q.filter(TRFRecord.project_name.ilike(f"%{project_name}%"))
        
        # TRF number filter
        if trf_number:
            q = q.filter(TRFRecord.trf_number.ilike(f"%{trf_number}%"))
        
        # Manager assignment filter
        if assigned_manager_id:
            q = q.filter(TRFRecord.assigned_manager_id == assigned_manager_id)
        
        # Engineer assignment filter (subquery)
        if assigned_engineer_id:
            engineer_trf_ids = db.query(TRFEngineerAssignment.trf_id).filter(
                TRFEngineerAssignment.engineer_id == assigned_engineer_id
            ).all()
            engineer_trf_ids = [t[0] for t in engineer_trf_ids]
            q = q.filter(TRFRecord.id.in_(engineer_trf_ids))
        
        # Created by filter
        if created_by_id:
            q = q.filter(TRFRecord.created_by_id == created_by_id)
        
        # Date range filter
        if date_from:
            q = q.filter(TRFRecord.created_at >= date_from)
        if date_to:
            q = q.filter(TRFRecord.created_at <= date_to)
        
        # SharePoint status filter
        if sharepoint_status:
            q = q.filter(TRFRecord.sharepoint_status == sharepoint_status)
        
        # Get total count
        total = q.count()
        
        # Sorting
        sort_column = getattr(TRFRecord, sort_by, TRFRecord.created_at)
        if sort_order == "desc":
            q = q.order_by(sort_column.desc())
        else:
            q = q.order_by(sort_column.asc())
        
        # Pagination
        offset = (page - 1) * page_size
        results = q.offset(offset).limit(page_size).all()
        
        return results, total
