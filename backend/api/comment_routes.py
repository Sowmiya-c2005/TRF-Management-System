"""
Comment API routes.
Prefix: /comments
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.schemas.comment_schema import CommentCreate, CommentUpdate, CommentResponse
from backend.services import comment_service, audit_service, activity_service
from backend.middleware.auth_middleware import get_current_user
from backend.models.user_model import User

router = APIRouter(prefix="/comments", tags=["Comments"])


@router.post("/", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment(
    payload: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new comment or reply on a TRF."""
    comment = comment_service.create_comment(
        db,
        payload.trf_id,
        current_user.id,
        payload.content,
        payload.parent_id
    )
    
    # Log activity
    activity_service.log_activity(
        db,
        trf_id=payload.trf_id,
        user_id=current_user.id,
        action_type="COMMENT_ADDED",
        description=f"{current_user.username} added a comment on TRF"
    )
    
    audit_service.log_action(
        db,
        user_id=current_user.id,
        action="CREATE_COMMENT",
        details=f"User '{current_user.username}' added comment on TRF ID {payload.trf_id}"
    )
    
    return comment


@router.get("/trf/{trf_id}")
def get_trf_comments(
    trf_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all top-level comments for a TRF."""
    comments = comment_service.get_trf_comments(db, trf_id)
    return {"trf_id": trf_id, "comments": comments, "count": len(comments)}


@router.get("/{comment_id}/replies")
def get_comment_replies(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all replies to a specific comment."""
    replies = comment_service.get_comment_replies(db, comment_id)
    return {"comment_id": comment_id, "replies": replies, "count": len(replies)}


@router.get("/trf/{trf_id}/thread")
def get_full_comment_thread(
    trf_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the full comment thread for a TRF with nested replies."""
    comments = comment_service.get_full_comment_thread(db, trf_id)
    return {"trf_id": trf_id, "comments": comments, "count": len(comments)}


@router.put("/{comment_id}", response_model=CommentResponse)
def update_comment(
    comment_id: int,
    payload: CommentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a comment (only by the author)."""
    comment = comment_service.update_comment(db, comment_id, current_user.id, payload.content)
    
    audit_service.log_action(
        db,
        user_id=current_user.id,
        action="UPDATE_COMMENT",
        details=f"User '{current_user.username}' updated comment {comment_id}"
    )
    
    return comment


@router.delete("/{comment_id}", status_code=status.HTTP_200_OK)
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a comment (by author or admin)."""
    comment_service.delete_comment(db, comment_id, current_user.id, current_user.role)
    
    audit_service.log_action(
        db,
        user_id=current_user.id,
        action="DELETE_COMMENT",
        details=f"User '{current_user.username}' deleted comment {comment_id}"
    )
    
    return {"message": "Comment deleted successfully"}
