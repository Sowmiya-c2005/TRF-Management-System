from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class NotificationResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    title: str
    body: str
    read: bool
    type: str
    created_at: datetime
    trf_number: Optional[str] = None
    actor_username: Optional[str] = None
    actor_role: Optional[str] = None

    model_config = {"from_attributes": True}
