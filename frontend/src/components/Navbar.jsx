import { useState, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@mui/material/styles";

import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Badge from "@mui/material/Badge";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";

import SearchRoundedIcon           from "@mui/icons-material/SearchRounded";
import NotificationsRoundedIcon    from "@mui/icons-material/NotificationsRounded";
import LightModeRoundedIcon        from "@mui/icons-material/LightModeRounded";
import DarkModeRoundedIcon         from "@mui/icons-material/DarkModeRounded";
import AddRoundedIcon              from "@mui/icons-material/AddRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import SettingsRoundedIcon         from "@mui/icons-material/SettingsRounded";
import LogoutRoundedIcon           from "@mui/icons-material/LogoutRounded";
import PersonRoundedIcon           from "@mui/icons-material/PersonRounded";
import EditRoundedIcon             from "@mui/icons-material/EditRounded";
import DashboardRoundedIcon        from "@mui/icons-material/DashboardRounded";
import HomeRoundedIcon             from "@mui/icons-material/HomeRounded";

import { useThemeMode } from "../context/ThemeContext";
import { useApp } from "../context/AppContext";
import { useKeyboard } from "../hooks/useKeyboard";
import NotificationDrawer from "./NotificationDrawer";
import CommandPalette from "./CommandPalette";

const ROUTE_META = {
  "/":             { label: "Dashboard",    icon: <DashboardRoundedIcon sx={{ fontSize: 14 }} /> },
  "/create":       { label: "Create TRF",   icon: null },
  "/search":       { label: "Search TRF",   icon: null },
  "/all":          { label: "All TRFs",     icon: null },
  "/upload":       { label: "Upload Files", icon: null },
  "/files":        { label: "File Manager", icon: null },
  "/update":       { label: "Update TRF",   icon: null },
  "/analytics":    { label: "Analytics",    icon: null },
  "/reports":      { label: "Reports",      icon: null },
  "/users":        { label: "Users",        icon: null },
  "/settings":     { label: "Settings",     icon: null },
  "/profile":      { label: "Profile",      icon: null },
  "/notifications":{ label: "Notifications",icon: null },
  "/audit":        { label: "Audit Log",    icon: null },
};

// Live Clock component
function LiveClock({ isDark, theme }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", mr: 0.5 }}>
      <Typography sx={{
        fontSize: "0.78rem", fontWeight: 700, fontVariantNumeric: "tabular-nums",
        color: theme.palette.text.primary, lineHeight: 1.2,
        fontFamily: "'Outfit', 'Inter', sans-serif",
      }}>
        {timeStr}
      </Typography>
      <Typography sx={{ fontSize: "0.63rem", color: theme.palette.text.disabled, lineHeight: 1.2 }}>
        {dateStr}
      </Typography>
    </Box>
  );
}

export default function Navbar() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { toggle } = useThemeMode();
  const { user, signOut, unreadCount } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifOpen,     setNotifOpen]     = useState(false);
  const [cmdOpen,       setCmdOpen]       = useState(false);
  const [profileAnchor, setProfileAnchor] = useState(null);
  const [searchHovered, setSearchHovered] = useState(false);
  const [bellShake,     setBellShake]     = useState(false);

  // Keyboard shortcut
  useKeyboard({ "ctrl+k": useCallback(() => setCmdOpen(true), []) });

  // Shake bell when new notifications arrive
  const prevCount = useState(unreadCount)[0];
  useEffect(() => {
    if (unreadCount > 0) {
      setBellShake(true);
      setTimeout(() => setBellShake(false), 700);
    }
  }, [unreadCount]);

  const handleSignOut = () => {
    setProfileAnchor(null);
    signOut();
    navigate("/login");
  };

  const displayName  = user?.displayName || user?.username || "Admin";
  const initials     = displayName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const routeMeta    = ROUTE_META[location.pathname] || { label: location.pathname.slice(1), icon: null };
  const border       = isDark ? "rgba(148,163,184,0.08)" : "rgba(148,163,184,0.18)";

  return (
    <>
      <Box
        component={motion.div}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0,   opacity: 1 }}
        transition={{ duration: 0.38 }}
        sx={{
          height: 64, display: "flex", alignItems: "center",
          px: 3, gap: 1.5,
          background: isDark ? "rgba(10,15,30,0.88)" : "rgba(255,255,255,0.9)",
          backdropFilter: "blur(28px)",
          borderBottom: `1px solid ${border}`,
          position: "sticky", top: 0, zIndex: 200,
        }}
      >
        {/* Breadcrumb */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mr: 1, flexShrink: 0 }}>
          <HomeRoundedIcon sx={{ fontSize: 13, color: theme.palette.text.disabled }} />
          <Typography variant="caption" sx={{ color: theme.palette.text.disabled, fontSize: "0.72rem" }}>
            TRF Portal
          </Typography>
          {routeMeta.label && (
            <>
              <Typography variant="caption" sx={{ color: theme.palette.text.disabled, mx: 0.25 }}>/</Typography>
              <Typography variant="caption" sx={{
                color: theme.palette.text.primary, fontWeight: 700, fontSize: "0.78rem",
              }}>
                {routeMeta.label}
              </Typography>
            </>
          )}
        </Box>

        {/* Search */}
        <motion.div animate={{ width: searchHovered ? 280 : 200 }} transition={{ duration: 0.25 }}>
          <Box
            onClick={() => setCmdOpen(true)}
            onMouseEnter={() => setSearchHovered(true)}
            onMouseLeave={() => setSearchHovered(false)}
            sx={{
              display: "flex", alignItems: "center", gap: 1,
              px: 1.5, py: 0.75, borderRadius: "10px",
              cursor: "pointer",
              background: isDark ? "rgba(148,163,184,0.06)" : "rgba(100,116,139,0.06)",
              border: `1px solid ${searchHovered
                ? theme.palette.primary.main
                : isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.22)"}`,
              transition: "border-color 0.2s, background 0.2s",
              "&:hover": { background: isDark ? "rgba(148,163,184,0.09)" : "rgba(100,116,139,0.09)" },
            }}
          >
            <SearchRoundedIcon sx={{ color: theme.palette.text.secondary, fontSize: 15, flexShrink: 0 }} />
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, flex: 1, fontSize: "0.78rem" }}>
              Search or jump to…
            </Typography>
            <Chip
              label="⌘K" size="small"
              sx={{ fontSize: "0.58rem", height: 17, fontFamily: "monospace", opacity: 0.55, px: 0.25 }}
            />
          </Box>
        </motion.div>

        <Box sx={{ flex: 1 }} />

        {/* Live Clock */}
        <LiveClock isDark={isDark} theme={theme} />

        {/* Quick Create */}
        <Tooltip title="New TRF">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}>
            <IconButton
              size="small"
              onClick={() => navigate("/create")}
              sx={{
                background: "linear-gradient(135deg,#6366f1,#06b6d4)",
                color: "#fff", width: 32, height: 32,
                boxShadow: "0 4px 14px rgba(99,102,241,0.38)",
                "&:hover": { boxShadow: "0 6px 20px rgba(99,102,241,0.55)" },
              }}
            >
              <AddRoundedIcon sx={{ fontSize: 17 }} />
            </IconButton>
          </motion.div>
        </Tooltip>

        {/* Theme toggle */}
        <Tooltip title={isDark ? "Light mode" : "Dark mode"}>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}>
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
                  initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
                  animate={{ rotate: 0,   opacity: 1, scale: 1   }}
                  exit={{    rotate: 90,  opacity: 0, scale: 0.6 }}
                  transition={{ duration: 0.2 }}
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
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}>
            <IconButton
              size="small"
              onClick={() => setNotifOpen((o) => !o)}
              className={bellShake ? "bell-shake" : ""}
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
                sx={{ "& .MuiBadge-badge": { fontSize: "0.56rem", height: 14, minWidth: 14 } }}
              >
                <NotificationsRoundedIcon sx={{
                  fontSize: 17,
                  color: notifOpen ? theme.palette.primary.main : theme.palette.text.secondary,
                }} />
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
            boxShadow: "0 2px 6px rgba(99,102,241,0.25)",
          }}>
            {user?.avatar
              ? <Box component="img" src={user.avatar} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : initials
            }
          </Avatar>
          <Box>
            <Typography variant="caption" sx={{
              fontWeight: 700, color: theme.palette.text.primary, display: "block",
              maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              lineHeight: 1.3, fontSize: "0.76rem",
            }}>
              {displayName}
            </Typography>
            <Typography sx={{ fontSize: "0.62rem", color: theme.palette.text.disabled, lineHeight: 1.2 }}>
              {user?.role || "Admin"}
            </Typography>
          </Box>
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
            width: 240, mt: 1, borderRadius: "16px",
            background: isDark ? "rgba(10,15,30,0.97)" : "rgba(255,255,255,0.98)",
            backdropFilter: "blur(30px)",
            border: `1px solid ${border}`,
            boxShadow: isDark ? "0 24px 48px rgba(0,0,0,0.55)" : "0 24px 48px rgba(15,23,42,0.15)",
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        {/* User header */}
        <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar sx={{
            width: 40, height: 40, fontWeight: 700, fontSize: "0.9rem",
            background: "linear-gradient(135deg,#6366f1,#06b6d4)",
            boxShadow: "0 4px 12px rgba(99,102,241,0.35)",
          }}>
            {initials}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight={700} sx={{ fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {displayName}
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: "0.7rem" }}>
              {user?.email || `${user?.username || "admin"}@trf.com`}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ px: 2, pb: 1 }}>
          <Chip
            label={user?.role || "Administrator"}
            size="small"
            sx={{
              fontSize: "0.65rem", height: 20, fontWeight: 700,
              background: "rgba(99,102,241,0.12)", color: "#818cf8",
              border: "1px solid rgba(99,102,241,0.25)",
            }}
          />
        </Box>

        <Divider sx={{ borderColor: border }} />

        {[
          { icon: <PersonRoundedIcon sx={{ fontSize: 16 }} />, label: "View Profile",  path: "/profile" },
          { icon: <EditRoundedIcon   sx={{ fontSize: 16 }} />, label: "Edit Profile",  path: "/profile?tab=edit" },
          { icon: <SettingsRoundedIcon sx={{ fontSize: 16 }} />, label: "Settings",    path: "/settings" },
        ].map((item) => (
          <MenuItem
            key={item.label}
            onClick={() => { setProfileAnchor(null); navigate(item.path); }}
            sx={{ gap: 1.5, px: 2, py: 1, fontSize: "0.82rem",
              "&:hover": { background: isDark ? "rgba(148,163,184,0.07)" : "rgba(100,116,139,0.06)" } }}
          >
            {item.icon} {item.label}
          </MenuItem>
        ))}

        <Divider sx={{ borderColor: border }} />

        <MenuItem
          onClick={handleSignOut}
          sx={{ gap: 1.5, px: 2, py: 1, fontSize: "0.82rem",
            color: theme.palette.error.main,
            "&:hover": { background: "rgba(239,68,68,0.08)" } }}
        >
          <LogoutRoundedIcon sx={{ fontSize: 16 }} /> Sign Out
        </MenuItem>
      </Menu>

      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </>
  );
}
