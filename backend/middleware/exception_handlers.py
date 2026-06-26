"""
Exception handlers — registered globally on the FastAPI app.

Logging levels:
  4xx client errors → WARNING  (expected, not a server bug)
  5xx server errors → ERROR    (unexpected, needs attention)
"""
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy.exc import SQLAlchemyError
from backend.utils.logging_config import get_logger

logger = get_logger("exception_handlers")

# Paths that produce expected 4xx responses and should not pollute logs
_SILENT_PATHS = {"/notifications/", "/audits/"}


def _should_log_as_warning(path: str, status_code: int) -> bool:
    """Return True when the error is an expected client-side condition."""
    return status_code < 500


def register_exception_handlers(app: FastAPI) -> None:

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        path = request.url.path
        if _should_log_as_warning(path, exc.status_code):
            # Only log 401/403/404 at DEBUG level for known polling paths
            if path in _SILENT_PATHS or exc.status_code in (401, 403):
                logger.debug(f"[{exc.status_code}] {path} — {exc.detail}")
            else:
                logger.warning(f"[{exc.status_code}] {path} — {exc.detail}")
        else:
            logger.error(f"[{exc.status_code}] {path} — {exc.detail}")
        return JSONResponse(
            status_code=exc.status_code,
            content={"message": exc.detail},
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        logger.warning(f"[422] Validation error on {request.url.path}: {exc.errors()}")
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"message": "Validation failed", "errors": exc.errors()},
        )

    @app.exception_handler(SQLAlchemyError)
    async def database_exception_handler(request: Request, exc: SQLAlchemyError):
        err_msg = str(exc)
        if "unique constraint" in err_msg.lower() or "duplicate key" in err_msg.lower():
            logger.warning(f"[409] Unique constraint on {request.url.path}")
            return JSONResponse(
                status_code=status.HTTP_409_CONFLICT,
                content={"message": "Record already exists."},
            )
        logger.error(f"[500] Database error on {request.url.path}: {err_msg}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": "A database error occurred. Please contact the administrator."},
        )

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error(
            f"[500] Unhandled error on {request.url.path}: {str(exc)}",
            exc_info=True
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"message": "An unexpected server error occurred."},
        )
