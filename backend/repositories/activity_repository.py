from sqlalchemy.orm import Session
from backend.models.activity_model import Activity
from backend.repositories.base_repository import BaseRepository


class ActivityRepository(BaseRepository[Activity]):
    def __init__(self):
        super().__init__(Activity)

    def get_by_trf_id(self, db: Session, trf_id: int, limit: int = 50):
        return db.query(self.model).filter(self.model.trf_id == trf_id).order_by(self.model.created_at.desc()).limit(limit).all()

    def get_by_user_id(self, db: Session, user_id: int, limit: int = 50):
        return db.query(self.model).filter(self.model.user_id == user_id).order_by(self.model.created_at.desc()).limit(limit).all()

    def get_recent(self, db: Session, limit: int = 100):
        return db.query(self.model).order_by(self.model.created_at.desc()).limit(limit).all()
