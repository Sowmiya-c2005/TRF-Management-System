import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@mui/material/styles";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import toast from "react-hot-toast";

import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import DoneAllRoundedIcon       from "@mui/icons-material/DoneAllRounded";
import CheckRoundedIcon         from "@mui/icons-material/CheckRounded";
import FolderRoundedIcon        from "@mui/icons-material/FolderRounded";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";
import PersonRoundedIcon        from "@mui/icons-material/PersonRounded";
import InfoRoundedIcon          from "@mui/icons-material/InfoRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";

import { useApp } from "../context/AppContext";

const FILTER_TABS = [
  { id: "all",    label: "All" },
  { id: "unread", label: "Unread" },
  { id: "trf",    label: "TRF Alerts" },
  { id: "file",   label: "Files" },
  { id: "system", label: "System" },
];

const TYPE_ICON = {
  trf:    <FolderRoundedIcon sx={{ fontSize: 16 }} />,
  file:   <InsertDriveFileRoundedIcon sx={{ fontSize: 16 }} />,
  user:   <PersonRoundedIcon sx={{ fontSize: 16 }} />,
  report: <InfoRoundedIcon sx={{ fontSize: 16 }} />,
};

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Notifications() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { notifications, unreadCount, markRead, markAllRead } = useApp();
  const [activeFilter, setActiveFilter] = useState("all");

  const cardBg = isDark ? "rgba(15,23,42,0.72)" : "rgba(255,255,255,0.88)";
  const border  = isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.2)";

  const filtered = notifications.filter(n => {
    if (activeFilter === "unread") return !n.read;
    if (activeFilter === "all")    return true;
    return n.type === activeFilter;
  });

  const handleMarkAllRead = async () => {
    await markAllRead();
    toast.success("All notifications marked as read");
  };

  return (
    <Box sx={{ maxWidth: 780, mx: "auto" }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 4, flexWrap: "wrap", gap: 2 }}>
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
                {notifications.length} total notification{notifications.length !== 1 ? "s" : ""}
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
            const count = tab.id === "all" ? notifications.length
              : tab.id === "unread" ? notifications.filter(n => !n.read).length
              : notifications.filter(n => n.type === tab.id).length;
            return (
              <Box
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
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
                {count > 0 && (
                  <Chip
                    label={count}
                    size="small"
                    sx={{
                      fontSize: "0.62rem", height: 16, minWidth: 16,
                      background: isActive ? "rgba(99,102,241,0.2)" : "rgba(148,163,184,0.12)",
                      color: isActive ? "#818cf8" : theme.palette.text.disabled,
                    }}
                  />
                )}
              </Box>
            );
          })}
        </Box>
      </motion.div>

      {/* Notifications list */}
      <Box sx={{ borderRadius: "20px", background: cardBg, border: `1px solid ${border}`, backdropFilter: "blur(20px)", overflow: "hidden" }}>
        <AnimatePresence>
          {filtered.length === 0 ? (
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
                {activeFilter === "unread" ? "You're all caught up!" : "Nothing here yet."}
              </Typography>
            </Box>
          ) : (
            filtered.map((notif, i) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
              >
                <Box
                  onClick={() => !notif.read && markRead(notif.id)}
                  sx={{
                    display: "flex", alignItems: "flex-start", gap: 2,
                    px: 3, py: 2.5,
                    borderBottom: i < filtered.length - 1 ? `1px solid ${border}` : "none",
                    cursor: notif.read ? "default" : "pointer",
                    transition: "background 0.15s",
                    opacity: notif.read ? 0.6 : 1,
                    "&:hover": { background: isDark ? "rgba(148,163,184,0.03)" : "rgba(99,102,241,0.02)" },
                    position: "relative",
                    pl: 3.5,
                  }}
                >
                  {/* Colored left border */}
                  <Box sx={{
                    position: "absolute", left: 0, top: "15%", bottom: "15%",
                    width: 3, borderRadius: "0 3px 3px 0",
                    background: notif.color || "#6366f1",
                    opacity: notif.read ? 0.4 : 1,
                  }} />

                  {/* Icon */}
                  <Box sx={{
                    width: 38, height: 38, borderRadius: "11px", flexShrink: 0,
                    background: `${notif.color || "#6366f1"}14`,
                    border: `1px solid ${notif.color || "#6366f1"}25`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: notif.color || "#6366f1",
                  }}>
                    {TYPE_ICON[notif.type] || <InfoRoundedIcon sx={{ fontSize: 16 }} />}
                  </Box>

                  {/* Content */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1, mb: 0.3 }}>
                      <Typography sx={{
                        fontWeight: notif.read ? 500 : 700, fontSize: "0.88rem",
                        color: theme.palette.text.primary,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {notif.title}
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
                        <Typography sx={{ fontSize: "0.7rem", color: theme.palette.text.disabled, whiteSpace: "nowrap" }}>
                          {timeAgo(notif.time)}
                        </Typography>
                        {!notif.read && (
                          <Box sx={{ width: 7, height: 7, borderRadius: "50%", background: "#ef4444", flexShrink: 0 }} />
                        )}
                        {notif.read && (
                          <CheckRoundedIcon sx={{ fontSize: 14, color: "#10b981" }} />
                        )}
                      </Box>
                    </Box>
                    <Typography sx={{ fontSize: "0.8rem", color: theme.palette.text.secondary, lineHeight: 1.5 }}>
                      {notif.body}
                    </Typography>
                  </Box>
                </Box>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </Box>
    </Box>
  );
}
