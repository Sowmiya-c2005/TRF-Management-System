/**
 * AppContext
 * ──────────────────────────────────────────────────────────────────────────
 * Single source of truth for:
 *  - Authenticated user session (persisted to localStorage)
 *  - Notifications (fetched from backend when token exists; seed data otherwise)
 *  - Activity feed (fetched from /audits/ when Admin+token; seed data otherwise)
 *  - User preferences (persisted to localStorage)
 *
 * IMPORTANT: All backend API calls are guarded — they only fire when a JWT
 * token is present. This prevents 401 console errors for unauthenticated users.
 */
import { createContext, useContext, useState, useCallback, useEffect } from "react";
import API from "../services/api";

// ─── Defaults ────────────────────────────────────────────────────────────────

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

const hasToken = () => !!localStorage.getItem("token");

// ─── Seed data (shown when backend is unreachable or no token) ────────────────

const SEED_NOTIFICATIONS = [
  { id: 1, title: "TRF-2026-105 created",     body: "New TRF created by Admin",       time: new Date(Date.now() - 2 * 60000),    read: false, color: "#6366f1", type: "trf"    },
  { id: 2, title: "File upload completed",     body: "NMMERGEDRECORD.pdf uploaded",    time: new Date(Date.now() - 15 * 60000),   read: false, color: "#10b981", type: "file"   },
  { id: 3, title: "New user registered",       body: "John Engineer joined",           time: new Date(Date.now() - 60 * 60000),   read: true,  color: "#f59e0b", type: "user"   },
  { id: 4, title: "Monthly report generated",  body: "June 2026 summary is ready",     time: new Date(Date.now() - 3 * 3600000), read: true,  color: "#06b6d4", type: "report" },
  { id: 5, title: "TRF-2026-101 updated",      body: "Project name changed by Admin",  time: new Date(Date.now() - 5 * 3600000), read: true,  color: "#a855f7", type: "trf"    },
];

const SEED_ACTIVITIES = [
  { id: 1, action: "TRF-2026-105 created",       user: "Admin",  time: new Date(Date.now() - 2 * 60000),    color: "#6366f1" },
  { id: 2, action: "File uploaded to Documents", user: "Admin",  time: new Date(Date.now() - 15 * 60000),   color: "#10b981" },
  { id: 3, action: "TRF-2026-100 updated",       user: "Admin",  time: new Date(Date.now() - 3600000),      color: "#f59e0b" },
  { id: 4, action: "TRF-2026-099 reviewed",      user: "Admin",  time: new Date(Date.now() - 3 * 3600000),  color: "#06b6d4" },
  { id: 5, action: "Report generated",           user: "System", time: new Date(Date.now() - 5 * 3600000),  color: "#a855f7" },
];

// ─── Context ──────────────────────────────────────────────────────────────────

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user,          setUser]          = useState(loadUser);
  const [notifications, setNotifications] = useState(SEED_NOTIFICATIONS);
  const [activities,    setActivities]    = useState(SEED_ACTIVITIES);
  const [prefs,         setPrefsState]    = useState(loadPrefs);

  // ── Notifications ──────────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!hasToken()) return; // skip if no JWT — avoids 401 spam
    try {
      const res = await API.get("/notifications/");
      if (!Array.isArray(res.data) || res.data.length === 0) return; // keep seed if empty
      const mapped = res.data.map((n) => ({
        id:    n.id,
        title: n.title,
        body:  n.body  || "",
        read:  !!n.read,
        type:  n.type  || "trf",
        time:  new Date(n.created_at || Date.now()),
        color: n.type === "file" ? "#10b981" : n.type === "user" ? "#f59e0b" : n.type === "report" ? "#06b6d4" : "#6366f1",
      }));
      setNotifications(mapped);
    } catch {
      // silently keep current notifications — do NOT log to avoid console noise
    }
  }, []);

  // ── Audit trail (Admin only) ───────────────────────────────────────────────
  const fetchActivities = useCallback(async () => {
    if (!hasToken() || !user) return;
    // Only Admins can see the full audit trail
    if (user.role !== "Admin" && user.role !== "Administrator") return;
    try {
      const res = await API.get("/audits/");
      if (!Array.isArray(res.data) || res.data.length === 0) return;
      const mapped = res.data.map((log) => ({
        id:     log.id,
        action: log.details || log.action || "System action",
        user:   log.username || "System",
        time:   new Date(log.created_at || Date.now()),
        color:  (log.action || "").includes("DELETE")
                  ? "#ef4444"
                  : (log.action || "").includes("CREATE")
                  ? "#6366f1"
                  : "#f59e0b",
      }));
      setActivities(mapped);
    } catch {
      // silently keep seed activities
    }
  }, [user]);

  // Poll when user is logged in (with token)
  useEffect(() => {
    if (user && hasToken()) {
      fetchNotifications();
      fetchActivities();

      const notifTimer    = setInterval(fetchNotifications, 30000);  // every 30s
      const activityTimer = setInterval(fetchActivities,    60000);  // every 60s

      return () => {
        clearInterval(notifTimer);
        clearInterval(activityTimer);
      };
    } else if (!user) {
      // Restore seed data on sign-out
      setNotifications(SEED_NOTIFICATIONS);
      setActivities(SEED_ACTIVITIES);
    }
  }, [user, fetchNotifications, fetchActivities]);

  // ── Notification helpers ───────────────────────────────────────────────────

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchUnreadCount = useCallback(async () => {
    if (!hasToken()) return;
    try {
      const res = await API.get("/notifications/unread-count");
      return res.data.unread_count || 0;
    } catch {
      return unreadCount;
    }
  }, [unreadCount]);

  const markRead = useCallback((id) => {
    // Optimistic local update — fire API only when token exists
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    if (hasToken()) {
      API.put(`/notifications/${id}/read`).catch(() => {});
    }
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (hasToken()) {
      API.put("/notifications/read-all").catch(() => {});
    }
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const addNotification = useCallback((notif) => {
    const entry = { id: Date.now(), read: false, time: new Date(), ...notif };
    setNotifications((prev) => [entry, ...prev.slice(0, 49)]);
  }, []);

  // ── Activity helpers ───────────────────────────────────────────────────────

  const addActivity = useCallback((action, userLabel = "Admin") => {
    const entry = { id: Date.now(), action, user: userLabel, time: new Date(), color: "#6366f1" };
    setActivities((prev) => [entry, ...prev.slice(0, 49)]);
  }, []);

  // ── Auth helpers ───────────────────────────────────────────────────────────

  const signIn = useCallback((userData) => {
    const enriched = {
      username:    userData.username,
      role:        userData.role        || "Engineer",
      email:       userData.email       || `${userData.username}@trf.com`,
      displayName: userData.displayName || userData.username,
      avatar:      userData.avatar      || null,
      joinedAt:    userData.joinedAt    || new Date().toISOString(),
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
    localStorage.removeItem("refresh_token");
    setUser(null);
    setNotifications(SEED_NOTIFICATIONS);
    setActivities(SEED_ACTIVITIES);
  }, []);

  // ── Prefs helpers ──────────────────────────────────────────────────────────

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
        notifications, unreadCount, fetchUnreadCount,
        markRead, markAllRead, clearNotifications, addNotification,
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
