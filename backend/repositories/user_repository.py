from sqlalchemy.orm import Session
from backend.models.user_model import User
from backend.repositories.base_repository import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self):
        super().__init__(User)

    def get_by_username(self, db: Session, username: str) -> User | None:
        return db.query(self.model).filter(self.model.username == username).first()
