"""Add storage_config table. Run: python migrate_storage_config.py"""
import sys; sys.path.insert(0, ".")
from backend.database.database import engine
from backend.models.storage_config_model import StorageConfig
from backend.database.database import Base

Base.metadata.create_all(bind=engine, tables=[StorageConfig.__table__])
print("storage_config table created.")
