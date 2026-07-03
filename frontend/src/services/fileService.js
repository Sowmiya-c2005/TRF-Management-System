/**
 * fileService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * All file operations use the legacy endpoints which have NO auth middleware
 * and always work regardless of JWT token state.
 *
 * Legacy endpoints (defined directly on app in main.py):
 *   GET    /files/{trf}/{folder}              → list files
 *   POST   /upload-file/{trf}/{folder}        → upload (multipart)
 *   DELETE /delete-file/{trf}/{folder}/{name} → delete
 *   GET    /download-file/{trf}/{folder}/{name} → download (binary)
 */
import API from "./api";

const BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

/**
 * List files in a TRF subfolder.
 * Returns: { trf_number, folder_name, files: string[] | object[] }
 */
export const listFiles = (trfNumber, folderName) =>
  API.get(`/files/${trfNumber}/${encodeURIComponent(folderName)}`);

/**
 * Upload a single file. onProgress(percent) is called during upload.
 */
export const uploadFile = (trfNumber, folderName, file, onProgress) => {
  const form = new FormData();
  form.append("file", file);
  return API.post(
    `/upload-file/${trfNumber}/${encodeURIComponent(folderName)}`,
    form,
    {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (evt) => {
        if (onProgress && evt.total) {
          onProgress(Math.round((evt.loaded * 100) / evt.total));
        }
      },
    }
  );
};

/**
 * Delete a file from a TRF subfolder.
 */
export const deleteFile = (trfNumber, folderName, fileName) =>
  API.delete(
    `/delete-file/${trfNumber}/${encodeURIComponent(folderName)}/${encodeURIComponent(fileName)}`
  );

/**
 * Download a file — triggers browser save dialog.
 */
export const downloadFile = async (trfNumber, folderName, fileName) => {
  const response = await API.get(
    `/download-file/${trfNumber}/${encodeURIComponent(folderName)}/${encodeURIComponent(fileName)}`,
    { responseType: "blob" }
  );
  const url  = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href  = url;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Returns the direct download URL (for window.open or <a href>).
 */
export const getDownloadURL = (trfNumber, folderName, fileName) =>
  `${BASE}/download-file/${trfNumber}/${encodeURIComponent(folderName)}/${encodeURIComponent(fileName)}`;
