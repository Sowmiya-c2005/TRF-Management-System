"""
User service — authentication, registration, JWT, profile management.
"""
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
import bcrypt
import jwt

from backend.models.user_model import User, VALID_ROLES
from backend.schemas.user_schema import UserCreate, UserUpdate
from backend.repositories.user_repository import UserRepository
from backend.utils.logging_config import get_logger

logger = get_logger("user_service")

SECRET_KEY                  = os.getenv("SECRET_KEY",                  "supersecretkeyforlocaldev1234567890")
ALGORITHM                   = os.getenv("ALGORITHM",                   "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))  # 8 h

user_repo = UserRepository()


# ── Tokens ─────────────────────────────────────────────────────────────────────

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire    = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire    = datetime.now(timezone.utc) + (expires_delta or timedelta(days=7))
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_refresh_token(db: Session, token: str) -> User:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type.")
        username: str = payload.get("sub")
        if not username:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token.")
    except jwt.PyJWTError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Token error: {e}")

    user = user_repo.get_by_username(db, username)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found.")
    if user.refresh_token != token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token revoked.")
    return user


def store_refresh_token(db: Session, user: User, token: str) -> None:
    user.refresh_token = token
    user_repo.commit(db)


def clear_refresh_token(db: Session, user: User) -> None:
    user.refresh_token = None
    user_repo.commit(db)


# ── CRUD ────────────────────────────────────────────────────────────────────────

def _hash(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return plain == hashed   # legacy plain-text fallback (will be migrated)


def register_user(db: Session, payload: UserCreate, admin_override_role: Optional[str] = None) -> User:
    if user_repo.get_by_username(db, payload.username):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already exists.")

    # First user is always Admin; after that, use payload role or Engineer
    all_users  = user_repo.get_all(db)
    is_first   = len(all_users) == 0

    role = "Admin" if is_first else (admin_override_role or payload.role or "Engineer")
    if role not in VALID_ROLES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid role '{role}'. Must be one of {VALID_ROLES}.")

    new_user = User(
        username=payload.username,
        password=_hash(payload.password),
        role=role,
        email=payload.email,
        display_name=payload.display_name or payload.username,
    )
    user_repo.create(db, new_user)
    logger.info(f"Registered user '{payload.username}' with role '{role}'.")
    return new_user


def authenticate_user(db: Session, username: str, password: str) -> User:
    user = user_repo.get_by_username(db, username)
    if not user or not _verify(password, user.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password.")
    logger.info(f"User '{username}' authenticated (role={user.role}).")
    return user


def update_profile(db: Session, user: User, payload: UserUpdate) -> User:
    if payload.email is not None:
        user.email = payload.email
    if payload.display_name is not None:
        user.display_name = payload.display_name
    user_repo.commit(db)
    return user


def change_password(db: Session, user: User, current_pw: str, new_pw: str) -> None:
    if not _verify(current_pw, user.password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect.")
    if len(new_pw) < 6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New password must be at least 6 characters.")
    user.password = _hash(new_pw)
    # Revoke refresh token on password change (force re-login)
    user.refresh_token = None
    user_repo.commit(db)
    logger.info(f"Password changed for user '{user.username}'.")


def set_role(db: Session, user: User, new_role: str) -> User:
    if new_role not in VALID_ROLES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid role. Must be one of {VALID_ROLES}.")
    user.role = new_role
    user_repo.commit(db)
    logger.info(f"Role updated for '{user.username}': {new_role}")
    return user


def get_all_users(db: Session) -> list[User]:
    return user_repo.get_all(db)


def get_user_by_id(db: Session, user_id: int) -> User:
    u = user_repo.get(db, user_id)
    if not u:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return u


def delete_user(db: Session, user_id: int) -> None:
    u = get_user_by_id(db, user_id)
    user_repo.delete(db, u)
    logger.info(f"User id={user_id} deleted.")
