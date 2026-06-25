from fastapi import APIRouter, Depends, File, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.schemas.trf_schema import MessageResponse
from backend.services import file_service
from backend.middleware.auth_middleware import get_current_user, RoleChecker
from backend.models.user_model import User

router = APIRouter(prefix="/files", tags=["File Management"])


@router.get("/{trf_number}/{folder_name}")
def list_files(
    trf_number: str,
    folder_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all files inside a TRF sub-folder. Accessible by all authenticated users."""
    files = file_service.list_files(db, trf_number, folder_name)
    return {
        "trf_number": trf_number,
        "folder_name": folder_name,
        "files": files,
    }


@router.post(
    "/{trf_number}/{folder_name}",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
)
def upload_file(
    trf_number: str,
    folder_name: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Admin", "Engineer"]))
):
    """Upload a file into a TRF sub-folder. Accessible by Admin and Engineer."""
    saved_name = file_service.save_file(db, trf_number, folder_name, file, current_user=current_user)
    return {"message": f"File '{saved_name}' uploaded successfully"}


@router.delete("/{trf_number}/{folder_name}/{file_name}", response_model=MessageResponse)
def delete_file(
    trf_number: str,
    folder_name: str,
    file_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Admin", "Engineer"]))
):
    """Delete a file from a TRF sub-folder. Accessible by Admin and Engineer."""
    file_service.remove_file(db, trf_number, folder_name, file_name, current_user=current_user)
    return {"message": f"File '{file_name}' deleted successfully"}


@router.get("/{trf_number}/{folder_name}/{file_name}/download")
def download_file(
    trf_number: str,
    folder_name: str,
    file_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Download a file from a TRF sub-folder. Accessible by all authenticated users."""
    file_path = file_service.get_file_path(db, trf_number, folder_name, file_name)
    return FileResponse(path=file_path, filename=file_name)
