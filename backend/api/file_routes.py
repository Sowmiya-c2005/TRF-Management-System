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
    """Upload a file into a TRF sub-folder (supports versioning). Accessible by Admin and Engineer."""
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
    """Delete a file and all its versions from a TRF sub-folder. Accessible by Admin and Engineer."""
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


@router.get("/{trf_number}/{folder_name}/{file_name}/preview")
def preview_file(
    trf_number: str,
    folder_name: str,
    file_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Preview a file inline (PDFs, Images). Accessible by all authenticated users."""
    file_path, mime_type = file_service.preview_file(db, trf_number, folder_name, file_name)
    return FileResponse(path=file_path, media_type=mime_type, content_disposition_type="inline")


@router.get("/{trf_number}/{folder_name}/{file_name}/versions")
def get_file_versions(
    trf_number: str,
    folder_name: str,
    file_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all versions of a file with size and uploader metadata. Accessible by all authenticated users."""
    return file_service.get_file_versions(db, trf_number, folder_name, file_name)


@router.get("/{trf_number}/{folder_name}/{file_name}/version/{version_number}/download")
def download_file_version(
    trf_number: str,
    folder_name: str,
    file_name: str,
    version_number: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Download a specific version of a file. Accessible by all authenticated users."""
    file_path = file_service.get_version_file_path(db, trf_number, folder_name, file_name, version_number)
    return FileResponse(path=file_path, filename=f"v{version_number}_{file_name}")


@router.post("/{trf_number}/{folder_name}/sync", response_model=MessageResponse)
def sync_files(
    trf_number: str,
    folder_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Synchronize database records with local storage and SharePoint. Accessible by all authenticated users."""
    synced = file_service.sync_local_and_sharepoint(db, trf_number, folder_name)
    return {"message": f"Successfully synchronized {synced} file(s)."}
