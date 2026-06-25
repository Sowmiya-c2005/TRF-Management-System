import API from "./api";

const BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export const listFiles = (trfNumber, folderName) =>
  API.get(`/files/${trfNumber}/${folderName}`);

export const uploadFile = (trfNumber, folderName, file, onProgress) => {
  const form = new FormData();
  form.append("file", file);
  return API.post(`/files/${trfNumber}/${folderName}`, form, {
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    }
  });
};

export const deleteFile = (trfNumber, folderName, fileName) =>
  API.delete(`/files/${trfNumber}/${folderName}/${fileName}`);

export const downloadFile = async (trfNumber, folderName, fileName) => {
  const response = await API.get(`/files/${trfNumber}/${folderName}/${fileName}/download`, {
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Returns the raw download URL so the caller can use window.open() directly
export const getDownloadURL = (trfNumber, folderName, fileName) =>
  `${BASE}/files/${trfNumber}/${folderName}/${fileName}/download`;
