import { useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@mui/material/styles";

import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import Badge from "@mui/material/Badge";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";

import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";

import { useThemeMode } from "../context/ThemeContext";
import { useApp } from "../context/AppContext";
import { useKeyboard } from "../hooks/useKeyboard";
import NotificationDrawer from "./NotificationDrawer";
import CommandPalette from "./CommandPalette";

// Breadcrumb label map
const ROUTE_LABELS = {
  "/":          "Dashboard",
  "/create":    "Create TRF",
  "/search":    "Search TRF",
  "/all":       "All TRFs",
  "/upload":    "Upload Files",
  "/files":     "File Manager",
  "/update":    "Update TRF",
  "/analytics": "Analytics",
  "/reports":   "Reports",
  "/users":     "Users",
  "/settings":  "Settings",
  "/profile":   "Profile",
};

export default function Navbar() {
  const theme    = useTheme();
  const isDark   = theme.palette.mode === "dark";
  const { toggle } = useThemeMode();
  const { user, signOut, unreadCount } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifOpen, setNotifOpen]     = useState(false);
  const [cmdOpen,   setCmdOpen]       = useState(false);
  const [profileAnchor, setProfileAnchor] = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);

  // Keyboard shortcuts
  useKeyboard({
    "ctrl+k": useCallback(() => setCmdOpen(true),  []),
    "ctrl+/": useCallback(() => setCmdOpen(true),  []),
  });

  const handleSignOut = () => {
    setProfileAnchor(null);
    signOut();
    navigate("/login");
  };

  const displayName = user?.displayName || user?.username || "Admin";
  const initials    = displayName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const currentPage = ROUTE_LABELS[location.pathname] || "";

  const border = isDark ? "rgba(148,163,184,0.08)" : "rgba(148,163,184,0.2)";

  return (
    <>
      <Box
        component={motion.div}
        initial={{ y: -8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35 }}
        sx={{
          height: 64, display: "flex", alignItems: "center",
          px: 3, gap: 1.5,
          background: isDark ? "rgba(10,15,30,0.88)" : "rgba(255,255,255,0.88)",
          backdropFilter: "blur(24px)",
          borderBottom: `1px solid ${border}`,
          position: "sticky", top: 0, zIndex: 200,
        }}
      >
        {/* Breadcrumb */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mr: 1 }}>
          <Typography variant="caption" sx={{ color: theme.palette.text.disabled, fontSize: "0.72rem" }}>
            TRF Portal
          </Typography>
          {currentPage && (
            <>
              <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>/</Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: "0.78rem" }}>
                {currentPage}
              </Typography>
            </>
          )}
        </Box>

        {/* Search bar — opens command palette */}
        <motion.div
          animate={{ width: searchFocused ? 300 : 220 }}
          transition={{ duration: 0.25 }}
        >
          <Box
            onClick={() => setCmdOpen(true)}
            sx={{
              display: "flex", alignItems: "center", gap: 1,
              px: 1.5, py: 0.75, borderRadius: "10px",
              cursor: "pointer",
              background: isDark ? "rgba(148,163,184,0.06)" : "rgba(100,116,139,0.07)",
              border: `1px solid ${searchFocused ? theme.palette.primary.main : isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.22)"}`,
              transition: "border-color 0.2s, background 0.2s",
              "&:hover": {
                background: isDark ? "rgba(148,163,184,0.09)" : "rgba(100,116,139,0.1)",
                borderColor: theme.palette.primary.main,
              },
            }}
            onMouseEnter={() => setSearchFocused(true)}
            onMouseLeave={() => setSearchFocused(false)}
          >
            <SearchRoundedIcon sx={{ color: theme.palette.text.secondary, fontSize: 16, flexShrink: 0 }} />
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, flex: 1, fontSize: "0.8rem" }}>
              Search or jump to…
            </Typography>
            <Chip label="⌘K" size="small" sx={{ fontSize: "0.6rem", height: 18, fontFamily: "monospace", opacity: 0.6 }} />
          </Box>
        </motion.div>

        <Box sx={{ flex: 1 }} />

        {/* Quick Create */}
        <Tooltip title="New TRF  (quick create)">
          <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}>
            <IconButton
              size="small"
              onClick={() => navigate("/create")}
              sx={{
                background: "linear-gradient(135deg,#6366f1,#06b6d4)",
                color: "#fff", width: 32, height: 32,
                boxShadow: "0 4px 12px rgba(99,102,241,0.35)",
                "&:hover": { boxShadow: "0 6px 18px rgba(99,102,241,0.5)" },
              }}
            >
              <AddRoundedIcon sx={{ fontSize: 17 }} />
            </IconButton>
          </motion.div>
        </Tooltip>

        {/* Theme toggle */}
        <Tooltip title={isDark ? "Switch to light mode" : "Switch to dark mode"}>
          <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}>
            <IconButton
              size="small" onClick={toggle}
              sx={{
                background: isDark ? "rgba(148,163,184,0.08)" : "rgba(100,116,139,0.09)",
                color: theme.palette.text.secondary, width: 32, height: 32,
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={isDark ? "dark" : "light"}
                  initial={{ rotate: -90, opacity: 0, scale: 0.7 }}
                  animate={{ rotate: 0,   opacity: 1, scale: 1   }}
                  exit={{    rotate: 90,  opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.18 }}
                >
                  {isDark
                    ? <LightModeRoundedIcon sx={{ fontSize: 17 }} />
                    : <DarkModeRoundedIcon  sx={{ fontSize: 17 }} />
                  }
                </motion.div>
              </AnimatePresence>
            </IconButton>
          </motion.div>
        </Tooltip>

        {/* Notifications */}
        <Tooltip title="Notifications">
          <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}>
            <IconButton
              size="small"
              onClick={() => setNotifOpen((o) => !o)}
              sx={{
                background: notifOpen
                  ? "rgba(99,102,241,0.15)"
                  : isDark ? "rgba(148,163,184,0.08)" : "rgba(100,116,139,0.09)",
                width: 32, height: 32,
              }}
            >
              <Badge
                badgeContent={unreadCount}
                color="error"
                sx={{ "& .MuiBadge-badge": { fontSize: "0.58rem", height: 15, minWidth: 15 } }}
              >
                <NotificationsRoundedIcon sx={{ fontSize: 17, color: notifOpen ? theme.palette.primary.main : theme.palette.text.secondary }} />
              </Badge>
            </IconButton>
          </motion.div>
        </Tooltip>

        {/* Profile pill */}
        <Box
          component={motion.div}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={(e) => setProfileAnchor(e.currentTarget)}
          sx={{
            display: "flex", alignItems: "center", gap: 1,
            px: 1, py: 0.5, borderRadius: "10px", cursor: "pointer",
            background: isDark ? "rgba(148,163,184,0.06)" : "rgba(100,116,139,0.06)",
            border: `1px solid ${border}`,
            "&:hover": { borderColor: theme.palette.primary.main },
            transition: "border-color 0.2s",
          }}
        >
          <Avatar sx={{
            width: 26, height: 26, fontSize: "0.68rem", fontWeight: 700,
            background: user?.avatar ? "transparent" : "linear-gradient(135deg,#6366f1,#06b6d4)",
          }}>
            {user?.avatar
              ? <Box component="img" src={user.avatar} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : initials
            }
          </Avatar>
          <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.text.primary, maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {displayName}
          </Typography>
          <KeyboardArrowDownRoundedIcon sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
        </Box>
      </Box>

      {/* Profile Menu */}
      <Menu
        anchorEl={profileAnchor}
        open={Boolean(profileAnchor)}
        onClose={() => setProfileAnchor(null)}
        PaperProps={{
          sx: {
            width: 230, mt: 1, borderRadius: "16px",
            background: isDark ? "rgba(10,15,30,0.97)" : "rgba(255,255,255,0.98)",
            backdropFilter: "blur(30px)",
            border: `1px solid ${border}`,
            boxShadow: isDark ? "0 24px 48px rgba(0,0,0,0.5)" : "0 24px 48px rgba(15,23,42,0.14)",
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        {/* User info */}
        <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar sx={{
            width: 38, height: 38, fontWeight: 700, fontSize: "0.9rem",
            background: "linear-gradient(135deg,#6366f1,#06b6d4)",
          }}>
            {initials}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight={700} sx={{ fontSize: "0.83rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {displayName}
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: "0.7rem" }}>
              {user?.email || "admin@trf.com"}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ borderColor: border }} />

        <MenuItem onClick={() => { setProfileAnchor(null); navigate("/profile"); }}
          sx={{ gap: 1.5, px: 2, py: 1, fontSize: "0.82rem", "&:hover": { background: isDark ? "rgba(148,163,184,0.06)" : "rgba(100,116,139,0.06)" } }}>
          <PersonRoundedIcon sx={{ fontSize: 16 }} /> View Profile
        </MenuItem>
        <MenuItem onClick={() => { setProfileAnchor(null); navigate("/profile?tab=edit"); }}
          sx={{ gap: 1.5, px: 2, py: 1, fontSize: "0.82rem", "&:hover": { background: isDark ? "rgba(148,163,184,0.06)" : "rgba(100,116,139,0.06)" } }}>
          <EditRoundedIcon sx={{ fontSize: 16 }} /> Edit Profile
        </MenuItem>
        <MenuItem onClick={() => { setProfileAnchor(null); navigate("/settings"); }}
          sx={{ gap: 1.5, px: 2, py: 1, fontSize: "0.82rem", "&:hover": { background: isDark ? "rgba(148,163,184,0.06)" : "rgba(100,116,139,0.06)" } }}>
          <SettingsRoundedIcon sx={{ fontSize: 16 }} /> Settings
        </MenuItem>

        <Divider sx={{ borderColor: border }} />

        <MenuItem onClick={handleSignOut}
          sx={{ gap: 1.5, px: 2, py: 1, fontSize: "0.82rem", color: theme.palette.error.main,
            "&:hover": { background: "rgba(239,68,68,0.08)" } }}>
          <LogoutRoundedIcon sx={{ fontSize: 16 }} /> Sign Out
        </MenuItem>
      </Menu>

      {/* Notification Drawer */}
      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />

      {/* Command Palette */}
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </>
  );
}
