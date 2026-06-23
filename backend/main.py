"""
TRF Management System — FastAPI entry point.
Run with:  uvicorn backend.main:app --reload
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

from backend.api import trf_routes, file_routes, user_routes

app = FastAPI(
    title="TRF Management System",
    description="Document & Record Tracking API",
    version="2.0.0",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(trf_routes.router)
app.include_router(file_routes.router)
app.include_router(user_routes.router)


# ── Legacy compatibility shim ─────────────────────────────────────────────────
# These thin wrappers keep the old frontend URLs working while the frontend
# migrates to the new /trfs / /files / /users paths.

from fastapi import Depends
from sqlalchemy.orm import Session
from backend.database.database import get_db
from backend.schemas.trf_schema import TRFCreate, TRFUpdate
from backend.services import trf_service, file_service, user_service
from fastapi import File, UploadFile
from fastapi.responses import FileResponse


@app.get("/")
def health():
    return {"message": "TRF Management System Running Successfully", "version": "2.0.0"}


@app.get("/all-trfs")
def legacy_all_trfs(db: Session = Depends(get_db)):
    return trf_service.get_all_trfs(db)


@app.get("/dashboard-stats")
def legacy_dashboard_stats(db: Session = Depends(get_db)):
    return trf_service.get_dashboard_stats(db)


@app.get("/search-trf/{trf_number}")
def legacy_search_trf(trf_number: str, db: Session = Depends(get_db)):
    return trf_service.get_trf_by_number(db, trf_number)


@app.post("/create-trf")
def legacy_create_trf(payload: TRFCreate, db: Session = Depends(get_db)):
    trf = trf_service.create_trf(db, payload)
    return {"message": "TRF Created Successfully", "trf_number": trf.trf_number}


@app.put("/update-trf/{trf_number}")
def legacy_update_trf(trf_number: str, project_name: str, db: Session = Depends(get_db)):
    trf = trf_service.update_trf(db, trf_number, project_name)
    return {"message": "TRF Updated Successfully"}


@app.delete("/delete-trf/{trf_number}")
def legacy_delete_trf(trf_number: str, db: Session = Depends(get_db)):
    trf_service.delete_trf(db, trf_number)
    return {"message": "TRF Deleted Successfully"}


@app.post("/upload-file/{trf_number}/{folder_name}")
def legacy_upload_file(trf_number: str, folder_name: str, file: UploadFile = File(...)):
    saved = file_service.save_file(trf_number, folder_name, file)
    return {"message": "File Uploaded Successfully", "file_name": saved}


@app.get("/files/{trf_number}/{folder_name}")
def legacy_get_files(trf_number: str, folder_name: str):
    files = file_service.list_files(trf_number, folder_name)
    return {"trf_number": trf_number, "folder_name": folder_name, "files": files}


@app.delete("/delete-file/{trf_number}/{folder_name}/{file_name}")
def legacy_delete_file(trf_number: str, folder_name: str, file_name: str):
    file_service.remove_file(trf_number, folder_name, file_name)
    return {"message": "File Deleted Successfully"}


@app.get("/download-file/{trf_number}/{folder_name}/{file_name}")
def legacy_download_file(trf_number: str, folder_name: str, file_name: str):
    path = file_service.get_file_path(trf_number, folder_name, file_name)
    return FileResponse(path=path, filename=file_name)


@app.post("/login")
def legacy_login(username: str, password: str, db: Session = Depends(get_db)):
    user = user_service.authenticate_user(db, username, password)
    return {"message": "Login Successful", "username": user.username, "role": user.role}


@app.post("/register")
def legacy_register(username: str, password: str, db: Session = Depends(get_db)):
    from backend.schemas.user_schema import UserCreate
    user_service.register_user(db, UserCreate(username=username, password=password))
    return {"message": "User Created Successfully"}
