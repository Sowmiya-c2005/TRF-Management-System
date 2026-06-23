from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.schemas.user_schema import UserCreate, UserLogin, UserResponse, RegisterResponse
from backend.services import user_service

router = APIRouter(prefix="/users", tags=["Users & Auth"])


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    """Register a new user account."""
    user_service.register_user(db, payload)
    return {"message": "User registered successfully"}


@router.post("/login", response_model=UserResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    """Authenticate a user and return their profile."""
    user = user_service.authenticate_user(db, payload.username, payload.password)
    return {
        "message": "Login successful",
        "username": user.username,
        "role": user.role,
    }
