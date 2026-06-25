from pydantic import BaseModel, Field
from typing import Optional


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, description="Unique username")
    password: str = Field(..., min_length=6, description="User password")


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    message: str
    username: str
    role: str
    token: Optional[str] = None


class RegisterResponse(BaseModel):
    message: str


class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str


class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None
