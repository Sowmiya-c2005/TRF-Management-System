import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@mui/material/styles";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import toast from "react-hot-toast";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";

import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import DoneAllRoundedIcon       from "@mui/icons-material/DoneAllRounded";
import CheckCircleRoundedIcon   from "@mui/icons-material/CheckCircleRounded";
import RadioButtonUncheckedRoundedIcon from "@mui/icons-material/RadioButtonUncheckedRounded";
import FolderRoundedIcon        from "@mui/icons-material/FolderRounded";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";
import PersonRoundedIcon        from "@mui/icons-material/PersonRounded";
import InfoRoundedIcon          from "@mui/icons-material/InfoRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import ChevronLeftRoundedIcon   from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon  from "@mui/icons-material/ChevronRightRounded";
import OpenInNewRoundedIcon     from "@mui/icons-material/OpenInNewRounded";

import API from "../services/api";
import { useApp } from "../context/AppContext";
import PaginationBar from "../components/PaginationBar";

const FILTER_TABS = [
  { id: "all",         label: "All" },
  { id: "assignments", label: "Assignments" },
  { id: "trfs",        label: "TRFs" },
  { id: "documents",   label: "Documents" },
  { id: "system",      label: "System" },
];

const TYPE_ICON = {
  trf:        <FolderRoundedIcon sx={{ fontSize: 16 }} />,
  assignment: <PersonRoundedIcon sx={{ fontSize: 16 }} />,
  document:   <InsertDriveFileRoundedIcon sx={{ fontSize: 16 }} />,
  file:       <InsertDriveFileRoundedIcon sx={{ fontSize: 16 }} />,
  status:     <InfoRoundedIcon sx={{ fontSize: 16 }} />,
  system:     <InfoRoundedIcon sx={{ fontSize: 16 }} />,
};

function formatTime(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Notifications() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";
  
  const { fetchUnreadCount, unreadCount, markAllRead } = useApp();
  
  const [notifications, setNotifications] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const cardBg = isDark ? "rgba(15,23,42,0.72)" : "rgba(255,255,255,0.88)";
  const border  = isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.2)";

  const fetchPage = useCallback(async (p, f, l) => {
    setLoading(true);
    try {
      const typeParam = f === "all" ? "" : `&type=${f}`;
      const res = await API.get(`/notifications/?page=${p}&limit=${l}${typeParam}`);
      if (res.data && Array.isArray(res.data.items)) {
        setNotifications(res.data.items);
        setTotal(res.data.total ?? res.data.items.length);
        setPages(res.data.pages ?? 1);
        setPage(res.data.page ?? 1);
      } else {
        const arr = Array.isArray(res.data) ? res.data : [];
        setNotifications(arr);
        setTotal(arr.length);
        setPages(1);
        setPage(1);
      }
    } catch (err) {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPage(page, activeFilter, limit);
  }, [page, activeFilter, limit, fetchPage]);

  const handleFilterChange = (filterId) => {
    setActiveFilter(filterId);
    setPage(1);
  };

  const handleToggleRead = async (notif) => {
    try {
      const nextRead = !notif.read;
      const res = await API.put(`/notifications/${notif.id}/read?read=${nextRead}`);
      
      // Update local state
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: nextRead } : n));
      toast.success(nextRead ? "Marked as read" : "Marked as unread");
      fetchUnreadCount();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    toast.success("All notifications marked as read");
    // Reload current page
    fetchPage(page, activeFilter);
  };

  return (
    <Box sx={{ maxWidth: 780, mx: "auto" }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "space-between", mb: 4, flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{
              width: 44, height: 44, borderRadius: "13px",
              background: "linear-gradient(135deg,#f59e0b,#ef4444)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 8px 20px rgba(245,158,11,0.35)",
            }}>
              <NotificationsRoundedIcon sx={{ color: "#fff", fontSize: 22 }} />
            </Box>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, fontSize: "1.65rem", color: theme.palette.text.primary, lineHeight: 1.2 }}>
                  Notifications
                </Typography>
                {unreadCount > 0 && (
                  <Chip
                    label={`${unreadCount} unread`}
                    size="small"
                    sx={{ fontSize: "0.7rem", fontWeight: 700, background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.22)" }}
                  />
                )}
              </Box>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: "0.82rem" }}>
                Database-synchronized activity alerts
              </Typography>
            </Box>
          </Box>

          {unreadCount > 0 && (
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                variant="outlined" size="small"
                startIcon={<DoneAllRoundedIcon />}
                onClick={handleMarkAllRead}
                sx={{ borderRadius: "10px", fontWeight: 700 }}
              >
                Mark All Read
              </Button>
            </motion.div>
          )}
        </Box>
      </motion.div>

      {/* Filter tabs */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <Box sx={{
          display: "flex", gap: 1, p: 1, mb: 3, flexWrap: "wrap",
          borderRadius: "14px", background: cardBg,
          border: `1px solid ${border}`, backdropFilter: "blur(20px)",
        }}>
          {FILTER_TABS.map(tab => {
            const isActive = activeFilter === tab.id;
            return (
              <Box
                key={tab.id}
                onClick={() => handleFilterChange(tab.id)}
                sx={{
                  display: "flex", alignItems: "center", gap: 0.75,
                  px: 1.75, py: 0.75, borderRadius: "9px", cursor: "pointer",
                  background: isActive ? "linear-gradient(135deg,rgba(99,102,241,0.18),rgba(6,182,212,0.12))" : "transparent",
                  border: `1px solid ${isActive ? "rgba(99,102,241,0.35)" : "transparent"}`,
                  transition: "all 0.15s",
                }}
              >
                <Typography sx={{ fontSize: "0.8rem", fontWeight: isActive ? 700 : 500, color: isActive ? "#818cf8" : theme.palette.text.secondary }}>
                  {tab.label}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </motion.div>

      {/* Notifications list */}
      <Box sx={{ borderRadius: "20px", background: cardBg, border: `1px solid ${border}`, backdropFilter: "blur(20px)", overflow: "hidden", mb: 3 }}>
        <AnimatePresence mode="wait">
          {loading ? (
            <Box sx={{ py: 10, display: "flex", justifyContent: "center" }}>
              <CircularProgress size={36} sx={{ color: "#6366f1" }} />
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ py: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <Box sx={{
                width: 64, height: 64, borderRadius: "20px",
                background: isDark ? "rgba(148,163,184,0.06)" : "rgba(148,163,184,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <NotificationsNoneRoundedIcon sx={{ fontSize: 30, color: theme.palette.text.disabled }} />
              </Box>
              <Typography sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>No notifications</Typography>
              <Typography sx={{ fontSize: "0.8rem", color: theme.palette.text.disabled }}>
                You're all caught up!
              </Typography>
            </Box>
          ) : (
            <Box>
              {notifications.map((notif, i) => {
                const iconColor = notif.type === "assignment" ? "#f59e0b" : notif.type === "document" || notif.type === "file" ? "#10b981" : "#6366f1";
                return (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ delay: i * 0.04, duration: 0.2 }}
                  >
                    <Box
                      sx={{
                        display: "flex", alignItems: "flex-start", gap: 2,
                        px: 3, py: 2.5,
                        borderBottom: i < notifications.length - 1 ? `1px solid ${border}` : "none",
                        transition: "background 0.15s",
                        background: notif.read ? "transparent" : (isDark ? "rgba(99,102,241,0.04)" : "rgba(99,102,241,0.02)"),
                        "&:hover": { background: isDark ? "rgba(148,163,184,0.03)" : "rgba(99,102,241,0.02)" },
                        position: "relative",
                        pl: 3.5,
                      }}
                    >
                      {/* Colored left indicator */}
                      <Box sx={{
                        position: "absolute", left: 0, top: 0, bottom: 0,
                        width: 4,
                        background: notif.read ? "transparent" : iconColor,
                      }} />

                      {/* Icon */}
                      <Box sx={{
                        width: 38, height: 38, borderRadius: "11px", flexShrink: 0,
                        background: `${iconColor}14`,
                        border: `1px solid ${iconColor}25`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: iconColor,
                      }}>
                        {TYPE_ICON[notif.type] || <InfoRoundedIcon sx={{ fontSize: 16 }} />}
                      </Box>

                      {/* Content */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1, mb: 0.5 }}>
                          <Typography sx={{
                            fontWeight: notif.read ? 600 : 800, fontSize: "0.88rem",
                            color: theme.palette.text.primary,
                          }}>
                            {notif.title}
                          </Typography>
                          <Typography sx={{ fontSize: "0.72rem", color: theme.palette.text.disabled, whiteSpace: "nowrap" }}>
                            {formatTime(notif.created_at)}
                          </Typography>
                        </Box>
                        <Typography sx={{ fontSize: "0.8rem", color: theme.palette.text.secondary, lineHeight: 1.5, mb: 1 }}>
                          {notif.body}
                        </Typography>

                        {/* Metadata badge display (Actor / Role / TRF Link) */}
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                          {notif.actor_username && (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: theme.palette.text.secondary }}>
                                Triggered by:
                              </Typography>
                              <Chip
                                label={`${notif.actor_username} (${notif.actor_role || "User"})`}
                                size="small"
                                sx={{ height: 20, fontSize: "0.65rem", fontWeight: 600, background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }}
                              />
                            </Box>
                          )}
                          {notif.trf_number && (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: theme.palette.text.secondary }}>
                                Workspace:
                              </Typography>
                              <Link
                                to={`/files?trf=${notif.trf_number}`}
                                style={{
                                  display: "inline-flex", alignItems: "center", gap: 3,
                                  fontSize: "0.68rem", fontWeight: 700, color: "#818cf8", textDecoration: "none",
                                }}
                              >
                                {notif.trf_number} <OpenInNewRoundedIcon sx={{ fontSize: 11 }} />
                              </Link>
                            </Box>
                          )}
                        </Box>
                      </Box>

                      {/* Read/Unread Status Toggle Action */}
                      <Box sx={{ alignSelf: "center", ml: 1 }}>
                        <Tooltip title={notif.read ? "Mark as Unread" : "Mark as Read"}>
                          <Button
                            onClick={() => handleToggleRead(notif)}
                            sx={{ minWidth: 0, p: 0.5, color: notif.read ? theme.palette.text.disabled : "#6366f1" }}
                          >
                            {notif.read ? <RadioButtonUncheckedRoundedIcon sx={{ fontSize: 20 }} /> : <CheckCircleRoundedIcon sx={{ fontSize: 20 }} />}
                          </Button>
                        </Tooltip>
                      </Box>
                    </Box>
                  </motion.div>
                );
              })}
            </Box>
          )}
        </AnimatePresence>
      </Box>

      {/* Pagination Controls */}
      <PaginationBar
        page={page}
        pages={pages}
        total={total}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={(l) => {
          setLimit(l);
          setPage(1);
        }}
        isDark={isDark}
      />
    </Box>
  );
}
