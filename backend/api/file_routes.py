from fastapi import APIRouter, File, UploadFile, status
from fastapi.responses import FileResponse

from backend.schemas.trf_schema import MessageResponse
from backend.services import file_service

router = APIRouter(prefix="/files", tags=["File Management"])


@router.get("/{trf_number}/{folder_name}")
def list_files(trf_number: str, folder_name: str):
    """List all files inside a TRF sub-folder."""
    files = file_service.list_files(trf_number, folder_name)
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
def upload_file(trf_number: str, folder_name: str, file: UploadFile = File(...)):
    """Upload a file into a TRF sub-folder."""
    saved_name = file_service.save_file(trf_number, folder_name, file)
    return {"message": f"File '{saved_name}' uploaded successfully"}


@router.delete("/{trf_number}/{folder_name}/{file_name}", response_model=MessageResponse)
def delete_file(trf_number: str, folder_name: str, file_name: str):
    """Delete a file from a TRF sub-folder."""
    file_service.remove_file(trf_number, folder_name, file_name)
    return {"message": f"File '{file_name}' deleted successfully"}


@router.get("/{trf_number}/{folder_name}/{file_name}/download")
def download_file(trf_number: str, folder_name: str, file_name: str):
    """Download a file from a TRF sub-folder."""
    file_path = file_service.get_file_path(trf_number, folder_name, file_name)
    return FileResponse(path=file_path, filename=file_name)
