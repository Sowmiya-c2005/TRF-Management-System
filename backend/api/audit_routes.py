from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.schemas.audit_schema import AuditLogResponse
from backend.services import audit_service
from backend.middleware.auth_middleware import get_current_user, RoleChecker
from backend.models.user_model import User

router = APIRouter(prefix="/audits", tags=["Audit Trails"])


@router.get("/", response_model=dict)
def get_audits(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=500, description="Maximum number of records per page"),
    action: Optional[str] = Query(None, description="Filter by action type (e.g. CREATE_TRF)"),
    username: Optional[str] = Query(None, description="Filter by username"),
    search: Optional[str] = Query(None, description="Search in action and details fields"),
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["Admin"]))
):
    page = page if isinstance(page, int) else 1
    limit = limit if isinstance(limit, int) else 10
    action = action if isinstance(action, str) else None
    username = username if isinstance(username, str) else None
    search = search if isinstance(search, str) else None

    # Fetch all matching without limit/offset first to compute total count
    all_logs = audit_service.get_audit_logs(
        db,
        limit=10000,
        offset=0,
        action_filter=action if action and action != "All" else None,
        username_filter=username if username and username != "All" else None,
        search=search
    )

    total = len(all_logs)
    pages = max(1, (total + limit - 1) // limit)
    page_num = min(page, pages)
    start = (page_num - 1) * limit
    page_logs = all_logs[start : start + limit]

    response_data = []
    for log in page_logs:
        response_data.append({
            "id": log.id,
            "user_id": log.user_id,
            "username": log.user.username if log.user else "System",
            "action": log.action,
            "details": log.details,
            "ip_address": log.ip_address,
            "created_at": log.created_at
        })

    return {
        "items": response_data,
        "total": total,
        "page": page_num,
        "pages": pages,
        "limit": limit,
    }
