from sqlalchemy import Column, Integer, String, ForeignKey, TIMESTAMP, text
from sqlalchemy.orm import relationship
from backend.database.database import Base


class Folder(Base):
    __tablename__ = "folders"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    trf_id = Column(Integer, ForeignKey("trf_records.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(
        TIMESTAMP,
        server_default=text("CURRENT_TIMESTAMP"),
        nullable=False
    )

    trf = relationship("TRFRecord", back_populates="folders")
    files = relationship("FileRecord", back_populates="folder", cascade="all, delete-orphan")
