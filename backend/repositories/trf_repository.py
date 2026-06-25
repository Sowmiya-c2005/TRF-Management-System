from sqlalchemy.orm import Session
from backend.models.trf_model import TRFRecord
from backend.repositories.base_repository import BaseRepository


class TRFRepository(BaseRepository[TRFRecord]):
    def __init__(self):
        super().__init__(TRFRecord)

    def get_by_number(self, db: Session, trf_number: str) -> TRFRecord | None:
        return db.query(self.model).filter(self.model.trf_number == trf_number).first()

    def count_all(self, db: Session) -> int:
        return db.query(self.model).count()
