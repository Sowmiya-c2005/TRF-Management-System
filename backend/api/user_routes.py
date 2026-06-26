from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.schemas.user_schema import (
    UserCreate,
    UserLogin,
    UserResponse,
    RegisterResponse,
    TokenRefreshRequest,
    TokenRefreshResponse,
)
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
    """Authenticate a user, issue JWT access + refresh tokens, and return profile."""
    user = user_service.authenticate_user(db, payload.username, payload.password)
    # Generate JWT access and refresh tokens
    token = user_service.create_access_token({"sub": user.username, "role": user.role})
    refresh_token = user_service.create_refresh_token({"sub": user.username})
    
    # Store refresh token in DB
    user_service.store_refresh_token(db, user, refresh_token)
    
    return {
        "message": "Login successful",
        "username": user.username,
        "role": user.role,
        "token": token,
        "refresh_token": refresh_token
    }


@router.post("/refresh", response_model=TokenRefreshResponse)
def refresh(payload: TokenRefreshRequest, db: Session = Depends(get_db)):
    """Accept a refresh token, verify it, and issue new access + refresh tokens."""
    user = user_service.verify_refresh_token(db, payload.refresh_token)
    
    # Generate new tokens
    new_token = user_service.create_access_token({"sub": user.username, "role": user.role})
    new_refresh_token = user_service.create_refresh_token({"sub": user.username})
    
    # Update stored refresh token in DB
    user_service.store_refresh_token(db, user, new_refresh_token)
    
    return {
        "token": new_token,
        "refresh_token": new_refresh_token,
        "role": user.role,
        "username": user.username
    }


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Revoke refresh token on logout."""
    user_service.clear_refresh_token(db, current_user)
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Retrieve profile of the currently logged-in user (verifies JWT token)."""
    return {
        "message": "Profile retrieved successfully",
        "username": current_user.username,
        "role": current_user.role,
        "token": None,
        "refresh_token": None
    }
