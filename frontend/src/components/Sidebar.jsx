import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@mui/material/styles";
import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";

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
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import ArticleRoundedIcon      from "@mui/icons-material/ArticleRounded";
import HistoryRoundedIcon      from "@mui/icons-material/HistoryRounded";

import { useApp } from "../context/AppContext";

const NAV_ITEMS = [
  { path: "/",              label: "Dashboard",     icon: <DashboardRoundedIcon />,     group: "main"    },
  { path: "/create",        label: "Create TRF",    icon: <AddBoxRoundedIcon />,        group: "main"    },
  { path: "/search",        label: "Search TRF",    icon: <SearchRoundedIcon />,        group: "main"    },
  { path: "/all",           label: "All TRFs",      icon: <ListAltRoundedIcon />,       group: "main"    },
  { path: "/upload",        label: "Upload Files",  icon: <CloudUploadRoundedIcon />,   group: "files"   },
  { path: "/files",         label: "File Manager",  icon: <FolderOpenRoundedIcon />,    group: "files"   },
  { path: "/update",        label: "Update TRF",    icon: <EditRoundedIcon />,          group: "files"   },
  { path: "/analytics",     label: "Analytics",     icon: <BarChartRoundedIcon />,      group: "insights"},
  { path: "/reports",       label: "Reports",       icon: <AssessmentRoundedIcon />,    group: "insights"},
  { path: "/notifications", label: "Notifications", icon: <NotificationsRoundedIcon />, group: "admin", badge: true },
  { path: "/users",         label: "Users",         icon: <PeopleRoundedIcon />,        group: "admin"   },
  { path: "/audit",         label: "Audit Log",     icon: <HistoryRoundedIcon />,       group: "admin", adminOnly: true },
  { path: "/settings",      label: "Settings",      icon: <SettingsRoundedIcon />,      group: "admin"   },
];

const GROUPS = [
  { key: "main",     label: "WORKSPACE",  color: "#6366f1" },
  { key: "files",    label: "FILES",      color: "#06b6d4" },
  { key: "insights", label: "INSIGHTS",   color: "#10b981" },
  { key: "admin",    label: "ADMIN",      color: "#a855f7" },
];

function NavItem({ item, active, collapsed, isDark, theme, index, unreadCount }) {
  const hasBadge = item.badge && unreadCount > 0;

  return (
    <Tooltip title={collapsed ? item.label : ""} placement="right" arrow>
      <motion.div
        initial={{ opacity: 0, x: -15 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.04, duration: 0.25 }}
      >
        <Link to={item.path} style={{ textDecoration: "none" }}>
          <motion.div
            whileHover={{ x: collapsed ? 0 : 4, scale: collapsed ? 1.06 : 1.01 }}
            whileTap={{ scale: 0.96 }}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: collapsed ? "9px" : "9px 12px",
              borderRadius: 11,
              justifyContent: collapsed ? "center" : "flex-start",
              marginBottom: 3,
              background: active
                ? "linear-gradient(135deg,rgba(99,102,241,0.22),rgba(6,182,212,0.16))"
                : "transparent",
              border: `1px solid ${active ? "rgba(99,102,241,0.38)" : "transparent"}`,
              cursor: "pointer",
              position: "relative", overflow: "hidden",
              transition: "background 0.18s, border-color 0.18s",
            }}
          >
            {/* Active left bar */}
            {active && (
              <motion.div
                layoutId="activeBar"
                style={{
                  position: "absolute", left: 0, top: "15%", bottom: "15%",
                  width: 3, borderRadius: "0 3px 3px 0",
                  background: "linear-gradient(180deg,#6366f1,#06b6d4)",
                }}
                transition={{ duration: 0.3, ease: [0.4,0,0.2,1] }}
              />
            )}

            {/* Icon */}
            <Box sx={{
              color: active ? theme.palette.primary.main : theme.palette.text.secondary,
              display: "flex", alignItems: "center", position: "relative",
              "& svg": { fontSize: "1.15rem" },
              transition: "color 0.18s",
            }}>
              {hasBadge ? (
                <Badge
                  badgeContent={unreadCount}
                  color="error"
                  sx={{ "& .MuiBadge-badge": { fontSize: "0.55rem", height: 14, minWidth: 14 } }}
                >
                  {item.icon}
                </Badge>
              ) : item.icon}
            </Box>

            {/* Label */}
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.18 }}
                  style={{
                    fontSize: "0.83rem",
                    fontWeight: active ? 700 : 500,
                    color: active ? theme.palette.text.primary : theme.palette.text.secondary,
                    whiteSpace: "nowrap",
                    flex: 1,
                  }}
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>

            {/* Unread count badge on right when expanded */}
            {!collapsed && hasBadge && (
              <Box sx={{
                minWidth: 18, height: 18, borderRadius: "9px",
                background: "#ef4444",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.6rem", fontWeight: 700, color: "#fff",
              }}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </Box>
            )}
          </motion.div>
        </Link>
      </motion.div>
    </Tooltip>
  );
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location  = useLocation();
  const navigate  = useNavigate();
  const theme     = useTheme();
  const isDark    = theme.palette.mode === "dark";
  const { user, signOut, unreadCount } = useApp();

  const displayName = user?.displayName || user?.username || "Admin";
  const roleLabel   = user?.role || "Administrator";
  const initials    = displayName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const borderColor = isDark ? "rgba(148,163,184,0.08)" : "rgba(148,163,184,0.18)";

  // Animate logo orb
  const [logoHovered, setLogoHovered] = useState(false);

  const handleSignOut = () => { signOut(); navigate("/login"); };

  return (
    <motion.div
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
      style={{
        minHeight: "100vh",
        background: isDark
          ? "linear-gradient(180deg,#0d1117 0%,#0a0f1e 100%)"
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
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              style={{ display: "flex", alignItems: "center", gap: 10 }}
            >
              <motion.div
                animate={{ rotate: logoHovered ? 360 : 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                onMouseEnter={() => setLogoHovered(true)}
                onMouseLeave={() => setLogoHovered(false)}
              >
                <Box sx={{
                  width: 36, height: 36, borderRadius: "10px", flexShrink: 0,
                  background: "linear-gradient(135deg,#6366f1,#06b6d4)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 4px 14px rgba(99,102,241,0.45)",
                }}>
                  <FolderSpecialRoundedIcon sx={{ color: "#fff", fontSize: 20 }} />
                </Box>
              </motion.div>
              <Box>
                <Typography variant="subtitle2" sx={{
                  color: theme.palette.text.primary, fontWeight: 800,
                  fontSize: "0.88rem", lineHeight: 1.2,
                  fontFamily: "'Outfit', 'Inter', sans-serif",
                }}>
                  TRF Portal
                </Typography>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: "0.67rem" }}>
                  Enterprise Edition
                </Typography>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.92 }}
          onClick={() => setCollapsed((c) => !c)}
          style={{
            background: isDark ? "rgba(148,163,184,0.08)" : "rgba(100,116,139,0.09)",
            border: "none", borderRadius: 8, width: 28, height: 28,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: theme.palette.text.secondary, flexShrink: 0,
            transition: "background 0.18s",
          }}
        >
          {collapsed
            ? <ChevronRightRoundedIcon sx={{ fontSize: 18 }} />
            : <ChevronLeftRoundedIcon  sx={{ fontSize: 18 }} />
          }
        </motion.button>
      </Box>

      {/* ── Nav items ── */}
      <Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden", py: 1.5, px: collapsed ? 1 : 1.5 }}>
        {GROUPS.map((group) => {
          const items = NAV_ITEMS.filter((n) => n.group === group.key);
          return (
            <Box key={group.key} sx={{ mb: 1.5 }}>
              <AnimatePresence>
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1, pb: 0.75, pt: 1 }}>
                      <Box sx={{ width: 4, height: 4, borderRadius: "50%", background: group.color, opacity: 0.7 }} />
                      <Typography variant="caption" sx={{
                        color: theme.palette.text.disabled, fontWeight: 700,
                        fontSize: "0.63rem", letterSpacing: "0.1em",
                      }}>
                        {group.label}
                      </Typography>
                    </Box>
                  </motion.div>
                )}
              </AnimatePresence>
              {items.map((item, i) => {
                // Hide admin-only items from non-Admin users
                if (item.adminOnly && user?.role !== "Admin") return null;
                return (
                  <NavItem
                    key={item.path} item={item}
                    active={location.pathname === item.path}
                    collapsed={collapsed} isDark={isDark} theme={theme} index={i}
                    unreadCount={unreadCount}
                  />
                );
              })}
            </Box>
          );
        })}
      </Box>

      {/* ── User pill ── */}
      <Box sx={{ px: collapsed ? 1 : 1.5, py: 1.5, borderTop: `1px solid ${borderColor}` }}>
        <Tooltip title={collapsed ? `${displayName} — Profile` : ""} placement="right">
          <Box
            onClick={() => navigate("/profile")}
            sx={{
              display: "flex", alignItems: "center", gap: 1.5, p: 1,
              borderRadius: "11px", cursor: "pointer",
              justifyContent: collapsed ? "center" : "flex-start",
              "&:hover": { background: isDark ? "rgba(148,163,184,0.07)" : "rgba(100,116,139,0.07)" },
              transition: "background 0.18s",
            }}
          >
            <Avatar sx={{
              width: 32, height: 32, fontWeight: 700, fontSize: "0.75rem", flexShrink: 0,
              background: user?.avatar ? "transparent" : "linear-gradient(135deg,#6366f1,#06b6d4)",
              boxShadow: "0 2px 8px rgba(99,102,241,0.3)",
            }}>
              {user?.avatar
                ? <Box component="img" src={user.avatar} sx={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} alt="" />
                : initials
              }
            </Avatar>

            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }} style={{ flex: 1, minWidth: 0 }}
                >
                  <Typography variant="body2" sx={{
                    fontWeight: 700, color: theme.palette.text.primary,
                    fontSize: "0.8rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
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
