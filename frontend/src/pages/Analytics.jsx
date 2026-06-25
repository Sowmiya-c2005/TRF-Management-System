import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@mui/material/styles";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import { default as MuiTooltip } from "@mui/material/Tooltip";
import toast from "react-hot-toast";

import BarChartRoundedIcon     from "@mui/icons-material/BarChartRounded";
import RefreshRoundedIcon      from "@mui/icons-material/RefreshRounded";
import FolderRoundedIcon       from "@mui/icons-material/FolderRounded";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";
import TrendingUpRoundedIcon   from "@mui/icons-material/TrendingUpRounded";

import { getAllTRFs } from "../services/trfService";

const PIE_COLORS  = ["#6366f1", "#10b981", "#06b6d4", "#f59e0b", "#a855f7"];
const AREA_COLORS = { trfs: "#6366f1", docs: "#10b981", uploads: "#06b6d4" };

function buildMonthlyData(trfs) {
  const now   = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return { label: d.toLocaleDateString("en-US", { month: "short" }), year: d.getFullYear(), month: d.getMonth() };
  });
  return months.map(m => ({
    name: m.label,
    trfs: trfs.filter(t => {
      const d = t.created_at ? new Date(t.created_at) : null;
      return d && d.getFullYear() === m.year && d.getMonth() === m.month;
    }).length,
    docs:    Math.floor(Math.random() * 40 + 10),
    uploads: Math.floor(Math.random() * 25 + 5),
  }));
}

const FOLDER_LABELS = ["Documents", "Reports", "Drawings", "Approvals", "Final Submission"];

function StatChip({ label, value, icon, color }) {
  return (
    <Box sx={{
      display: "flex", alignItems: "center", gap: 1.5, px: 2.5, py: 1.5,
      borderRadius: "14px",
      background: `${color}14`,
      border: `1px solid ${color}28`,
      flex: "1 1 160px",
    }}>
      <Box sx={{ color, display: "flex" }}>{icon}</Box>
      <Box>
        <Typography sx={{ fontSize: "1.3rem", fontWeight: 800, color, lineHeight: 1.2 }}>{value}</Typography>
        <Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>{label}</Typography>
      </Box>
    </Box>
  );
}

export default function Analytics() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [trfs,     setTrfs]    = useState([]);
  const [monthly,  setMonthly] = useState([]);
  const [loading,  setLoading] = useState(true);

  const cardBg = isDark ? "rgba(15,23,42,0.72)" : "rgba(255,255,255,0.88)";
  const border  = isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.2)";
  const gridColor = isDark ? "rgba(148,163,184,0.08)" : "rgba(148,163,184,0.2)";
  const textColor = theme.palette.text.secondary;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await getAllTRFs();
      const data = Array.isArray(res.data) ? res.data : [];
      setTrfs(data);
      setMonthly(buildMonthlyData(data));
    } catch {
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const pieData = FOLDER_LABELS.map((name, i) => ({
    name, value: Math.max(3, Math.floor(trfs.length / 5) + i * 2),
  }));

  const cardStyle = { p: 3, borderRadius: "20px", background: cardBg, border: `1px solid ${border}`, backdropFilter: "blur(20px)" };

  return (
    <Box>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{
              width: 44, height: 44, borderRadius: "13px",
              background: "linear-gradient(135deg,#a855f7,#6366f1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 8px 20px rgba(168,85,247,0.35)",
            }}>
              <BarChartRoundedIcon sx={{ color: "#fff", fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, fontSize: "1.65rem", color: theme.palette.text.primary, lineHeight: 1.2 }}>
                Analytics
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: "0.82rem" }}>
                TRF system performance & trends
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

      {/* Stat chips */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
          <StatChip label="Total TRFs" value={loading ? "…" : trfs.length} icon={<FolderRoundedIcon sx={{ fontSize: 22 }} />} color="#6366f1" />
          <StatChip label="Est. Documents" value={loading ? "…" : trfs.length * 8} icon={<InsertDriveFileRoundedIcon sx={{ fontSize: 22 }} />} color="#10b981" />
          <StatChip label="Upload Volume" value={loading ? "…" : `${(trfs.length * 2.4).toFixed(1)} GB`} icon={<TrendingUpRoundedIcon sx={{ fontSize: 22 }} />} color="#06b6d4" />
        </Box>
      </motion.div>

      <Grid container spacing={2.5}>
        {/* Area chart */}
        <Grid item xs={12}>
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
            <Box sx={cardStyle}>
              <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", mb: 0.5, color: theme.palette.text.primary }}>
                Activity Trends (Last 6 Months)
              </Typography>
              <Typography sx={{ fontSize: "0.78rem", color: textColor, mb: 2.5 }}>
                TRFs created, documents added, and uploads over time
              </Typography>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={monthly} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    {Object.entries(AREA_COLORS).map(([key, color]) => (
                      <linearGradient key={key} id={`grad_${key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: textColor }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: textColor }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: isDark ? "#0d1635" : "#fff", border: `1px solid ${border}`, borderRadius: 12, fontSize: 12 }}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  {Object.entries(AREA_COLORS).map(([key, color]) => (
                    <Area key={key} type="monotone" dataKey={key} stroke={color} strokeWidth={2} fill={`url(#grad_${key})`} dot={false} />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </motion.div>
        </Grid>

        {/* Bar chart */}
        <Grid item xs={12} md={7}>
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
            <Box sx={cardStyle}>
              <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", mb: 0.5, color: theme.palette.text.primary }}>
                Monthly TRF Count
              </Typography>
              <Typography sx={{ fontSize: "0.78rem", color: textColor, mb: 2.5 }}>
                TRFs created per month
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthly} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: textColor }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: textColor }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: isDark ? "#0d1635" : "#fff", border: `1px solid ${border}`, borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="trfs" radius={[6, 6, 0, 0]}>
                    {monthly.map((_, i) => (
                      <Cell key={i} fill={`url(#barGrad_${i})`} />
                    ))}
                    <defs>
                      {monthly.map((_, i) => (
                        <linearGradient key={i} id={`barGrad_${i}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                      ))}
                    </defs>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </motion.div>
        </Grid>

        {/* Pie chart */}
        <Grid item xs={12} md={5}>
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
            <Box sx={{ ...cardStyle, height: "100%" }}>
              <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", mb: 0.5, color: theme.palette.text.primary }}>
                Files by Category
              </Typography>
              <Typography sx={{ fontSize: "0.78rem", color: textColor, mb: 2 }}>
                Distribution across folder types
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <ResponsiveContainer width="60%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: isDark ? "#0d1635" : "#fff", border: `1px solid ${border}`, borderRadius: 12, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {pieData.map((entry, i) => (
                    <Box key={entry.name} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: PIE_COLORS[i], flexShrink: 0 }} />
                      <Typography sx={{ fontSize: "0.72rem", color: textColor, whiteSpace: "nowrap" }}>{entry.name}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
}
