"""
SharePoint Graph API Service
─────────────────────────────────────────────────────────────────────────────
Handles all Microsoft SharePoint operations via the MS Graph API.

When SharePoint credentials are NOT configured (default dev mode), every
method falls back to local-only operation and logs at DEBUG level so the
console stays clean.

Folder structure on SharePoint mirrors local storage:
  /<site-drive-root>/<TRF_NUMBER>/Documents/
  /<site-drive-root>/<TRF_NUMBER>/Reports/
  /<site-drive-root>/<TRF_NUMBER>/Drawings/
  /<site-drive-root>/<TRF_NUMBER>/Approvals/
  /<site-drive-root>/<TRF_NUMBER>/Final Submission/
"""
import os
import time
import threading
from typing import Optional

import requests

from backend.utils.logging_config import get_logger

logger = get_logger("sharepoint_service")

# ── Env vars ──────────────────────────────────────────────────────────────────
CLIENT_ID     = os.getenv("SHAREPOINT_CLIENT_ID")
CLIENT_SECRET = os.getenv("SHAREPOINT_CLIENT_SECRET")
TENANT_ID     = os.getenv("SHAREPOINT_TENANT_ID")
SITE_ID       = os.getenv("SHAREPOINT_SITE_ID")           # e.g. "contoso.sharepoint.com,<guid>,<guid>"
DRIVE_ID      = os.getenv("SHAREPOINT_DRIVE_ID", "")      # optional: specific document library drive ID
SP_ROOT_FOLDER= os.getenv("SHAREPOINT_ROOT_FOLDER", "TRF Portal")  # top-level folder inside the drive

GRAPH_BASE    = "https://graph.microsoft.com/v1.0"
TOKEN_URL     = f"https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/token"
REQUEST_TIMEOUT = int(os.getenv("SHAREPOINT_TIMEOUT", "20"))


class SharePointService:
    """
    Production-ready SharePoint integration with:
    - OAuth2 client_credentials token fetch + in-memory cache
    - Proper nested folder creation (TRF_ID → subfolder)
    - File upload / delete via Graph API
    - Graceful fallback to local-only when credentials absent
    - Thread-safe token refresh
    """

    def __init__(self):
        self.is_configured = all([CLIENT_ID, CLIENT_SECRET, TENANT_ID, SITE_ID])
        self._token: Optional[str] = None
        self._token_expiry: float = 0.0
        self._lock = threading.Lock()

        if self.is_configured:
            logger.info("SharePoint: Graph API configured — live integration enabled.")
        else:
            logger.info(
                "SharePoint: credentials not set — running in local-only mode. "
                "Set SHAREPOINT_CLIENT_ID / CLIENT_SECRET / TENANT_ID / SITE_ID in .env to enable."
            )

    # ── Token management ───────────────────────────────────────────────────────

    def _get_access_token(self) -> str:
        """Return a valid access token, refreshing if expired (thread-safe)."""
        with self._lock:
            if self._token and time.time() < self._token_expiry - 60:
                return self._token

            resp = requests.post(
                TOKEN_URL,
                data={
                    "client_id":     CLIENT_ID,
                    "client_secret": CLIENT_SECRET,
                    "scope":         "https://graph.microsoft.com/.default",
                    "grant_type":    "client_credentials",
                },
                timeout=15,
            )
            resp.raise_for_status()
            data = resp.json()
            self._token = data["access_token"]
            self._token_expiry = time.time() + data.get("expires_in", 3600)
            logger.debug("SharePoint: access token refreshed.")
            return self._token

    def _headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self._get_access_token()}",
            "Content-Type":  "application/json",
        }

    # ── Drive helpers ─────────────────────────────────────────────────────────

    def _drive_base(self) -> str:
        """Return the Graph API base URL for the target drive."""
        if DRIVE_ID:
            return f"{GRAPH_BASE}/drives/{DRIVE_ID}"
        return f"{GRAPH_BASE}/sites/{SITE_ID}/drive"

    def _ensure_folder_path(self, path: str) -> Optional[str]:
        """
        Create all folders in *path* (e.g. "TRF Portal/TRF-2026-001/Documents")
        using Graph API's path-based endpoint with conflictBehavior=fail (returns
        existing item on conflict).

        Returns the folder item ID or None on failure.
        """
        url = f"{self._drive_base()}/root:/{path}"
        # Check existence first
        chk = requests.get(url, headers=self._headers(), timeout=REQUEST_TIMEOUT)
        if chk.status_code == 200:
            return chk.json().get("id")

        # Create via parent + children endpoint — walk path segments
        segments = path.strip("/").split("/")
        current_id = "root"
        for seg in segments:
            create_url = f"{self._drive_base()}/items/{current_id}/children"
            body = {"name": seg, "folder": {}, "@microsoft.graph.conflictBehavior": "replace"}
            r = requests.post(create_url, headers=self._headers(), json=body, timeout=REQUEST_TIMEOUT)
            if r.status_code not in (200, 201):
                logger.error(f"SharePoint: failed to create folder segment '{seg}': {r.text}")
                return None
            current_id = r.json().get("id")
        return current_id

    # ── Public API ─────────────────────────────────────────────────────────────

    def create_folder(self, trf_number: str, folder_name: str) -> dict:
        """
        Create /<SP_ROOT_FOLDER>/<trf_number>/<folder_name> on SharePoint.

        Returns:
            {
              "success": bool,
              "sharepoint_folder_id": str | None,
              "mode": "live" | "local",
              "message": str
            }
        """
        path = f"{SP_ROOT_FOLDER}/{trf_number}/{folder_name}"

        if not self.is_configured:
            logger.debug(f"SharePoint[local]: folder path '{path}' noted.")
            return {
                "success": True,
                "sharepoint_folder_id": f"local-{trf_number}-{folder_name}",
                "mode": "local",
                "message": f"Local mode: folder '{path}' will be on disk only.",
            }

        try:
            folder_id = self._ensure_folder_path(path)
            if folder_id:
                logger.info(f"SharePoint: folder '{path}' ready (id={folder_id}).")
                return {
                    "success": True,
                    "sharepoint_folder_id": folder_id,
                    "mode": "live",
                    "message": f"SharePoint folder '{path}' created/verified.",
                }
            return {
                "success": False,
                "sharepoint_folder_id": None,
                "mode": "live",
                "message": f"SharePoint folder creation returned no ID for '{path}'.",
            }
        except Exception as exc:
            logger.error(f"SharePoint: create_folder failed for '{path}': {exc}")
            return {
                "success": False,
                "sharepoint_folder_id": None,
                "mode": "live",
                "message": str(exc),
            }

    def upload_file(
        self,
        trf_number: str,
        folder_name: str,
        filename: str,
        file_content: bytes,
    ) -> Optional[str]:
        """
        Upload *file_content* to /<SP_ROOT_FOLDER>/<trf_number>/<folder_name>/<filename>.

        Returns the SharePoint item ID on success, or a local mock ID in local mode.
        Returns None if a live upload fails (caller continues with local-only storage).
        """
        if not self.is_configured:
            mock_id = f"local-{trf_number}-{folder_name}-{filename}".replace(" ", "_")
            logger.debug(f"SharePoint[local]: upload noted '{filename}' → '{mock_id}'")
            return mock_id

        path = f"{SP_ROOT_FOLDER}/{trf_number}/{folder_name}/{filename}"
        try:
            url = f"{self._drive_base()}/root:/{path}:/content"
            headers = {
                "Authorization": f"Bearer {self._get_access_token()}",
                "Content-Type":  "application/octet-stream",
            }
            resp = requests.put(url, headers=headers, data=file_content, timeout=REQUEST_TIMEOUT)
            resp.raise_for_status()
            item_id = resp.json().get("id")
            logger.info(f"SharePoint: uploaded '{filename}' to '{path}' (id={item_id}).")
            return item_id
        except Exception as exc:
            logger.error(f"SharePoint: upload_file failed for '{filename}': {exc}")
            return None

    def delete_file(self, sharepoint_id: str) -> bool:
        """
        Delete a file from SharePoint by its item ID.
        Returns True on success (or in local mode), False on live failure.
        """
        if not self.is_configured:
            logger.debug(f"SharePoint[local]: delete noted for id='{sharepoint_id}'")
            return True

        if not sharepoint_id or sharepoint_id.startswith("local-"):
            return True  # nothing to delete on SharePoint

        try:
            url = f"{self._drive_base()}/items/{sharepoint_id}"
            resp = requests.delete(url, headers=self._headers(), timeout=REQUEST_TIMEOUT)
            if resp.status_code == 404:
                logger.warning(f"SharePoint: item '{sharepoint_id}' already gone (404).")
                return True
            resp.raise_for_status()
            logger.info(f"SharePoint: deleted item id='{sharepoint_id}'.")
            return True
        except Exception as exc:
            logger.error(f"SharePoint: delete_file failed for id='{sharepoint_id}': {exc}")
            return False

    def list_remote_files(self, trf_number: str, folder_name: str) -> list[dict]:
        """
        List files in /<SP_ROOT_FOLDER>/<trf_number>/<folder_name> on SharePoint.

        Returns list of {"name": str, "id": str, "size": int} dicts.
        Returns empty list in local mode or on failure.
        """
        if not self.is_configured:
            return []

        path = f"{SP_ROOT_FOLDER}/{trf_number}/{folder_name}"
        try:
            url = f"{self._drive_base()}/root:/{path}:/children"
            resp = requests.get(url, headers=self._headers(), timeout=REQUEST_TIMEOUT)
            if resp.status_code == 404:
                return []
            resp.raise_for_status()
            items = resp.json().get("value", [])
            return [
                {"name": i["name"], "id": i["id"], "size": i.get("size", 0)}
                for i in items
                if "file" in i  # skip sub-folders
            ]
        except Exception as exc:
            logger.error(f"SharePoint: list_remote_files failed for '{path}': {exc}")
            return []

    def get_status(self) -> dict:
        """Return integration status — useful for health-check endpoint."""
        if not self.is_configured:
            return {"configured": False, "mode": "local", "message": "SharePoint credentials not set."}
        try:
            self._get_access_token()
            return {"configured": True, "mode": "live", "message": "SharePoint Graph API reachable."}
        except Exception as exc:
            return {"configured": True, "mode": "error", "message": str(exc)}
