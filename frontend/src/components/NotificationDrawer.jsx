import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import FolderSpecialRoundedIcon from "@mui/icons-material/FolderSpecialRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import PersonAddRoundedIcon from "@mui/icons-material/PersonAddRounded";
import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";

import { useApp } from "../context/AppContext";

function timeAgo(date) {
  const d   = date instanceof Date ? date : new Date(date);
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60)   return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400)return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

const TYPE_ICON = {
  trf:    <FolderSpecialRoundedIcon />,
  file:   <UploadFileRoundedIcon />,
  user:   <PersonAddRoundedIcon />,
  report: <AssessmentRoundedIcon />,
  update: <EditRoundedIcon />,
};

function NotifItem({ notif, onRead }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      transition={{ duration: 0.22 }}
    >
      <Box
        onClick={() => !notif.read && onRead(notif.id)}
        sx={{
          display: "flex", gap: 1.5, px: 2.5, py: 1.8,
          cursor: notif.read ? "default" : "pointer",
          background: notif.read
            ? "transparent"
            : isDark ? "rgba(99,102,241,0.06)" : "rgba(99,102,241,0.04)",
          borderLeft: `3px solid ${notif.read ? "transparent" : notif.color}`,
          transition: "background 0.2s",
          "&:hover": {
            background: isDark ? "rgba(148,163,184,0.04)" : "rgba(148,163,184,0.07)",
          },
        }}
      >
        {/* Icon bubble */}
        <Box sx={{
          width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
          background: `${notif.color}18`,
          border: `1px solid ${notif.color}35`,
          display: "flex", alignItems: "center", justifyContent: "center",
          "& svg": { fontSize: 16, color: notif.color },
          mt: 0.3,
        }}>
          {TYPE_ICON[notif.type] || <NotificationsNoneRoundedIcon />}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}>
            <Typography variant="body2" sx={{
              fontWeight: notif.read ? 400 : 700,
              fontSize: "0.82rem",
              color: notif.read ? theme.palette.text.secondary : theme.palette.text.primary,
              lineHeight: 1.3,
            }}>
              {notif.title}
            </Typography>
            {!notif.read && (
              <Box sx={{
                width: 7, height: 7, borderRadius: "50%",
                background: notif.color, flexShrink: 0, mt: 0.6,
              }} />
            )}
          </Box>
          {notif.body && (
            <Typography variant="caption" sx={{
              color: theme.palette.text.secondary, fontSize: "0.74rem",
              display: "block", mt: 0.2,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {notif.body}
            </Typography>
          )}
          <Typography variant="caption" sx={{ color: theme.palette.text.disabled, fontSize: "0.7rem", mt: 0.3, display: "block" }}>
            {timeAgo(notif.time)}
          </Typography>
        </Box>
      </Box>
    </motion.div>
  );
}

export default function NotificationDrawer({ open, onClose }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { notifications, unreadCount, markRead, markAllRead } = useApp();
  const drawerRef = useRef(null);

  const bg     = isDark ? "rgba(10,15,30,0.97)" : "rgba(255,255,255,0.98)";
  const border = isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.2)";

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: "fixed", inset: 0, zIndex: 1299, background: "rgba(0,0,0,0.15)" }}
          />

          {/* Drawer panel */}
          <motion.div
            ref={drawerRef}
            initial={{ opacity: 0, x: 40, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position: "fixed",
              top: 72, right: 16,
              width: "min(380px, calc(100vw - 32px))",
              maxHeight: "calc(100vh - 88px)",
              zIndex: 1300,
              display: "flex", flexDirection: "column",
              borderRadius: 18,
              background: bg,
              backdropFilter: "blur(30px)",
              border: `1px solid ${border}`,
              boxShadow: isDark
                ? "0 32px 64px rgba(0,0,0,0.5), 0 8px 16px rgba(0,0,0,0.3)"
                : "0 32px 64px rgba(15,23,42,0.18), 0 8px 16px rgba(15,23,42,0.08)",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <Box sx={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              px: 2.5, py: 2,
              borderBottom: `1px solid ${border}`,
              flexShrink: 0,
            }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ fontSize: "0.95rem" }}>
                  Notifications
                </Typography>
                {unreadCount > 0 && (
                  <Chip
                    label={unreadCount}
                    size="small"
                    sx={{
                      height: 20, fontSize: "0.65rem", fontWeight: 700,
                      background: "linear-gradient(135deg,#6366f1,#06b6d4)",
                      color: "#fff", minWidth: 28,
                    }}
                  />
                )}
              </Box>
              <Box sx={{ display: "flex", gap: 0.5 }}>
                {unreadCount > 0 && (
                  <Tooltip title="Mark all as read">
                    <IconButton size="small" onClick={markAllRead}
                      sx={{ color: theme.palette.primary.main, "&:hover": { background: "rgba(99,102,241,0.1)" } }}>
                      <DoneAllRoundedIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                  </Tooltip>
                )}
                <IconButton size="small" onClick={onClose}
                  sx={{ color: theme.palette.text.secondary }}>
                  <CloseRoundedIcon sx={{ fontSize: 17 }} />
                </IconButton>
              </Box>
            </Box>

            {/* List */}
            <Box sx={{ flex: 1, overflowY: "auto" }}>
              {notifications.length === 0 ? (
                <Box sx={{ py: 8, textAlign: "center" }}>
                  <NotificationsNoneRoundedIcon sx={{ fontSize: 48, color: theme.palette.text.disabled, mb: 1.5 }} />
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    You're all caught up!
                  </Typography>
                </Box>
              ) : (
                <AnimatePresence initial={false}>
                  {notifications.map((n) => (
                    <NotifItem key={n.id} notif={n} onRead={markRead} />
                  ))}
                </AnimatePresence>
              )}
            </Box>

            {/* Footer */}
            <Box sx={{
              px: 2.5, py: 1.5,
              borderTop: `1px solid ${border}`,
              display: "flex", justifyContent: "space-between", alignItems: "center",
              flexShrink: 0,
            }}>
              <Typography variant="caption" sx={{ color: theme.palette.text.disabled, fontSize: "0.72rem" }}>
                {notifications.length} total · {unreadCount} unread
              </Typography>
              <Button size="small" onClick={markAllRead} disabled={unreadCount === 0}
                sx={{ fontSize: "0.75rem", textTransform: "none", fontWeight: 600 }}>
                Clear all
              </Button>
            </Box>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
