from sqlalchemy import Column, Integer, ForeignKey, TIMESTAMP, text
from sqlalchemy.orm import relationship
from backend.database.database import Base


class TRFEngineerAssignment(Base):
    __tablename__ = "trf_engineer_assignments"

    id = Column(Integer, primary_key=True, index=True)
    trf_id = Column(Integer, ForeignKey("trf_records.id", ondelete="CASCADE"), nullable=False, index=True)
    engineer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_at = Column(
        TIMESTAMP,
        server_default=text("CURRENT_TIMESTAMP"),
        nullable=False
    )
    assigned_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    trf = relationship("TRFRecord", back_populates="engineer_assignments")
    engineer = relationship("User", foreign_keys="TRFEngineerAssignment.engineer_id", back_populates="engineer_assignments")
