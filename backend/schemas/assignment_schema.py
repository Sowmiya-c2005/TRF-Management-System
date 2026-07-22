from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class TRFAssignmentRequest(BaseModel):
    trf_id: int = Field(..., description="TRF ID to assign")
    manager_id: Optional[int] = Field(None, description="Manager ID to assign")
    engineer_ids: List[int] = Field(default_factory=list, description="List of Engineer IDs to assign")
    priority: Optional[str] = Field(None, description="Priority: Low | Medium | High | Critical")
    due_date: Optional[datetime] = Field(None, description="Project due date")
    remarks: Optional[str] = Field(None, description="Assignment remarks/notes")


class TRFAssignmentResponse(BaseModel):
    id: int
    trf_id: int
    engineer_id: int
    assigned_at: datetime
    assigned_by_id: Optional[int]

    model_config = {"from_attributes": True}


class TRFStatusUpdateRequest(BaseModel):
    status: str = Field(..., description="New status: Draft | Assigned | In Progress | Under Review | Approved | Completed | Archived")


class TRFStatusResponse(BaseModel):
    id: int
    trf_number: str
    status: str
    status_updated_at: Optional[datetime]

    model_config = {"from_attributes": True}
