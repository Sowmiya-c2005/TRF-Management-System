import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "@mui/material/styles";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";

import FolderSpecialRoundedIcon from "@mui/icons-material/FolderSpecialRounded";
import DescriptionRoundedIcon   from "@mui/icons-material/DescriptionRounded";
import WorkRoundedIcon           from "@mui/icons-material/WorkRounded";
import StorageRoundedIcon        from "@mui/icons-material/StorageRounded";
import AddRoundedIcon            from "@mui/icons-material/AddRounded";
import TrendingUpRoundedIcon     from "@mui/icons-material/TrendingUpRounded";
import AccessTimeRoundedIcon     from "@mui/icons-material/AccessTimeRounded";

import StatCard     from "../components/StatCard";
import SkeletonCard from "../components/SkeletonCard";
import { useGreeting }       from "../hooks/useGreeting";
import { useApp }            from "../context/AppContext";
import { getAllTRFs, getDashboardStats } from "../services/trfService";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function buildMonthly(trfs) {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return MONTH_NAMES[d.getMonth()];
  });
  const counts = {};
  months.forEach((m) => (counts[m] = { trfs: 0, docs: 0 }));
  trfs.forEach((t) => {
    if (!t.created_at) return;
    const m = MONTH_NAMES[new Date(t.created_at).getMonth()];
    if (counts[m]) { counts[m].trfs += 1; counts[m].docs += 3; }
  });
  return months.map((m) => ({ month: m, ...counts[m] }));
}

function timeAgo(time) {
  if (!time) return "";
  const sec = Math.floor((Date.now() - new Date(time).getTime()) / 1000);
  if (sec < 60)   return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  return `${Math.floor(sec / 3600)}h ago`;
}

// ─── Static data (no backend endpoint for these yet) ──────────────────────────
const PIE_DATA = [
  { name: "Documents", value: 42, color: "#6366f1" },
  { name: "Drawings",  value: 28, color: "#06b6d4" },
  { name: "Reports",   value: 18, color: "#10b981" },
  { name: "Approvals", value: 12, color: "#f59e0b" },
];

const PROJECTS = [
  { name: "Project Alpha", progress: 78, status: "Active",        color: "#6366f1" },
  { name: "Project Beta",  progress: 45, status: "In Progress",   color: "#06b6d4" },
  { name: "Project Gamma", progress: 92, status: "Near Complete", color: "#10b981" },
  { name: "Project Delta", progress: 23, status: "Starting",      color: "#f59e0b" },
];

// ─── Variants ─────────────────────────────────────────────────────────────────
const stagger = { animate: { transition: { staggerChildren: 0.07 } } };
const fadeUp  = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0, transition: { duration: 0.38 } } };

// ─── Component ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const theme   = useTheme();
  const isDark  = theme.palette.mode === "dark";
  const navigate  = useNavigate();
  const greeting  = useGreeting();
  const { user, activities } = useApp();

  const [stats,   setStats]   = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [loading, setLoading] = useState(true);

  const displayName = user?.displayName || user?.username || "there";
  const cardBg = isDark ? "rgba(15,23,42,0.72)" : "rgba(255,255,255,0.88)";
  const border = isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.2)";
  const chartText = isDark ? "#94a3b8" : "#64748b";
  const chartGrid = isDark ? "rgba(148,163,184,0.06)" : "rgba(148,163,184,0.16)";
  const tooltip   = { background: isDark ? "#1e293b" : "#fff", border: `1px solid ${border}`, borderRadius: 10, fontSize: "0.78rem" };

  useEffect(() => {
    Promise.all([getDashboardStats(), getAllTRFs()])
      .then(([statsRes, trfsRes]) => {
        setStats(statsRes.data);
        setMonthly(buildMonthly(trfsRes.data || []));
      })
      .catch(() => setStats({ total_trfs: 0 }))
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { title: "Total TRFs",      value: loading ? "—" : (stats?.total_trfs ?? 0),
      subtitle: "Live from database", icon: <FolderSpecialRoundedIcon />,
      gradient: "linear-gradient(135deg,#6366f1,#818cf8)", glowColor: "#6366f1", delay: 0 },
    { title: "Total Documents",  value: 2345,
      subtitle: "↑ 8% this month",   icon: <DescriptionRoundedIcon />,
      gradient: "linear-gradient(135deg,#06b6d4,#22d3ee)", glowColor: "#06b6d4", delay: 0.08 },
    { title: "Active Projects",  value: 58,
      subtitle: "↑ 3 new this week",  icon: <WorkRoundedIcon />,
      gradient: "linear-gradient(135deg,#10b981,#34d399)", glowColor: "#10b981", delay: 0.16 },
    { title: "Storage Used",     value: "12 GB",
      subtitle: "48% of 25 GB used",  icon: <StorageRoundedIcon />,
      gradient: "linear-gradient(135deg,#f59e0b,#fbbf24)", glowColor: "#f59e0b", delay: 0.24 },
  ];

  return (
    <motion.div variants={stagger} initial="initial" animate="animate">

      {/* Header */}
      <motion.div variants={fadeUp}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 4, flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{
              fontWeight: 800, fontSize: "clamp(1.3rem,2.5vw,1.65rem)",
              background: isDark ? "linear-gradient(135deg,#f1f5f9 30%,#94a3b8)" : "linear-gradient(135deg,#0f172a 30%,#475569)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>
              {greeting.text}, {displayName} {greeting.emoji}
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
              Welcome back to TRF Management System. Here's what's happening today.
            </Typography>
          </Box>
          <Button
            variant="contained" startIcon={<AddRoundedIcon />}
            onClick={() => navigate("/create")}
            component={motion.button} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            sx={{ background: "linear-gradient(135deg,#6366f1,#06b6d4)", borderRadius: "12px", px: 2.5, py: 1, boxShadow: "0 8px 20px rgba(99,102,241,0.35)" }}
          >
            New TRF
          </Button>
        </Box>
      </motion.div>

      {/* KPI cards */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {loading
          ? [0,1,2,3].map((i) => <Grid item xs={12} sm={6} lg={3} key={i}><SkeletonCard /></Grid>)
          : statCards.map((card) => (
              <Grid item xs={12} sm={6} lg={3} key={card.title}>
                <StatCard {...card} />
              </Grid>
            ))
        }
      </Grid>

      {/* Charts */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        <Grid item xs={12} lg={8}>
          <motion.div variants={fadeUp}>
            <Box sx={{ p: 3, borderRadius: "18px", background: cardBg, backdropFilter: "blur(20px)", border: `1px solid ${border}` }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
                <Box>
                  <Typography variant="h6" fontWeight={700} sx={{ fontSize: "1rem" }}>Monthly Overview</Typography>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                    Live — TRFs & estimated documents · last 6 months
                  </Typography>
                </Box>
                <Chip icon={<TrendingUpRoundedIcon sx={{ fontSize: "14px !important" }} />} label="Live data" color="success" size="small" sx={{ fontWeight: 600 }} />
              </Box>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={monthly} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dTRF"  x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.32} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="dDocs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.32} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                  <XAxis dataKey="month" tick={{ fill: chartText, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: chartText, fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltip} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "0.78rem" }} />
                  <Area type="monotone" dataKey="trfs" name="TRFs"      stroke="#6366f1" strokeWidth={2.5} fill="url(#dTRF)"  dot={false} />
                  <Area type="monotone" dataKey="docs" name="Documents" stroke="#06b6d4" strokeWidth={2.5} fill="url(#dDocs)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </motion.div>
        </Grid>

        <Grid item xs={12} lg={4}>
          <motion.div variants={fadeUp} style={{ height: "100%" }}>
            <Box sx={{ p: 3, borderRadius: "18px", background: cardBg, backdropFilter: "blur(20px)", border: `1px solid ${border}`, height: "100%" }}>
              <Typography variant="h6" fontWeight={700} sx={{ fontSize: "1rem", mb: 0.5 }}>File Types</Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>Distribution by category</Typography>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={52} outerRadius={78} paddingAngle={3} dataKey="value">
                    {PIE_DATA.map((d, i) => <Cell key={i} fill={d.color} stroke="transparent" />)}
                  </Pie>
                  <Tooltip contentStyle={tooltip} />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                {PIE_DATA.map((d) => (
                  <Box key={d.name} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: d.color }} />
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: "0.75rem" }}>{d.name}</Typography>
                    </Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.75rem" }}>{d.value}%</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </motion.div>
        </Grid>
      </Grid>

      {/* Bottom row */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={5}>
          <motion.div variants={fadeUp}>
            <Box sx={{ p: 3, borderRadius: "18px", background: cardBg, backdropFilter: "blur(20px)", border: `1px solid ${border}` }}>
              <Typography variant="h6" fontWeight={700} sx={{ fontSize: "1rem", mb: 0.5 }}>TRFs per Month</Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: "block", mb: 2.5 }}>Live creation volume</Typography>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={monthly} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: chartText, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: chartText, fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltip} cursor={{ fill: isDark ? "rgba(148,163,184,0.04)" : "rgba(148,163,184,0.08)" }} />
                  <Bar dataKey="trfs" name="TRFs" fill="url(#dBar)" radius={[6,6,0,0]} />
                  <defs>
                    <linearGradient id="dBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={4}>
          <motion.div variants={fadeUp}>
            <Box sx={{ p: 3, borderRadius: "18px", background: cardBg, backdropFilter: "blur(20px)", border: `1px solid ${border}`, height: "100%" }}>
              <Typography variant="h6" fontWeight={700} sx={{ fontSize: "1rem", mb: 0.5 }}>Project Progress</Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: "block", mb: 2.5 }}>Active project completion</Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {PROJECTS.map((p, i) => (
                  <motion.div key={p.name} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.08 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.6 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, fontSize: "0.78rem" }}>{p.name}</Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                        <Chip label={p.status} size="small" sx={{ height: 18, fontSize: "0.6rem", fontWeight: 700, background: `${p.color}20`, color: p.color, border: `1px solid ${p.color}40` }} />
                        <Typography variant="caption" sx={{ fontWeight: 700, color: p.color, fontSize: "0.78rem" }}>{p.progress}%</Typography>
                      </Box>
                    </Box>
                    <LinearProgress variant="determinate" value={p.progress} sx={{
                      height: 6, borderRadius: 10,
                      backgroundColor: isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.15)",
                      "& .MuiLinearProgress-bar": { borderRadius: 10, background: `linear-gradient(90deg,${p.color},${p.color}88)` },
                    }} />
                  </motion.div>
                ))}
              </Box>
            </Box>
          </motion.div>
        </Grid>

        {/* Live activity feed from AppContext */}
        <Grid item xs={12} md={3}>
          <motion.div variants={fadeUp}>
            <Box sx={{ p: 3, borderRadius: "18px", background: cardBg, backdropFilter: "blur(20px)", border: `1px solid ${border}`, height: "100%" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}>
                <AccessTimeRoundedIcon sx={{ fontSize: 17, color: theme.palette.primary.main }} />
                <Typography variant="h6" fontWeight={700} sx={{ fontSize: "1rem" }}>Activity</Typography>
                <Box sx={{ ml: "auto", width: 7, height: 7, borderRadius: "50%", background: "#10b981", animation: "pulseDot 2s ease infinite" }} />
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                {activities.slice(0, 5).map((act, i) => (
                  <motion.div key={act.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.07 }}>
                    <Box sx={{ display: "flex", gap: 1.5, py: 1.2, position: "relative" }}>
                      {i < 4 && (
                        <Box sx={{ position: "absolute", left: 14, top: 36, bottom: 0, width: 1, background: isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.2)" }} />
                      )}
                      <Box sx={{
                        width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                        background: `${act.color}22`, border: `1px solid ${act.color}45`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Box sx={{ width: 7, height: 7, borderRadius: "50%", background: act.color }} />
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, fontSize: "0.74rem", display: "block", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {act.action}
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: "0.67rem" }}>
                          {act.user} · {timeAgo(act.time)}
                        </Typography>
                      </Box>
                    </Box>
                  </motion.div>
                ))}
                {activities.length === 0 && (
                  <Typography variant="caption" sx={{ color: theme.palette.text.disabled, textAlign: "center", py: 3 }}>
                    No recent activity
                  </Typography>
                )}
              </Box>
            </Box>
          </motion.div>
        </Grid>
      </Grid>
    </motion.div>
  );
}
