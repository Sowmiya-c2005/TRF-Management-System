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
    Extract and validate the JWT access token.
    If REQUIRE_AUTH=False and no token is supplied, returns the first Admin in DB.
    """
    token = credentials.credentials if credentials else None

    if not token:
        if not REQUIRE_AUTH:
            # Return the actual first Admin user from DB — NOT a hardcoded fallback
            user = db.query(User).filter(User.role == "Admin", User.is_active == True).first()
            if not user:
                # Only if truly no admin exists, create one
                import bcrypt
                user = User(
                    username="admin",
                    password=bcrypt.hashpw(b"Admin@123", bcrypt.gensalt()).decode(),
                    role="Admin",
                    is_active=True,
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                logger.info("Created initial admin user.")
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
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account has been deactivated. Please contact administrator."
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


# Common role checkers for convenience
require_admin = RoleChecker(["Admin"])
require_manager_or_admin = RoleChecker(["Admin", "Manager"])
require_engineer_or_admin = RoleChecker(["Admin", "Engineer"])
require_manager_or_engineer = RoleChecker(["Admin", "Manager", "Engineer"])
require_any_role = RoleChecker(["Admin", "Manager", "Engineer"])


def check_trf_access(db: Session, current_user: User, trf_number: str) -> None:
    """Raise 403 Forbidden if non-admin user is not assigned to this TRF number."""
    if current_user.role == "Admin":
        return
    from backend.services.assignment_service import get_user_assigned_trfs
    assigned = get_user_assigned_trfs(db, current_user.id, current_user.role)
    if trf_number.strip().lower() not in [t.trf_number.strip().lower() for t in assigned]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You are not assigned to this TRF project."
        )


def check_trf_id_access(db: Session, current_user: User, trf_id: int) -> None:
    """Raise 403 Forbidden if non-admin user is not assigned to this TRF ID."""
    if current_user.role == "Admin":
        return
    from backend.services.assignment_service import get_user_assigned_trfs
    assigned = get_user_assigned_trfs(db, current_user.id, current_user.role)
    if trf_id not in [t.id for t in assigned]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You are not assigned to this TRF project."
        )

