from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List


class TRFCreate(BaseModel):
    trf_number: str = Field(..., min_length=1, description="Unique TRF identifier")
    project_name: str = Field(..., min_length=1, description="Name of the project")


class TRFUpdate(BaseModel):
    project_name: str = Field(..., min_length=1, description="Updated project name")


class FileSchemaResponse(BaseModel):
    id: int
    filename: str
    file_path: str
    size_bytes: int
    uploaded_at: datetime
    uploaded_by_id: Optional[int] = None
    sharepoint_id: Optional[str] = None

    model_config = {"from_attributes": True}


class FolderResponse(BaseModel):
    id: int
    name: str
    created_at: datetime
    files: List[FileSchemaResponse] = []

    model_config = {"from_attributes": True}


class TRFResponse(BaseModel):
    id: int
    trf_number: str
    project_name: str
    created_at: datetime

    model_config = {"from_attributes": True}


class TRFDetailResponse(TRFResponse):
    folders: List[FolderResponse] = []


class MessageResponse(BaseModel):
    message: str


class DashboardStats(BaseModel):
    total_trfs: int
