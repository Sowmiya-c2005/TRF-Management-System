import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
import bcrypt
import jwt

from backend.models.user_model import User
from backend.schemas.user_schema import UserCreate
from backend.repositories.user_repository import UserRepository
from backend.utils.logging_config import get_logger

logger = get_logger("user_service")

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkeyforlocaldev1234567890")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

user_repo = UserRepository()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def register_user(db: Session, payload: UserCreate) -> User:
    existing = user_repo.get_by_username(db, payload.username)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already exists"
        )

    # Hash the password
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(payload.password.encode("utf-8"), salt).decode("utf-8")

    # Set first user as Admin, subsequent as Engineer
    is_first = len(user_repo.get_all(db)) == 0
    role = "Admin" if is_first else "Engineer"

    new_user = User(
        username=payload.username,
        password=hashed_password,
        role=role,
    )
    user_repo.create(db, new_user)
    logger.info(f"Registered new user '{payload.username}' with role '{role}'.")
    return new_user


def authenticate_user(db: Session, username: str, password: str) -> User:
    user = user_repo.get_by_username(db, username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    # Check password with support for hashed passwords and fallback to legacy raw check
    is_valid = False
    try:
        # Try hashed check
        is_valid = bcrypt.checkpw(password.encode("utf-8"), user.password.encode("utf-8"))
    except Exception:
        # Fallback to legacy raw string comparison for existing database users
        is_valid = (user.password == password)

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )

    logger.info(f"User '{username}' authenticated successfully.")
    return user
