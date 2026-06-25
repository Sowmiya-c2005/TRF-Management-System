import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@mui/material/styles";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Skeleton from "@mui/material/Skeleton";
import toast from "react-hot-toast";

import SearchRoundedIcon        from "@mui/icons-material/SearchRounded";
import AddRoundedIcon           from "@mui/icons-material/AddRounded";
import RefreshRoundedIcon       from "@mui/icons-material/RefreshRounded";
import DeleteRoundedIcon        from "@mui/icons-material/DeleteRounded";
import FolderOpenRoundedIcon    from "@mui/icons-material/FolderOpenRounded";
import EditRoundedIcon          from "@mui/icons-material/EditRounded";
import FileDownloadRoundedIcon  from "@mui/icons-material/FileDownloadRounded";
import ListAltRoundedIcon       from "@mui/icons-material/ListAltRounded";
import WarningAmberRoundedIcon  from "@mui/icons-material/WarningAmberRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import TagRoundedIcon           from "@mui/icons-material/TagRounded";

import { getAllTRFs, deleteTRF } from "../services/trfService";
import { useApp } from "../context/AppContext";

function SkeletonRow() {
  return (
    <Box sx={{ display: "flex", gap: 2, p: 2, alignItems: "center" }}>
      <Skeleton variant="rounded" width={120} height={20} sx={{ borderRadius: 2 }} />
      <Skeleton variant="rounded" width="40%" height={20} sx={{ borderRadius: 2 }} />
      <Skeleton variant="rounded" width={90} height={20} sx={{ borderRadius: 2, ml: "auto" }} />
      <Skeleton variant="circular" width={32} height={32} />
      <Skeleton variant="circular" width={32} height={32} />
    </Box>
  );
}

export default function AllTRFs() {
  const theme   = useTheme();
  const isDark  = theme.palette.mode === "dark";
  const navigate = useNavigate();
  const { addActivity, addNotification, user } = useApp();

  const [trfs,      setTrfs]      = useState([]);
  const [filtered,  setFiltered]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [delTarget, setDelTarget] = useState(null);
  const [deleting,  setDeleting]  = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const cardBg = isDark ? "rgba(15,23,42,0.72)" : "rgba(255,255,255,0.88)";
  const border  = isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.2)";

  const loadTRFs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllTRFs();
      const data = Array.isArray(res.data) ? res.data : [];
      setTrfs(data);
      setFiltered(data);
    } catch {
      toast.error("Failed to load TRFs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTRFs(); }, [loadTRFs]);

  useEffect(() => {
    if (!search.trim()) { setFiltered(trfs); return; }
    const q = search.toLowerCase();
    setFiltered(trfs.filter(t =>
      t.trf_number?.toLowerCase().includes(q) ||
      t.project_name?.toLowerCase().includes(q)
    ));
  }, [search, trfs]);

  const exportCSV = () => {
    const rows = [["TRF Number", "Project Name", "Created At"], ...filtered.map(t => [t.trf_number, t.project_name, t.created_at || ""])];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "trfs_export.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported to CSV");
  };

  const handleDelete = async () => {
    if (!delTarget) return;
    setDeleting(true);
    try {
      await deleteTRF(delTarget.trf_number);
      setTrfs(prev => prev.filter(t => t.trf_number !== delTarget.trf_number));
      addActivity(`${delTarget.trf_number} deleted`, user?.username || "Admin");
      addNotification({ title: `${delTarget.trf_number} deleted`, body: "TRF removed from system", color: "#ef4444", type: "trf" });
      toast.success(`${delTarget.trf_number} deleted`);
      setDelTarget(null);
    } catch (e) {
      toast.error(e.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 4, flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 0.5 }}>
              <Box sx={{
                width: 44, height: 44, borderRadius: "13px",
                background: "linear-gradient(135deg,#6366f1,#06b6d4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 8px 20px rgba(99,102,241,0.35)",
              }}>
                <ListAltRoundedIcon sx={{ color: "#fff", fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, fontSize: "1.65rem", color: theme.palette.text.primary, lineHeight: 1.2 }}>
                  All TRFs
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: "0.82rem" }}>
                  {loading ? "Loading…" : `${filtered.length} of ${trfs.length} records`}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
            <Tooltip title="Export CSV">
              <Button
                variant="outlined" size="small"
                startIcon={<FileDownloadRoundedIcon />}
                onClick={exportCSV}
                disabled={loading || filtered.length === 0}
                sx={{ borderRadius: "10px", fontSize: "0.8rem", height: 38 }}
              >
                Export
              </Button>
            </Tooltip>
            <Tooltip title="Refresh">
              <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}>
                <IconButton
                  onClick={loadTRFs}
                  sx={{
                    background: isDark ? "rgba(148,163,184,0.08)" : "rgba(100,116,139,0.08)",
                    borderRadius: "10px", width: 38, height: 38,
                  }}
                >
                  <RefreshRoundedIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </motion.div>
            </Tooltip>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                variant="contained" size="small"
                startIcon={<AddRoundedIcon />}
                onClick={() => navigate("/create")}
                sx={{
                  borderRadius: "10px", fontSize: "0.82rem", height: 38,
                  background: "linear-gradient(135deg,#6366f1,#06b6d4)",
                  boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
                }}
              >
                New TRF
              </Button>
            </motion.div>
          </Box>
        </Box>
      </motion.div>

      {/* Search bar */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Box sx={{
          p: 2.5, borderRadius: "18px", background: cardBg,
          border: `1px solid ${border}`, backdropFilter: "blur(20px)",
          mb: 2.5, display: "flex", alignItems: "center", gap: 2,
        }}>
          <TextField
            fullWidth
            placeholder="Search by TRF number or project name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                </InputAdornment>
              ),
              sx: { borderRadius: "10px" },
            }}
          />
          {search && (
            <Chip
              label={`${filtered.length} results`}
              size="small"
              sx={{ fontSize: "0.72rem", background: "rgba(99,102,241,0.12)", color: "#818cf8" }}
            />
          )}
        </Box>
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Box sx={{
          borderRadius: "18px", background: cardBg,
          border: `1px solid ${border}`, backdropFilter: "blur(20px)",
          overflow: "hidden",
        }}>
          {/* Table header */}
          <Box sx={{
            display: "flex", alignItems: "center",
            px: 3, py: 1.75,
            background: isDark ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.04)",
            borderBottom: `1px solid ${border}`,
            gap: 2,
          }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: 160, flexShrink: 0 }}>
              <TagRoundedIcon sx={{ fontSize: 14, color: theme.palette.text.disabled }} />
              <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: theme.palette.text.disabled, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                TRF Number
              </Typography>
            </Box>
            <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: theme.palette.text.disabled, letterSpacing: "0.08em", textTransform: "uppercase", flex: 1 }}>
              Project Name
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: 130, flexShrink: 0 }}>
              <CalendarTodayRoundedIcon sx={{ fontSize: 13, color: theme.palette.text.disabled }} />
              <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: theme.palette.text.disabled, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Created
              </Typography>
            </Box>
            <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: theme.palette.text.disabled, letterSpacing: "0.08em", textTransform: "uppercase", width: 90, textAlign: "center", flexShrink: 0 }}>
              Actions
            </Typography>
          </Box>

          {/* Loading skeletons */}
          {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}

          {/* Empty state */}
          {!loading && filtered.length === 0 && (
            <Box sx={{ py: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <Box sx={{
                width: 68, height: 68, borderRadius: "20px",
                background: isDark ? "rgba(148,163,184,0.06)" : "rgba(148,163,184,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <ListAltRoundedIcon sx={{ fontSize: 32, color: theme.palette.text.disabled }} />
              </Box>
              <Typography sx={{ color: theme.palette.text.secondary, fontWeight: 600, fontSize: "1rem" }}>
                {search ? "No matching TRFs found" : "No TRFs yet"}
              </Typography>
              <Typography sx={{ color: theme.palette.text.disabled, fontSize: "0.82rem", textAlign: "center", maxWidth: 320 }}>
                {search ? "Try a different search term." : "Create your first TRF to get started."}
              </Typography>
              {!search && (
                <Button
                  variant="contained" size="small"
                  startIcon={<AddRoundedIcon />}
                  onClick={() => navigate("/create")}
                  sx={{ mt: 1, borderRadius: "10px", background: "linear-gradient(135deg,#6366f1,#06b6d4)" }}
                >
                  Create TRF
                </Button>
              )}
            </Box>
          )}

          {/* Rows */}
          {!loading && filtered.map((trf, i) => (
            <motion.div
              key={trf.trf_number}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.035, duration: 0.3 }}
            >
              <Box sx={{
                display: "flex", alignItems: "center",
                px: 3, py: 1.75, gap: 2,
                borderBottom: i < filtered.length - 1 ? `1px solid ${border}` : "none",
                cursor: "default",
                transition: "background 0.15s",
                "&:hover": { background: isDark ? "rgba(148,163,184,0.04)" : "rgba(99,102,241,0.02)" },
              }}>
                {/* TRF Number */}
                <Box sx={{ width: 160, flexShrink: 0 }}>
                  <Chip
                    label={trf.trf_number}
                    size="small"
                    sx={{
                      fontSize: "0.72rem", fontWeight: 700, height: 22,
                      background: "rgba(99,102,241,0.12)", color: "#818cf8",
                      border: "1px solid rgba(99,102,241,0.2)",
                    }}
                  />
                </Box>
                {/* Project Name */}
                <Typography sx={{ flex: 1, fontSize: "0.85rem", fontWeight: 500, color: theme.palette.text.primary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {trf.project_name || "—"}
                </Typography>
                {/* Date */}
                <Typography sx={{ width: 130, flexShrink: 0, fontSize: "0.78rem", color: theme.palette.text.secondary }}>
                  {trf.created_at ? new Date(trf.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                </Typography>
                {/* Actions */}
                <Box sx={{ width: 90, flexShrink: 0, display: "flex", justifyContent: "center", gap: 0.5 }}>
                  <Tooltip title="Open Files">
                    <IconButton size="small" onClick={() => navigate(`/files?trf=${trf.trf_number}`)}
                      sx={{ "&:hover": { color: "#06b6d4", background: "rgba(6,182,212,0.1)" }, borderRadius: "8px" }}>
                      <FolderOpenRoundedIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit TRF">
                    <IconButton size="small" onClick={() => navigate(`/update?trf=${trf.trf_number}`)}
                      sx={{ "&:hover": { color: "#f59e0b", background: "rgba(245,158,11,0.1)" }, borderRadius: "8px" }}>
                      <EditRoundedIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" onClick={() => setDelTarget(trf)}
                      sx={{ "&:hover": { color: "#ef4444", background: "rgba(239,68,68,0.1)" }, borderRadius: "8px" }}>
                      <DeleteRoundedIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </motion.div>
          ))}
        </Box>
      </motion.div>

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!delTarget}
        onClose={() => !deleting && setDelTarget(null)}
        PaperProps={{
          sx: {
            borderRadius: "20px", p: 1,
            background: isDark ? "rgba(10,15,30,0.97)" : "#fff",
            backdropFilter: "blur(30px)",
            border: `1px solid ${border}`,
            minWidth: 380,
          },
        }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 0.5 }}>
          <Box sx={{
            width: 40, height: 40, borderRadius: "12px",
            background: "rgba(239,68,68,0.12)", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <WarningAmberRoundedIcon sx={{ color: "#ef4444", fontSize: 20 }} />
          </Box>
          <Typography fontWeight={700}>Delete TRF?</Typography>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: theme.palette.text.secondary, fontSize: "0.88rem", mt: 1 }}>
            Are you sure you want to delete{" "}
            <Chip label={delTarget?.trf_number} size="small" sx={{ fontSize: "0.72rem", background: "rgba(239,68,68,0.1)", color: "#ef4444" }} />
            ? This will also remove all associated files and cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setDelTarget(null)} disabled={deleting} sx={{ borderRadius: "10px" }}>Cancel</Button>
          <Button
            variant="contained" onClick={handleDelete} disabled={deleting}
            startIcon={deleting ? <CircularProgress size={14} color="inherit" /> : <DeleteRoundedIcon />}
            sx={{ borderRadius: "10px", background: "linear-gradient(135deg,#ef4444,#dc2626)", boxShadow: "none" }}
          >
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
