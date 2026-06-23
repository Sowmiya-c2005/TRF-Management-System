import API from "./api";

const BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export const listFiles = (trfNumber, folderName) =>
  API.get(`/files/${trfNumber}/${folderName}`);

export const uploadFile = (trfNumber, folderName, file) => {
  const form = new FormData();
  form.append("file", file);
  return API.post(`/upload-file/${trfNumber}/${folderName}`, form);
};

export const deleteFile = (trfNumber, folderName, fileName) =>
  API.delete(`/delete-file/${trfNumber}/${folderName}/${fileName}`);

export const getDownloadURL = (trfNumber, folderName, fileName) =>
  `${BASE}/download-file/${trfNumber}/${folderName}/${fileName}`;
