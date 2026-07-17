/**
 * AssignedWorkspace.jsx
 * Enterprise-grade Kanban workspace for Managers and Engineers.
 * Shows assigned TRFs in status columns. Click a card to open
 * a slide-over console with details, documents, comments, and activity.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import TextField from "@mui/material/TextField";
import Divider from "@mui/material/Divider";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import toast from "react-hot-toast";

import DashboardRoundedIcon       from "@mui/icons-material/DashboardRounded";
import CloseRoundedIcon           from "@mui/icons-material/CloseRounded";
import FolderRoundedIcon          from "@mui/icons-material/FolderRounded";
import UploadFileRoundedIcon      from "@mui/icons-material/UploadFileRounded";
import FileDownloadRoundedIcon    from "@mui/icons-material/FileDownloadRounded";
import DeleteRoundedIcon          from "@mui/icons-material/DeleteRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import SendRoundedIcon            from "@mui/icons-material/SendRounded";
import HistoryRoundedIcon         from "@mui/icons-material/HistoryRounded";
import CalendarTodayRoundedIcon   from "@mui/icons-material/CalendarTodayRounded";
import PriorityHighRoundedIcon    from "@mui/icons-material/PriorityHighRounded";
import PersonRoundedIcon          from "@mui/icons-material/PersonRounded";
import EngineeringRoundedIcon     from "@mui/icons-material/EngineeringRounded";
import RefreshRoundedIcon         from "@mui/icons-material/RefreshRounded";
import CheckCircleRoundedIcon     from "@mui/icons-material/CheckCircleRounded";
import ArrowForwardRoundedIcon    from "@mui/icons-material/ArrowForwardRounded";
import TagRoundedIcon             from "@mui/icons-material/TagRounded";

import API from "../services/api";
import { getMyAssignedTRFs, updateTRFStatus } from "../services/assignmentService";
import { listFiles, uploadFile, deleteFile, downloadFile } from "../services/fileService";
import { useApp } from "../context/AppContext";

// ─── Constants ────────────────────────────────────────────────────────────────

const KANBAN_COLUMNS = [
  { id: "Assigned",     label: "Assigned",     color: "#f59e0b", emoji: "📋" },
  { id: "In Progress",  label: "In Progress",  color: "#06b6d4", emoji: "⚙️" },
  { id: "Under Review", label: "Under Review", color: "#a855f7", emoji: "🔍" },
  { id: "Approved",     label: "Approved",     color: "#10b981", emoji: "✅" },
  { id: "Completed",    label: "Completed",    color: "#6366f1", emoji: "🏁" },
];

const PRIORITY_COLORS = { Critical: "#ef4444", High: "#f97316", Medium: "#f59e0b", Low: "#10b981" };

const VALID_TRANSITIONS = {
  Assigned:       ["In Progress"],
  "In Progress":  ["Under Review"],
  "Under Review": ["Approved", "In Progress"],
  Approved:       ["Completed", "Under Review"],
  Completed:      [],
  Archived:       [],
};

const FOLDERS = ["Documents", "Drawings", "Reports", "Approvals", "Final Submission"];

const STATUS_PCT = {
  Draft: 0, Assigned: 15, "In Progress": 40,
  "Under Review": 65, Approved: 85, Completed: 100, Archived: 100,
};

function timeAgo(date) {
  const d = Math.floor((Date.now() - new Date(date)) / 1000);
  if (d < 60) return `${d}s ago`;
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KanbanCard({ trf, onClick, isDark }) {
  const isOverdue = trf.due_date && new Date(trf.due_date) < new Date() && trf.status !== "Completed";
  const pct = STATUS_PCT[trf.status] || 0;
  const colMeta = KANBAN_COLUMNS.find(c => c.id === trf.status);
  const statusColor = colMeta?.color || "#94a3b8";

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      layout
    >
      <Box sx={{
        background: isDark ? "rgba(15,23,42,0.75)" : "rgba(255,255,255,0.9)",
        border: `1px solid ${isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.18)"}`,
        borderRadius: "14px",
        p: 2,
        cursor: "pointer",
        backdropFilter: "blur(16px)",
        boxShadow: isDark
          ? "0 4px 20px rgba(0,0,0,0.25)"
          : "0 4px 20px rgba(0,0,0,0.06)",
        mb: 1.5,
        position: "relative",
        overflow: "hidden",
        "&:hover": {
          borderColor: `${statusColor}55`,
          boxShadow: isDark
            ? `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${statusColor}22`
            : `0 8px 24px rgba(0,0,0,0.1), 0 0 0 1px ${statusColor}22`,
        },
      }}>
        {/* top accent line */}
        <Box sx={{
          position: "absolute", top: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, ${statusColor}, ${statusColor}55)`,
          borderRadius: "14px 14px 0 0",
        }} />

        {/* header row */}
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 1, mt: 0.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <TagRoundedIcon sx={{ fontSize: 13, color: "#94a3b8" }} />
            <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.05em" }}>
              {trf.trf_number}
            </Typography>
          </Box>
          {isOverdue && (
            <Chip label="OVERDUE" size="small" sx={{
              fontSize: "0.6rem", fontWeight: 800, height: 18,
              background: "rgba(239,68,68,0.12)", color: "#ef4444",
              border: "1px solid rgba(239,68,68,0.25)",
            }} />
          )}
        </Box>

        {/* project name */}
        <Typography sx={{
          fontSize: "0.86rem", fontWeight: 700, mb: 1.5,
          color: isDark ? "#f1f5f9" : "#0f172a",
          lineHeight: 1.35,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {trf.project_name}
        </Typography>

        {/* meta row */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1.5 }}>
          {trf.priority && (
            <Chip
              icon={<PriorityHighRoundedIcon sx={{ fontSize: 11, color: PRIORITY_COLORS[trf.priority] }} />}
              label={trf.priority}
              size="small"
              sx={{
                fontSize: "0.68rem", fontWeight: 700, height: 20,
                background: `${PRIORITY_COLORS[trf.priority] || "#94a3b8"}15`,
                color: PRIORITY_COLORS[trf.priority] || "#94a3b8",
                "& .MuiChip-icon": { ml: "5px" },
              }}
            />
          )}
          {trf.due_date && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
              <CalendarTodayRoundedIcon sx={{ fontSize: 11, color: isOverdue ? "#ef4444" : "#94a3b8" }} />
              <Typography sx={{
                fontSize: "0.68rem", fontWeight: 600,
                color: isOverdue ? "#ef4444" : "#94a3b8",
              }}>
                {new Date(trf.due_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              </Typography>
            </Box>
          )}
        </Box>

        {/* progress bar */}
        <Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
            <Typography sx={{ fontSize: "0.66rem", color: "#94a3b8" }}>Progress</Typography>
            <Typography sx={{ fontSize: "0.66rem", fontWeight: 700, color: statusColor }}>{pct}%</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={pct}
            sx={{
              height: 4, borderRadius: 4,
              background: isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.15)",
              "& .MuiLinearProgress-bar": {
                background: `linear-gradient(90deg, ${statusColor}, ${statusColor}99)`,
              },
            }}
          />
        </Box>
      </Box>
    </motion.div>
  );
}

// ─── Slide-over Panel ─────────────────────────────────────────────────────────

function WorkspacePanel({ trf, onClose, onStatusUpdated, isDark }) {
  const theme = useTheme();
  const [tab, setTab] = useState("details");
  const [files, setFiles] = useState({});
  const [folder, setFolder] = useState(FOLDERS[0]);
  const [uploading, setUploading] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [activities, setActivities] = useState([]);
  const [statusTransition, setStatusTransition] = useState("");
  const [transitioning, setTransitioning] = useState(false);
  const fileInputRef = useRef(null);

  const cardBg = isDark ? "rgba(15,23,42,0.82)" : "rgba(255,255,255,0.95)";
  const border = isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.18)";
  const subColor = isDark ? "#94a3b8" : "#64748b";
  const headColor = isDark ? "#f1f5f9" : "#0f172a";
  const pct = STATUS_PCT[trf.status] || 0;
  const colMeta = KANBAN_COLUMNS.find(c => c.id === trf.status);
  const statusColor = colMeta?.color || "#94a3b8";
  const nextStatuses = VALID_TRANSITIONS[trf.status] || [];

  const loadFiles = useCallback(async () => {
    try {
      const res = await listFiles(trf.trf_number, folder);
      const raw = res.data?.files || [];
      setFiles(prev => ({
        ...prev,
        [folder]: Array.isArray(raw)
          ? raw.map(f =>
              typeof f === "string"
                ? { name: f }
                : { ...f, name: f.filename || f.name || String(f) }
            )
          : [],
      }));
    } catch { /* ignore */ }
  }, [trf.trf_number, folder]);

  const loadComments = useCallback(async () => {
    try {
      const res = await API.get(`/comments/trf/${trf.trf_number}`);
      setComments(res.data?.comments || []);
    } catch { setComments([]); }
  }, [trf.trf_number]);

  const loadActivities = useCallback(async () => {
    try {
      const res = await API.get(`/activities/trf/${trf.id}`);
      setActivities(res.data?.activities || []);
    } catch { setActivities([]); }
  }, [trf.id]);

  useEffect(() => {
    loadFiles();
    loadComments();
    loadActivities();
  }, [loadFiles, loadComments, loadActivities]);

  useEffect(() => { loadFiles(); }, [folder]);

  const handleFileUpload = async (e) => {
    const picked = Array.from(e.target.files || []);
    // Reset input immediately so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!picked.length) return;
    setUploading(true);
    let ok = 0;
    for (const f of picked) {
      try {
        await uploadFile(trf.trf_number, folder, f);
        ok++;
      } catch {
        toast.error(`Failed to upload ${f.name}`);
      }
    }
    setUploading(false);
    if (ok > 0) {
      toast.success(`${ok} file${ok > 1 ? "s" : ""} uploaded`);
      await loadFiles();
    }
  };

  const handleDelete = async (fname) => {
    try {
      await deleteFile(trf.trf_number, folder, fname);
      toast.success("Deleted");
      loadFiles();
    } catch { toast.error("Delete failed"); }
  };

  const handleDownload = async (fname) => {
    try {
      await downloadFile(trf.trf_number, folder, fname);
    } catch { toast.error("Download failed"); }
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;
    try {
      await API.post("/comments/", { trf_number: trf.trf_number, content: newComment.trim() });
      setNewComment("");
      loadComments();
      toast.success("Comment added");
    } catch { toast.error("Failed to post comment"); }
  };

  const handleStatusTransition = async () => {
    if (!statusTransition) return;
    setTransitioning(true);
    try {
      await updateTRFStatus(trf.id, statusTransition);
      toast.success(`Status updated to ${statusTransition}`);
      onStatusUpdated?.();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Status update failed");
    } finally {
      setTransitioning(false);
      setStatusTransition("");
    }
  };

  const TABS = [
    { id: "details",   label: "Details",    icon: <DashboardRoundedIcon sx={{ fontSize: 15 }} /> },
    { id: "documents", label: "Documents",  icon: <FolderRoundedIcon sx={{ fontSize: 15 }} /> },
    { id: "comments",  label: "Comments",   icon: <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 15 }} /> },
    { id: "activity",  label: "Activity",   icon: <HistoryRoundedIcon sx={{ fontSize: 15 }} /> },
  ];

  return (
    <Box sx={{
      position: "fixed", top: 0, right: 0, bottom: 0,
      width: { xs: "100vw", md: 520 },
      background: cardBg,
      backdropFilter: "blur(24px)",
      borderLeft: `1px solid ${border}`,
      boxShadow: "-8px 0 40px rgba(0,0,0,0.22)",
      zIndex: 1300,
      display: "flex", flexDirection: "column",
      overflowY: "hidden",
    }}>
      {/* Panel Header */}
      <Box sx={{
        px: 3, py: 2.5, borderBottom: `1px solid ${border}`,
        background: isDark ? "rgba(15,23,42,0.9)" : "rgba(255,255,255,0.98)",
        flexShrink: 0,
      }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 1.5 }}>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
              <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: subColor, letterSpacing: "0.06em" }}>
                {trf.trf_number}
              </Typography>
              <Chip
                label={trf.status}
                size="small"
                sx={{
                  fontSize: "0.68rem", fontWeight: 700, height: 20,
                  background: `${statusColor}18`, color: statusColor,
                }}
              />
            </Box>
            <Typography sx={{ fontSize: "1rem", fontWeight: 800, color: headColor, lineHeight: 1.3, maxWidth: 380 }}>
              {trf.project_name}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ mt: -0.5 }}>
            <CloseRoundedIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>

        {/* Progress */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
            <Typography sx={{ fontSize: "0.72rem", color: subColor }}>Overall Progress</Typography>
            <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: statusColor }}>{pct}%</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={pct}
            sx={{
              height: 6, borderRadius: 4,
              background: isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.15)",
              "& .MuiLinearProgress-bar": {
                background: `linear-gradient(90deg, ${statusColor}, ${statusColor}88)`,
              },
            }}
          />
        </Box>

        {/* Status Transition */}
        {nextStatuses.length > 0 && (
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select
                value={statusTransition}
                onChange={e => setStatusTransition(e.target.value)}
                displayEmpty
                sx={{ fontSize: "0.78rem", borderRadius: "9px" }}
              >
                <MenuItem value="" sx={{ fontSize: "0.78rem" }}>Move to status…</MenuItem>
                {nextStatuses.map(s => (
                  <MenuItem key={s} value={s} sx={{ fontSize: "0.78rem" }}>{s}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              size="small"
              disabled={!statusTransition || transitioning}
              onClick={handleStatusTransition}
              endIcon={transitioning ? <CircularProgress size={12} /> : <ArrowForwardRoundedIcon sx={{ fontSize: 14 }} />}
              sx={{
                borderRadius: "9px", fontWeight: 700, fontSize: "0.78rem",
                background: "linear-gradient(135deg,#6366f1,#06b6d4)",
                boxShadow: "none",
                "&:hover": { boxShadow: "0 4px 12px rgba(99,102,241,0.35)" },
              }}
            >
              Update
            </Button>
          </Box>
        )}
      </Box>

      {/* Tabs */}
      <Box sx={{
        display: "flex", gap: 0.5, px: 2, py: 1.5,
        borderBottom: `1px solid ${border}`,
        flexShrink: 0,
      }}>
        {TABS.map(t => (
          <Box
            key={t.id}
            onClick={() => setTab(t.id)}
            sx={{
              display: "flex", alignItems: "center", gap: 0.75,
              px: 1.5, py: 0.75, borderRadius: "9px", cursor: "pointer",
              background: tab === t.id
                ? "linear-gradient(135deg,rgba(99,102,241,0.18),rgba(6,182,212,0.12))"
                : "transparent",
              border: `1px solid ${tab === t.id ? "rgba(99,102,241,0.35)" : "transparent"}`,
              transition: "all 0.15s",
            }}
          >
            <Box sx={{ color: tab === t.id ? "#818cf8" : subColor }}>{t.icon}</Box>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: tab === t.id ? 700 : 500, color: tab === t.id ? "#818cf8" : subColor }}>
              {t.label}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Tab Content */}
      <Box sx={{ flex: 1, overflowY: "auto", p: 2.5 }}>
        <AnimatePresence mode="wait">
          {/* ── Details ──────────────────────────────────── */}
          {tab === "details" && (
            <motion.div key="details" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                {/* Project Info */}
                <Box sx={{ background: isDark ? "rgba(99,102,241,0.06)" : "rgba(99,102,241,0.04)", borderRadius: "12px", p: 2 }}>
                  <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#818cf8", mb: 1.5, letterSpacing: "0.08em" }}>PROJECT INFO</Typography>
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                    {[
                      { label: "TRF Number", value: trf.trf_number },
                      { label: "Priority", value: trf.priority || "—", color: PRIORITY_COLORS[trf.priority] },
                      { label: "Status", value: trf.status, color: statusColor },
                      { label: "Due Date", value: trf.due_date ? new Date(trf.due_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—" },
                    ].map(row => (
                      <Box key={row.label}>
                        <Typography sx={{ fontSize: "0.66rem", color: subColor, mb: 0.3 }}>{row.label}</Typography>
                        <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: row.color || headColor }}>{row.value}</Typography>
                      </Box>
                    ))}
                  </Box>
                  {trf.remarks && (
                    <Box sx={{ mt: 1.5, pt: 1.5, borderTop: `1px solid ${border}` }}>
                      <Typography sx={{ fontSize: "0.66rem", color: subColor, mb: 0.3 }}>Remarks</Typography>
                      <Typography sx={{ fontSize: "0.8rem", color: headColor, lineHeight: 1.5 }}>{trf.remarks}</Typography>
                    </Box>
                  )}
                </Box>

                {/* Assigned Team */}
                <Box sx={{ background: isDark ? "rgba(6,182,212,0.06)" : "rgba(6,182,212,0.04)", borderRadius: "12px", p: 2 }}>
                  <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#06b6d4", mb: 1.5, letterSpacing: "0.08em" }}>ASSIGNED TEAM</Typography>
                  {trf.assigned_manager_name && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                      <Box sx={{
                        width: 34, height: 34, borderRadius: "50%",
                        background: "linear-gradient(135deg,#6366f1,#06b6d4)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <PersonRoundedIcon sx={{ fontSize: 17, color: "#fff" }} />
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: headColor }}>{trf.assigned_manager_name}</Typography>
                        <Typography sx={{ fontSize: "0.66rem", color: subColor }}>Manager</Typography>
                      </Box>
                    </Box>
                  )}
                  {trf.engineers?.length > 0 && (
                    <Box>
                      <Typography sx={{ fontSize: "0.66rem", color: subColor, mb: 0.75 }}>Engineers</Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                        {trf.engineers.map(eng => (
                          <Chip
                            key={eng.id}
                            icon={<EngineeringRoundedIcon sx={{ fontSize: 13 }} />}
                            label={eng.display_name || eng.username}
                            size="small"
                            sx={{
                              fontSize: "0.72rem", fontWeight: 600, height: 24,
                              background: isDark ? "rgba(6,182,212,0.12)" : "rgba(6,182,212,0.08)",
                              color: "#06b6d4",
                              "& .MuiChip-icon": { color: "#06b6d4" },
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              </Box>
            </motion.div>
          )}

          {/* ── Documents ─────────────────────────────────── */}
          {tab === "documents" && (
            <motion.div key="documents" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              {/* Folder Selector */}
              <Box sx={{ display: "flex", gap: 0.75, mb: 2, flexWrap: "wrap" }}>
                {FOLDERS.map(f => (
                  <Box
                    key={f}
                    onClick={() => setFolder(f)}
                    sx={{
                      px: 1.5, py: 0.5, borderRadius: "8px", cursor: "pointer",
                      background: folder === f ? "linear-gradient(135deg,rgba(99,102,241,0.18),rgba(6,182,212,0.12))" : "transparent",
                      border: `1px solid ${folder === f ? "rgba(99,102,241,0.35)" : border}`,
                      transition: "all 0.15s",
                    }}
                  >
                    <Typography sx={{ fontSize: "0.72rem", fontWeight: folder === f ? 700 : 500, color: folder === f ? "#818cf8" : subColor }}>
                      {f}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* Upload Button */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                style={{ display: "none" }}
                id="ws-upload"
              />
              <Box
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  border: `2px dashed ${isDark ? "rgba(99,102,241,0.3)" : "rgba(99,102,241,0.2)"}`,
                  borderRadius: "12px",
                  p: 2, mb: 2, textAlign: "center", cursor: "pointer",
                  background: isDark ? "rgba(99,102,241,0.04)" : "rgba(99,102,241,0.02)",
                  transition: "all 0.15s",
                  "&:hover": { borderColor: "#6366f1", background: "rgba(99,102,241,0.06)" },
                }}
              >
                {uploading ? (
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                    <CircularProgress size={16} sx={{ color: "#6366f1" }} />
                    <Typography sx={{ fontSize: "0.78rem", color: "#6366f1" }}>Uploading…</Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                    <UploadFileRoundedIcon sx={{ fontSize: 18, color: "#6366f1" }} />
                    <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: "#6366f1" }}>
                      Click to upload files to {folder}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* File List */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {(files[folder] || []).length === 0 ? (
                  <Box sx={{ py: 5, textAlign: "center" }}>
                    <FolderRoundedIcon sx={{ fontSize: 36, color: isDark ? "rgba(148,163,184,0.2)" : "rgba(148,163,184,0.4)", mb: 1 }} />
                    <Typography sx={{ fontSize: "0.8rem", color: subColor }}>No files in {folder}</Typography>
                  </Box>
                ) : (files[folder] || []).map(f => (
                  <Box
                    key={f.name}
                    sx={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      px: 2, py: 1.25, borderRadius: "10px",
                      background: isDark ? "rgba(148,163,184,0.05)" : "rgba(148,163,184,0.06)",
                      border: `1px solid ${border}`,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
                      <FolderRoundedIcon sx={{ fontSize: 16, color: "#06b6d4", flexShrink: 0 }} />
                      <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: headColor, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {f.name}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
                      <Tooltip title="Download">
                        <IconButton size="small" onClick={() => handleDownload(f.name)} sx={{ color: "#6366f1" }}>
                          <FileDownloadRoundedIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDelete(f.name)} sx={{ color: "#ef4444" }}>
                          <DeleteRoundedIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                ))}
              </Box>
            </motion.div>
          )}

          {/* ── Comments ──────────────────────────────────── */}
          {tab === "comments" && (
            <motion.div key="comments" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 3 }}>
                {comments.length === 0 ? (
                  <Box sx={{ py: 6, textAlign: "center" }}>
                    <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 36, color: isDark ? "rgba(148,163,184,0.2)" : "rgba(148,163,184,0.4)", mb: 1 }} />
                    <Typography sx={{ fontSize: "0.8rem", color: subColor }}>No comments yet. Start the discussion.</Typography>
                  </Box>
                ) : comments.map((c, i) => (
                  <Box key={c.id || i} sx={{
                    p: 2, borderRadius: "12px",
                    background: isDark ? "rgba(148,163,184,0.05)" : "rgba(148,163,184,0.06)",
                    border: `1px solid ${border}`,
                  }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.75 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box sx={{
                          width: 24, height: 24, borderRadius: "50%",
                          background: "linear-gradient(135deg,#6366f1,#06b6d4)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <Typography sx={{ fontSize: "0.6rem", fontWeight: 800, color: "#fff" }}>
                            {(c.author_name || c.username || "U")[0].toUpperCase()}
                          </Typography>
                        </Box>
                        <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: headColor }}>
                          {c.author_name || c.username || "User"}
                        </Typography>
                        {c.author_role && (
                          <Chip
                            label={c.author_role}
                            size="small"
                            sx={{ fontSize: "0.6rem", height: 16, fontWeight: 600 }}
                          />
                        )}
                      </Box>
                      <Typography sx={{ fontSize: "0.65rem", color: subColor }}>
                        {timeAgo(c.created_at)}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: "0.8rem", color: isDark ? "#cbd5e1" : "#334155", lineHeight: 1.55 }}>
                      {c.content}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* Comment Input */}
              <Box sx={{
                display: "flex", gap: 1, position: "sticky", bottom: 0,
                background: cardBg, pt: 1.5, pb: 0.5,
              }}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={3}
                  size="small"
                  placeholder="Add a comment…"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) handleComment(); }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "12px", fontSize: "0.82rem",
                    },
                  }}
                />
                <IconButton
                  onClick={handleComment}
                  disabled={!newComment.trim()}
                  sx={{
                    background: "linear-gradient(135deg,#6366f1,#06b6d4)",
                    color: "#fff", borderRadius: "12px", alignSelf: "flex-end",
                    "&:hover": { transform: "scale(1.05)" },
                    "&:disabled": { background: isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.15)", color: subColor },
                  }}
                >
                  <SendRoundedIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>
            </motion.div>
          )}

          {/* ── Activity ──────────────────────────────────── */}
          {tab === "activity" && (
            <motion.div key="activity" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              {activities.length === 0 ? (
                <Box sx={{ py: 8, textAlign: "center" }}>
                  <HistoryRoundedIcon sx={{ fontSize: 36, color: isDark ? "rgba(148,163,184,0.2)" : "rgba(148,163,184,0.4)", mb: 1 }} />
                  <Typography sx={{ fontSize: "0.8rem", color: subColor }}>No activity recorded yet.</Typography>
                </Box>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                  {activities.map((a, i) => (
                    <Box key={a.id || i} sx={{ display: "flex", gap: 1.5, pb: 2, position: "relative" }}>
                      {i < activities.length - 1 && (
                        <Box sx={{
                          position: "absolute", left: 14, top: 28, bottom: 0,
                          width: 1.5, background: border,
                        }} />
                      )}
                      <Box sx={{
                        width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                        background: "linear-gradient(135deg,rgba(99,102,241,0.2),rgba(6,182,212,0.15))",
                        border: "1.5px solid rgba(99,102,241,0.3)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <CheckCircleRoundedIcon sx={{ fontSize: 13, color: "#6366f1" }} />
                      </Box>
                      <Box sx={{ flex: 1, pt: 0.3 }}>
                        <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: headColor }}>
                          {a.description || a.action_type}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1, mt: 0.3, flexWrap: "wrap" }}>
                          {a.user && (
                            <Typography sx={{ fontSize: "0.66rem", color: "#818cf8", fontWeight: 600 }}>
                              {a.user.display_name || a.user.username}
                            </Typography>
                          )}
                          <Typography sx={{ fontSize: "0.66rem", color: subColor }}>
                            {timeAgo(a.created_at)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </Box>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AssignedWorkspace() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { user } = useApp();

  const [trfs, setTrfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const cardBg = isDark ? "rgba(15,23,42,0.55)" : "rgba(255,255,255,0.6)";
  const border = isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.18)";
  const subColor = isDark ? "#94a3b8" : "#64748b";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyAssignedTRFs();
      setTrfs(res.data?.trfs || []);
    } catch {
      toast.error("Failed to load assigned projects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // real-time sync
  useEffect(() => {
    const onUpdate = () => load();
    window.addEventListener("trf_update_event", onUpdate);
    return () => window.removeEventListener("trf_update_event", onUpdate);
  }, [load]);

  const handleStatusUpdated = () => {
    setSelected(null);
    load();
  };

  const activeCols = KANBAN_COLUMNS.filter(col =>
    trfs.some(t => t.status === col.id)
  );

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Page Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{
              width: 44, height: 44, borderRadius: "13px",
              background: "linear-gradient(135deg,#6366f1,#06b6d4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 8px 20px rgba(99,102,241,0.35)",
            }}>
              <DashboardRoundedIcon sx={{ color: "#fff", fontSize: 22 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: "1.5rem", color: isDark ? "#f1f5f9" : "#0f172a" }}>
                Project Workspace
              </Typography>
              <Typography sx={{ fontSize: "0.82rem", color: subColor }}>
                {user?.role === "Admin" ? "All TRF projects" : "Your assigned TRF projects"} · {trfs.length} project{trfs.length !== 1 ? "s" : ""}
              </Typography>
            </Box>
          </Box>
          <Tooltip title="Refresh">
            <IconButton onClick={load} disabled={loading} sx={{
              background: isDark ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.06)",
              border: `1px solid ${isDark ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.15)"}`,
              "&:hover": { background: "rgba(99,102,241,0.15)" },
            }}>
              {loading ? <CircularProgress size={18} sx={{ color: "#6366f1" }} /> : <RefreshRoundedIcon sx={{ color: "#6366f1" }} />}
            </IconButton>
          </Tooltip>
        </Box>
      </motion.div>

      {/* Kanban Board */}
      {loading && trfs.length === 0 ? (
        <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CircularProgress sx={{ color: "#6366f1" }} />
        </Box>
      ) : trfs.length === 0 ? (
        <Box sx={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 2, py: 12,
        }}>
          <Box sx={{
            width: 72, height: 72, borderRadius: "22px",
            background: isDark ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.06)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <DashboardRoundedIcon sx={{ fontSize: 34, color: "#6366f1" }} />
          </Box>
          <Typography sx={{ fontWeight: 700, fontSize: "1.05rem", color: isDark ? "#f1f5f9" : "#0f172a" }}>
            No projects assigned yet
          </Typography>
          <Typography sx={{ fontSize: "0.85rem", color: subColor, maxWidth: 360, textAlign: "center" }}>
            When an Admin assigns a TRF to you, it will appear here in your personal workspace.
          </Typography>
        </Box>
      ) : (
        <Box sx={{
          flex: 1, overflowX: "auto", overflowY: "hidden",
          display: "flex", gap: 2, pb: 2,
          "&::-webkit-scrollbar": { height: 6 },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": { background: isDark ? "rgba(148,163,184,0.2)" : "rgba(148,163,184,0.35)", borderRadius: 3 },
        }}>
          {KANBAN_COLUMNS.map((col) => {
            const colTRFs = trfs.filter(t => t.status === col.id);
            if (colTRFs.length === 0 && !activeCols.find(c => c.id === col.id)) return null;

            return (
              <motion.div
                key={col.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: KANBAN_COLUMNS.indexOf(col) * 0.07 }}
                style={{ minWidth: 280, maxWidth: 300, display: "flex", flexDirection: "column" }}
              >
                {/* Column Header */}
                <Box sx={{
                  px: 1.5, py: 1.25, mb: 1.5, borderRadius: "12px",
                  background: `${col.color}12`,
                  border: `1px solid ${col.color}25`,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography sx={{ fontSize: "1rem" }}>{col.emoji}</Typography>
                    <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: col.color }}>
                      {col.label}
                    </Typography>
                  </Box>
                  <Chip
                    label={colTRFs.length}
                    size="small"
                    sx={{ height: 20, fontSize: "0.68rem", fontWeight: 700, background: `${col.color}22`, color: col.color }}
                  />
                </Box>

                {/* Cards */}
                <Box sx={{ flex: 1, overflowY: "auto", pr: 0.5 }}>
                  {colTRFs.length === 0 ? (
                    <Box sx={{
                      py: 4, textAlign: "center",
                      border: `1.5px dashed ${isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.2)"}`,
                      borderRadius: "12px",
                    }}>
                      <Typography sx={{ fontSize: "0.75rem", color: subColor }}>No projects here</Typography>
                    </Box>
                  ) : colTRFs.map(trf => (
                    <KanbanCard
                      key={trf.id}
                      trf={trf}
                      isDark={isDark}
                      onClick={() => setSelected(trf)}
                    />
                  ))}
                </Box>
              </motion.div>
            );
          })}
        </Box>
      )}

      {/* Slide-over backdrop */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              style={{
                position: "fixed", inset: 0,
                background: "rgba(0,0,0,0.45)",
                zIndex: 1299,
              }}
            />
            <motion.div
              key="panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              style={{ position: "fixed", inset: 0, zIndex: 1300, pointerEvents: "none" }}
            >
              <Box sx={{ position: "absolute", right: 0, top: 0, bottom: 0, pointerEvents: "all" }}>
                <WorkspacePanel
                  trf={selected}
                  onClose={() => setSelected(null)}
                  onStatusUpdated={handleStatusUpdated}
                  isDark={isDark}
                />
              </Box>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Box>
  );
}
