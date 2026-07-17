import { useState, useEffect, useCallback, useRef } from "react";
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
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Pagination from "@mui/material/Pagination";
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
import QrCode2RoundedIcon       from "@mui/icons-material/QrCode2Rounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import TagRoundedIcon           from "@mui/icons-material/TagRounded";
import TuneRoundedIcon          from "@mui/icons-material/TuneRounded";
import ArrowUpwardRoundedIcon   from "@mui/icons-material/ArrowUpwardRounded";
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import AssignmentIndRoundedIcon from "@mui/icons-material/AssignmentIndRounded";
import CloseRoundedIcon         from "@mui/icons-material/CloseRounded";

import { getAllTRFs, deleteTRF } from "../services/trfService";
import { useApp }        from "../context/AppContext";
import { usePermission } from "../hooks/usePermission";
import QRCodeModal       from "../components/QRCodeModal";

// ─── Status / Priority colours ───────────────────────────────────────────────
const STATUS_COLORS = {
  Draft:          { bg: "rgba(148,163,184,0.12)", text: "#94a3b8" },
  Assigned:       { bg: "rgba(99,102,241,0.12)",  text: "#818cf8" },
  "In Progress":  { bg: "rgba(245,158,11,0.12)",  text: "#fbbf24" },
  "Under Review": { bg: "rgba(6,182,212,0.12)",   text: "#22d3ee" },
  Approved:       { bg: "rgba(16,185,129,0.12)",  text: "#34d399" },
  Completed:      { bg: "rgba(139,92,246,0.12)",  text: "#a78bfa" },
  Archived:       { bg: "rgba(71,85,105,0.12)",   text: "#64748b" },
};
const PRIORITY_COLORS = {
  Critical: { bg: "rgba(239,68,68,0.12)",   text: "#f87171" },
  High:     { bg: "rgba(249,115,22,0.12)",  text: "#fb923c" },
  Medium:   { bg: "rgba(245,158,11,0.12)",  text: "#fbbf24" },
  Low:      { bg: "rgba(16,185,129,0.12)",  text: "#34d399" },
};

const STATUS_OPTIONS  = ["", "Draft", "Assigned", "In Progress", "Under Review", "Approved", "Completed", "Archived"];
const PRIORITY_OPTIONS = ["", "Critical", "High", "Medium", "Low"];
const SORT_FIELDS = [
  { value: "created_at",   label: "Created" },
  { value: "trf_number",   label: "TRF Number" },
  { value: "project_name", label: "Project Name" },
  { value: "status",       label: "Status" },
  { value: "priority",     label: "Priority" },
  { value: "due_date",     label: "Due Date" },
];

// ─── Skeleton row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <Box sx={{ display: "flex", gap: 2, p: 2, alignItems: "center" }}>
      <Skeleton variant="rounded" width={120} height={20} sx={{ borderRadius: 2 }} />
      <Skeleton variant="rounded" width="40%" height={20} sx={{ borderRadius: 2 }} />
      <Skeleton variant="rounded" width={80}  height={20} sx={{ borderRadius: 2, ml: "auto" }} />
      <Skeleton variant="rounded" width={70}  height={20} sx={{ borderRadius: 2 }} />
      <Skeleton variant="circular" width={28} height={28} />
      <Skeleton variant="circular" width={28} height={28} />
    </Box>
  );
}

// ─── Sortable column header ───────────────────────────────────────────────────
function SortHeader({ label, field, sortBy, sortOrder, onSort }) {
  const active = sortBy === field;
  return (
    <Box
      onClick={() => onSort(field)}
      sx={{
        display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer",
        userSelect: "none",
        "&:hover .sort-icon": { opacity: 1 },
      }}
    >
      <Typography sx={{
        fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: active ? "#818cf8" : "text.disabled",
        transition: "color 0.15s",
      }}>
        {label}
      </Typography>
      <Box className="sort-icon" sx={{ opacity: active ? 1 : 0, transition: "opacity 0.15s", color: "#818cf8" }}>
        {active && sortOrder === "asc"
          ? <ArrowUpwardRoundedIcon sx={{ fontSize: 12 }} />
          : <ArrowDownwardRoundedIcon sx={{ fontSize: 12 }} />}
      </Box>
    </Box>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function AllTRFs() {
  const theme    = useTheme();
  const isDark   = theme.palette.mode === "dark";
  const navigate = useNavigate();
  const { addActivity, addNotification, user } = useApp();
  const { can }  = usePermission();

  // ── Pagination / filter / sort state ────────────────────────────────────────
  const [page,      setPage]      = useState(1);
  const [perPage]                 = useState(15);
  const [total,     setTotal]     = useState(0);
  const [pages,     setPages]     = useState(1);
  const [search,    setSearch]    = useState("");
  const [status,    setStatus]    = useState("");
  const [priority,  setPriority]  = useState("");
  const [sortBy,    setSortBy]    = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showFilters, setShowFilters] = useState(false);

  // ── Data state ───────────────────────────────────────────────────────────────
  const [trfs,      setTrfs]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [delTarget, setDelTarget] = useState(null);
  const [deleting,  setDeleting]  = useState(false);
  const [qrTarget,  setQrTarget]  = useState(null);

  const searchDebounce = useRef(null);

  const cardBg = isDark ? "rgba(15,23,42,0.72)" : "rgba(255,255,255,0.88)";
  const border = isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.2)";

  // ── Load from server ─────────────────────────────────────────────────────────
  const loadTRFs = useCallback(async (overrides = {}) => {
    setLoading(true);
    try {
      const params = {
        page:       overrides.page      ?? page,
        per_page:   perPage,
        search:     overrides.search    ?? search,
        status:     overrides.status    ?? status,
        priority:   overrides.priority  ?? priority,
        sort_by:    overrides.sortBy    ?? sortBy,
        sort_order: overrides.sortOrder ?? sortOrder,
      };
      const res = await getAllTRFs(params);
      // Modern endpoint returns { items, total, page, pages, per_page }
      // Legacy /all-trfs returns plain array — handle both gracefully
      if (res.data && Array.isArray(res.data.items)) {
        setTrfs(res.data.items);
        setTotal(res.data.total ?? res.data.items.length);
        setPages(res.data.pages ?? 1);
        setPage(res.data.page ?? 1);
      } else {
        const arr = Array.isArray(res.data) ? res.data : [];
        setTrfs(arr);
        setTotal(arr.length);
        setPages(1);
        setPage(1);
      }
    } catch {
      toast.error("Failed to load TRFs");
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, status, priority, sortBy, sortOrder]);

  useEffect(() => { loadTRFs(); }, [page, status, priority, sortBy, sortOrder]);

  // Debounced search
  useEffect(() => {
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      setPage(1);
      loadTRFs({ page: 1, search });
    }, 350);
    return () => clearTimeout(searchDebounce.current);
  }, [search]);

  // ── Sorting ──────────────────────────────────────────────────────────────────
  const handleSort = (field) => {
    const newOrder = (sortBy === field && sortOrder === "desc") ? "asc" : "desc";
    setSortBy(field);
    setSortOrder(newOrder);
    setPage(1);
  };

  // ── Filter change helpers ─────────────────────────────────────────────────────
  const handleStatusChange = (val) => { setStatus(val); setPage(1); };
  const handlePriorityChange = (val) => { setPriority(val); setPage(1); };

  // ── CSV export ───────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const rows = [
      ["TRF Number","Project Name","Status","Priority","Created At","Due Date"],
      ...trfs.map(t => [
        t.trf_number, t.project_name,
        t.status || "", t.priority || "",
        t.created_at || "", t.due_date || "",
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a   = document.createElement("a"); a.href = url; a.download = "trfs_export.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported to CSV");
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!delTarget) return;
    setDeleting(true);
    try {
      await deleteTRF(delTarget.trf_number);
      addActivity(`${delTarget.trf_number} deleted`, user?.username || "Admin");
      addNotification({ title: `${delTarget.trf_number} deleted`, body: "TRF removed", color: "#ef4444", type: "trf" });
      toast.success(`${delTarget.trf_number} deleted`);
      setDelTarget(null);
      loadTRFs();
    } catch (e) { toast.error(e.message || "Delete failed"); }
    finally     { setDeleting(false); }
  };

  const activeFilterCount = [status, priority].filter(Boolean).length;

  return (
    <Box>
      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ width: 44, height: 44, borderRadius: "13px", background: "linear-gradient(135deg,#6366f1,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 20px rgba(99,102,241,0.35)" }}>
              <ListAltRoundedIcon sx={{ color: "#fff", fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, fontSize: "1.65rem", color: theme.palette.text.primary, lineHeight: 1.2 }}>All TRFs</Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: "0.82rem" }}>
                {loading ? "Loading…" : `${total} records · page ${page} of ${pages}`}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
            <Tooltip title="Filters / Sort">
              <IconButton
                onClick={() => setShowFilters(v => !v)}
                sx={{
                  position: "relative",
                  background: showFilters ? "rgba(99,102,241,0.12)" : (isDark ? "rgba(148,163,184,0.08)" : "rgba(100,116,139,0.08)"),
                  borderRadius: "10px", width: 38, height: 38,
                  color: showFilters ? "#818cf8" : "inherit",
                }}
              >
                <TuneRoundedIcon sx={{ fontSize: 18 }} />
                {activeFilterCount > 0 && (
                  <Box sx={{ position: "absolute", top: 4, right: 4, width: 8, height: 8, borderRadius: "50%", background: "#6366f1" }} />
                )}
              </IconButton>
            </Tooltip>
            <Button variant="outlined" size="small" startIcon={<FileDownloadRoundedIcon />} onClick={exportCSV}
              disabled={loading || !trfs.length} sx={{ borderRadius: "10px", height: 38 }}>Export</Button>
            <Tooltip title="Refresh">
              <IconButton onClick={() => loadTRFs()} sx={{ background: isDark ? "rgba(148,163,184,0.08)" : "rgba(100,116,139,0.08)", borderRadius: "10px", width: 38, height: 38 }}>
                <RefreshRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            {can("create_trf") && (
              <Button variant="contained" size="small" startIcon={<AddRoundedIcon />} onClick={() => navigate("/create")}
                sx={{ borderRadius: "10px", height: 38, background: "linear-gradient(135deg,#6366f1,#06b6d4)", boxShadow: "0 4px 14px rgba(99,102,241,0.35)" }}>
                New TRF
              </Button>
            )}
          </Box>
        </Box>
      </motion.div>

      {/* ── Search + Filters Bar ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
        <Box sx={{ p: 2, borderRadius: "18px", background: cardBg, border: `1px solid ${border}`, backdropFilter: "blur(20px)", mb: 2 }}>
          {/* Search row */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
            <TextField
              fullWidth
              placeholder="Search by TRF number or project name…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} /></InputAdornment>,
                endAdornment: search ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearch("")}>
                      <CloseRoundedIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
                sx: { borderRadius: "10px" },
              }}
              sx={{ flex: 1, minWidth: 200 }}
            />
          </Box>

          {/* Filter row */}
          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
                <Box sx={{ pt: 2, display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
                  {/* Status */}
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Status</InputLabel>
                    <Select value={status} label="Status" onChange={e => handleStatusChange(e.target.value)} sx={{ borderRadius: "10px" }}>
                      {STATUS_OPTIONS.map(s => <MenuItem key={s} value={s}>{s || "All statuses"}</MenuItem>)}
                    </Select>
                  </FormControl>

                  {/* Priority */}
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel>Priority</InputLabel>
                    <Select value={priority} label="Priority" onChange={e => handlePriorityChange(e.target.value)} sx={{ borderRadius: "10px" }}>
                      {PRIORITY_OPTIONS.map(p => <MenuItem key={p} value={p}>{p || "All priorities"}</MenuItem>)}
                    </Select>
                  </FormControl>

                  {/* Sort by */}
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Sort by</InputLabel>
                    <Select value={sortBy} label="Sort by" onChange={e => { setSortBy(e.target.value); setPage(1); }} sx={{ borderRadius: "10px" }}>
                      {SORT_FIELDS.map(f => <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>)}
                    </Select>
                  </FormControl>

                  {/* Sort order */}
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={sortOrder === "asc" ? <ArrowUpwardRoundedIcon sx={{ fontSize: 14 }} /> : <ArrowDownwardRoundedIcon sx={{ fontSize: 14 }} />}
                    onClick={() => setSortOrder(v => v === "asc" ? "desc" : "asc")}
                    sx={{ borderRadius: "10px", height: 40 }}
                  >
                    {sortOrder === "asc" ? "Ascending" : "Descending"}
                  </Button>

                  {/* Active filter chips */}
                  {status && (
                    <Chip
                      label={status}
                      size="small"
                      onDelete={() => handleStatusChange("")}
                      sx={{ background: STATUS_COLORS[status]?.bg || "rgba(99,102,241,0.12)", color: STATUS_COLORS[status]?.text || "#818cf8", fontSize: "0.72rem" }}
                    />
                  )}
                  {priority && (
                    <Chip
                      label={priority}
                      size="small"
                      onDelete={() => handlePriorityChange("")}
                      sx={{ background: PRIORITY_COLORS[priority]?.bg || "rgba(99,102,241,0.12)", color: PRIORITY_COLORS[priority]?.text || "#818cf8", fontSize: "0.72rem" }}
                    />
                  )}

                  {activeFilterCount > 0 && (
                    <Button size="small" variant="text" onClick={() => { setStatus(""); setPriority(""); setPage(1); }}
                      sx={{ fontSize: "0.75rem", color: "#ef4444" }}>
                      Clear all
                    </Button>
                  )}
                </Box>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      </motion.div>

      {/* ── Table ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
        <Box sx={{ borderRadius: "18px", background: cardBg, border: `1px solid ${border}`, backdropFilter: "blur(20px)", overflow: "hidden" }}>

          {/* Header row */}
          <Box sx={{ display: "flex", alignItems: "center", px: 3, py: 1.75, background: isDark ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.04)", borderBottom: `1px solid ${border}`, gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: 150, flexShrink: 0 }}>
              <TagRoundedIcon sx={{ fontSize: 13, color: theme.palette.text.disabled }} />
              <SortHeader label="TRF Number" field="trf_number" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <SortHeader label="Project Name" field="project_name" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
            </Box>
            <Box sx={{ width: 100, flexShrink: 0 }}>
              <SortHeader label="Status" field="status" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
            </Box>
            <Box sx={{ width: 90, flexShrink: 0 }}>
              <SortHeader label="Priority" field="priority" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: 120, flexShrink: 0 }}>
              <CalendarTodayRoundedIcon sx={{ fontSize: 12, color: theme.palette.text.disabled }} />
              <SortHeader label="Created" field="created_at" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
            </Box>
            <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: theme.palette.text.disabled, letterSpacing: "0.08em", textTransform: "uppercase", width: 120, textAlign: "center", flexShrink: 0 }}>Actions</Typography>
          </Box>

          {/* Skeleton rows */}
          {loading && Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}

          {/* Empty state */}
          {!loading && trfs.length === 0 && (
            <Box sx={{ py: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <ListAltRoundedIcon sx={{ fontSize: 48, color: theme.palette.text.disabled }} />
              <Typography sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>
                {search || status || priority ? "No matching TRFs" : "No TRFs yet"}
              </Typography>
              {!search && !status && !priority && can("create_trf") && (
                <Button variant="contained" size="small" startIcon={<AddRoundedIcon />} onClick={() => navigate("/create")}
                  sx={{ mt: 1, borderRadius: "10px", background: "linear-gradient(135deg,#6366f1,#06b6d4)" }}>Create TRF</Button>
              )}
            </Box>
          )}

          {/* Data rows */}
          {!loading && trfs.map((trf, i) => {
            const sc = STATUS_COLORS[trf.status];
            const pc = PRIORITY_COLORS[trf.priority];
            return (
              <motion.div key={trf.trf_number} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.025 }}>
                <Box sx={{
                  display: "flex", alignItems: "center", px: 3, py: 1.75, gap: 2,
                  borderBottom: i < trfs.length - 1 ? `1px solid ${border}` : "none",
                  transition: "background 0.15s",
                  "&:hover": { background: isDark ? "rgba(148,163,184,0.04)" : "rgba(99,102,241,0.02)" },
                }}>
                  {/* TRF Number */}
                  <Box sx={{ width: 150, flexShrink: 0 }}>
                    <Chip label={trf.trf_number} size="small" sx={{ fontSize: "0.72rem", fontWeight: 700, height: 22, background: "rgba(99,102,241,0.12)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)" }} />
                  </Box>
                  {/* Project Name */}
                  <Typography sx={{ flex: 1, fontSize: "0.85rem", fontWeight: 500, color: theme.palette.text.primary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {trf.project_name || "—"}
                  </Typography>
                  {/* Status */}
                  <Box sx={{ width: 100, flexShrink: 0 }}>
                    {trf.status ? (
                      <Chip label={trf.status} size="small" sx={{ fontSize: "0.68rem", fontWeight: 700, height: 20, background: sc?.bg || "rgba(148,163,184,0.12)", color: sc?.text || "#94a3b8", maxWidth: "100%" }} />
                    ) : <Typography sx={{ fontSize: "0.78rem", color: theme.palette.text.disabled }}>—</Typography>}
                  </Box>
                  {/* Priority */}
                  <Box sx={{ width: 90, flexShrink: 0 }}>
                    {trf.priority ? (
                      <Chip label={trf.priority} size="small" sx={{ fontSize: "0.68rem", fontWeight: 700, height: 20, background: pc?.bg || "rgba(148,163,184,0.12)", color: pc?.text || "#94a3b8", maxWidth: "100%" }} />
                    ) : <Typography sx={{ fontSize: "0.78rem", color: theme.palette.text.disabled }}>—</Typography>}
                  </Box>
                  {/* Created */}
                  <Typography sx={{ width: 120, flexShrink: 0, fontSize: "0.78rem", color: theme.palette.text.secondary }}>
                    {trf.created_at ? new Date(trf.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                  </Typography>
                  {/* Actions */}
                  <Box sx={{ width: 120, flexShrink: 0, display: "flex", justifyContent: "center", gap: 0.5 }}>
                    <Tooltip title="Browse Files">
                      <IconButton size="small" onClick={() => navigate(`/files?trf=${trf.trf_number}`)}
                        sx={{ "&:hover": { color: "#06b6d4", background: "rgba(6,182,212,0.1)" }, borderRadius: "8px" }}>
                        <FolderOpenRoundedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="QR Code">
                      <IconButton size="small" onClick={() => setQrTarget({ trf_number: trf.trf_number, project_name: trf.project_name })}
                        sx={{ "&:hover": { color: "#6366f1", background: "rgba(99,102,241,0.1)" }, borderRadius: "8px" }}>
                        <QrCode2RoundedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                    {user?.role === "Admin" && (
                      <Tooltip title="Assign Project">
                        <IconButton size="small" onClick={() => navigate(`/assign?trf=${trf.trf_number}`)}
                          sx={{ "&:hover": { color: "#8b5cf6", background: "rgba(139,92,246,0.1)" }, borderRadius: "8px" }}>
                          <AssignmentIndRoundedIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    {can("update_trf") && (
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => navigate(`/update?trf=${trf.trf_number}`)}
                          sx={{ "&:hover": { color: "#f59e0b", background: "rgba(245,158,11,0.1)" }, borderRadius: "8px" }}>
                          <EditRoundedIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    {can("delete_trf") && (
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => setDelTarget(trf)}
                          sx={{ "&:hover": { color: "#ef4444", background: "rgba(239,68,68,0.1)" }, borderRadius: "8px" }}>
                          <DeleteRoundedIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Box>
              </motion.div>
            );
          })}
        </Box>
      </motion.div>

      {/* ── Pagination ── */}
      {!loading && pages > 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
            <Pagination
              count={pages}
              page={page}
              onChange={(_, v) => setPage(v)}
              color="primary"
              shape="rounded"
              sx={{
                "& .MuiPaginationItem-root": { borderRadius: "10px" },
                "& .Mui-selected": { background: "linear-gradient(135deg,#6366f1,#06b6d4) !important", color: "#fff" },
              }}
            />
          </Box>
        </motion.div>
      )}

      {/* ── QR Code Modal ── */}
      <QRCodeModal
        open={!!qrTarget}
        onClose={() => setQrTarget(null)}
        trfNumber={qrTarget?.trf_number}
        projectName={qrTarget?.project_name}
      />

      {/* ── Delete confirm ── */}
      <Dialog open={!!delTarget} onClose={() => !deleting && setDelTarget(null)}
        PaperProps={{ sx: { borderRadius: "20px", p: 1, background: isDark ? "rgba(10,15,30,0.97)" : "#fff", backdropFilter: "blur(30px)", border: `1px solid ${border}`, minWidth: 380 } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 0.5 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: "12px", background: "rgba(239,68,68,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <WarningAmberRoundedIcon sx={{ color: "#ef4444", fontSize: 20 }} />
          </Box>
          <Typography fontWeight={700}>Delete TRF?</Typography>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: theme.palette.text.secondary, fontSize: "0.88rem", mt: 1 }}>
            Delete <Chip label={delTarget?.trf_number} size="small" sx={{ fontSize: "0.72rem", background: "rgba(239,68,68,0.1)", color: "#ef4444" }} />? This removes all files and cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setDelTarget(null)} disabled={deleting} sx={{ borderRadius: "10px" }}>Cancel</Button>
          <Button variant="contained" onClick={handleDelete} disabled={deleting}
            startIcon={deleting ? <CircularProgress size={14} color="inherit" /> : <DeleteRoundedIcon />}
            sx={{ borderRadius: "10px", background: "linear-gradient(135deg,#ef4444,#dc2626)", boxShadow: "none" }}>
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
