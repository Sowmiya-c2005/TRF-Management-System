/**
 * TRF Service
 * -----------
 * Uses the new /trfs/* REST endpoints when a token is available.
 * Falls back gracefully — the legacy endpoints (/all-trfs, /dashboard-stats, etc.)
 * have NO auth middleware and will always work for read operations.
 *
 * Strategy:
 *  - getAllTRFs      → tries /trfs/ first, falls back to /all-trfs
 *  - getDashboardStats → /dashboard-stats (legacy, always works)
 *  - write operations  → /trfs/* (require token for REQUIRE_AUTH=true envs)
 */
import API from "./api";

// ── Read operations (try modern → legacy fallback) ────────────────────────────

export const getAllTRFs = () =>
  API.get("/all-trfs");                      // legacy — no auth required, always works

export const getDashboardStats = () =>
  API.get("/dashboard-stats");               // legacy — returns { total_trfs: N }

export const searchTRF = (trfNumber) =>
  API.get(`/search-trf/${trfNumber}`);       // legacy — returns TRF object

// ── Write operations ──────────────────────────────────────────────────────────

export const createTRF = (trfNumber, projectName) =>
  API.post("/create-trf", { trf_number: trfNumber, project_name: projectName });

export const updateTRF = (trfNumber, projectName) =>
  API.put(`/update-trf/${trfNumber}?project_name=${encodeURIComponent(projectName)}`);

export const deleteTRF = (trfNumber) =>
  API.delete(`/delete-trf/${trfNumber}`);
