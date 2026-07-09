from sqlalchemy import Column, Integer, String, TIMESTAMP, Boolean, text, ForeignKey
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

    # ── Status Workflow ───────────────────────────────────────────────────────
    # Draft → Assigned → In Progress → Under Review → Approved → Completed → Archived
    status = Column(String, default="Draft", nullable=False, index=True)
    status_updated_at = Column(TIMESTAMP, nullable=True)

    # ── Assignments ───────────────────────────────────────────────────────────
    assigned_manager_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # ── SharePoint integration tracking ───────────────────────────────────────
    # "pending"  → TRF created, folders not yet confirmed on SharePoint
    # "success"  → all 5 subfolders confirmed on SharePoint (or local-mode)
    # "partial"  → some subfolders failed
    # "failed"   → all SharePoint folder creation attempts failed
    sharepoint_status = Column(String, default="pending", nullable=False)

    # Human-readable note about the last SharePoint operation
    sharepoint_message = Column(String, nullable=True)

    # Relationships
    folders = relationship("Folder", back_populates="trf", cascade="all, delete-orphan")
    manager = relationship("User", foreign_keys=[assigned_manager_id], back_populates="managed_trfs")
    creator = relationship("User", foreign_keys=[created_by_id], back_populates="created_trfs")
    engineer_assignments = relationship("TRFEngineerAssignment", back_populates="trf", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="trf", cascade="all, delete-orphan")
    activities = relationship("Activity", back_populates="trf", cascade="all, delete-orphan")
