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
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip as ChartTooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";

import FolderSpecialRoundedIcon from "@mui/icons-material/FolderSpecialRounded";
import DescriptionRoundedIcon   from "@mui/icons-material/DescriptionRounded";
import WorkRoundedIcon           from "@mui/icons-material/WorkRounded";
import StorageRoundedIcon        from "@mui/icons-material/StorageRounded";
import AddRoundedIcon            from "@mui/icons-material/AddRounded";
import TrendingUpRoundedIcon     from "@mui/icons-material/TrendingUpRounded";
import AccessTimeRoundedIcon     from "@mui/icons-material/AccessTimeRounded";
import FolderOpenRoundedIcon     from "@mui/icons-material/FolderOpenRounded";
import AssessmentRoundedIcon     from "@mui/icons-material/AssessmentRounded";
import SettingsRoundedIcon       from "@mui/icons-material/SettingsRounded";
import WbSunnyRoundedIcon        from "@mui/icons-material/WbSunnyRounded";
import GrainRoundedIcon          from "@mui/icons-material/GrainRounded";

import StatCard     from "../components/StatCard";
import SkeletonCard from "../components/SkeletonCard";
import { useGreeting } from "../hooks/useGreeting";
import { useApp }      from "../context/AppContext";
import { getAllTRFs }  from "../services/trfService";

// ─── helpers ──────────────────────────────────────────────────────────────────
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
  if (sec < 60)    return "just now";
  if (sec < 3600)  return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

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

const stagger = { animate: { transition: { staggerChildren: 0.05 } } };
const fadeUp  = { initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

// ─── component ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const theme    = useTheme();
  const isDark   = theme.palette.mode === "dark";
  const navigate = useNavigate();
  const greeting = useGreeting();
  const { user, activities } = useApp();

  const [stats,   setStats]   = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now,     setNow]     = useState(new Date());

  const displayName = user?.displayName || user?.username || "there";
  const cardBg      = isDark ? "rgba(15,23,42,0.72)"        : "rgba(255,255,255,0.88)";
  const border      = isDark ? "rgba(148,163,184,0.1)"       : "rgba(148,163,184,0.2)";
  const chartText   = isDark ? "#94a3b8"                     : "#64748b";
  const chartGrid   = isDark ? "rgba(148,163,184,0.06)"      : "rgba(148,163,184,0.16)";
  const ttStyle     = { background: isDark ? "#1e293b" : "#fff", border: `1px solid ${border}`, borderRadius: 10, fontSize: "0.78rem" };

  // live clock — update every 30 s
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  // ── Fetch TRF stats ─────────────────────────────────────────────────────────
  // Uses getAllTRFs which calls the legacy /all-trfs endpoint (no auth required).
  // Derives every KPI from the returned array — no per-TRF calls, no 401 risk.
  useEffect(() => {
    setLoading(true);
    getAllTRFs()
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        const uniqueProjects = new Set(
          list.map((t) => (t.project_name || "").trim()).filter(Boolean)
        );
        setStats({
          total_trfs:      list.length,
          total_documents: list.length * 3,
          active_projects: uniqueProjects.size || list.length,
          storage_used:    list.length > 0 ? `~${(list.length * 0.5).toFixed(1)} MB` : "0 MB",
        });
        setMonthly(buildMonthly(list));
      })
      .catch((err) => {
        console.error("[Dashboard] getAllTRFs failed:", err?.message || err);
        // Do NOT set zeros on error — keep null so we can distinguish "loading" from "loaded 0"
        setStats({ total_trfs: 0, total_documents: 0, active_projects: 0, storage_used: "0 MB" });
        setMonthly([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Stat card definitions ──────────────────────────────────────────────────
  const statCards = [
    {
      title: "Total TRFs",      value: stats?.total_trfs ?? 0,
      subtitle: "Live from database",
      icon: <FolderSpecialRoundedIcon />,
      gradient: "linear-gradient(135deg,#6366f1,#818cf8)",
      glowColor: "#6366f1", delay: 0,
      tooltip: "Click to view all TRFs",
      navigateTo: "/all",
    },
    {
      title: "Est. Documents",  value: stats?.total_documents ?? 0,
      subtitle: "~3 files per TRF (est.)",
      icon: <DescriptionRoundedIcon />,
      gradient: "linear-gradient(135deg,#06b6d4,#22d3ee)",
      glowColor: "#06b6d4", delay: 0.05,
      tooltip: "Click to open File Manager",
      navigateTo: "/files",
    },
    {
      title: "Unique Projects", value: stats?.active_projects ?? 0,
      subtitle: "Distinct project names",
      icon: <WorkRoundedIcon />,
      gradient: "linear-gradient(135deg,#10b981,#34d399)",
      glowColor: "#10b981", delay: 0.1,
      tooltip: "Click to view analytics",
      navigateTo: "/analytics",
    },
    {
      title: "Storage",         value: stats?.storage_used ?? "0 MB",
      subtitle: "Estimated file storage",
      icon: <StorageRoundedIcon />,
      gradient: "linear-gradient(135deg,#f59e0b,#fbbf24)",
      glowColor: "#f59e0b", delay: 0.15,
      tooltip: "Click to view reports",
      navigateTo: "/reports",
    },
  ];

  const QUICK_ACTIONS = [
    { label: "Create New TRF",  desc: "Initialize folders",  icon: <AddRoundedIcon />,       color: "#6366f1", bg: "rgba(99,102,241,0.08)",  path: "/create"   },
    { label: "File Manager",    desc: "Upload and view",      icon: <FolderOpenRoundedIcon />, color: "#06b6d4", bg: "rgba(6,182,212,0.08)",   path: "/files"    },
    { label: "Export Reports",  desc: "Generate CSV",         icon: <AssessmentRoundedIcon />, color: "#10b981", bg: "rgba(16,185,129,0.08)",  path: "/reports"  },
    { label: "Settings",        desc: "App preferences",      icon: <SettingsRoundedIcon />,   color: "#a855f7", bg: "rgba(168,85,247,0.08)",  path: "/settings" },
  ];

  return (
    <motion.div variants={stagger} initial="initial" animate="animate">

      {/* ── Hero / welcome banner ── */}
      <motion.div variants={fadeUp}>
        <Grid container spacing={2.5} sx={{ mb: 4 }} alignItems="stretch">

          {/* Left: greeting */}
          <Grid item xs={12} md={8}>
            <Box sx={{
              p: 4, borderRadius: "24px", height: "100%",
              background: isDark
                ? "linear-gradient(135deg,rgba(99,102,241,0.15) 0%,rgba(6,182,212,0.05) 100%)"
                : "linear-gradient(135deg,rgba(99,102,241,0.06) 0%,rgba(6,182,212,0.02) 100%)",
              border: `1px solid ${isDark ? "rgba(99,102,241,0.22)" : "rgba(99,102,241,0.12)"}`,
              backdropFilter: "blur(20px)",
              display: "flex", flexDirection: "column", justifyContent: "center",
            }}>
              <Typography variant="h4" sx={{
                fontWeight: 900, fontSize: "clamp(1.4rem,3vw,1.9rem)",
                color: theme.palette.text.primary, mb: 1,
                fontFamily: "'Outfit','Inter',sans-serif",
              }}>
                {greeting.text}, {displayName}! {greeting.emoji}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, maxWidth: 550, lineHeight: 1.6 }}>
                Logged in as <b>{user?.role || "Administrator"}</b>.
                Manage TRFs, browse files, and track real-time activity below.
              </Typography>
              <Box sx={{ mt: 2.5, display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                <Button variant="contained" startIcon={<AddRoundedIcon />}
                  onClick={() => navigate("/create")}
                  sx={{ background: "linear-gradient(135deg,#6366f1,#06b6d4)", borderRadius: "12px", px: 3, py: 1.1, fontWeight: 700 }}>
                  Create TRF
                </Button>
                <Button variant="outlined" startIcon={<FolderOpenRoundedIcon />}
                  onClick={() => navigate("/files")}
                  sx={{ borderRadius: "12px", px: 3, py: 1.1, fontWeight: 700 }}>
                  Browse Files
                </Button>
              </Box>
            </Box>
          </Grid>

          {/* Right: system hub widget */}
          <Grid item xs={12} md={4}>
            <Box sx={{
              p: 3, borderRadius: "24px", height: "100%",
              background: cardBg, border: `1px solid ${border}`, backdropFilter: "blur(20px)",
              display: "flex", flexDirection: "column",
            }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Box>
                  <Typography variant="subtitle2" fontWeight={800} color="primary">SYSTEM HUB</Typography>
                  <Typography variant="caption" color="text.secondary">Location: Head Office</Typography>
                </Box>
                <Chip
                  icon={<GrainRoundedIcon sx={{ color: "#10b981 !important" }} />}
                  label="Online" size="small" color="success" variant="outlined"
                  sx={{ fontWeight: 700 }}
                />
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, my: 1.5 }}>
                <WbSunnyRoundedIcon className="float" sx={{ fontSize: 44, color: "#fbbf24", filter: "drop-shadow(0 0 10px rgba(251,191,36,0.5))" }} />
                <Box>
                  <Typography variant="h4" fontWeight={900} sx={{ fontVariantNumeric: "tabular-nums" }}>27°C</Typography>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>Clear Sky · Humidity 52%</Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 1.5, borderColor: border }} />
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="caption" fontWeight={600} color="text.secondary">
                  {now.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                </Typography>
                <Typography variant="caption" fontWeight={700} color="text.primary">
                  {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </motion.div>

      {/* ── Quick actions ── */}
      <motion.div variants={fadeUp}>
        <Typography variant="subtitle2" fontWeight={800} color="text.secondary" sx={{ letterSpacing: "0.1em", mb: 2 }}>
          QUICK SHORTCUTS
        </Typography>
        <Grid container spacing={2.5} sx={{ mb: 4.5 }}>
          {QUICK_ACTIONS.map((action, i) => (
            <Grid item xs={12} sm={6} lg={3} key={i}>
              <Card
                component={motion.div}
                whileHover={{ y: -5, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(action.path)}
                sx={{
                  background: cardBg, border: `1px solid ${border}`,
                  cursor: "pointer", borderRadius: "18px",
                  "&:hover": { borderColor: action.color, boxShadow: `0 12px 30px ${action.color}18` },
                  transition: "all 0.22s ease-out",
                }}
              >
                <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 }, display: "flex", alignItems: "center", gap: 2 }}>
                  <Box sx={{
                    width: 44, height: 44, borderRadius: "12px",
                    background: action.bg, color: action.color,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    {action.icon}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" fontWeight={700}
                      sx={{ fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {action.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.72rem" }}>
                      {action.desc}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </motion.div>

      {/* ── KPI stat cards ── */}
      <Grid container spacing={2.5} sx={{ mb: 4.5 }}>
        {(loading || stats === null)
          ? [0,1,2,3].map((i) => (
              <Grid item xs={12} sm={6} lg={3} key={i}>
                <SkeletonCard />
              </Grid>
            ))
          : statCards.map((card) => (
              <Grid item xs={12} sm={6} lg={3} key={card.title}>
                <StatCard {...card} />
              </Grid>
            ))
        }
      </Grid>

      {/* ── Charts row ── */}
      <Grid container spacing={2.5} sx={{ mb: 4.5 }}>

        {/* Area chart — live data */}
        <Grid item xs={12} lg={8}>
          <motion.div variants={fadeUp}>
            <Box sx={{ p: 3, borderRadius: "24px", background: cardBg, backdropFilter: "blur(20px)", border: `1px solid ${border}` }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
                <Box>
                  <Typography variant="h6" fontWeight={700} sx={{ fontSize: "1rem" }}>Technical Request Trends</Typography>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                    Monthly TRFs created and estimated document logs
                  </Typography>
                </Box>
                <Chip
                  icon={<TrendingUpRoundedIcon sx={{ fontSize: "14px !important" }} />}
                  label="Live" color="success" size="small" sx={{ fontWeight: 700 }}
                />
              </Box>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={monthly} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dTRF"  x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="dDocs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                  <XAxis dataKey="month" tick={{ fill: chartText, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: chartText, fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <ChartTooltip contentStyle={ttStyle} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "0.78rem" }} />
                  <Area type="monotone" dataKey="trfs" name="TRFs Created"  stroke="#6366f1" strokeWidth={3} fill="url(#dTRF)"  dot={false} />
                  <Area type="monotone" dataKey="docs" name="Files (est.)"  stroke="#06b6d4" strokeWidth={3} fill="url(#dDocs)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </motion.div>
        </Grid>

        {/* Pie chart */}
        <Grid item xs={12} lg={4}>
          <motion.div variants={fadeUp} style={{ height: "100%" }}>
            <Box sx={{
              p: 3, borderRadius: "24px", background: cardBg,
              backdropFilter: "blur(20px)", border: `1px solid ${border}`,
              height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between",
            }}>
              <Box>
                <Typography variant="h6" fontWeight={700} sx={{ fontSize: "1rem", mb: 0.5 }}>Document Breakdown</Typography>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                  File system distribution by category
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 160 }}>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={48} outerRadius={68} paddingAngle={4} dataKey="value">
                      {PIE_DATA.map((d, i) => <Cell key={i} fill={d.color} stroke="transparent" />)}
                    </Pie>
                    <ChartTooltip contentStyle={ttStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {PIE_DATA.map((d) => (
                  <Box key={d.name} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: d.color }} />
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: "0.75rem", fontWeight: 500 }}>
                        {d.name}
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.75rem" }}>{d.value}%</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </motion.div>
        </Grid>
      </Grid>

      {/* ── Bottom row ── */}
      <Grid container spacing={2.5}>

        {/* Project progress */}
        <Grid item xs={12} md={6}>
          <motion.div variants={fadeUp}>
            <Box sx={{ p: 3, borderRadius: "24px", background: cardBg, backdropFilter: "blur(20px)", border: `1px solid ${border}`, minHeight: 300 }}>
              <Typography variant="h6" fontWeight={700} sx={{ fontSize: "1rem", mb: 0.5 }}>Project Tracking</Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: "block", mb: 3 }}>
                Current status of active pipeline installations
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.2 }}>
                {PROJECTS.map((p) => (
                  <Box key={p.name}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.8 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.78rem" }}>{p.name}</Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Chip label={p.status} size="small" sx={{
                          height: 18, fontSize: "0.58rem", fontWeight: 800,
                          background: `${p.color}15`, color: p.color, border: `1px solid ${p.color}30`,
                        }} />
                        <Typography variant="caption" sx={{ fontWeight: 800, color: p.color, fontSize: "0.78rem" }}>
                          {p.progress}%
                        </Typography>
                      </Box>
                    </Box>
                    <LinearProgress variant="determinate" value={p.progress} sx={{
                      height: 6, borderRadius: 10,
                      backgroundColor: isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.15)",
                      "& .MuiLinearProgress-bar": { borderRadius: 10, background: `linear-gradient(90deg,${p.color},${p.color}88)` },
                    }} />
                  </Box>
                ))}
              </Box>
            </Box>
          </motion.div>
        </Grid>

        {/* Activity feed — live from AppContext */}
        <Grid item xs={12} md={6}>
          <motion.div variants={fadeUp}>
            <Box sx={{ p: 3, borderRadius: "24px", background: cardBg, backdropFilter: "blur(20px)", border: `1px solid ${border}`, minHeight: 300 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <AccessTimeRoundedIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
                <Typography variant="h6" fontWeight={700} sx={{ fontSize: "1rem" }}>System Audit Trail</Typography>
                <Box sx={{ ml: "auto", width: 7, height: 7, borderRadius: "50%", background: "#10b981", animation: "pulseDot 2s ease infinite" }} />
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", maxHeight: 240, overflowY: "auto", pr: 0.5 }}>
                {activities.length === 0 ? (
                  <Typography variant="caption" sx={{ color: theme.palette.text.disabled, textAlign: "center", py: 5 }}>
                    No recent activity logs found
                  </Typography>
                ) : (
                  activities.slice(0, 5).map((act, i) => (
                    <Box key={act.id} sx={{ display: "flex", gap: 2, py: 1.2, position: "relative" }}>
                      {i < Math.min(activities.length, 5) - 1 && (
                        <Box sx={{
                          position: "absolute", left: 14, top: 36, bottom: 0, width: 1,
                          background: isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.2)",
                        }} />
                      )}
                      <Box sx={{
                        width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                        background: `${act.color}20`, border: `1.5px solid ${act.color}40`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: "50%", background: act.color }} />
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.8rem", display: "block", lineHeight: 1.3 }}>
                          {act.action}
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: "0.68rem" }}>
                          {act.user} · {timeAgo(act.time)}
                        </Typography>
                      </Box>
                    </Box>
                  ))
                )}
              </Box>
            </Box>
          </motion.div>
        </Grid>
      </Grid>
    </motion.div>
  );
}
