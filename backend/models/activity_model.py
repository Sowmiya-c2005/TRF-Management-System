from sqlalchemy import Column, Integer, String, ForeignKey, TIMESTAMP, text
from sqlalchemy.orm import relationship
from backend.database.database import Base


class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    trf_id = Column(Integer, ForeignKey("trf_records.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action_type = Column(String, nullable=False, index=True)  # TRF_CREATED, ASSIGNED, STATUS_CHANGED, FILE_UPLOADED, COMMENT_ADDED, etc.
    description = Column(String, nullable=False)
    extra_data = Column(String, nullable=True)  # JSON string for additional context
    created_at = Column(
        TIMESTAMP,
        server_default=text("CURRENT_TIMESTAMP"),
        nullable=False
    )

    # Relationships
    trf = relationship("TRFRecord", back_populates="activities")
    user = relationship("User")
