from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ── Requests ──────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    username:     str           = Field(..., min_length=3)
    password:     str           = Field(..., min_length=6)
    email:        Optional[str] = None
    display_name: Optional[str] = None
    phone:        Optional[str] = None
    role:         Optional[str] = "Engineer"


class UserLogin(BaseModel):
    username: str
    password: str


class UserUpdate(BaseModel):
    email:        Optional[str] = None
    display_name: Optional[str] = None
    phone:        Optional[str] = None
    avatar_url:   Optional[str] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password:     str = Field(..., min_length=6)


class AdminResetPasswordRequest(BaseModel):
    new_password: str = Field(..., min_length=6)


class RoleUpdateRequest(BaseModel):
    role: str = Field(..., description="New role: Admin | Engineer | Manager")


class UserStatusRequest(BaseModel):
    is_active: bool


# ── Responses ─────────────────────────────────────────────────────────────────

class UserResponse(BaseModel):
    message:       str
    username:      str
    role:          str
    email:         Optional[str] = None
    display_name:  Optional[str] = None
    phone:         Optional[str] = None
    token:         Optional[str] = None
    refresh_token: Optional[str] = None



class UserProfileResponse(BaseModel):
    id:            int
    username:      str
    role:          str
    email:         Optional[str]  = None
    display_name:  Optional[str]  = None
    phone:         Optional[str]  = None
    avatar_url:    Optional[str]  = None
    is_active:     bool           = True
    last_login_at: Optional[datetime] = None
    created_at:    datetime

    model_config = {"from_attributes": True}


class RegisterResponse(BaseModel):
    message: str


class TokenRefreshRequest(BaseModel):
    refresh_token: str


class TokenRefreshResponse(BaseModel):
    token:         str
    refresh_token: str
    role:          str
    username:      str


class Token(BaseModel):
    access_token: str
    token_type:   str
    role:         str
    username:     str


class TokenData(BaseModel):
    username: Optional[str] = None
    role:     Optional[str] = None
