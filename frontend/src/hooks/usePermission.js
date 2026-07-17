/**
 * usePermission — role-based UI permission hook.
 *
 * Usage:
 *   const { can, role, isAdmin, isEngineer, isViewer } = usePermission();
 *   if (can("upload")) { ... }
 *
 * Permissions map:
 *   Admin      → everything
 *   Engineer   → create/update TRF, upload/delete files, view all
 *   Manager    → view all, download, no write
 *   Viewer     → view only, download only
 */
import { useApp } from "../context/AppContext";

const PERMISSIONS = {
  Admin: [
    "create_trf", "update_trf", "delete_trf",
    "upload_file", "delete_file", "download_file",
    "view_analytics", "view_reports", "view_audit",
    "manage_users", "view_all",
  ],
  Engineer: [
    "create_trf", "update_trf",
    "upload_file", "delete_file", "download_file",
    "view_reports", "view_all",
  ],
  Manager: [
    "upload_file", "delete_file", "download_file",
    "view_analytics", "view_reports", "view_all",
  ],
  Viewer: [
    "download_file", "view_all",
  ],
};

export function usePermission() {
  const { user } = useApp();
  const role = user?.role || "Viewer";

  const allowed = PERMISSIONS[role] || PERMISSIONS.Viewer;

  const can = (action) => allowed.includes(action);

  return {
    role,
    can,
    isAdmin:    role === "Admin",
    isEngineer: role === "Engineer",
    isManager:  role === "Manager",
    isViewer:   role === "Viewer",
    // Shorthand checks
    canWrite:   can("create_trf"),
    canUpload:  can("upload_file"),
    canDelete:  can("delete_file"),
    canManageUsers: can("manage_users"),
    canViewAudit:   can("view_audit"),
  };
}
