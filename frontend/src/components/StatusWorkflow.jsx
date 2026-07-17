import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@mui/material/styles";
import {
  Box, Typography, Chip, Button, Menu, MenuItem,
  IconButton, Tooltip, CircularProgress
} from "@mui/material";
import API from "../services/api";
import toast from "react-hot-toast";

import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import PendingRoundedIcon from "@mui/icons-material/PendingRounded";
import HourglassEmptyRoundedIcon from "@mui/icons-material/HourglassEmptyRounded";
import AssignmentTurnInRoundedIcon from "@mui/icons-material/AssignmentTurnInRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import ArchiveRoundedIcon from "@mui/icons-material/ArchiveRounded";

const STATUS_CONFIG = {
  "Draft": {
    label: "Draft",
    color: "#94a3b8",
    bgColor: "rgba(148,163,184,0.15)",
    icon: <PendingRoundedIcon sx={{ fontSize: 16 }} />,
    nextStatuses: ["Assigned", "Archived"]
  },
  "Assigned": {
    label: "Assigned",
    color: "#6366f1",
    bgColor: "rgba(99,102,241,0.15)",
    icon: <AssignmentTurnInRoundedIcon sx={{ fontSize: 16 }} />,
    nextStatuses: ["In Progress", "Archived"]
  },
  "In Progress": {
    label: "In Progress",
    color: "#06b6d4",
    bgColor: "rgba(6,182,212,0.15)",
    icon: <HourglassEmptyRoundedIcon sx={{ fontSize: 16 }} />,
    nextStatuses: ["Under Review", "Archived"]
  },
  "Under Review": {
    label: "Under Review",
    color: "#f59e0b",
    bgColor: "rgba(245,158,11,0.15)",
    icon: <PendingRoundedIcon sx={{ fontSize: 16 }} />,
    nextStatuses: ["Approved", "In Progress", "Archived"]
  },
  "Approved": {
    label: "Approved",
    color: "#10b981",
    bgColor: "rgba(16,185,129,0.15)",
    icon: <CheckCircleRoundedIcon sx={{ fontSize: 16 }} />,
    nextStatuses: ["Completed", "Under Review", "Archived"]
  },
  "Completed": {
    label: "Completed",
    color: "#3b82f6",
    bgColor: "rgba(59,130,246,0.15)",
    icon: <TaskAltRoundedIcon sx={{ fontSize: 16 }} />,
    nextStatuses: ["Archived"]
  },
  "Archived": {
    label: "Archived",
    color: "#64748b",
    bgColor: "rgba(100,116,139,0.15)",
    icon: <ArchiveRoundedIcon sx={{ fontSize: 16 }} />,
    nextStatuses: []
  }
};

const STATUS_ORDER = ["Draft", "Assigned", "In Progress", "Under Review", "Approved", "Completed", "Archived"];

export default function StatusWorkflow({ trf, onUpdate, editable = true }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [anchorEl, setAnchorEl] = useState(null);
  const [updating, setUpdating] = useState(false);

  const currentStatus = trf?.status || "Draft";
  const config = STATUS_CONFIG[currentStatus] || STATUS_CONFIG["Draft"];

  const handleMenuOpen = (e) => {
    if (!editable) return;
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleStatusChange = async (newStatus) => {
    handleMenuClose();
    setUpdating(true);
    try {
      await API.put(`/assignments/trf/${trf.id}/status`, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      onUpdate?.({ ...trf, status: newStatus });
    } catch (error) {
      console.error('Status update error:', error);
      toast.error(error?.response?.data?.detail || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const currentIndex = STATUS_ORDER.indexOf(currentStatus);
  const progress = ((currentIndex + 1) / STATUS_ORDER.length) * 100;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Current Status Badge */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <motion.div
          whileHover={editable ? { scale: 1.02 } : {}}
          whileTap={editable ? { scale: 0.98 } : {}}
        >
          <Chip
            icon={config.icon}
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="body2" fontWeight={600}>
                  {config.label}
                </Typography>
                {updating && <CircularProgress size={12} sx={{ color: "inherit" }} />}
              </Box>
            }
            onClick={handleMenuOpen}
            sx={{
              background: config.bgColor,
              color: config.color,
              border: `1px solid ${config.color}40`,
              px: 1,
              py: 1.5,
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: editable ? "pointer" : "default",
              "&:hover": editable ? {
                background: config.bgColor.replace("0.15", "0.25"),
              } : {},
            }}
          />
        </motion.div>

        {editable && (
          <Tooltip title="Change Status">
            <IconButton size="small" onClick={handleMenuOpen} disabled={updating}>
              <MoreVertRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Status Progress Bar */}
      <Box sx={{ position: "relative", pt: 1 }}>
        <Box
          sx={{
            height: 4,
            borderRadius: 2,
            background: isDark ? "rgba(148,163,184,0.2)" : "rgba(148,163,184,0.3)",
            overflow: "hidden",
          }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
              height: "100%",
              background: `linear-gradient(90deg, ${config.color}, ${config.color}aa)`,
            }}
          />
        </Box>
      </Box>

      {/* Status Dropdown Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            borderRadius: "12px",
            background: isDark ? "rgba(10,15,30,0.97)" : "rgba(255,255,255,0.98)",
            backdropFilter: "blur(30px)",
            border: `1px solid ${isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.2)"}`,
            boxShadow: isDark
              ? "0 16px 32px rgba(0,0,0,0.4)"
              : "0 16px 32px rgba(15,23,42,0.12)",
            minWidth: 180,
          }
        }}
      >
        <MenuItem disabled sx={{ opacity: 0.7 }}>
          <Typography variant="caption" fontWeight={600} sx={{ color: theme.palette.text.secondary }}>
            Change to:
          </Typography>
        </MenuItem>
        {config.nextStatuses.map((status) => {
          const statusConfig = STATUS_CONFIG[status];
          return (
            <MenuItem
              key={status}
              onClick={() => handleStatusChange(status)}
              disabled={updating}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                py: 1,
              }}
            >
              {statusConfig.icon}
              <Typography variant="body2" fontWeight={500}>
                {statusConfig.label}
              </Typography>
            </MenuItem>
          );
        })}
        {config.nextStatuses.length === 0 && (
          <MenuItem disabled>
            <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>
              No valid transitions
            </Typography>
          </MenuItem>
        )}
      </Menu>

      {/* Status Timeline (Visual) */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1 }}>
        {STATUS_ORDER.map((status, index) => {
          const isPast = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isFuture = index > currentIndex;
          const statusConfig = STATUS_CONFIG[status];

          return (
            <Box
              key={status}
              sx={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: 0.5,
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: isPast
                    ? statusConfig.color
                    : isCurrent
                    ? statusConfig.color
                    : isDark
                    ? "rgba(148,163,184,0.3)"
                    : "rgba(148,163,184,0.4)",
                  border: isCurrent ? `2px solid ${statusConfig.color}` : "none",
                  transition: "all 0.3s",
                }}
              />
              {index < STATUS_ORDER.length - 1 && (
                <Box
                  sx={{
                    flex: 1,
                    height: 2,
                    background: isPast
                      ? statusConfig.color
                      : isDark
                      ? "rgba(148,163,184,0.2)"
                      : "rgba(148,163,184,0.3)",
                    borderRadius: 1,
                  }}
                />
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
