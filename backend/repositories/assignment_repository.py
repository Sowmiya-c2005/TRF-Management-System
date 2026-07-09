from sqlalchemy.orm import Session
from backend.models.trf_assignment_model import TRFEngineerAssignment
from backend.repositories.base_repository import BaseRepository


class AssignmentRepository(BaseRepository[TRFEngineerAssignment]):
    def __init__(self):
        super().__init__(TRFEngineerAssignment)

    def get_by_trf_id(self, db: Session, trf_id: int):
        return db.query(self.model).filter(self.model.trf_id == trf_id).all()

    def get_by_engineer_id(self, db: Session, engineer_id: int):
        return db.query(self.model).filter(self.model.engineer_id == engineer_id).all()

    def delete_by_trf_id(self, db: Session, trf_id: int):
        db.query(self.model).filter(self.model.trf_id == trf_id).delete()
        db.commit()
