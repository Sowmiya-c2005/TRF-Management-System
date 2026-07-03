"""
StorageService — resolves the active storage root directory.

Priority order:
  1. Admin-configured path stored in `storage_config` DB table
  2. UPLOADS_ROOT environment variable
  3. Hard-coded fallback: "uploads"

All path creation is handled here so trf_service and file_service
never need to know where the root comes from.
"""
import os
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from backend.models.storage_config_model import StorageConfig
from backend.utils.logging_config import get_logger

logger = get_logger("storage_service")

_ENV_DEFAULT = os.getenv("UPLOADS_ROOT", "uploads")


# ─── Public helpers ────────────────────────────────────────────────────────────

def get_storage_root(db: Session) -> str:
    """
    Return the absolute, validated storage root directory.
    Creates the directory if it does not exist.
    """
    cfg = db.query(StorageConfig).filter(StorageConfig.id == 1).first()
    raw = (cfg.storage_root or "").strip() if cfg else ""
    root = raw if raw else _ENV_DEFAULT

    # Make absolute relative to CWD when a relative path is stored
    if not os.path.isabs(root):
        root = os.path.abspath(root)

    os.makedirs(root, exist_ok=True)
    return root


def get_config(db: Session) -> dict:
    """Return the current storage config record as a dict."""
    cfg = db.query(StorageConfig).filter(StorageConfig.id == 1).first()
    configured = (cfg.storage_root or "").strip() if cfg else ""
    active_root = get_storage_root(db)
    return {
        "storage_root":    configured or None,
        "active_root":     active_root,
        "is_custom":       bool(configured),
        "env_default":     os.path.abspath(_ENV_DEFAULT),
        "directory_exists": os.path.isdir(active_root),
    }


def set_storage_root(db: Session, new_path: str) -> dict:
    """
    Persist a new storage root.  Validates / creates the directory.
    Pass an empty string to reset to the env default.
    """
    new_path = (new_path or "").strip()

    if new_path:
        # Expand user home shortcut and make absolute
        new_path = os.path.abspath(os.path.expanduser(new_path))

        # Create if missing
        try:
            os.makedirs(new_path, exist_ok=True)
        except PermissionError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot create directory '{new_path}': permission denied.",
            )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid path '{new_path}': {exc}",
            )

        if not os.path.isdir(new_path):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Path '{new_path}' is not a directory.",
            )

    cfg = db.query(StorageConfig).filter(StorageConfig.id == 1).first()
    if cfg:
        cfg.storage_root = new_path or None
    else:
        cfg = StorageConfig(id=1, storage_root=new_path or None)
        db.add(cfg)
    db.commit()

    action = f"set to '{new_path}'" if new_path else "reset to env default"
    logger.info(f"Storage root {action}.")
    return get_config(db)
