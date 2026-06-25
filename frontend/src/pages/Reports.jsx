import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@mui/material/styles";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import MuiTooltip from "@mui/material/Tooltip";
import Skeleton from "@mui/material/Skeleton";
import toast from "react-hot-toast";

import AssessmentRoundedIcon    from "@mui/icons-material/AssessmentRounded";
import RefreshRoundedIcon       from "@mui/icons-material/RefreshRounded";
import FileDownloadRoundedIcon  from "@mui/icons-material/FileDownloadRounded";
import WarningAmberRoundedIcon  from "@mui/icons-material/WarningAmberRounded";
import SummarizeRoundedIcon     from "@mui/icons-material/SummarizeRounded";
import TableChartRoundedIcon    from "@mui/icons-material/TableChartRounded";
import FolderZipRoundedIcon     from "@mui/icons-material/FolderZipRounded";
import TrendingUpRoundedIcon    from "@mui/icons-material/TrendingUpRounded";

import { getAllTRFs } from "../services/trfService";

const REPORT_CARDS = [
  { id: "full",     title: "Full TRF Report",       desc: "Complete list of all TRFs with metadata", icon: <SummarizeRoundedIcon />, color: "#6366f1", tag: "CSV",  size: "~12 KB" },
  { id: "monthly",  title: "Monthly Summary",        desc: "TRF counts grouped by creation month",    icon: <TableChartRoundedIcon />, color: "#10b981", tag: "CSV",  size: "~3 KB" },
  { id: "activity", title: "Activity Log",           desc: "Audit trail of all system actions",       icon: <TrendingUpRoundedIcon />, color: "#f59e0b", tag: "CSV",  size: "~8 KB" },
  { id: "archive",  title: "Document Archive",       desc: "Metadata of all uploaded files",          icon: <FolderZipRoundedIcon />,  color: "#a855f7", tag: "ZIP",  size: "~45 KB" },
];

function buildMonthData(trfs) {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const label = d.toLocaleDateString("en-US", { month: "short" });
    const count = trfs.filter(t => {
      const cd = t.created_at ? new Date(t.created_at) : null;
      return cd && cd.getFullYear() === d.getFullYear() && cd.getMonth() === d.getMonth();
    }).length;
    return { name: label, trfs: count };
  });
}

export default function Reports() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [trfs,    setTrfs]    = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [loading, setLoading] = useState(true);

  const cardBg = isDark ? "rgba(15,23,42,0.72)" : "rgba(255,255,255,0.88)";
  const border  = isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.2)";
  const gridColor = isDark ? "rgba(148,163,184,0.08)" : "rgba(148,163,184,0.18)";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllTRFs();
      const data = Array.isArray(res.data) ? res.data : [];
      setTrfs(data);
      setMonthly(buildMonthData(data));
    } catch {
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const downloadCSV = (id) => {
    let rows, filename;
    if (id === "full") {
      rows = [["TRF Number", "Project Name", "Created At"], ...trfs.map(t => [t.trf_number, t.project_name, t.created_at || ""])];
      filename = "trf_full_report.csv";
    } else if (id === "monthly") {
      rows = [["Month", "TRF Count"], ...monthly.map(m => [m.name, m.trfs])];
      filename = "trf_monthly_summary.csv";
    } else if (id === "activity") {
      rows = [["Action", "User", "Time"], ["TRF System", "Admin", new Date().toISOString()]];
      filename = "trf_activity_log.csv";
    } else {
      toast("Archive export is a placeholder in this demo", { icon: "📁" });
      return;
    }
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filename} downloaded`);
  };

  return (
    <Box>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{
              width: 44, height: 44, borderRadius: "13px",
              background: "linear-gradient(135deg,#10b981,#06b6d4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 8px 20px rgba(16,185,129,0.35)",
            }}>
              <AssessmentRoundedIcon sx={{ color: "#fff", fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, fontSize: "1.65rem", color: theme.palette.text.primary, lineHeight: 1.2 }}>
                Reports
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: "0.82rem" }}>
                Download detailed reports and insights
              </Typography>
            </Box>
          </Box>
          <MuiTooltip title="Refresh">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}>
              <IconButton onClick={load} disabled={loading}
                sx={{ background: isDark ? "rgba(148,163,184,0.08)" : "rgba(100,116,139,0.08)", borderRadius: "10px" }}>
                <RefreshRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </motion.div>
          </MuiTooltip>
        </Box>
      </motion.div>

      {/* No-data warning */}
      {!loading && trfs.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Box sx={{
            p: 2, borderRadius: "14px", mb: 3,
            background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)",
            display: "flex", alignItems: "center", gap: 1.5,
          }}>
            <WarningAmberRoundedIcon sx={{ color: "#f59e0b", flexShrink: 0 }} />
            <Typography sx={{ fontSize: "0.85rem", color: "#f59e0b" }}>
              No TRF data found. Reports will be empty until you create TRFs.
            </Typography>
          </Box>
        </motion.div>
      )}

      {/* Chart */}
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Box sx={{ p: 3, borderRadius: "20px", background: cardBg, border: `1px solid ${border}`, backdropFilter: "blur(20px)", mb: 3 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", mb: 0.5, color: theme.palette.text.primary }}>
            TRFs Created (Last 6 Months)
          </Typography>
          <Typography sx={{ fontSize: "0.78rem", color: theme.palette.text.secondary, mb: 2.5 }}>
            Monthly TRF creation trend from backend data
          </Typography>
          {loading ? (
            <Skeleton variant="rounded" height={180} sx={{ borderRadius: "12px" }} />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={monthly} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: theme.palette.text.secondary }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: theme.palette.text.secondary }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: isDark ? "#0d1635" : "#fff", border: `1px solid ${border}`, borderRadius: 12, fontSize: 12 }}
                />
                <Bar dataKey="trfs" radius={[6, 6, 0, 0]} fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Box>
      </motion.div>

      {/* Report download cards */}
      <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: theme.palette.text.secondary, mb: 2, letterSpacing: "0.06em", textTransform: "uppercase" }}>
        Available Reports
      </Typography>
      <Grid container spacing={2}>
        {REPORT_CARDS.map((card, i) => (
          <Grid item xs={12} sm={6} key={card.id}>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + i * 0.08 }}
            >
              <Box sx={{
                p: 3, borderRadius: "18px", background: cardBg,
                border: `1px solid ${border}`, backdropFilter: "blur(20px)",
                height: "100%", display: "flex", flexDirection: "column", gap: 1.5,
                transition: "box-shadow 0.2s",
                "&:hover": { boxShadow: isDark ? "0 12px 36px rgba(0,0,0,0.35)" : "0 12px 36px rgba(15,23,42,0.1)" },
              }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <Box sx={{
                    width: 42, height: 42, borderRadius: "12px",
                    background: `${card.color}16`, border: `1px solid ${card.color}28`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: card.color,
                  }}>
                    {card.icon}
                  </Box>
                  <Box sx={{ display: "flex", gap: 0.75 }}>
                    <Chip label={card.tag}  size="small" sx={{ fontSize: "0.65rem", height: 18, background: `${card.color}14`, color: card.color }} />
                    <Chip label={card.size} size="small" sx={{ fontSize: "0.65rem", height: 18 }} />
                  </Box>
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: theme.palette.text.primary, mb: 0.4 }}>
                    {card.title}
                  </Typography>
                  <Typography sx={{ fontSize: "0.8rem", color: theme.palette.text.secondary, lineHeight: 1.5 }}>
                    {card.desc}
                  </Typography>
                </Box>
                <Box sx={{ mt: "auto" }}>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button
                      variant="outlined" size="small" fullWidth
                      startIcon={<FileDownloadRoundedIcon />}
                      onClick={() => downloadCSV(card.id)}
                      sx={{
                        borderRadius: "10px", fontWeight: 700, fontSize: "0.8rem",
                        borderColor: `${card.color}40`, color: card.color,
                        "&:hover": { background: `${card.color}08`, borderColor: card.color },
                      }}
                    >
                      Download {card.tag}
                    </Button>
                  </motion.div>
                </Box>
              </Box>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
