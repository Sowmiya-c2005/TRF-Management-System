import API from "./api";

export const getAllTRFs = () => API.get("/all-trfs");

export const searchTRF = (trfNumber) => API.get(`/search-trf/${trfNumber}`);

export const createTRF = (trfNumber, projectName) =>
  API.post("/create-trf", { trf_number: trfNumber, project_name: projectName });

export const updateTRF = (trfNumber, projectName) =>
  API.put(`/update-trf/${trfNumber}?project_name=${encodeURIComponent(projectName)}`);

export const deleteTRF = (trfNumber) => API.delete(`/delete-trf/${trfNumber}`);

export const getDashboardStats = () => API.get("/dashboard-stats");
