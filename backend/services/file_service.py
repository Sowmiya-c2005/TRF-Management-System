import os
import shutil

from fastapi import HTTPException, UploadFile, status

UPLOADS_ROOT = os.getenv("UPLOADS_ROOT", "uploads")


def _resolve_folder(trf_number: str, folder_name: str) -> str:
    """Returns the absolute folder path and raises 404 if it does not exist."""
    path = os.path.join(UPLOADS_ROOT, trf_number, folder_name)
    if not os.path.exists(path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Folder '{folder_name}' not found for TRF '{trf_number}'"
        )
    return path


def list_files(trf_number: str, folder_name: str) -> list[str]:
    folder_path = _resolve_folder(trf_number, folder_name)
    return [
        f for f in os.listdir(folder_path)
        if os.path.isfile(os.path.join(folder_path, f))
    ]


def save_file(trf_number: str, folder_name: str, file: UploadFile) -> str:
    folder_path = _resolve_folder(trf_number, folder_name)
    file_path = os.path.join(folder_path, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return file.filename


def remove_file(trf_number: str, folder_name: str, file_name: str) -> None:
    folder_path = _resolve_folder(trf_number, folder_name)
    file_path = os.path.join(folder_path, file_name)
    if not os.path.isfile(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File '{file_name}' not found"
        )
    os.remove(file_path)


def get_file_path(trf_number: str, folder_name: str, file_name: str) -> str:
    folder_path = _resolve_folder(trf_number, folder_name)
    file_path = os.path.join(folder_path, file_name)
    if not os.path.isfile(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File '{file_name}' not found"
        )
    return file_path
