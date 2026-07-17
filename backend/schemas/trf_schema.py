import re
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional, List

# Strict TRF format: TRF-YYYY-Number  (e.g. TRF-2026-1, TRF-2026-25)
TRF_PATTERN = re.compile(r'^TRF-\d{4}-\d+$')

def validate_trf_number(v: str) -> str:
    v = v.strip()
    if not TRF_PATTERN.match(v):
        raise ValueError(
            "Invalid TRF Number. Please use the format: TRF-YYYY-Number (Example: TRF-2026-1)"
        )
    return v


# ── Requests ──────────────────────────────────────────────────────────────────

class TRFCreate(BaseModel):
    trf_number:   str = Field(..., min_length=1, description="Unique TRF identifier, e.g. TRF-2026-1")
    project_name: str = Field(..., min_length=1, description="Human-readable project name")
    assigned_manager_id: Optional[int] = Field(None, description="Manager ID to assign")
    engineer_ids: List[int] = Field(default_factory=list, description="Engineer IDs to assign")
    priority: Optional[str] = Field("Medium", description="Project priority")
    due_date: Optional[datetime] = Field(None, description="Project due date")
    remarks: Optional[str] = Field(None, description="Project remarks")

    @field_validator("trf_number")
    @classmethod
    def check_trf_number(cls, v):
        return validate_trf_number(v)


class TRFUpdate(BaseModel):
    project_name: Optional[str] = Field(None, description="Updated project name")
    assigned_manager_id: Optional[int] = Field(None, description="Manager ID to assign")
    engineer_ids: List[int] = Field(default_factory=list, description="Engineer IDs to assign")
    priority: Optional[str] = Field(None, description="Project priority")
    due_date: Optional[datetime] = Field(None, description="Project due date")
    remarks: Optional[str] = Field(None, description="Project remarks")


# ── File / Folder nested responses ────────────────────────────────────────────

class FileSchemaResponse(BaseModel):
    id:              int
    filename:        str
    file_path:       str
    size_bytes:      int
    uploaded_at:     datetime
    uploaded_by_id:  Optional[int] = None
    sharepoint_id:   Optional[str] = None

    model_config = {"from_attributes": True}


class FolderResponse(BaseModel):
    id:         int
    name:       str
    created_at: datetime
    files:      List[FileSchemaResponse] = []

    model_config = {"from_attributes": True}


# ── TRF responses ─────────────────────────────────────────────────────────────

class TRFResponse(BaseModel):
    id:                  int
    trf_number:          str
    project_name:        str
    created_at:          datetime
    sharepoint_status:   str = "pending"
    sharepoint_message:  Optional[str] = None
    status:              str = "Draft"
    status_updated_at:   Optional[datetime] = None
    assigned_manager_id: Optional[int] = None
    engineer_ids:        List[int] = []
    priority:            str = "Medium"
    due_date:            Optional[datetime] = None
    remarks:             Optional[str] = None
    created_by:          Optional[str] = None
    assigned_by:         Optional[str] = None
    last_updated_by:     Optional[str] = None
    last_updated_time:   Optional[datetime] = None
    completion_pct:      Optional[int] = 0

    model_config = {"from_attributes": True}


class TRFDetailResponse(TRFResponse):
    folders: List[FolderResponse] = []


# ── Dashboard ─────────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_trfs:         int
    sharepoint_enabled: bool  = False


# ── Misc ──────────────────────────────────────────────────────────────────────

class MessageResponse(BaseModel):
    message: str


class SharePointStatusResponse(BaseModel):
    configured:  bool
    mode:        str
    message:     str
