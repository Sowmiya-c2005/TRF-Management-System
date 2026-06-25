from sqlalchemy import Column, Integer, String, TIMESTAMP, text
from sqlalchemy.orm import relationship
from backend.database.database import Base


class TRFRecord(Base):
    __tablename__ = "trf_records"

    id = Column(Integer, primary_key=True, index=True)
    trf_number = Column(String, unique=True, nullable=False, index=True)
    project_name = Column(String, nullable=False)
    created_at = Column(
        TIMESTAMP,
        server_default=text("CURRENT_TIMESTAMP"),
        nullable=False
    )

    folders = relationship("Folder", back_populates="trf", cascade="all, delete-orphan")
