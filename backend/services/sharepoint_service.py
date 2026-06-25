import os
import requests
from typing import Optional
from backend.utils.logging_config import get_logger

logger = get_logger("sharepoint_service")

# SharePoint credentials from env (optional)
CLIENT_ID = os.getenv("SHAREPOINT_CLIENT_ID")
CLIENT_SECRET = os.getenv("SHAREPOINT_CLIENT_SECRET")
TENANT_ID = os.getenv("SHAREPOINT_TENANT_ID")
SITE_ID = os.getenv("SHAREPOINT_SITE_ID")


class SharePointService:
    def __init__(self):
        self.is_configured = all([CLIENT_ID, CLIENT_SECRET, TENANT_ID, SITE_ID])
        if self.is_configured:
            logger.info("SharePoint client configured with tenant/client credentials.")
        else:
            logger.info("SharePoint client initialized in Mock Mode (no credentials in .env).")

    def _get_access_token(self) -> str:
        """Fetch Azure OAuth2 access token for MS Graph API."""
        if not self.is_configured:
            return "mock-access-token"
        
        url = f"https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/token"
        data = {
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "scope": "https://graph.microsoft.com/.default",
            "grant_type": "client_credentials"
        }
        response = requests.post(url, data=data, timeout=10)
        response.raise_for_status()
        return response.json().get("access_token")

    def create_folder(self, trf_number: str, folder_name: str) -> bool:
        """Create a folder directory structure in SharePoint."""
        if not self.is_configured:
            logger.info(f"[Mock SharePoint] Created folder: {trf_number}/{folder_name}")
            return True

        try:
            token = self._get_access_token()
            headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
            # Reference Site's drive root
            url = f"https://graph.microsoft.com/v1.0/sites/{SITE_ID}/drive/root/children"
            
            # Simple implementation assumes target folder is created at root or relative path
            payload = {
                "name": f"{trf_number}_{folder_name}",
                "folder": {},
                "@microsoft.graph.conflictBehavior": "replace"
            }
            res = requests.post(url, headers=headers, json=payload, timeout=15)
            res.raise_for_status()
            logger.info(f"SharePoint folder created for {trf_number}/{folder_name}")
            return True
        except Exception as e:
            logger.error(f"SharePoint create_folder failed: {str(e)}")
            return False

    def upload_file(self, trf_number: str, folder_name: str, filename: str, file_content: bytes) -> Optional[str]:
        """Upload a file to SharePoint, returning SharePoint unique item ID."""
        if not self.is_configured:
            mock_id = f"sp-{trf_number}-{folder_name}-{filename}".replace(" ", "_")
            logger.info(f"[Mock SharePoint] Uploaded file '{filename}' to '{trf_number}/{folder_name}'. ID: {mock_id}")
            return mock_id

        try:
            token = self._get_access_token()
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/octet-stream"
            }
            # Put file content
            url = f"https://graph.microsoft.com/v1.0/sites/{SITE_ID}/drive/root:/{trf_number}_{folder_name}/{filename}:/content"
            res = requests.put(url, headers=headers, data=file_content, timeout=30)
            res.raise_for_status()
            sp_id = res.json().get("id")
            logger.info(f"SharePoint upload successful for '{filename}'. SharePoint ID: {sp_id}")
            return sp_id
        except Exception as e:
            logger.error(f"SharePoint upload failed: {str(e)}")
            return None

    def delete_file(self, sharepoint_id: str) -> bool:
        """Delete a file from SharePoint by its unique item ID."""
        if not self.is_configured:
            logger.info(f"[Mock SharePoint] Deleted file with ID: {sharepoint_id}")
            return True

        try:
            token = self._get_access_token()
            headers = {"Authorization": f"Bearer {token}"}
            url = f"https://graph.microsoft.com/v1.0/sites/{SITE_ID}/drive/items/{sharepoint_id}"
            res = requests.delete(url, headers=headers, timeout=15)
            res.raise_for_status()
            logger.info(f"SharePoint file deleted for ID: {sharepoint_id}")
            return True
        except Exception as e:
            logger.error(f"SharePoint delete_file failed: {str(e)}")
            return False
