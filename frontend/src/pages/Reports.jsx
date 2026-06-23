import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import toast from "react-hot-toast";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import DownloadRoundedIcon   from "@mui/icons-material/DownloadRounded";
import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded";
import RefreshRoundedIcon    from "@mui/icons-material/RefreshRounded";

import { getAllTRFs } from "../services/trfService";

// ─── Generate per-month counts from real TRF data ─────────────────────────────
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function buildChartData(trfs) {
  const counts = {};
  trfs.forEach((t) => {
    if (!t.created_at) return;
    const d = new Date(t.created_at);
    const key = MONTH_NAMES[d.getMonth()];
    counts[key] = (counts[key] || 0) + 1;
  });
  // Keep last 6 months in order
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const m = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const label = MONTH_NAMES[m.getMonth()];
    return { month: label, count: counts[label] || 0 };
  });
}

// ─── CSV export utility ───────────────────────────────────────────────────────
function downloadCSV(rows, filename) {
  if (!rows.length) { toast.error("No data to export"); return; }
  const keys   = Object.keys(rows[0]);
  const header = keys.join(",");
  const body   = rows.map((r) => keys.map((k) => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob   = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8;" });
  const url    = URL.createObjectURL(blob);
  const a      = document.createElement("a");
  a.href       = url;
  a.download   = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const stagger = { animate: { transition: { staggerChildren: 0.08 } } };
const fadeUp  = { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export default function Reports() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [trfs,       setTrfs]       = useState([]);
  const [chartData,  setChartData]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [exporting,  setExporting]  = useState(null); // id of report being exported

  const cardBg = isDark ? "rgba(15,23,42,0.72)" : "rgba(255,255,255,0.88)";
  const border = isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.2)";
  const chartText = isDark ? "#94a3b8" : "#64748b";
  const chartGrid = isDark ? "rgba(148,163,184,0.06)" : "rgba(148,163,184,0.15)";

  const fetchData = async () => {
    setLoading(true);
    try {
      const r = await getAllTRFs();
      const data = r.data || [];
      setTrfs(data);
      setChartData(buildChartData(data));
    } catch {
      toast.error("Failed to load TRF data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── Dynamic report definitions ───────────────────────────────────────────────
  const now     = new Date();
  const monthLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
  const totalTRFs  = trfs.length;

  const REPORTS = [
    {
      id:    "monthly-summary",
      title: `Monthly TRF Summary`,
      desc:  `All ${totalTRFs} TRFs · ${monthLabel}`,
      date:  monthLabel,
      size:  `${(totalTRFs * 0.4).toFixed(1)} KB`,
      tag:   "Monthly",
      getData: () => trfs.map((t) => ({
        TRF_Number:   t.trf_number,
        Project_Name: t.project_name,
        Created_At:   t.created_at,
      })),
      filename: `TRF_Monthly_Summary_${monthLabel.replace(" ","_")}.csv`,
    },
    {
      id:    "trf-listing",
      title: "Full TRF Listing",
      desc:  "Complete export of all TRF records",
      date:  monthLabel,
      size:  `${(totalTRFs * 0.6).toFixed(1)} KB`,
      tag:   "Export",
      getData: () => trfs.map((t) => ({
        ID:           t.id,
        TRF_Number:   t.trf_number,
        Project_Name: t.project_name,
        Created_At:   t.created_at,
      })),
      filename: "All_TRFs.csv",
    },
    {
      id:    "monthly-counts",
      title: "Monthly Volume Report",
      desc:  "TRF count per month (last 6 months)",
      date:  monthLabel,
      size:  "< 1 KB",
      tag:   "Trend",
      getData: () => chartData.map((d) => ({ Month: d.month, TRF_Count: d.count })),
      filename: "TRF_Monthly_Volume.csv",
    },
    {
      id:    "project-index",
      title: "Project Name Index",
      desc:  "Unique project names with TRF counts",
      date:  monthLabel,
      size:  `${(totalTRFs * 0.2).toFixed(1)} KB`,
      tag:   "Index",
      getData: () => {
        const counts = {};
        trfs.forEach((t) => { counts[t.project_name] = (counts[t.project_name] || 0) + 1; });
        return Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .map(([Project_Name, TRF_Count]) => ({ Project_Name, TRF_Count }));
      },
      filename: "Project_Index.csv",
    },
  ];

  const handleDownload = async (report) => {
    setExporting(report.id);
    await new Promise((r) => setTimeout(r, 300)); // brief feedback delay
    try {
      const data = report.getData();
      downloadCSV(data, report.filename);
      toast.success(`"${report.title}" downloaded`);
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(null);
    }
  };

  return (
    <motion.div variants={stagger} initial="initial" animate="animate">

      {/* Header */}
      <motion.div variants={fadeUp}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mb: 4, flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, fontSize: "1.6rem", color: theme.palette.text.primary }}>
              Reports
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
              Download CSV reports generated from live TRF data.
            </Typography>
          </Box>
          <Button
            size="small" startIcon={<RefreshRoundedIcon />} onClick={fetchData} disabled={loading}
            sx={{ borderRadius: "10px" }}
          >
            Refresh
          </Button>
        </Box>
      </motion.div>

      <Grid container spacing={2.5}>

        {/* ── Bar chart — real data ── */}
        <Grid item xs={12} md={5}>
          <motion.div variants={fadeUp}>
            <Box sx={{ p: 3, borderRadius: "18px", background: cardBg, border: `1px solid ${border}`, backdropFilter: "blur(20px)" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                <Typography variant="h6" fontWeight={700} sx={{ fontSize: "1rem" }}>TRFs Per Month</Typography>
                <Chip label={`${totalTRFs} total`} size="small" sx={{ fontWeight: 700, fontSize: "0.7rem", background: "rgba(99,102,241,0.12)", color: "#818cf8" }} />
              </Box>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: "block", mb: 3 }}>
                Live from database — last 6 months
              </Typography>
              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
                  <CircularProgress size={28} sx={{ color: "#6366f1" }} />
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData} margin={{ left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: chartText, fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: chartText, fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: isDark ? "#1e293b" : "#fff", border: `1px solid ${border}`, borderRadius: 10, fontSize: "0.78rem" }}
                      cursor={{ fill: isDark ? "rgba(148,163,184,0.04)" : "rgba(148,163,184,0.08)" }}
                    />
                    <Bar dataKey="count" name="TRFs" fill="url(#repGrad)" radius={[6,6,0,0]} />
                    <defs>
                      <linearGradient id="repGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Box>
          </motion.div>
        </Grid>

        {/* ── Downloadable reports ── */}
        <Grid item xs={12} md={7}>
          <motion.div variants={fadeUp}>
            <Box sx={{ p: 3, borderRadius: "18px", background: cardBg, border: `1px solid ${border}`, backdropFilter: "blur(20px)" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
                <AssessmentRoundedIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
                <Typography variant="h6" fontWeight={700} sx={{ fontSize: "1rem" }}>Downloadable Reports</Typography>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {REPORTS.map((r, i) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                  >
                    <Box sx={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      p: 1.5, borderRadius: "12px",
                      background: isDark ? "rgba(148,163,184,0.04)" : "rgba(100,116,139,0.04)",
                      border: `1px solid ${border}`,
                      "&:hover": { borderColor: theme.palette.primary.main, background: isDark ? "rgba(99,102,241,0.05)" : "rgba(99,102,241,0.03)" },
                      transition: "all 0.18s",
                    }}>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.3 }}>
                          <Typography variant="body2" fontWeight={600} sx={{ fontSize: "0.82rem" }}>{r.title}</Typography>
                          <Chip label={r.tag} size="small" sx={{ height: 18, fontSize: "0.62rem", fontWeight: 700, background: "rgba(99,102,241,0.15)", color: "#818cf8" }} />
                        </Box>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: "0.72rem" }}>
                          {loading ? "Loading…" : r.desc} · {r.date} · {loading ? "…" : r.size}
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        onClick={() => handleDownload(r)}
                        disabled={loading || exporting === r.id}
                        startIcon={
                          exporting === r.id
                            ? <CircularProgress size={12} color="inherit" />
                            : <DownloadRoundedIcon sx={{ fontSize: "14px !important" }} />
                        }
                        sx={{ borderRadius: "8px", fontSize: "0.72rem", fontWeight: 600, minWidth: 96, ml: 1, flexShrink: 0 }}
                      >
                        {exporting === r.id ? "Exporting…" : "Download"}
                      </Button>
                    </Box>
                  </motion.div>
                ))}
              </Box>

              {!loading && totalTRFs === 0 && (
                <Box sx={{ mt: 2, p: 2, borderRadius: "10px", background: isDark ? "rgba(245,158,11,0.08)" : "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", textAlign: "center" }}>
                  <Typography variant="caption" sx={{ color: "#f59e0b", fontWeight: 600 }}>
                    No TRFs in the database yet. Reports will contain live data once TRFs are created.
                  </Typography>
                </Box>
              )}
            </Box>
          </motion.div>
        </Grid>
      </Grid>
    </motion.div>
  );
}
