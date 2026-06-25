import os
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.models.user_model import User
from backend.repositories.user_repository import UserRepository
from backend.utils.logging_config import get_logger

logger = get_logger("auth_middleware")

# JWT Constants
SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkeyforlocaldev1234567890")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
REQUIRE_AUTH = os.getenv("REQUIRE_AUTH", "false").lower() == "true"

security = HTTPBearer(auto_error=False)
user_repo = UserRepository()


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    FastAPI dependency that extracts and validates the JWT access token.
    If REQUIRE_AUTH=False and no token is supplied, returns a fallback default admin user.
    """
    token = credentials.credentials if credentials else None

    if not token:
        if not REQUIRE_AUTH:
            # Lenient mode: return/create a default Admin user to ensure frontend compatibility
            default_username = "admin"
            user = user_repo.get_by_username(db, default_username)
            if not user:
                # Create a default admin user if one doesn't exist
                # Password is "admin123" (hashed)
                import bcrypt
                salt = bcrypt.gensalt()
                hashed_pw = bcrypt.hashpw(b"admin123", salt).decode("utf-8")
                
                user = User(
                    username=default_username,
                    password=hashed_pw,
                    role="Admin"
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                logger.info(f"Created default admin user for development/lenient mode.")
            return user
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication credentials were not provided."
            )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing subject claim."
            )
    except jwt.PyJWTError as e:
        logger.error(f"JWT decode error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials."
        )

    user = user_repo.get_by_username(db, username)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found."
        )
    return user


class RoleChecker:
    """
    Role verification dependency.
    """
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in self.allowed_roles:
            logger.warning(
                f"Unauthorized role access attempt by user '{current_user.username}' (role: {current_user.role}). "
                f"Required: {self.allowed_roles}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action."
            )
        return current_user
