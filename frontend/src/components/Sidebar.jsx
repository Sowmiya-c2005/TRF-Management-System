import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@mui/material/styles";
import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";

import DashboardRoundedIcon    from "@mui/icons-material/DashboardRounded";
import AddBoxRoundedIcon       from "@mui/icons-material/AddBoxRounded";
import SearchRoundedIcon       from "@mui/icons-material/SearchRounded";
import ListAltRoundedIcon      from "@mui/icons-material/ListAltRounded";
import CloudUploadRoundedIcon  from "@mui/icons-material/CloudUploadRounded";
import FolderOpenRoundedIcon   from "@mui/icons-material/FolderOpenRounded";
import EditRoundedIcon         from "@mui/icons-material/EditRounded";
import BarChartRoundedIcon     from "@mui/icons-material/BarChartRounded";
import PeopleRoundedIcon       from "@mui/icons-material/PeopleRounded";
import SettingsRoundedIcon     from "@mui/icons-material/SettingsRounded";
import ChevronLeftRoundedIcon  from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import FolderSpecialRoundedIcon from "@mui/icons-material/FolderSpecialRounded";
import AssessmentRoundedIcon   from "@mui/icons-material/AssessmentRounded";
import LogoutRoundedIcon       from "@mui/icons-material/LogoutRounded";

import { useApp } from "../context/AppContext";

const NAV_ITEMS = [
  { path: "/",          label: "Dashboard",    icon: <DashboardRoundedIcon />,   group: "main" },
  { path: "/create",    label: "Create TRF",   icon: <AddBoxRoundedIcon />,      group: "main" },
  { path: "/search",    label: "Search TRF",   icon: <SearchRoundedIcon />,      group: "main" },
  { path: "/all",       label: "All TRFs",     icon: <ListAltRoundedIcon />,     group: "main" },
  { path: "/upload",    label: "Upload Files", icon: <CloudUploadRoundedIcon />, group: "files" },
  { path: "/files",     label: "File Manager", icon: <FolderOpenRoundedIcon />,  group: "files" },
  { path: "/update",    label: "Update TRF",   icon: <EditRoundedIcon />,        group: "files" },
  { path: "/analytics", label: "Analytics",   icon: <BarChartRoundedIcon />,    group: "insights" },
  { path: "/reports",   label: "Reports",      icon: <AssessmentRoundedIcon />,  group: "insights" },
  { path: "/users",     label: "Users",        icon: <PeopleRoundedIcon />,      group: "admin" },
  { path: "/settings",  label: "Settings",     icon: <SettingsRoundedIcon />,    group: "admin" },
];

const GROUPS = [
  { key: "main",     label: "WORKSPACE" },
  { key: "files",    label: "FILES" },
  { key: "insights", label: "INSIGHTS" },
  { key: "admin",    label: "ADMIN" },
];

function NavItem({ item, active, collapsed, isDark, theme, index }) {
  return (
    <Tooltip title={collapsed ? item.label : ""} placement="right" arrow>
      <motion.div
        initial={{ opacity: 0, x: -15 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.04, duration: 0.25 }}
      >
        <Link to={item.path} style={{ textDecoration: "none" }}>
          <motion.div
            whileHover={{ x: collapsed ? 0 : 3, scale: collapsed ? 1.05 : 1 }}
            whileTap={{ scale: 0.97 }}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: collapsed ? "9px" : "9px 12px",
              borderRadius: 10,
              justifyContent: collapsed ? "center" : "flex-start",
              marginBottom: 2,
              background: active
                ? "linear-gradient(135deg,rgba(99,102,241,0.2),rgba(6,182,212,0.15))"
                : "transparent",
              border: `1px solid ${active ? "rgba(99,102,241,0.4)" : "transparent"}`,
              cursor: "pointer",
              position: "relative", overflow: "hidden",
            }}
          >
            {active && (
              <motion.div
                layoutId="activeIndicator"
                style={{
                  position: "absolute", left: 0, top: "20%", bottom: "20%",
                  width: 3, borderRadius: "0 3px 3px 0",
                  background: "linear-gradient(180deg,#6366f1,#06b6d4)",
                }}
              />
            )}
            <Box sx={{
              color: active ? theme.palette.primary.main : theme.palette.text.secondary,
              display: "flex", alignItems: "center",
              "& svg": { fontSize: "1.15rem" },
            }}>
              {item.icon}
            </Box>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    fontSize: "0.83rem",
                    fontWeight: active ? 600 : 500,
                    color: active ? theme.palette.text.primary : theme.palette.text.secondary,
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        </Link>
      </motion.div>
    </Tooltip>
  );
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate  = useNavigate();
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { user, signOut } = useApp();

  const displayName = user?.displayName || user?.username || "Admin";
  const roleLabel   = user?.role || "Administrator";
  const initials    = displayName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const borderColor = isDark ? "rgba(148,163,184,0.08)" : "rgba(148,163,184,0.2)";

  const handleSignOut = () => {
    signOut();
    navigate("/login");
  };

  return (
    <motion.div
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      style={{
        minHeight: "100vh",
        background: isDark
          ? "linear-gradient(180deg,#0d1117 0%,#0f172a 100%)"
          : "linear-gradient(180deg,#ffffff 0%,#f8fafc 100%)",
        borderRight: `1px solid ${borderColor}`,
        display: "flex", flexDirection: "column",
        overflow: "hidden", flexShrink: 0,
        position: "relative", zIndex: 100,
      }}
    >
      {/* ── Logo row ── */}
      <Box sx={{
        display: "flex", alignItems: "center",
        justifyContent: collapsed ? "center" : "space-between",
        px: collapsed ? 1.5 : 2.5, py: 2.5,
        borderBottom: `1px solid ${borderColor}`,
        minHeight: 64,
      }}>
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}
              style={{ display: "flex", alignItems: "center", gap: 10 }}
            >
              <Box sx={{
                width: 36, height: 36, borderRadius: "10px",
                background: "linear-gradient(135deg,#6366f1,#06b6d4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 12px rgba(99,102,241,0.4)", flexShrink: 0,
              }}>
                <FolderSpecialRoundedIcon sx={{ color: "#fff", fontSize: 20 }} />
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ color: theme.palette.text.primary, fontWeight: 700, fontSize: "0.875rem", lineHeight: 1.2 }}>
                  TRF Portal
                </Typography>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: "0.7rem" }}>
                  Enterprise Edition
                </Typography>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
          onClick={() => setCollapsed((c) => !c)}
          style={{
            background: isDark ? "rgba(148,163,184,0.08)" : "rgba(100,116,139,0.1)",
            border: "none", borderRadius: 8, width: 28, height: 28,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: theme.palette.text.secondary, flexShrink: 0,
          }}
        >
          {collapsed ? <ChevronRightRoundedIcon sx={{ fontSize: 18 }} /> : <ChevronLeftRoundedIcon sx={{ fontSize: 18 }} />}
        </motion.button>
      </Box>

      {/* ── Nav items ── */}
      <Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden", py: 1.5, px: collapsed ? 1 : 1.5 }}>
        {GROUPS.map((group) => {
          const items = NAV_ITEMS.filter((n) => n.group === group.key);
          return (
            <Box key={group.key} sx={{ mb: 1 }}>
              <AnimatePresence>
                {!collapsed && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                    <Typography variant="caption" sx={{
                      display: "block", color: theme.palette.text.disabled,
                      fontWeight: 700, fontSize: "0.65rem", letterSpacing: "0.08em",
                      px: 1, pb: 0.5, pt: 1,
                    }}>
                      {group.label}
                    </Typography>
                  </motion.div>
                )}
              </AnimatePresence>
              {items.map((item, i) => (
                <NavItem
                  key={item.path} item={item}
                  active={location.pathname === item.path}
                  collapsed={collapsed} isDark={isDark} theme={theme} index={i}
                />
              ))}
            </Box>
          );
        })}
      </Box>

      {/* ── User pill ── */}
      <Box sx={{ px: collapsed ? 1 : 1.5, py: 1.5, borderTop: `1px solid ${borderColor}` }}>
        <Tooltip title={collapsed ? `${displayName} — Sign out` : ""} placement="right">
          <Box
            onClick={() => navigate("/profile")}
            sx={{
              display: "flex", alignItems: "center", gap: 1.5, p: 1,
              borderRadius: "10px", cursor: "pointer",
              justifyContent: collapsed ? "center" : "flex-start",
              "&:hover": { background: isDark ? "rgba(148,163,184,0.07)" : "rgba(100,116,139,0.08)" },
              transition: "background 0.2s",
            }}
          >
            <Avatar sx={{
              width: 32, height: 32, fontWeight: 700, fontSize: "0.75rem", flexShrink: 0,
              background: user?.avatar ? "transparent" : "linear-gradient(135deg,#6366f1,#06b6d4)",
            }}>
              {user?.avatar
                ? <Box component="img" src={user.avatar} sx={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} alt="" />
                : initials
              }
            </Avatar>
            <AnimatePresence>
              {!collapsed && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                  style={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: "0.8rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {displayName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: "0.68rem" }}>
                    {roleLabel}
                  </Typography>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {!collapsed && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Tooltip title="Sign out">
                    <Box
                      component="span"
                      onClick={(e) => { e.stopPropagation(); handleSignOut(); }}
                      sx={{
                        display: "flex", p: 0.5, borderRadius: "6px",
                        color: theme.palette.text.secondary,
                        "&:hover": { color: theme.palette.error.main, background: "rgba(239,68,68,0.08)" },
                        transition: "all 0.15s",
                      }}
                    >
                      <LogoutRoundedIcon sx={{ fontSize: 15 }} />
                    </Box>
                  </Tooltip>
                </motion.div>
              )}
            </AnimatePresence>
          </Box>
        </Tooltip>
      </Box>
    </motion.div>
  );
}
