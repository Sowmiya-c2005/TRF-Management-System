"""
Comment API routes.
Prefix: /comments
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.schemas.comment_schema import CommentCreate, CommentUpdate, CommentResponse
from backend.services import comment_service, audit_service, activity_service
from backend.services.email_service import (
    email_comment_added, email_comment_updated, email_comment_deleted
)
from backend.middleware.auth_middleware import get_current_user, check_trf_id_access
from backend.models.user_model import User

router = APIRouter(prefix="/comments", tags=["Comments"])


@router.post("/", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment(
    payload: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new comment or reply on a TRF."""
    from backend.repositories.trf_repository import TRFRepository
    trf_repo = TRFRepository()

    # Resolve trf_id from trf_number if needed
    if payload.trf_id:
        trf_id = payload.trf_id
        trf = trf_repo.get(db, trf_id)
    elif payload.trf_number:
        trf = trf_repo.get_by_number(db, payload.trf_number)
        if not trf:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail=f"TRF '{payload.trf_number}' not found")
        trf_id = trf.id
    else:
        from fastapi import HTTPException
        raise HTTPException(status_code=422, detail="Either trf_id or trf_number is required")

    trf_number = trf.trf_number if trf else f"ID:{trf_id}"
    check_trf_id_access(db, current_user, trf_id)

    comment = comment_service.create_comment(
        db, trf_id, current_user.id, payload.content, payload.parent_id
    )

    # Log activity
    activity_service.log_activity(
        db,
        trf_id=trf_id,
        user_id=current_user.id,
        action_type="COMMENT_ADDED",
        description=f"{current_user.username} added a comment on TRF {trf_number}"
    )

    audit_service.log_action(
        db,
        user_id=current_user.id,
        action="CREATE_COMMENT",
        details=f"User '{current_user.username}' added comment on TRF '{trf_number}'"
    )

    # Email admins when Engineer/Manager adds a comment
    try:
        email_comment_added(db, trf_number, payload.content, current_user.username, current_user.role)
    except Exception as email_err:
        import logging; logging.getLogger("comment_routes").warning(f"Comment email error: {email_err}")

    return comment


@router.get("/trf/{trf_ref}")
def get_trf_comments(
    trf_ref: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all top-level comments for a TRF. Accepts either trf_id (int) or trf_number (string)."""
    from backend.repositories.trf_repository import TRFRepository
    # Try numeric ID first, then trf_number string
    if trf_ref.isdigit():
        trf_id = int(trf_ref)
    else:
        trf = TRFRepository().get_by_number(db, trf_ref)
        if not trf:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail=f"TRF '{trf_ref}' not found")
        trf_id = trf.id
    check_trf_id_access(db, current_user, trf_id)
    comments = comment_service.get_trf_comments(db, trf_id)
    return {"trf_id": trf_id, "comments": comments, "count": len(comments)}


@router.get("/{comment_id}/replies")
def get_comment_replies(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all replies to a specific comment."""
    # Since comment_id doesn't directly give trf_id without fetching it, let's verify via comment's trf
    from backend.repositories.comment_repository import CommentRepository
    comment = CommentRepository().get(db, comment_id)
    if comment:
        check_trf_id_access(db, current_user, comment.trf_id)
    replies = comment_service.get_comment_replies(db, comment_id)
    return {"comment_id": comment_id, "replies": replies, "count": len(replies)}


@router.get("/trf/{trf_id}/thread")
def get_full_comment_thread(
    trf_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the full comment thread for a TRF with nested replies."""
    check_trf_id_access(db, current_user, trf_id)
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

    # Resolve TRF number and notify admins
    try:
        from backend.repositories.trf_repository import TRFRepository
        trf = TRFRepository().get(db, comment.trf_id)
        trf_number = trf.trf_number if trf else f"ID:{comment.trf_id}"
        email_comment_updated(
            db, trf_number, payload.content,
            current_user.username, current_user.role
        )
    except Exception as email_err:
        import logging; logging.getLogger("comment_routes").warning(f"Comment update email error: {email_err}")

    return comment


@router.delete("/{comment_id}", status_code=status.HTTP_200_OK)
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a comment (by author or admin)."""
    # Resolve TRF number before deletion
    from backend.repositories.comment_repository import CommentRepository
    comment = CommentRepository().get(db, comment_id)
    trf_number = None
    if comment:
        from backend.repositories.trf_repository import TRFRepository
        trf = TRFRepository().get(db, comment.trf_id)
        trf_number = trf.trf_number if trf else f"ID:{comment.trf_id}"

    comment_service.delete_comment(db, comment_id, current_user.id, current_user.role)

    audit_service.log_action(
        db,
        user_id=current_user.id,
        action="DELETE_COMMENT",
        details=f"User '{current_user.username}' deleted comment {comment_id}"
    )

    # Notify admins when Engineer/Manager deletes a comment
    try:
        if trf_number:
            email_comment_deleted(
                db, trf_number,
                current_user.username, current_user.role
            )
    except Exception as email_err:
        import logging; logging.getLogger("comment_routes").warning(f"Comment delete email error: {email_err}")

    return {"message": "Comment deleted successfully"}
