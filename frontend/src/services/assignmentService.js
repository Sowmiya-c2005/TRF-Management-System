/**
 * Assignment Service
 * ------------------
 * API calls for the Project Assignment module.
 */
import API from "./api";

/** Fetch all managers and engineers for dropdown selection (Admin only) */
export const getAssignableUsers = () =>
  API.get("/assignments/users");

/** Assign a TRF to a manager + engineers with metadata (Admin only) */
export const assignTRF = (payload) =>
  API.post("/assignments/assign", payload);

/** Get all assignments for a specific TRF */
export const getTRFAssignments = (trfId) =>
  API.get(`/assignments/trf/${trfId}`);

/** Get detailed TRF assignment info (manager, engineers, priority, due date) */
export const getTRFAssignmentDetail = (trfId) =>
  API.get(`/assignments/trf-detail/${trfId}`);

/** Get TRFs assigned to the current logged-in user */
export const getMyAssignedTRFs = () =>
  API.get("/assignments/my-trfs");

/** Update TRF status (workflow step) */
export const updateTRFStatus = (trfId, newStatus) =>
  API.put(`/assignments/trf/${trfId}/status`, { status: newStatus });
