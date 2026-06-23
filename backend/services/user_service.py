from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from backend.models.user_model import User
from backend.schemas.user_schema import UserCreate


def register_user(db: Session, payload: UserCreate) -> User:
    existing = db.query(User).filter(User.username == payload.username).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already exists"
        )
    new_user = User(
        username=payload.username,
        password=payload.password,   # NOTE: hash passwords before production
        role="Engineer",
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


def authenticate_user(db: Session, username: str, password: str) -> User:
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    if user.password != password:   # NOTE: use hashed comparison in production
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    return user
