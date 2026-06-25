from sqlalchemy.orm import Session
from backend.models.folder_model import Folder
from backend.models.trf_model import TRFRecord
from backend.repositories.base_repository import BaseRepository


class FolderRepository(BaseRepository[Folder]):
    def __init__(self):
        super().__init__(Folder)

    def get_by_trf_and_name(self, db: Session, trf_id: int, name: str) -> Folder | None:
        return db.query(self.model).filter(
            self.model.trf_id == trf_id,
            self.model.name == name
        ).first()

    def get_by_trf_number_and_name(self, db: Session, trf_number: str, name: str) -> Folder | None:
        return db.query(self.model).join(TRFRecord).filter(
            TRFRecord.trf_number == trf_number,
            self.model.name == name
        ).first()
