"""
Admin Storage Configuration API
  GET  /admin/storage          → get current config
  PUT  /admin/storage          → update storage root path
  POST /admin/storage/validate → check if a path is usable
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.services import storage_service
from backend.middleware.auth_middleware import RoleChecker
from backend.models.user_model import User

router = APIRouter(prefix="/admin/storage", tags=["Admin — Storage Config"])


class StorageUpdateRequest(BaseModel):
    storage_root: Optional[str] = None   # empty string / None → reset to default


class StorageValidateRequest(BaseModel):
    path: str


@router.get("/")
def get_storage_config(
    db: Session = Depends(get_db),
    _: User = Depends(RoleChecker(["Admin"])),
):
    """Return the current storage configuration. Admin only."""
    return storage_service.get_config(db)


@router.put("/")
def update_storage_config(
    payload: StorageUpdateRequest,
    db: Session = Depends(get_db),
    _: User = Depends(RoleChecker(["Admin"])),
):
    """
    Set a new storage root directory.
    Pass empty string or null to reset to the UPLOADS_ROOT env default.
    Admin only.
    """
    return storage_service.set_storage_root(db, payload.storage_root or "")


@router.post("/validate")
def validate_path(
    payload: StorageValidateRequest,
    _: User = Depends(RoleChecker(["Admin"])),
):
    """
    Check whether a given filesystem path is usable as a storage root.
    Does NOT persist anything.
    Admin only.
    """
    import os
    path = os.path.abspath(os.path.expanduser(payload.path.strip()))
    exists      = os.path.exists(path)
    is_dir      = os.path.isdir(path) if exists else False
    can_write   = os.access(path, os.W_OK) if exists else False
    parent_ok   = os.path.isdir(os.path.dirname(path))

    return {
        "path":       path,
        "exists":     exists,
        "is_dir":     is_dir,
        "can_write":  can_write,
        "parent_ok":  parent_ok,
        "usable":     (exists and is_dir and can_write) or (not exists and parent_ok),
    }
