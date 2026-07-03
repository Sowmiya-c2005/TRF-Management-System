import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Skeleton from "@mui/material/Skeleton";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import toast from "react-hot-toast";

import SearchRoundedIcon       from "@mui/icons-material/SearchRounded";
import RefreshRoundedIcon      from "@mui/icons-material/RefreshRounded";
import HistoryRoundedIcon      from "@mui/icons-material/HistoryRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";

import API from "../services/api";

const ACTION_COLORS = {
  CREATE_TRF:     { bg: "rgba(99,102,241,0.12)",  color: "#818cf8" },
  UPDATE_TRF:     { bg: "rgba(245,158,11,0.12)",  color: "#fbbf24" },
  DELETE_TRF:     { bg: "rgba(239,68,68,0.12)",   color: "#f87171" },
  UPLOAD_FILE:    { bg: "rgba(16,185,129,0.12)",  color: "#34d399" },
  DELETE_FILE:    { bg: "rgba(239,68,68,0.12)",   color: "#f87171" },
  SYNC_FILES:     { bg: "rgba(6,182,212,0.12)",   color: "#22d3ee" },
  LOGIN:          { bg: "rgba(168,85,247,0.12)",  color: "#c084fc" },
  LOGOUT:         { bg: "rgba(100,116,139,0.12)", color: "#94a3b8" },
  REGISTER:       { bg: "rgba(16,185,129,0.12)",  color: "#34d399" },
  UPDATE_PROFILE: { bg: "rgba(245,158,11,0.12)",  color: "#fbbf24" },
  CHANGE_PASSWORD:{ bg: "rgba(239,68,68,0.12)",   color: "#f87171" },
  UPDATE_ROLE:    { bg: "rgba(6,182,212,0.12)",   color: "#22d3ee" },
  DELETE_USER:    { bg: "rgba(239,68,68,0.12)",   color: "#f87171" },
};

const ACTION_OPTIONS = [
  "All", "CREATE_TRF", "UPDATE_TRF", "DELETE_TRF",
  "UPLOAD_FILE", "DELETE_FILE", "LOGIN", "LOGOUT", "REGISTER",
];

function timeFormat(ts) {
  try {
    return new Date(ts).toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  } catch { return ts; }
}

function SkeletonRow() {
  return (
    <Box sx={{ display: "flex", gap: 2, p: 2, alignItems: "center" }}>
      <Skeleton variant="rounded" width={100} height={20} />
      <Skeleton variant="rounded" width={80}  height={20} />
      <Skeleton variant="rounded" width="50%" height={16} />
      <Skeleton variant="rounded" width={130} height={16} sx={{ ml: "auto" }} />
    </Box>
  );
}

export default function AuditLog() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [action,  setAction]  = useState("All");
  const [user,    setUser]    = useState("");
  const [limit,   setLimit]   = useState(100);

  const cardBg = isDark ? "rgba(15,23,42,0.72)" : "rgba(255,255,255,0.88)";
  const border = isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.2)";

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(limit) });
      if (action !== "All") params.set("action", action);
      if (user.trim())       params.set("username", user.trim());
      if (search.trim())     params.set("search", search.trim());

      const res = await API.get(`/audits/?${params}`);
      setLogs(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      toast.error(e.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [action, user, search, limit]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const exportCSV = () => {
    const headers = ["ID", "Timestamp", "User", "Action", "Details", "IP"];
    const rows = logs.map(l => [
      l.id, timeFormat(l.created_at), l.username || "System",
      l.action, (l.details || "").replace(/,/g, ";"), l.ip_address || "",
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const url  = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a    = document.createElement("a");
    a.href     = url; a.download = "audit_log.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Audit log exported");
  };

  return (
    <Box>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 4, flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{
              width: 44, height: 44, borderRadius: "13px",
              background: "linear-gradient(135deg,#a855f7,#6366f1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 8px 20px rgba(168,85,247,0.35)",
            }}>
              <HistoryRoundedIcon sx={{ color: "#fff", fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, fontSize: "1.65rem", color: theme.palette.text.primary, lineHeight: 1.2 }}>
                Audit Log
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: "0.82rem" }}>
                {loading ? "Loading…" : `${logs.length} entries`}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Button variant="outlined" size="small" startIcon={<FileDownloadRoundedIcon />}
              onClick={exportCSV} disabled={!logs.length}
              sx={{ borderRadius: "10px" }}>
              Export CSV
            </Button>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchLogs}
                sx={{ background: isDark ? "rgba(148,163,184,0.08)" : "rgba(100,116,139,0.08)", borderRadius: "10px" }}>
                <RefreshRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <Box sx={{
          p: 2.5, borderRadius: "18px", background: cardBg,
          border: `1px solid ${border}`, backdropFilter: "blur(20px)",
          mb: 2.5, display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center",
        }}>
          <TextField
            placeholder="Search details…" value={search}
            onChange={e => setSearch(e.target.value)}
            size="small" sx={{ flex: "1 1 200px", minWidth: 180 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ fontSize: 17 }} /></InputAdornment>,
              sx: { borderRadius: "10px" },
            }}
          />
          <TextField
            placeholder="Filter by username" value={user}
            onChange={e => setUser(e.target.value)}
            size="small" sx={{ flex: "1 1 150px", minWidth: 140 }}
            InputProps={{ sx: { borderRadius: "10px" } }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Action</InputLabel>
            <Select value={action} label="Action" onChange={e => setAction(e.target.value)} sx={{ borderRadius: "10px" }}>
              {ACTION_OPTIONS.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Limit</InputLabel>
            <Select value={limit} label="Limit" onChange={e => setLimit(e.target.value)} sx={{ borderRadius: "10px" }}>
              {[50, 100, 200, 500].map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
        <Box sx={{ borderRadius: "18px", background: cardBg, border: `1px solid ${border}`, backdropFilter: "blur(20px)", overflow: "hidden" }}>

          {/* Header row */}
          <Box sx={{
            display: "grid", gridTemplateColumns: "80px 130px 130px 1fr 200px",
            px: 2.5, py: 1.5,
            background: isDark ? "rgba(168,85,247,0.08)" : "rgba(168,85,247,0.04)",
            borderBottom: `1px solid ${border}`,
          }}>
            {["ID", "Action", "User", "Details", "Timestamp"].map(h => (
              <Typography key={h} sx={{ fontSize: "0.7rem", fontWeight: 700, color: theme.palette.text.disabled, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {h}
              </Typography>
            ))}
          </Box>

          {/* Skeleton */}
          {loading && Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}

          {/* Empty */}
          {!loading && logs.length === 0 && (
            <Box sx={{ py: 10, textAlign: "center" }}>
              <HistoryRoundedIcon sx={{ fontSize: 48, color: theme.palette.text.disabled, mb: 1.5 }} />
              <Typography sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>No audit entries found</Typography>
              <Typography sx={{ fontSize: "0.82rem", color: theme.palette.text.disabled }}>Try adjusting your filters</Typography>
            </Box>
          )}

          {/* Rows */}
          {!loading && logs.map((log, i) => {
            const col = ACTION_COLORS[log.action] || { bg: "rgba(148,163,184,0.1)", color: "#94a3b8" };
            return (
              <motion.div key={log.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.025 }}>
                <Box sx={{
                  display: "grid", gridTemplateColumns: "80px 130px 130px 1fr 200px",
                  px: 2.5, py: 1.6, alignItems: "center",
                  borderBottom: i < logs.length - 1 ? `1px solid ${border}` : "none",
                  transition: "background 0.15s",
                  "&:hover": { background: isDark ? "rgba(148,163,184,0.04)" : "rgba(168,85,247,0.02)" },
                }}>
                  <Typography sx={{ fontSize: "0.75rem", color: theme.palette.text.disabled, fontFamily: "monospace" }}>
                    #{log.id}
                  </Typography>
                  <Box>
                    <Chip label={log.action} size="small" sx={{
                      fontSize: "0.62rem", height: 20, fontWeight: 700,
                      background: col.bg, color: col.color,
                      border: `1px solid ${col.color}40`,
                    }} />
                  </Box>
                  <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: theme.palette.text.primary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {log.username || "System"}
                  </Typography>
                  <Typography sx={{ fontSize: "0.78rem", color: theme.palette.text.secondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", pr: 2 }}>
                    {log.details || "—"}
                  </Typography>
                  <Typography sx={{ fontSize: "0.72rem", color: theme.palette.text.disabled, fontVariantNumeric: "tabular-nums" }}>
                    {timeFormat(log.created_at)}
                  </Typography>
                </Box>
              </motion.div>
            );
          })}
        </Box>
      </motion.div>
    </Box>
  );
}
