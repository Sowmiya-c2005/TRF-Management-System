"""
TRF Management System — FastAPI entry point.
Run with:  uvicorn backend.main:app --reload
"""
from fastapi import FastAPI, Depends, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import os

load_dotenv()

# Setup logging before any imports that might use loggers
from backend.utils.logging_config import setup_logging, get_logger
setup_logging()
logger = get_logger("main")

from backend.api import trf_routes, file_routes, user_routes, audit_routes, notification_routes, qr_routes, storage_routes
from backend.database.database import get_db
from backend.middleware.exception_handlers import register_exception_handlers
from backend.schemas.trf_schema import TRFCreate
from backend.services import trf_service, file_service, user_service

app = FastAPI(
    title="TRF Management System",
    description="Document & Record Tracking API (SOLID Enterprise Edition)",
    version="2.1.0",
)

# ── Exception Handlers ────────────────────────────────────────────────────────
register_exception_handlers(app)

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
app.include_router(audit_routes.router)
app.include_router(notification_routes.router)
app.include_router(qr_routes.router)
app.include_router(storage_routes.router)

logger.info("FastAPI application routers successfully loaded.")


@app.get("/")
def health():
    return {"message": "TRF Management System Running Successfully", "version": "2.1.0"}


# ── Legacy compatibility shims ────────────────────────────────────────────────
# These keep the existing frontend working while keeping DB database normalization
# and service layer updates intact.

@app.get("/all-trfs")
def legacy_all_trfs(db: Session = Depends(get_db)):
    return trf_service.get_all_trfs(db)


@app.get("/dashboard-stats")
def legacy_dashboard_stats(db: Session = Depends(get_db)):
    stats = trf_service.get_dashboard_stats(db)
    # Keep backward compat — front-end only reads total_trfs
    return stats


@app.get("/search-trf/{trf_number}")
def legacy_search_trf(trf_number: str, db: Session = Depends(get_db)):
    return trf_service.get_trf_by_number(db, trf_number)


@app.post("/create-trf")
def legacy_create_trf(payload: TRFCreate, db: Session = Depends(get_db)):
    trf = trf_service.create_trf(db, payload)
    return {
        "message":            "TRF Created Successfully",
        "trf_number":         trf.trf_number,
        "sharepoint_status":  trf.sharepoint_status,
        "sharepoint_message": trf.sharepoint_message,
    }


@app.put("/update-trf/{trf_number}")
def legacy_update_trf(trf_number: str, project_name: str, db: Session = Depends(get_db)):
    trf_service.update_trf(db, trf_number, project_name)
    return {"message": "TRF Updated Successfully"}


@app.delete("/delete-trf/{trf_number}")
def legacy_delete_trf(trf_number: str, db: Session = Depends(get_db)):
    trf_service.delete_trf(db, trf_number)
    return {"message": "TRF Deleted Successfully"}


@app.post("/upload-file/{trf_number}/{folder_name}")
def legacy_upload_file(trf_number: str, folder_name: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    saved = file_service.save_file(db, trf_number, folder_name, file)
    return {"message": "File Uploaded Successfully", "file_name": saved}


@app.get("/files/{trf_number}/{folder_name}")
def legacy_get_files(trf_number: str, folder_name: str, db: Session = Depends(get_db)):
    files = file_service.list_files(db, trf_number, folder_name)
    return {"trf_number": trf_number, "folder_name": folder_name, "files": files}


@app.delete("/delete-file/{trf_number}/{folder_name}/{file_name}")
def legacy_delete_file(trf_number: str, folder_name: str, file_name: str, db: Session = Depends(get_db)):
    file_service.remove_file(db, trf_number, folder_name, file_name)
    return {"message": "File Deleted Successfully"}


@app.get("/download-file/{trf_number}/{folder_name}/{file_name}")
def legacy_download_file(trf_number: str, folder_name: str, file_name: str, db: Session = Depends(get_db)):
    path = file_service.get_file_path(db, trf_number, folder_name, file_name)
    return FileResponse(path=path, filename=file_name)


@app.post("/login")
def legacy_login(username: str, password: str, db: Session = Depends(get_db)):
    user = user_service.authenticate_user(db, username, password)
    from backend.services import audit_service
    audit_service.log_action(db, user_id=user.id, action="LOGIN",
                             details=f"User '{user.username}' logged in via legacy endpoint.")
    return {"message": "Login Successful", "username": user.username, "role": user.role}


@app.post("/register")
def legacy_register(username: str, password: str, db: Session = Depends(get_db)):
    from backend.schemas.user_schema import UserCreate
    user_service.register_user(db, UserCreate(username=username, password=password))
    return {"message": "User Created Successfully"}
