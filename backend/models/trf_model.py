from sqlalchemy import Column, Integer, String, TIMESTAMP, Boolean, text
from sqlalchemy.orm import relationship
from backend.database.database import Base


class TRFRecord(Base):
    __tablename__ = "trf_records"

    id = Column(Integer, primary_key=True, index=True)
    trf_number   = Column(String, unique=True, nullable=False, index=True)
    project_name = Column(String, nullable=False)
    created_at   = Column(
        TIMESTAMP,
        server_default=text("CURRENT_TIMESTAMP"),
        nullable=False,
    )

    # ── SharePoint integration tracking ───────────────────────────────────────
    # "pending"  → TRF created, folders not yet confirmed on SharePoint
    # "success"  → all 5 subfolders confirmed on SharePoint (or local-mode)
    # "partial"  → some subfolders failed
    # "failed"   → all SharePoint folder creation attempts failed
    sharepoint_status = Column(String, default="pending", nullable=False)

    # Human-readable note about the last SharePoint operation
    sharepoint_message = Column(String, nullable=True)

    folders = relationship("Folder", back_populates="trf", cascade="all, delete-orphan")
