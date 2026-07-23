from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class CommentCreate(BaseModel):
    trf_id:     Optional[int] = Field(None, description="TRF ID (use this OR trf_number)")
    trf_number: Optional[str] = Field(None, description="TRF number (use this OR trf_id)")
    content:    str           = Field(..., min_length=1, description="Comment content")
    parent_id:  Optional[int] = Field(None, description="Parent comment ID for replies")


class CommentUpdate(BaseModel):
    content: str = Field(..., min_length=1, description="Updated comment content")


class CommentResponse(BaseModel):
    id: int
    trf_id: int
    user_id: int
    parent_id: Optional[int]
    content: str
    created_at: datetime
    updated_at: Optional[datetime]
    
    # Include nested user info
    username: Optional[str] = None
    user_role: Optional[str] = None
    display_name: Optional[str] = None
    
    # Include replies count
    replies_count: int = 0

    model_config = {"from_attributes": True}


class CommentWithRepliesResponse(CommentResponse):
    replies: list["CommentWithRepliesResponse"] = []
