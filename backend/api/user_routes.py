"""
User & Auth API routes.  Prefix: /users
"""
from fastapi import APIRouter, Depends, status, Request
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.schemas.user_schema import (
    UserCreate, UserLogin, UserResponse, RegisterResponse,
    TokenRefreshRequest, TokenRefreshResponse,
    UserProfileResponse, UserUpdate,
    ChangePasswordRequest, RoleUpdateRequest,
    AdminResetPasswordRequest, UserStatusRequest, RoleVerifyRequest,
)
from backend.services import user_service, audit_service, notification_service
from backend.middleware.auth_middleware import get_current_user, RoleChecker
from backend.models.user_model import User
from fastapi import HTTPException

router = APIRouter(prefix="/users", tags=["Users & Auth"])


# ── Auth ──────────────────────────────────────────────────────────────────────

@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    user = user_service.register_user(db, payload)
    audit_service.log_action(db, user_id=user.id, action="REGISTER",
                             details=f"User '{user.username}' registered (role: {user.role}).")
    return {"message": "User registered successfully"}


@router.post("/login", response_model=UserResponse)
def login(payload: UserLogin, request: Request, db: Session = Depends(get_db)):
    user  = user_service.authenticate_user(db, payload.username, payload.password)
    token = user_service.create_access_token({"sub": user.username, "role": user.role})
    rtok  = user_service.create_refresh_token({"sub": user.username})
    user_service.store_refresh_token(db, user, rtok)
    ip = request.client.host if request.client else None
    audit_service.log_action(db, user_id=user.id, action="LOGIN",
                             details=f"User '{user.username}' logged in.", ip_address=ip)
    return {
        "message": "Login successful",
        "username": user.username,
        "role": user.role,
        "email": user.email,
        "display_name": user.display_name,
        "phone": user.phone,
        "token": token,
        "refresh_token": rtok,
    }


@router.post("/verify-role")
def verify_role(payload: RoleVerifyRequest, current_user: User = Depends(get_current_user)):
    if current_user.role != payload.role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Selected role '{payload.role}' does not match your assigned role."
        )
    return {"message": "Role verified successfully", "role": current_user.role}




@router.post("/refresh", response_model=TokenRefreshResponse)
def refresh(payload: TokenRefreshRequest, db: Session = Depends(get_db)):
    user     = user_service.verify_refresh_token(db, payload.refresh_token)
    new_tok  = user_service.create_access_token({"sub": user.username, "role": user.role})
    new_rtok = user_service.create_refresh_token({"sub": user.username})
    user_service.store_refresh_token(db, user, new_rtok)
    return {"token": new_tok, "refresh_token": new_rtok, "role": user.role, "username": user.username}


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user_service.clear_refresh_token(db, current_user)
    audit_service.log_action(db, user_id=current_user.id, action="LOGOUT",
                             details=f"User '{current_user.username}' logged out.")
    return {"message": "Logged out successfully"}


# ── My Profile ────────────────────────────────────────────────────────────────

@router.get("/me", response_model=UserProfileResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserProfileResponse)
def update_me(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update the current user's own profile (name, email, phone, avatar).
    Email uniqueness is validated — returns 409 if duplicate.
    If email changes, refresh token is revoked (frontend must re-login).
    If the user is an Admin and their email changes, a test verification email is
    immediately dispatched to the new address to confirm the SMTP pipeline is live.
    """
    import logging
    _log = logging.getLogger("user_routes")

    email_before = (current_user.email or "").strip().lower()
    updated = user_service.update_profile(db, current_user, payload)

    audit_service.log_action(db, user_id=current_user.id, action="UPDATE_PROFILE",
                             details=f"User '{current_user.username}' updated profile.")

    # ── Admin email changed → fire immediate test notification ────────────────
    email_after = (updated.email or "").strip().lower()
    if current_user.role == "Admin" and email_after and email_after != email_before:
        _log.info(
            f"[SMTP-DEBUG] Admin '{current_user.username}' changed email from "
            f"'{email_before}' → '{email_after}'. Dispatching immediate test notification..."
        )
        try:
            from backend.services.email_service import send_system_email
            test_subject = "[TRF Portal] ✅ Email Updated — Notification Test"
            test_body = (
                f"Hi {updated.display_name or updated.username},\n\n"
                f"Your TRF Portal admin email has been successfully updated.\n\n"
                f"Previous Email : {email_before or '(not set)'}\n"
                f"New Email      : {email_after}\n\n"
                f"This is an automated test email confirming that all future TRF Portal\n"
                f"notifications (TRF creation, assignments, status changes, file uploads,\n"
                f"comments, approvals) will now be sent to this email address.\n\n"
                f"No action required — you're all set!\n\n"
                f"— TRF Portal System"
            )
            send_system_email(email_after, test_subject, test_body, db)
            _log.info(f"[SMTP-DEBUG] Test notification dispatched to new admin email: {email_after!r}")
        except Exception as email_err:
            _log.warning(f"[SMTP-DEBUG] Failed to send admin email update test notification: {email_err}")

    return updated


@router.put("/me/password", status_code=status.HTTP_200_OK)
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user_service.change_password(db, current_user, payload.current_password, payload.new_password)
    audit_service.log_action(db, user_id=current_user.id, action="CHANGE_PASSWORD",
                             details=f"User '{current_user.username}' changed password.")
    return {"message": "Password updated successfully."}


# ── Admin: list & create ──────────────────────────────────────────────────────

@router.get("/", response_model=list[UserProfileResponse])
def list_users(db: Session = Depends(get_db), _: User = Depends(RoleChecker(["Admin"]))):
    return user_service.get_all_users(db)


@router.post("/", response_model=UserProfileResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Admin"])),
):
    user = user_service.register_user(db, payload, admin_override_role=payload.role)
    audit_service.log_action(db, user_id=current_user.id, action="CREATE_USER",
                             details=f"Admin created user '{user.username}' role='{user.role}'.")
    notification_service.create_notification(db, user_id=user.id,
        title="Welcome to TRF Portal",
        body=f"Your account has been created by Admin. Username: {user.username}",
        notif_type="user")
    return user


# ── Admin: edit / role / status / reset-password / delete ────────────────────

@router.put("/{user_id}/role", response_model=UserProfileResponse)
def update_role(
    user_id: int,
    payload: RoleUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Admin"])),
):
    user    = user_service.get_user_by_id(db, user_id)
    updated = user_service.set_role(db, user, payload.role)
    audit_service.log_action(db, user_id=current_user.id, action="UPDATE_ROLE",
                             details=f"Admin changed '{user.username}' role → '{payload.role}'.")
    return updated


@router.put("/{user_id}/status", response_model=UserProfileResponse)
def update_status(
    user_id: int,
    payload: UserStatusRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Admin"])),
):
    from datetime import datetime, timezone
    from fastapi import HTTPException as HE
    user = user_service.get_user_by_id(db, user_id)
    if user.id == current_user.id:
        raise HE(status_code=400, detail="Cannot deactivate your own account.")
    user.is_active  = payload.is_active
    user.updated_at = datetime.now(timezone.utc)
    from backend.repositories.user_repository import UserRepository
    UserRepository().commit(db)
    action = "ACTIVATE_USER" if payload.is_active else "DEACTIVATE_USER"
    audit_service.log_action(db, user_id=current_user.id, action=action,
                             details=f"Admin {'activated' if payload.is_active else 'deactivated'} user '{user.username}'.")
    return user


@router.post("/{user_id}/reset-password", status_code=status.HTTP_200_OK)
def admin_reset_password(
    user_id: int,
    payload: AdminResetPasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Admin"])),
):
    import bcrypt
    from backend.repositories.user_repository import UserRepository
    user = user_service.get_user_by_id(db, user_id)
    user.password      = bcrypt.hashpw(payload.new_password.encode(), bcrypt.gensalt()).decode()
    user.refresh_token = None
    UserRepository().commit(db)
    audit_service.log_action(db, user_id=current_user.id, action="RESET_PASSWORD",
                             details=f"Admin reset password for '{user.username}'.")
    return {"message": f"Password reset for '{user.username}'."}


@router.put("/{user_id}", response_model=UserProfileResponse)
def admin_update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Admin"])),
):
    user    = user_service.get_user_by_id(db, user_id)
    updated = user_service.update_profile(db, user, payload)
    audit_service.log_action(db, user_id=current_user.id, action="ADMIN_UPDATE_USER",
                             details=f"Admin updated profile for '{user.username}'.")
    return updated


@router.delete("/{user_id}", status_code=status.HTTP_200_OK)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Admin"])),
):
    from fastapi import HTTPException as HE
    target = user_service.get_user_by_id(db, user_id)
    if target.id == current_user.id:
        raise HE(status_code=400, detail="Cannot delete your own account.")
    user_service.delete_user(db, user_id)
    audit_service.log_action(db, user_id=current_user.id, action="DELETE_USER",
                             details=f"Admin deleted user '{target.username}'.")
    return {"message": f"User '{target.username}' deleted."}
