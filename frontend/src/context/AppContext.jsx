/**
 * AppContext — single source of truth for:
 *  - authenticated user / session
 *  - notifications (with unread count + mark-as-read)
 *  - user preferences (settings persisted to localStorage)
 *  - activity feed (shared across Dashboard & Notifications)
 */
import { createContext, useContext, useState, useCallback, useEffect } from "react";
import API from "../services/api";

// ─── Initial data ────────────────────────────────────────────────────────────

const DEFAULT_PREFS = {
  compactView: false,
  emailNotifications: true,
  pushNotifications: false,
  trfCreationAlerts: true,
  autoGenerateTRF: true,
  requireApproval: false,
  sidebarCollapsed: false,
};

function loadPrefs() {
  try {
    const raw = localStorage.getItem("userPrefs");
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

function loadUser() {
  try {
    const raw = localStorage.getItem("authUser");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const SEED_NOTIFICATIONS = [
  { id: 1, title: "TRF-2026-105 created",       body: "New TRF created by Admin",           time: new Date(Date.now() - 2 * 60000),         read: false, color: "#6366f1", type: "trf" },
  { id: 2, title: "File upload completed",       body: "NMMERGEDRECORD.pdf uploaded",        time: new Date(Date.now() - 15 * 60000),        read: false, color: "#10b981", type: "file" },
  { id: 3, title: "New user registered",         body: "John Engineer joined the system",    time: new Date(Date.now() - 60 * 60000),        read: true,  color: "#f59e0b", type: "user" },
  { id: 4, title: "Monthly report generated",   body: "June 2026 summary is ready",         time: new Date(Date.now() - 3 * 3600000),       read: true,  color: "#06b6d4", type: "report" },
  { id: 5, title: "TRF-2026-101 updated",        body: "Project name changed by Admin",      time: new Date(Date.now() - 5 * 3600000),       read: true,  color: "#a855f7", type: "trf" },
];

const SEED_ACTIVITIES = [
  { id: 1, action: "TRF-2026-105 created",       user: "Admin",  time: new Date(Date.now() - 2 * 60000),   color: "#6366f1" },
  { id: 2, action: "File uploaded to Documents", user: "Admin",  time: new Date(Date.now() - 15 * 60000),  color: "#10b981" },
  { id: 3, action: "TRF-2026-100 updated",       user: "Admin",  time: new Date(Date.now() - 3600000),     color: "#f59e0b" },
  { id: 4, action: "TRF-2026-099 reviewed",      user: "Admin",  time: new Date(Date.now() - 3 * 3600000), color: "#06b6d4" },
  { id: 5, action: "Report generated",           user: "System", time: new Date(Date.now() - 5 * 3600000), color: "#a855f7" },
];

// ─── Context ─────────────────────────────────────────────────────────────────

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(loadUser);
  const [notifications, setNotifications] = useState([]);
  const [activities, setActivities] = useState(SEED_ACTIVITIES);
  const [prefs, setPrefsState] = useState(loadPrefs);

  // ── Fetch Notifications from Backend ──────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await API.get("/notifications/");
      const mapped = res.data.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        read: n.read,
        type: n.type || "trf",
        time: new Date(n.created_at),
        color:
          n.type === "trf"
            ? "#6366f1"
            : n.type === "file"
            ? "#10b981"
            : n.type === "user"
            ? "#f59e0b"
            : "#a855f7",
      }));
      setNotifications(mapped);
    } catch (e) {
      console.error("Failed to fetch notifications:", e);
    }
  }, [user]);

  // ── Fetch Activities / Audit Logs for Admin ──────────────────────────────
  const fetchActivities = useCallback(async () => {
    if (!user || user.role !== "Admin") return;
    try {
      const res = await API.get("/audits/");
      const mapped = res.data.map((log) => ({
        id: log.id,
        action: log.details || log.action,
        user: log.username,
        time: new Date(log.created_at),
        color: log.action.includes("CREATE")
          ? "#6366f1"
          : log.action.includes("DELETE")
          ? "#ef4444"
          : "#f59e0b",
      }));
      setActivities(mapped);
    } catch (e) {
      console.error("Failed to fetch activities:", e);
    }
  }, [user]);

  // Sync data on user login/status changes
  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchActivities();

      const notifTimer = setInterval(fetchNotifications, 15000);
      const activityTimer = setInterval(fetchActivities, 30000);

      return () => {
        clearInterval(notifTimer);
        clearInterval(activityTimer);
      };
    } else {
      setNotifications([]);
      setActivities(SEED_ACTIVITIES);
    }
  }, [user, fetchNotifications, fetchActivities]);

  // ── Notification helpers ──────────────────────────────────────────────────

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = useCallback(async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (e) {
      console.error("Failed to mark notification as read:", e);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await API.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      console.error("Failed to mark all notifications as read:", e);
    }
  }, []);

  const addNotification = useCallback((notif) => {
    const entry = { id: Date.now(), read: false, time: new Date(), ...notif };
    setNotifications((prev) => [entry, ...prev]);
  }, []);

  // ── Activity helpers ──────────────────────────────────────────────────────

  const addActivity = useCallback((action, userLabel = "Admin") => {
    const entry = { id: Date.now(), action, user: userLabel, time: new Date(), color: "#6366f1" };
    setActivities((prev) => [entry, ...prev.slice(0, 49)]);
  }, []);

  // ── Auth helpers ──────────────────────────────────────────────────────────

  const signIn = useCallback((userData) => {
    const enriched = {
      username: userData.username,
      role: userData.role || "Engineer",
      email: userData.email || `${userData.username}@trf.com`,
      displayName: userData.displayName || userData.username,
      avatar: userData.avatar || null,
      joinedAt: userData.joinedAt || new Date().toISOString(),
    };
    if (userData.token) {
      localStorage.setItem("token", userData.token);
    }
    localStorage.setItem("authUser", JSON.stringify(enriched));
    setUser(enriched);
  }, []);

  const updateUser = useCallback((patch) => {
    setUser((prev) => {
      const updated = { ...prev, ...patch };
      localStorage.setItem("authUser", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem("authUser");
    localStorage.removeItem("token");
    setUser(null);
  }, []);


  // ── Preferences helpers ────────────────────────────────────────────────────

  const setPrefs = useCallback((patch) => {
    setPrefsState((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem("userPrefs", JSON.stringify(next));
      return next;
    });
  }, []);

  const resetPrefs = useCallback(() => {
    localStorage.setItem("userPrefs", JSON.stringify(DEFAULT_PREFS));
    setPrefsState(DEFAULT_PREFS);
  }, []);

  return (
    <AppContext.Provider
      value={{
        // auth
        user, signIn, signOut, updateUser,
        isAuthenticated: !!user,
        // notifications
        notifications, unreadCount, markRead, markAllRead, addNotification,
        // activity
        activities, addActivity,
        // prefs
        prefs, setPrefs, resetPrefs,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
};
