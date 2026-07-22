"""
TRF Management System — FastAPI entry point.
Production mode: serves React SPA from frontend/dist via StaticFiles.
Run with:  uvicorn backend.main:app --reload
           python app.py
"""
# Load .env FIRST — before any other imports so all os.getenv() calls in
# middleware, services, and models pick up the correct values.
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Depends, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy.orm import Session
import os

# Setup logging before any imports that might use loggers
from backend.utils.logging_config import setup_logging, get_logger
setup_logging()
logger = get_logger("main")

from backend.api import trf_routes, file_routes, user_routes, audit_routes, notification_routes, qr_routes, storage_routes, assignment_routes, activity_routes, comment_routes, dashboard_routes, search_routes
from backend.database.database import get_db
from backend.middleware.exception_handlers import register_exception_handlers
from backend.schemas.trf_schema import TRFCreate, TRFResponse
from backend.services import trf_service, file_service, user_service

from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("FastAPI starting up... Initializing database and default users...")
    try:
        from backend.database.init_db import init_db
        init_db()
        logger.info("Database initialization completed successfully.")
    except Exception as exc:
        logger.critical(f"FATAL: Database initialization failed on startup: {exc}", exc_info=True)
        # Raise exception to prevent application from running with uninitialized/corrupted DB
        raise RuntimeError(f"Application startup aborted due to DB initialization failure: {exc}") from exc
    yield
    logger.info("FastAPI application shutting down...")


app = FastAPI(
    title="TRF Management System",
    description="Document & Record Tracking API (SOLID Enterprise Edition)",
    version="2.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# ── Exception Handlers ────────────────────────────────────────────────────────
register_exception_handlers(app)

# ── CORS — works for both local dev and Render production ────────────────────
_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
_raw_origins = [o.strip() for o in _raw_origins if o.strip()]
_wildcard    = "*" in _raw_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if _wildcard else _raw_origins,
    allow_credentials=not _wildcard,   # credentials not allowed with wildcard
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(trf_routes.router, prefix="/api")
app.include_router(file_routes.router, prefix="/api")
app.include_router(user_routes.router, prefix="/api")
app.include_router(audit_routes.router, prefix="/api")
app.include_router(notification_routes.router, prefix="/api")
app.include_router(qr_routes.router, prefix="/api")
app.include_router(storage_routes.router, prefix="/api")
app.include_router(assignment_routes.router, prefix="/api")
app.include_router(activity_routes.router, prefix="/api")
app.include_router(comment_routes.router, prefix="/api")
app.include_router(dashboard_routes.router, prefix="/api")
app.include_router(search_routes.router, prefix="/api")

logger.info("FastAPI application routers successfully loaded.")


@app.get("/api/health")
def health():
    return {"message": "TRF Management System Running Successfully", "version": "2.1.0"}


# ── Legacy compatibility shims ────────────────────────────────────────────────
# These keep the existing frontend working while keeping DB database normalization
# and service layer updates intact.
from backend.middleware.auth_middleware import get_current_user, check_trf_access, RoleChecker
from backend.models.user_model import User
from fastapi import HTTPException

@app.get("/api/all-trfs", response_model=list[TRFResponse])
def legacy_all_trfs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from backend.services.assignment_service import get_user_assigned_trfs
    return get_user_assigned_trfs(db, current_user.id, current_user.role)


@app.get("/api/dashboard-stats")
def legacy_dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Return role-aware dashboard stats
    from backend.services import dashboard_service
    if current_user.role == "Admin":
        stats = dashboard_service.get_admin_dashboard_stats(db)
    elif current_user.role == "Manager":
        stats = dashboard_service.get_manager_dashboard_stats(db, current_user.id)
    elif current_user.role == "Engineer":
        stats = dashboard_service.get_engineer_dashboard_stats(db, current_user.id)
    else:
        stats = {}
    stats["unread_notifications"] = dashboard_service.get_unread_notification_count(db, current_user.id)
    return stats


@app.get("/api/search-trf/{trf_number}", response_model=TRFResponse)
def legacy_search_trf(trf_number: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    check_trf_access(db, current_user, trf_number)
    return trf_service.get_trf_by_number(db, trf_number)


@app.post("/api/create-trf")
def legacy_create_trf(payload: TRFCreate, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["Admin", "Engineer"]))):
    trf = trf_service.create_trf(db, payload, current_user=current_user)
    return {
        "message":            "TRF Created Successfully",
        "trf_number":         trf.trf_number,
        "sharepoint_status":  trf.sharepoint_status,
        "sharepoint_message": trf.sharepoint_message,
    }


@app.put("/api/update-trf/{trf_number}")
def legacy_update_trf(trf_number: str, project_name: str, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["Admin", "Engineer"]))):
    check_trf_access(db, current_user, trf_number)
    trf_service.update_trf(db, trf_number, project_name, current_user=current_user)
    return {"message": "TRF Updated Successfully"}


@app.delete("/api/delete-trf/{trf_number}")
def legacy_delete_trf(trf_number: str, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["Admin"]))):
    trf_service.delete_trf(db, trf_number, current_user=current_user)
    return {"message": "TRF Deleted Successfully"}


@app.post("/api/upload-file/{trf_number}/{folder_name}")
def legacy_upload_file(trf_number: str, folder_name: str, file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["Admin", "Engineer", "Manager"]))):
    check_trf_access(db, current_user, trf_number)
    saved = file_service.save_file(db, trf_number, folder_name, file, current_user=current_user)
    return {"message": "File Uploaded Successfully", "file_name": saved}


@app.get("/api/files/{trf_number}/{folder_name}")
def legacy_get_files(trf_number: str, folder_name: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    check_trf_access(db, current_user, trf_number)
    files = file_service.list_files(db, trf_number, folder_name)
    return {"trf_number": trf_number, "folder_name": folder_name, "files": files}


@app.delete("/api/delete-file/{trf_number}/{folder_name}/{file_name}")
def legacy_delete_file(trf_number: str, folder_name: str, file_name: str, db: Session = Depends(get_db), current_user: User = Depends(RoleChecker(["Admin", "Engineer", "Manager"]))):
    check_trf_access(db, current_user, trf_number)
    file_service.remove_file(db, trf_number, folder_name, file_name, current_user=current_user)
    return {"message": "File Deleted Successfully"}


@app.get("/api/download-file/{trf_number}/{folder_name}/{file_name}")
def legacy_download_file(trf_number: str, folder_name: str, file_name: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    check_trf_access(db, current_user, trf_number)
    path = file_service.get_file_path(db, trf_number, folder_name, file_name)
    return FileResponse(path=path, filename=file_name)


@app.post("/api/login")
def legacy_login(username: str, password: str, db: Session = Depends(get_db)):
    user = user_service.authenticate_user(db, username, password)
    from backend.services import audit_service
    audit_service.log_action(db, user_id=user.id, action="LOGIN",
                             details=f"User '{user.username}' logged in via legacy endpoint.")
    return {"message": "Login Successful", "username": user.username, "role": user.role}


@app.post("/api/register")
def legacy_register(username: str, password: str, db: Session = Depends(get_db)):
    from backend.schemas.user_schema import UserCreate
    user_service.register_user(db, UserCreate(username=username, password=password))
    return {"message": "User Created Successfully"}


# ── Serve React SPA (production) ──────────────────────────────────────────────
# Mount the built frontend AFTER all API routes so API routes take priority.
# Supports React Router SPA fallback: any unknown path returns index.html.
_DIST_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")

if os.path.isdir(_DIST_DIR):
    # Serve static assets (JS, CSS, images, etc.)
    app.mount("/assets", StaticFiles(directory=os.path.join(_DIST_DIR, "assets")), name="assets")

    @app.get("/", include_in_schema=False)
    async def serve_spa_root():
        """Serve index.html at the root URL /"""
        return FileResponse(os.path.join(_DIST_DIR, "index.html"))

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        """
        SPA fallback — return index.html for any unknown route so
        React Router handles client-side navigation correctly.
        Known static files are served directly; everything else → index.html.
        """
        # Do not intercept backend paths (api, docs, redoc, openapi.json)
        # return 404 for missing routes under these prefixes
        path_segments = full_path.split("/")
        if path_segments and path_segments[0] in ("api", "docs", "redoc", "openapi.json"):
            raise StarletteHTTPException(status_code=404, detail="Not Found")

        # Check if it's a real file in dist
        target = os.path.join(_DIST_DIR, full_path)
        if os.path.isfile(target):
            return FileResponse(target)
        # Fallback to index.html for all SPA routes
        return FileResponse(os.path.join(_DIST_DIR, "index.html"))

    logger.info(f"React SPA served from: {_DIST_DIR}")
else:
    logger.info("frontend/dist not found — running in API-only mode (run `npm run build` to enable SPA serving)")
