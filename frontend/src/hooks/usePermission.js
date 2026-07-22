/**
 * usePermission — role-based UI permission hook.
 *
 * Usage:
 *   const { can, role, isAdmin, isEngineer, isManager } = usePermission();
 *   if (can("upload")) { ... }
 *
 * Permissions map:
 *   Admin    → everything
 *   Engineer → create/update TRF, upload/delete files, view all
 *   Manager  → view all, download, upload/delete, analytics
 *
 * NOTE: Viewer role has been removed. Only Admin, Manager, and Engineer exist.
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
    "update_trf",
    "upload_file", "delete_file", "download_file",
    "view_analytics", "view_reports", "view_all",
  ],
};

const DEFAULT_PERMISSIONS = ["view_all", "download_file"];

export function usePermission() {
  const { user } = useApp();
  const role = user?.role || "Engineer";

  const allowed = PERMISSIONS[role] || DEFAULT_PERMISSIONS;

  const can = (action) => allowed.includes(action);

  return {
    role,
    can,
    isAdmin:    role === "Admin",
    isEngineer: role === "Engineer",
    isManager:  role === "Manager",
    // Shorthand checks
    canWrite:       can("create_trf"),
    canUpload:      can("upload_file"),
    canDelete:      can("delete_file"),
    canManageUsers: can("manage_users"),
    canViewAudit:   can("view_audit"),
  };
}
