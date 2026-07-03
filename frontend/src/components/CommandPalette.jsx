import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import InputBase from "@mui/material/InputBase";
import Chip from "@mui/material/Chip";

import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import AddBoxRoundedIcon from "@mui/icons-material/AddBoxRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ListAltRoundedIcon from "@mui/icons-material/ListAltRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded";
import KeyboardReturnRoundedIcon from "@mui/icons-material/KeyboardReturnRounded";
import SearchIcon from "@mui/icons-material/Search";

const ALL_COMMANDS = [
  { id: "nav-dash",     label: "Go to Dashboard",    path: "/",          icon: <DashboardRoundedIcon />,    category: "Navigate" },
  { id: "nav-create",   label: "Create New TRF",      path: "/create",    icon: <AddBoxRoundedIcon />,       category: "Navigate" },
  { id: "nav-search",   label: "Search TRF",          path: "/search",    icon: <SearchRoundedIcon />,       category: "Navigate" },
  { id: "nav-all",      label: "View All TRFs",       path: "/all",       icon: <ListAltRoundedIcon />,      category: "Navigate" },
  { id: "nav-upload",   label: "Upload Files",        path: "/upload",    icon: <CloudUploadRoundedIcon />,  category: "Navigate" },
  { id: "nav-files",    label: "File Manager",        path: "/files",     icon: <FolderOpenRoundedIcon />,   category: "Navigate" },
  { id: "nav-analytics",label: "Analytics",           path: "/analytics", icon: <BarChartRoundedIcon />,     category: "Navigate" },
  { id: "nav-reports",  label: "Reports",             path: "/reports",   icon: <AssessmentRoundedIcon />,   category: "Navigate" },
  { id: "nav-users",    label: "User Management",     path: "/users",     icon: <PeopleRoundedIcon />,       category: "Navigate" },
  { id: "nav-settings", label: "Settings",            path: "/settings",  icon: <SettingsRoundedIcon />,     category: "Navigate" },
  { id: "nav-profile",  label: "My Profile",          path: "/profile",   icon: <PeopleRoundedIcon />,       category: "Navigate" },
  { id: "nav-audit",    label: "Audit Log",            path: "/audit",     icon: <AssessmentRoundedIcon />,   category: "Navigate" },
];

export default function CommandPalette({ open, onClose }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);

  const filtered = query.trim()
    ? ALL_COMMANDS.filter((c) =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.category.toLowerCase().includes(query.toLowerCase())
      )
    : ALL_COMMANDS;

  const execute = useCallback(
    (cmd) => {
      navigate(cmd.path);
      onClose();
      setQuery("");
      setSelected(0);
    },
    [navigate, onClose]
  );

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  const handleKey = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter" && filtered[selected]) {
      execute(filtered[selected]);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  const groups = [...new Set(filtered.map((c) => c.category))];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "fixed", inset: 0,
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(4px)",
              zIndex: 1400,
            }}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position: "fixed",
              top: "15%",
              left: "50%",
              transform: "translateX(-50%)",
              width: "min(580px, 92vw)",
              zIndex: 1401,
            }}
          >
            <Box
              sx={{
                borderRadius: "18px",
                overflow: "hidden",
                background: isDark ? "rgba(10,15,30,0.97)" : "rgba(255,255,255,0.98)",
                backdropFilter: "blur(30px)",
                border: `1px solid ${isDark ? "rgba(148,163,184,0.15)" : "rgba(148,163,184,0.3)"}`,
                boxShadow: isDark
                  ? "0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)"
                  : "0 40px 80px rgba(15,23,42,0.2)",
              }}
            >
              {/* Search input */}
              <Box
                sx={{
                  display: "flex", alignItems: "center", gap: 1.5,
                  px: 2.5, py: 1.5,
                  borderBottom: `1px solid ${isDark ? "rgba(148,163,184,0.08)" : "rgba(148,163,184,0.15)"}`,
                }}
              >
                <SearchIcon sx={{ color: theme.palette.text.secondary, fontSize: 20, flexShrink: 0 }} />
                <InputBase
                  inputRef={inputRef}
                  placeholder="Search commands, pages, actions…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKey}
                  fullWidth
                  sx={{
                    fontSize: "0.95rem",
                    color: theme.palette.text.primary,
                    "& input::placeholder": { color: theme.palette.text.secondary },
                  }}
                />
                <Chip
                  label="ESC"
                  size="small"
                  onClick={onClose}
                  sx={{ fontSize: "0.65rem", height: 20, fontFamily: "monospace", cursor: "pointer", opacity: 0.7 }}
                />
              </Box>

              {/* Results */}
              <Box sx={{ maxHeight: 380, overflowY: "auto", py: 1 }}>
                {filtered.length === 0 ? (
                  <Box sx={{ py: 5, textAlign: "center" }}>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                      No results for "<b>{query}</b>"
                    </Typography>
                  </Box>
                ) : (
                  groups.map((group) => (
                    <Box key={group} sx={{ mb: 0.5 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          display: "block", px: 3, py: 0.5,
                          color: theme.palette.text.disabled,
                          fontWeight: 700, fontSize: "0.62rem", letterSpacing: "0.08em",
                          textTransform: "uppercase",
                        }}
                      >
                        {group}
                      </Typography>
                      {filtered
                        .filter((c) => c.category === group)
                        .map((cmd) => {
                          const idx = filtered.indexOf(cmd);
                          const isSelected = idx === selected;
                          return (
                            <Box
                              key={cmd.id}
                              onClick={() => execute(cmd)}
                              onMouseEnter={() => setSelected(idx)}
                              sx={{
                                display: "flex", alignItems: "center", gap: 2,
                                px: 3, py: 1,
                                cursor: "pointer",
                                background: isSelected
                                  ? isDark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.08)"
                                  : "transparent",
                                borderLeft: `2px solid ${isSelected ? "#6366f1" : "transparent"}`,
                                transition: "background 0.1s",
                              }}
                            >
                              <Box
                                sx={{
                                  color: isSelected
                                    ? theme.palette.primary.main
                                    : theme.palette.text.secondary,
                                  "& svg": { fontSize: 17 },
                                }}
                              >
                                {cmd.icon}
                              </Box>
                              <Typography
                                variant="body2"
                                sx={{
                                  flex: 1, fontSize: "0.85rem",
                                  fontWeight: isSelected ? 600 : 400,
                                  color: isSelected ? theme.palette.text.primary : theme.palette.text.secondary,
                                }}
                              >
                                {cmd.label}
                              </Typography>
                              {isSelected && (
                                <KeyboardReturnRoundedIcon
                                  sx={{ fontSize: 15, color: theme.palette.text.disabled }}
                                />
                              )}
                            </Box>
                          );
                        })}
                    </Box>
                  ))
                )}
              </Box>

              {/* Footer */}
              <Box
                sx={{
                  px: 2.5, py: 1,
                  borderTop: `1px solid ${isDark ? "rgba(148,163,184,0.08)" : "rgba(148,163,184,0.15)"}`,
                  display: "flex", gap: 2.5,
                }}
              >
                {[
                  ["↑↓", "navigate"],
                  ["↵", "select"],
                  ["ESC", "close"],
                ].map(([key, label]) => (
                  <Box key={key} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Chip label={key} size="small" sx={{ height: 18, fontSize: "0.6rem", fontFamily: "monospace" }} />
                    <Typography variant="caption" sx={{ color: theme.palette.text.disabled, fontSize: "0.68rem" }}>
                      {label}
                    </Typography>
                  </Box>
                ))}
                <Box sx={{ flex: 1 }} />
                <Typography variant="caption" sx={{ color: theme.palette.text.disabled, fontSize: "0.68rem" }}>
                  {filtered.length} results
                </Typography>
              </Box>
            </Box>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
