from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.schemas.user_schema import UserCreate, UserLogin, UserResponse, RegisterResponse
from backend.services import user_service
from backend.middleware.auth_middleware import get_current_user
from backend.models.user_model import User

router = APIRouter(prefix="/users", tags=["Users & Auth"])


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    """Register a new user account with hashed password."""
    user_service.register_user(db, payload)
    return {"message": "User registered successfully"}


@router.post("/login", response_model=UserResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    """Authenticate a user, issue a JWT token, and return their profile."""
    user = user_service.authenticate_user(db, payload.username, payload.password)
    # Generate JWT Token (JWT Authentication)
    token = user_service.create_access_token({"sub": user.username, "role": user.role})
    return {
        "message": "Login successful",
        "username": user.username,
        "role": user.role,
        "token": token
    }


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Retrieve profile of the currently logged-in user (verifies JWT token)."""
    return {
        "message": "Profile retrieved successfully",
        "username": current_user.username,
        "role": current_user.role,
        "token": None
    }
