"""
Comment service - manage threaded comments for TRFs.
"""
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from backend.models.comment_model import Comment
from backend.models.trf_model import TRFRecord
from backend.models.user_model import User
from backend.repositories.comment_repository import CommentRepository
from backend.repositories.trf_repository import TRFRepository
from backend.repositories.user_repository import UserRepository
from backend.utils.logging_config import get_logger

logger = get_logger("comment_service")

comment_repo = CommentRepository()
trf_repo = TRFRepository()
user_repo = UserRepository()


def create_comment(db: Session, trf_id: int, user_id: int, content: str, parent_id: Optional[int] = None) -> Comment:
    """Create a new comment or reply."""
    trf = trf_repo.get(db, trf_id)
    if not trf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="TRF not found.")
    
    user = user_repo.get(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    
    # If parent_id is provided, verify it exists and belongs to the same TRF
    if parent_id:
        parent_comment = comment_repo.get(db, parent_id)
        if not parent_comment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent comment not found.")
        if parent_comment.trf_id != trf_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Parent comment does not belong to this TRF.")
    
    comment = Comment(
        trf_id=trf_id,
        user_id=user_id,
        content=content,
        parent_id=parent_id
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    
    logger.info(f"Comment created by {user.username} on TRF {trf.trf_number}")
    return comment


def get_trf_comments(db: Session, trf_id: int) -> List[Comment]:
    """Get all top-level comments for a TRF."""
    trf = trf_repo.get(db, trf_id)
    if not trf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="TRF not found.")
    
    return comment_repo.get_by_trf_id(db, trf_id)


def get_comment_replies(db: Session, comment_id: int) -> List[Comment]:
    """Get all replies to a specific comment."""
    comment = comment_repo.get(db, comment_id)
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found.")
    
    return comment_repo.get_by_parent_id(db, comment_id)


def update_comment(db: Session, comment_id: int, user_id: int, content: str) -> Comment:
    """Update a comment (only by the author)."""
    comment = comment_repo.get(db, comment_id)
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found.")
    
    if comment.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only edit your own comments.")
    
    comment.content = content
    comment.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(comment)
    
    logger.info(f"Comment {comment_id} updated by user {user_id}")
    return comment


def delete_comment(db: Session, comment_id: int, user_id: int, user_role: str) -> None:
    """Delete a comment (by author or admin)."""
    comment = comment_repo.get(db, comment_id)
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found.")
    
    if comment.user_id != user_id and user_role != "Admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own comments.")
    
    # Delete all replies first (cascade will handle this in DB, but explicit here for clarity)
    replies = comment_repo.get_by_parent_id(db, comment_id)
    for reply in replies:
        db.delete(reply)
    
    db.delete(comment)
    db.commit()
    
    logger.info(f"Comment {comment_id} deleted by user {user_id}")


def get_full_comment_thread(db: Session, trf_id: int) -> List[Comment]:
    """Get all comments for a TRF with nested structure."""
    trf = trf_repo.get(db, trf_id)
    if not trf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="TRF not found.")
    
    return comment_repo.get_full_thread(db, trf_id)
