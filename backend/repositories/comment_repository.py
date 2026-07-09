from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.models.comment_model import Comment
from backend.repositories.base_repository import BaseRepository


class CommentRepository(BaseRepository[Comment]):
    def __init__(self):
        super().__init__(Comment)

    def get_by_trf_id(self, db: Session, trf_id: int):
        """Get all top-level comments for a TRF (no parent)."""
        return db.query(self.model).filter(
            self.model.trf_id == trf_id,
            self.model.parent_id.is_(None)
        ).order_by(self.model.created_at.desc()).all()

    def get_by_parent_id(self, db: Session, parent_id: int):
        """Get all replies to a specific comment."""
        return db.query(self.model).filter(self.model.parent_id == parent_id).order_by(self.model.created_at.asc()).all()

    def get_with_replies_count(self, db: Session, comment_id: int):
        """Get a comment with its replies count."""
        comment = db.query(self.model).filter(self.model.id == comment_id).first()
        if comment:
            replies_count = db.query(func.count(self.model.id)).filter(self.model.parent_id == comment_id).scalar()
            comment.replies_count = replies_count or 0
        return comment

    def get_full_thread(self, db: Session, trf_id: int):
        """Get all comments for a TRF with nested replies."""
        return db.query(self.model).filter(self.model.trf_id == trf_id).order_by(self.model.created_at.desc()).all()
