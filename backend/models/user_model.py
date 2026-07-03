from sqlalchemy import Column, Integer, String, TIMESTAMP, text
from backend.database.database import Base

# Valid roles in the system
VALID_ROLES = ("Admin", "Engineer", "Manager", "Viewer")


class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True, index=True)
    username      = Column(String, unique=True, nullable=False, index=True)
    password      = Column(String, nullable=False)
    role          = Column(String, default="Engineer", nullable=False)  # Admin | Engineer | Manager | Viewer
    refresh_token = Column(String, nullable=True)
    email         = Column(String, nullable=True)
    display_name  = Column(String, nullable=True)   # friendly name (optional)
    created_at    = Column(
        TIMESTAMP,
        server_default=text("CURRENT_TIMESTAMP"),
        nullable=False,
    )
