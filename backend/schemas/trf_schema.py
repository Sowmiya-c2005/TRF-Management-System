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

    @field_validator("trf_number")
    @classmethod
    def check_trf_number(cls, v):
        return validate_trf_number(v)


class TRFUpdate(BaseModel):
    project_name: str = Field(..., min_length=1, description="Updated project name")


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
