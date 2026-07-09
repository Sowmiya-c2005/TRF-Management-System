import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@mui/material/styles";
import {
  Box, Typography, Avatar, Chip, Divider,
  IconButton, Tooltip, CircularProgress, Alert
} from "@mui/material";
import { useApp } from "../context/AppContext";
import toast from "react-hot-toast";

import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import CommentRoundedIcon from "@mui/icons-material/CommentRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";

const ACTION_CONFIG = {
  "TRF_ASSIGNED": {
    icon: <AssignmentRoundedIcon sx={{ fontSize: 16 }} />,
    color: "#6366f1",
    label: "TRF Assigned"
  },
  "STATUS_CHANGED": {
    icon: <CheckCircleRoundedIcon sx={{ fontSize: 16 }} />,
    color: "#10b981",
    label: "Status Changed"
  },
  "COMMENT_ADDED": {
    icon: <CommentRoundedIcon sx={{ fontSize: 16 }} />,
    color: "#06b6d4",
    label: "Comment Added"
  },
  "DOCUMENT_UPLOADED": {
    icon: <UploadFileRoundedIcon sx={{ fontSize: 16 }} />,
    color: "#f59e0b",
    label: "Document Uploaded"
  },
  "TRF_CREATED": {
    icon: <AssignmentRoundedIcon sx={{ fontSize: 16 }} />,
    color: "#a855f7",
    label: "TRF Created"
  },
  "TRF_UPDATED": {
    icon: <EditRoundedIcon sx={{ fontSize: 16 }} />,
    color: "#ec4899",
    label: "TRF Updated"
  },
  "default": {
    icon: <PersonRoundedIcon sx={{ fontSize: 16 }} />,
    color: "#64748b",
    label: "Activity"
  }
};

function timeAgo(date) {
  const d = date instanceof Date ? date : new Date(date);
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 604800) return `${Math.floor(sec / 86400)}d ago`;
  return d.toLocaleDateString();
}

export default function ActivityTimeline({ trfId, limit = 10 }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { user } = useApp();

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (trfId) {
      fetchActivities();
    }
  }, [trfId]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/activities/trf/${trfId}?limit=${expanded ? 50 : limit}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
      } else {
        console.error('Failed to fetch activities');
      }
    } catch (error) {
      console.error('Activities fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const displayedActivities = expanded ? activities : activities.slice(0, limit);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (activities.length === 0) {
    return (
      <Alert severity="info" sx={{ borderRadius: 2 }}>
        <Typography variant="body2">No activity recorded yet</Typography>
      </Alert>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ color: theme.palette.text.primary }}>
          Activity Timeline
        </Typography>
        {activities.length > limit && (
          <IconButton
            size="small"
            onClick={() => setExpanded(!expanded)}
            sx={{ color: theme.palette.primary.main }}
          >
            {expanded ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
          </IconButton>
        )}
      </Box>

      {/* Timeline */}
      <Box sx={{ position: "relative", pl: 3 }}>
        {/* Vertical line */}
        <Box
          sx={{
            position: "absolute",
            left: 7,
            top: 8,
            bottom: 8,
            width: 2,
            background: isDark ? "rgba(148,163,184,0.2)" : "rgba(148,163,184,0.3)",
            borderRadius: 1,
          }}
        />

        <AnimatePresence>
          {displayedActivities.map((activity, index) => {
            const config = ACTION_CONFIG[activity.action_type] || ACTION_CONFIG["default"];
            
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                style={{ position: "relative", paddingBottom: index < displayedActivities.length - 1 ? 2 : 0 }}
              >
                {/* Timeline dot */}
                <Box
                  sx={{
                    position: "absolute",
                    left: -23,
                    top: 12,
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: config.color,
                    border: `2px solid ${isDark ? "rgba(10,15,30,0.97)" : "rgba(255,255,255,0.98)"}`,
                    boxShadow: `0 0 0 4px ${isDark ? "rgba(10,15,30,0.97)" : "rgba(255,255,255,0.98)"}`,
                    zIndex: 1,
                  }}
                />

                {/* Activity card */}
                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
                    p: 2,
                    borderRadius: "12px",
                    background: isDark ? "rgba(148,163,184,0.04)" : "rgba(148,163,184,0.06)",
                    border: `1px solid ${isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.15)"}`,
                    transition: "all 0.2s",
                    "&:hover": {
                      background: isDark ? "rgba(148,163,184,0.08)" : "rgba(148,163,184,0.1)",
                    },
                  }}
                >
                  {/* Icon */}
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "10px",
                      background: `${config.color}15`,
                      border: `1px solid ${config.color}30`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: config.color,
                      flexShrink: 0,
                    }}
                  >
                    {config.icon}
                  </Box>

                  {/* Content */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1, mb: 0.5 }}>
                      <Typography variant="body2" fontWeight={600} sx={{ color: theme.palette.text.primary }}>
                        {config.label}
                      </Typography>
                      <Typography variant="caption" sx={{ color: theme.palette.text.disabled, flexShrink: 0 }}>
                        {timeAgo(activity.created_at)}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" sx={{ 
                      color: theme.palette.text.secondary, 
                      fontSize: "0.85rem",
                      lineHeight: 1.4,
                      mb: 0.5,
                    }}>
                      {activity.description}
                    </Typography>

                    {/* User info */}
                    {activity.username && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Avatar sx={{ width: 20, height: 20, fontSize: 10, background: config.color }}>
                          {activity.username[0]?.toUpperCase()}
                        </Avatar>
                        <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>
                          {activity.username}
                          {activity.user_role && ` · ${activity.user_role}`}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </Box>

      {/* Show more indicator */}
      {!expanded && activities.length > limit && (
        <Box sx={{ textAlign: "center", pt: 1 }}>
          <Typography
            variant="caption"
            sx={{ 
              color: theme.palette.primary.main, 
              cursor: "pointer",
              fontWeight: 600,
              "&:hover": { textDecoration: "underline" }
            }}
            onClick={() => setExpanded(true)}
          >
            +{activities.length - limit} more activities
          </Typography>
        </Box>
      )}
    </Box>
  );
}
