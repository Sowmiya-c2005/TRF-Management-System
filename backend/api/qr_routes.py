"""
QR Code API
───────────────────────────────────────────────────────────────────────────
GET /qr/{trf_number}           → returns PNG QR image (inline)
GET /qr/{trf_number}/download  → returns PNG as file download

The QR code encodes a URL that points to the TRF detail page:
  {APP_BASE_URL}/all?trf={trf_number}

If APP_BASE_URL is not set it falls back to http://localhost:5173.
"""
import io
import os

import qrcode
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse, Response
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.services.trf_service import get_trf_by_number
from backend.middleware.auth_middleware import get_current_user, check_trf_access
from backend.models.user_model import User

router = APIRouter(prefix="/qr", tags=["QR Codes"])

APP_BASE_URL = os.getenv("APP_BASE_URL", "http://localhost:5173")


def _generate_qr_bytes(trf_number: str) -> bytes:
    """Return PNG bytes for a QR code pointing to the TRF detail page."""
    url = f"{APP_BASE_URL}/all?trf={trf_number}"

    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="#0f172a", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf.read()


@router.get("/{trf_number}", summary="Inline QR code PNG for a TRF")
def get_qr_inline(
    trf_number: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the QR code as an inline PNG image (for <img src=> embedding)."""
    # Verify access first
    check_trf_access(db, current_user, trf_number)
    # Verify TRF exists — raises 404 if not
    get_trf_by_number(db, trf_number)

    png = _generate_qr_bytes(trf_number)
    return Response(content=png, media_type="image/png")


@router.get("/{trf_number}/download", summary="Download QR code PNG for a TRF")
def get_qr_download(
    trf_number: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the QR code as a downloadable PNG file."""
    # Verify access first
    check_trf_access(db, current_user, trf_number)
    get_trf_by_number(db, trf_number)

    png = _generate_qr_bytes(trf_number)
    return Response(
        content=png,
        media_type="image/png",
        headers={"Content-Disposition": f'attachment; filename="QR_{trf_number}.png"'},
    )

