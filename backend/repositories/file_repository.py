from sqlalchemy.orm import Session
from backend.models.file_model import FileRecord
from backend.models.folder_model import Folder
from backend.models.trf_model import TRFRecord
from backend.repositories.base_repository import BaseRepository


class FileRepository(BaseRepository[FileRecord]):
    def __init__(self):
        super().__init__(FileRecord)

    def get_by_folder_and_name(self, db: Session, folder_id: int, filename: str) -> FileRecord | None:
        return db.query(self.model).filter(
            self.model.folder_id == folder_id,
            self.model.filename == filename
        ).first()

    def get_by_trf_folder_and_name(self, db: Session, trf_number: str, folder_name: str, filename: str) -> FileRecord | None:
        return db.query(self.model).join(Folder).join(TRFRecord).filter(
            TRFRecord.trf_number == trf_number,
            Folder.name == folder_name,
            self.model.filename == filename
        ).first()
