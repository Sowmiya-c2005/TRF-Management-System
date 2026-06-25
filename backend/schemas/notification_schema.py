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

    model_config = {"from_attributes": True}
