"""
User & Auth API routes.
Prefix: /users
"""
from fastapi import APIRouter, Depends, status, Request
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.schemas.user_schema import (
    UserCreate, UserLogin, UserResponse, RegisterResponse,
    TokenRefreshRequest, TokenRefreshResponse,
    UserProfileResponse, UserUpdate,
    ChangePasswordRequest, RoleUpdateRequest,
)
from backend.services import user_service, audit_service, notification_service
from backend.middleware.auth_middleware import get_current_user, RoleChecker
from backend.models.user_model import User

router = APIRouter(prefix="/users", tags=["Users & Auth"])


# ── Auth ───────────────────────────────────────────────────────────────────────

@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    """Register a new user. First user is always Admin."""
    user = user_service.register_user(db, payload)
    audit_service.log_action(db, user_id=user.id, action="REGISTER",
                             details=f"User '{user.username}' registered (role: {user.role}).")
    return {"message": "User registered successfully"}


@router.post("/login", response_model=UserResponse)
def login(payload: UserLogin, request: Request, db: Session = Depends(get_db)):
    """Authenticate a user and return JWT access + refresh tokens."""
    user  = user_service.authenticate_user(db, payload.username, payload.password)
    token = user_service.create_access_token({"sub": user.username, "role": user.role})
    rtok  = user_service.create_refresh_token({"sub": user.username})
    user_service.store_refresh_token(db, user, rtok)

    ip = request.client.host if request.client else None
    audit_service.log_action(db, user_id=user.id, action="LOGIN",
                             details=f"User '{user.username}' logged in.", ip_address=ip)
    return {
        "message":       "Login successful",
        "username":      user.username,
        "role":          user.role,
        "token":         token,
        "refresh_token": rtok,
    }


@router.post("/refresh", response_model=TokenRefreshResponse)
def refresh(payload: TokenRefreshRequest, db: Session = Depends(get_db)):
    """Issue new access + refresh tokens from a valid refresh token."""
    user     = user_service.verify_refresh_token(db, payload.refresh_token)
    new_tok  = user_service.create_access_token({"sub": user.username, "role": user.role})
    new_rtok = user_service.create_refresh_token({"sub": user.username})
    user_service.store_refresh_token(db, user, new_rtok)
    return {"token": new_tok, "refresh_token": new_rtok, "role": user.role, "username": user.username}


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Revoke refresh token."""
    user_service.clear_refresh_token(db, current_user)
    audit_service.log_action(db, user_id=current_user.id, action="LOGOUT",
                             details=f"User '{current_user.username}' logged out.")
    return {"message": "Logged out successfully"}


# ── Profile ────────────────────────────────────────────────────────────────────

@router.get("/me", response_model=UserProfileResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the current user's profile."""
    return current_user


@router.put("/me", response_model=UserProfileResponse)
def update_me(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update display name / email."""
    updated = user_service.update_profile(db, current_user, payload)
    audit_service.log_action(db, user_id=current_user.id, action="UPDATE_PROFILE",
                             details=f"User '{current_user.username}' updated profile.")
    return updated


@router.put("/me/password", status_code=status.HTTP_200_OK)
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Change the current user's password."""
    user_service.change_password(db, current_user, payload.current_password, payload.new_password)
    audit_service.log_action(db, user_id=current_user.id, action="CHANGE_PASSWORD",
                             details=f"User '{current_user.username}' changed password.")
    return {"message": "Password updated successfully. Please log in again."}


# ── Admin user management ──────────────────────────────────────────────────────

@router.get("/", response_model=list[UserProfileResponse])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(RoleChecker(["Admin"])),
):
    """List all users. Admin only."""
    return user_service.get_all_users(db)


@router.put("/{user_id}/role", response_model=UserProfileResponse)
def update_role(
    user_id: int,
    payload: RoleUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Admin"])),
):
    """Change a user's role. Admin only."""
    user    = user_service.get_user_by_id(db, user_id)
    updated = user_service.set_role(db, user, payload.role)
    audit_service.log_action(db, user_id=current_user.id, action="UPDATE_ROLE",
                             details=f"Admin '{current_user.username}' changed '{user.username}' role → '{payload.role}'.")
    return updated


@router.delete("/{user_id}", status_code=status.HTTP_200_OK)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Admin"])),
):
    """Delete a user. Admin only."""
    target = user_service.get_user_by_id(db, user_id)
    if target.id == current_user.id:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Cannot delete your own account.")
    user_service.delete_user(db, user_id)
    audit_service.log_action(db, user_id=current_user.id, action="DELETE_USER",
                             details=f"Admin '{current_user.username}' deleted user '{target.username}'.")
    return {"message": f"User '{target.username}' deleted."}
