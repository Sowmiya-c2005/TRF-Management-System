import os
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from backend.models.trf_model import TRFRecord
from backend.schemas.trf_schema import TRFCreate

UPLOADS_ROOT = os.getenv("UPLOADS_ROOT", "uploads")

TRF_SUBFOLDERS = [
    "Documents",
    "Reports",
    "Drawings",
    "Approvals",
    "Final Submission",
]


def _trf_folder_path(trf_number: str) -> str:
    return os.path.join(UPLOADS_ROOT, trf_number)


def get_all_trfs(db: Session) -> list[TRFRecord]:
    return db.query(TRFRecord).all()


def get_trf_by_number(db: Session, trf_number: str) -> TRFRecord:
    trf = db.query(TRFRecord).filter(TRFRecord.trf_number == trf_number).first()
    if not trf:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"TRF '{trf_number}' not found"
        )
    return trf


def create_trf(db: Session, payload: TRFCreate) -> TRFRecord:
    existing = db.query(TRFRecord).filter(
        TRFRecord.trf_number == payload.trf_number
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="TRF already exists in database"
        )

    new_trf = TRFRecord(
        trf_number=payload.trf_number,
        project_name=payload.project_name,
    )
    db.add(new_trf)
    db.commit()
    db.refresh(new_trf)

    # Create directory structure
    root_path = _trf_folder_path(payload.trf_number)
    if not os.path.exists(root_path):
        os.makedirs(root_path)
        for folder in TRF_SUBFOLDERS:
            os.makedirs(os.path.join(root_path, folder))

    return new_trf


def update_trf(db: Session, trf_number: str, project_name: str) -> TRFRecord:
    trf = get_trf_by_number(db, trf_number)
    trf.project_name = project_name
    db.commit()
    db.refresh(trf)
    return trf


def delete_trf(db: Session, trf_number: str) -> None:
    trf = get_trf_by_number(db, trf_number)
    db.delete(trf)
    db.commit()


def get_dashboard_stats(db: Session) -> dict:
    total_trfs = db.query(TRFRecord).count()
    return {"total_trfs": total_trfs}
