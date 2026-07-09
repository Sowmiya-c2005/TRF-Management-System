from sqlalchemy import Column, Integer, String, TIMESTAMP, Boolean, text
from sqlalchemy.orm import relationship
from backend.database.database import Base

VALID_ROLES = ("Admin", "Engineer", "Manager")


class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True, index=True)
    username      = Column(String, unique=True, nullable=False, index=True)
    password      = Column(String, nullable=False)
    role          = Column(String, default="Engineer", nullable=False)
    refresh_token = Column(String, nullable=True)
    email         = Column(String, nullable=True)
    display_name  = Column(String, nullable=True)
    phone         = Column(String, nullable=True)
    avatar_url    = Column(String, nullable=True)
    is_active     = Column(Boolean, default=True, nullable=False, index=True)
    last_login_at = Column(TIMESTAMP, nullable=True)
    created_at    = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at    = Column(TIMESTAMP, nullable=True)

    # Relationships
    managed_trfs         = relationship("TRFRecord", foreign_keys="TRFRecord.assigned_manager_id", back_populates="manager")
    created_trfs         = relationship("TRFRecord", foreign_keys="TRFRecord.created_by_id", back_populates="creator")
    engineer_assignments = relationship("TRFEngineerAssignment", foreign_keys="TRFEngineerAssignment.engineer_id", back_populates="engineer", cascade="all, delete-orphan")
    comments             = relationship("Comment", back_populates="user", cascade="all, delete-orphan")
