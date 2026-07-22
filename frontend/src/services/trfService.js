/**
 * TRF Service
 * -----------
 * Uses the new /trfs/* REST endpoints when a token is available.
 * Falls back gracefully — the legacy endpoints (/all-trfs, /dashboard-stats, etc.)
 * have NO auth middleware and will always work for read operations.
 *
 * Strategy:
 *  - getAllTRFs      → /trfs/ with pagination/filter/sort support
 *  - getDashboardStats → /dashboard-stats (legacy, always works)
 *  - write operations  → /trfs/* (require token for REQUIRE_AUTH=true envs)
 */
import API from "./api";

// ── Read operations ───────────────────────────────────────────────────────────

/**
 * Fetch paginated TRF list from /trfs/
 * Returns: { items: TRFResponse[], total, page, pages, per_page }
 *
 * @param {object} params
 * @param {string}  [params.search]      - Search by TRF number or project name
 * @param {string}  [params.status]      - Filter by status
 * @param {string}  [params.priority]    - Filter by priority
 * @param {string}  [params.sharepoint_status] - Filter by SharePoint status
 * @param {string}  [params.sort_by]     - trf_number|project_name|status|priority|created_at|due_date
 * @param {string}  [params.sort_order]  - asc|desc
 * @param {number}  [params.page]        - 1-based page number
 * @param {number}  [params.per_page]    - Records per page (1-100)
 */
export const getAllTRFs = (params = {}) => {
  // Strip undefined/null/empty values to keep query string clean
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
  );
  return API.get("/trfs/", { params: clean });
};

/**
 * Legacy all-trfs endpoint — no auth required, always works.
 * Use when the modern endpoint is unavailable or for quick reads.
 */
export const getAllTRFsLegacy = () =>
  API.get("/all-trfs");

export const getDashboardStats = () =>
  API.get("/dashboard-stats");               // legacy — returns { total_trfs: N }

export const searchTRF = (trfNumber) =>
  API.get(`/search-trf/${trfNumber}`);       // legacy — returns TRF object

// ── Write operations ──────────────────────────────────────────────────────────

/**
 * Create TRF — uses POST /trfs/ (modern endpoint).
 * The backend reads current_user from the JWT token and sets created_by_id correctly.
 */
export const createTRF = (trfNumber, projectName, extra = {}) =>
  API.post("/trfs/", { trf_number: trfNumber, project_name: projectName, ...extra });

export const updateTRF = (trfNumber, projectName) =>
  API.put(`/trfs/${trfNumber}`, { project_name: projectName });

export const deleteTRF = (trfNumber) =>
  API.delete(`/trfs/${trfNumber}`);
