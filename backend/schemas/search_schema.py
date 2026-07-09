from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class SearchFilters(BaseModel):
    status: Optional[str] = None
    project_name: Optional[str] = None
    trf_number: Optional[str] = None
    assigned_manager_id: Optional[int] = None
    assigned_engineer_id: Optional[int] = None
    created_by_id: Optional[int] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    sharepoint_status: Optional[str] = None


class SearchRequest(BaseModel):
    query: Optional[str] = Field(None, description="Text search query")
    filters: Optional[SearchFilters] = None
    sort_by: Optional[str] = Field("created_at", description="Field to sort by")
    sort_order: Optional[str] = Field("desc", description="asc or desc")
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)


class SearchResponse(BaseModel):
    results: List[dict]
    total: int
    page: int
    page_size: int
    total_pages: int
