"""
StorageConfig — single-row table that stores the admin-configured
root storage directory. The system always has exactly one row (id=1).
"""
from sqlalchemy import Column, Integer, String, TIMESTAMP, text
from backend.database.database import Base


class StorageConfig(Base):
    __tablename__ = "storage_config"

    id           = Column(Integer, primary_key=True, default=1)
    storage_root = Column(String, nullable=True)   # NULL → fall back to UPLOADS_ROOT env var
    updated_at   = Column(
        TIMESTAMP,
        server_default=text("CURRENT_TIMESTAMP"),
        onupdate=text("CURRENT_TIMESTAMP"),
        nullable=False,
    )
