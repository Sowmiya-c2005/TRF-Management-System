import API from "./api";

export const getAllTRFs = () => API.get("/trfs/");

export const searchTRF = (trfNumber) => API.get(`/trfs/${trfNumber}`);

export const createTRF = (trfNumber, projectName) =>
  API.post("/trfs/", { trf_number: trfNumber, project_name: projectName });

export const updateTRF = (trfNumber, projectName) =>
  API.put(`/trfs/${trfNumber}`, { project_name: projectName });

export const deleteTRF = (trfNumber) => API.delete(`/trfs/${trfNumber}`);

export const getDashboardStats = () => API.get("/trfs/stats");

