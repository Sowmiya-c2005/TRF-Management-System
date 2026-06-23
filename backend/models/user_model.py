from sqlalchemy import Column, Integer, String, TIMESTAMP, text
from backend.database.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    password = Column(String, nullable=False)
    role = Column(String, default="Engineer", nullable=False)
    created_at = Column(
        TIMESTAMP,
        server_default=text("CURRENT_TIMESTAMP"),
        nullable=False
    )
