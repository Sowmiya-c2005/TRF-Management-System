from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class TRFCreate(BaseModel):
    trf_number: str = Field(..., min_length=1, description="Unique TRF identifier")
    project_name: str = Field(..., min_length=1, description="Name of the project")


class TRFUpdate(BaseModel):
    project_name: str = Field(..., min_length=1, description="Updated project name")


class TRFResponse(BaseModel):
    id: int
    trf_number: str
    project_name: str
    created_at: datetime

    model_config = {"from_attributes": True}


class MessageResponse(BaseModel):
    message: str


class DashboardStats(BaseModel):
    total_trfs: int
