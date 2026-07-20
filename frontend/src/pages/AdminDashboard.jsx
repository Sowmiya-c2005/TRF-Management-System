import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "@mui/material/styles";
import { useApp } from "../context/AppContext";
import { useGreeting } from "../hooks/useGreeting";
import { getAllTRFs } from "../services/trfService";
import API from "../services/api";

import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";

import AddRoundedIcon            from "@mui/icons-material/AddRounded";
import FolderOpenRoundedIcon     from "@mui/icons-material/FolderOpenRounded";
import FolderSpecialRoundedIcon  from "@mui/icons-material/FolderSpecialRounded";
import WorkRoundedIcon            from "@mui/icons-material/WorkRounded";
import GrainRoundedIcon           from "@mui/icons-material/GrainRounded";
import SettingsRoundedIcon        from "@mui/icons-material/SettingsRounded";
import BoltRoundedIcon            from "@mui/icons-material/BoltRounded";
import ShowChartRoundedIcon       from "@mui/icons-material/ShowChartRounded";
import PeopleRoundedIcon          from "@mui/icons-material/PeopleRounded";
import HistoryRoundedIcon         from "@mui/icons-material/HistoryRounded";
import AssignmentIndRoundedIcon   from "@mui/icons-material/AssignmentIndRounded";
import CloseRoundedIcon           from "@mui/icons-material/CloseRounded";
import WarningAmberRoundedIcon    from "@mui/icons-material/WarningAmberRounded";
import OpenInNewRoundedIcon       from "@mui/icons-material/OpenInNewRounded";
import CalendarTodayRoundedIcon   from "@mui/icons-material/CalendarTodayRounded";
import PersonRoundedIcon          from "@mui/icons-material/PersonRounded";
import EngineeringRoundedIcon     from "@mui/icons-material/EngineeringRounded";
import AttachFileRoundedIcon      from "@mui/icons-material/AttachFileRounded";

import {
  AreaChart, Area, XAxis, YAxis,
  Tooltip as ChartTooltip, ResponsiveContainer,
} from "recharts";

/* ─── helpers ────────────────────────────────────────────────── */
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function buildMonthly(trfs) {
  const now = new Date();
  const months = Array.from({length:6},(_,i)=>{
    const d = new Date(now.getFullYear(),now.getMonth()-5+i,1);
    return MONTHS[d.getMonth()];
  });
  const c={}; months.forEach(m=>(c[m]={trfs:0,docs:0}));
  trfs.forEach(t=>{
    if(!t.created_at) return;
    const m=MONTHS[new Date(t.created_at).getMonth()];
    if(c[m]){c[m].trfs++;c[m].docs+=3;}
  });
  return months.map(m=>({month:m,...c[m]}));
}

function timeAgo(time) {
  if(!time) return "";
  const s=Math.floor((Date.now()-new Date(time).getTime())/1000);
  if(s<60)    return "just now";
  if(s<3600)  return `${Math.floor(s/60)}m ago`;
  if(s<86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

function useClock() {
  const [n,setN]=useState(new Date());
  useEffect(()=>{const t=setInterval(()=>setN(new Date()),1000);return()=>clearInterval(t);},[]);
  return n;
}

function AnimNum({ val }) {
  const [d, setD] = useState(0);
  useEffect(()=>{
    if(typeof val!=="number"){setD(val);return;}
    let cur=0;
    const step=Math.max(1,Math.ceil(val/45));
    const t=setInterval(()=>{
      cur=Math.min(cur+step,val);
      setD(cur);
      if(cur>=val) clearInterval(t);
    },18);
    return()=>clearInterval(t);
  },[val]);
  return <>{d}</>;
}

const stagger={animate:{transition:{staggerChildren:0.08}}};
const up={initial:{opacity:0,y:22},animate:{opacity:1,y:0,transition:{duration:0.45,ease:[.22,.61,.36,1]}}};

const IllusTRF = () => (
  <Box sx={{position:"relative",width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}>
    {[0,1,2,3].map(i=>(
      <Box key={i} sx={{
        position:"absolute",
        width:`${75-i*8}%`,height:`${65-i*8}%`,
        borderRadius:"10px",
        background:`linear-gradient(135deg,rgba(99,102,241,${0.35-i*0.06}),rgba(129,140,248,${0.20-i*0.04}))`,
        border:"1px solid rgba(129,140,248,0.30)",
        transform:`translateY(${i*10}px) scale(${1-i*0.04})`,
        boxShadow:`0 4px 20px rgba(99,102,241,${0.20-i*0.04})`,
      }}/>
    ))}
  </Box>
);

const IllusUsers = () => (
  <Box sx={{position:"relative",width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}>
    <Box sx={{width:50,height:50,borderRadius:"50%",background:"rgba(6,182,212,0.2)",border:"2px solid #06b6d4",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <PeopleRoundedIcon sx={{fontSize:28,color:"#22d3ee"}}/>
    </Box>
  </Box>
);

const IllusManagers = () => (
  <Box sx={{position:"relative",width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}>
    <Box sx={{width:50,height:50,borderRadius:"50%",background:"rgba(16,185,129,0.2)",border:"2px solid #10b981",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <WorkRoundedIcon sx={{fontSize:26,color:"#34d399"}}/>
    </Box>
  </Box>
);

const IllusEngineers = () => (
  <Box sx={{position:"relative",width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}>
    <Box sx={{width:50,height:50,borderRadius:"50%",background:"rgba(245,158,11,0.2)",border:"2px solid #f59e0b",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <BoltRoundedIcon sx={{fontSize:28,color:"#fbbf24"}}/>
    </Box>
  </Box>
);

function StatCard({ icon, value, title, subtitle, gradient, rgb, onClick, isDark }) {
  const [hov, setHov] = useState(false);
  const gc = (a) => `rgba(${rgb},${a})`;

  return (
    <motion.div
      variants={up}
      whileHover={{ y: -6, scale: 1.025 }}
      whileTap={{ scale: 0.975 }}
      onHoverStart={() => setHov(true)}
      onHoverEnd={() => setHov(false)}
      onClick={onClick}
      style={{ cursor: "pointer", height: "100%", position: "relative" }}
    >
      {/* drop shadow plate */}
      <Box sx={{
        position: "absolute", inset: 0, borderRadius: "18px",
        transform: "translate(4px,6px) scale(0.98)",
        background: gc("0.20"), filter: "blur(3px) brightness(0.40)", zIndex: -1,
      }}/>

      <Box sx={{
        borderRadius: "18px", overflow: "hidden", height: "100%",
        display: "flex", flexDirection: "column",
        background: isDark
          ? "linear-gradient(158deg,rgba(15,19,45,0.97) 0%,rgba(8,11,26,0.95) 100%)"
          : "linear-gradient(158deg,rgba(255,255,255,0.96) 0%,rgba(244,247,255,0.92) 100%)",
        border: `1.5px solid ${hov ? gc("0.50") : gc("0.20")}`,
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        boxShadow: hov
          ? `0 8px 32px rgba(0,0,0,0.55), 0 0 60px ${gc("0.20")}, inset 0 1px 0 rgba(255,255,255,0.12)`
          : `0 2px 8px rgba(0,0,0,0.50), 0 10px 30px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.08)`,
        transition: "border .25s, box-shadow .25s",
      }}>
        {/* top accent bar */}
        <Box sx={{ height: 3, background: gradient, boxShadow: `0 0 14px ${gc("0.60")}` }}/>

        {/* main content */}
        <Box sx={{ p: "20px 22px 22px", flex: 1, display: "flex", flexDirection: "column", gap: 0 }}>
          {/* icon + badge row */}
          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 2 }}>
            <Box sx={{
              width: 48, height: 48, borderRadius: "14px",
              background: gc("0.15"),
              border: `1.5px solid ${gc("0.30")}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 0 18px ${gc("0.20")}`,
              color: hov ? `rgba(${rgb},1)` : `rgba(${rgb},0.85)`,
              transition: "color .25s",
            }}>
              {icon}
            </Box>
            <Box sx={{
              px: 1.2, py: 0.35, borderRadius: "6px",
              background: gc("0.12"), border: `1px solid ${gc("0.25")}`,
              fontSize: "0.60rem", fontWeight: 800, letterSpacing: 0.8,
              color: `rgba(${rgb},0.90)`, textTransform: "uppercase",
            }}>LIVE</Box>
          </Box>

          {/* value */}
          <Typography sx={{
            fontSize: "2.2rem", fontWeight: 900, lineHeight: 1.05,
            fontVariantNumeric: "tabular-nums", letterSpacing: -0.5,
            background: gradient,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            filter: `drop-shadow(0 0 12px ${gc("0.35")})`,
            mb: 0.5,
          }}>
            <AnimNum val={value}/>
          </Typography>

          {/* title */}
          <Typography sx={{
            fontSize: "0.87rem", fontWeight: 700, lineHeight: 1.3,
            color: isDark ? "#e2e8f0" : "#1e293b",
            mb: 0.4,
          }}>{title}</Typography>

          {/* subtitle */}
          <Typography sx={{
            fontSize: "0.70rem", fontWeight: 500,
            color: isDark ? "#4b5577" : "#94a3b8",
          }}>{subtitle}</Typography>
        </Box>

        {/* bottom gradient glow */}
        <Box sx={{
          height: 2, background: gradient, opacity: hov ? 0.55 : 0.18,
          transition: "opacity .25s",
        }}/>
      </Box>
    </motion.div>
  );
}

function GlassCard({ children, sx={}, onClick, isDark }) {
  const bg = isDark
    ? "linear-gradient(160deg,rgba(18,22,48,0.92) 0%,rgba(10,13,28,0.88) 100%)"
    : "linear-gradient(160deg,rgba(255,255,255,0.94) 0%,rgba(244,247,255,0.90) 100%)";
  const border = isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.08)";
  const shadow = isDark
    ? "0 2px 6px rgba(0,0,0,0.65),0 10px 28px rgba(0,0,0,0.50),0 24px 48px rgba(0,0,0,0.35),inset 0 1px 0 rgba(255,255,255,0.06)"
    : "0 2px 6px rgba(0,0,0,0.06),0 10px 28px rgba(0,0,0,0.08),0 24px 48px rgba(0,0,0,0.05),inset 0 1px 0 rgba(255,255,255,1)";

  return (
    <Box onClick={onClick} sx={{
      borderRadius:"20px", background:bg, border:`1px solid ${border}`, backdropFilter:"blur(36px)",
      boxShadow:shadow, cursor:onClick?"pointer":"default", position:"relative", overflow:"hidden", ...sx
    }}>
      <Box sx={{position:"relative",zIndex:1}}>{children}</Box>
    </Box>
  );
}

function QkBtn({ label, icon, color, path, isDark, navigate }) {
  return (
    <motion.div whileHover={{y:-5,scale:1.06}} whileTap={{scale:.96}}>
      <Box onClick={()=>navigate(path)} sx={{
        borderRadius:"16px",p:"14px 10px",
        background: isDark ? `rgba(255,255,255,0.04)` : `rgba(0,0,0,0.03)`,
        border:`1px solid ${color}30`, cursor:"pointer", textAlign:"center",
        display:"flex",flexDirection:"column",alignItems:"center",gap:.9,
        "&:hover":{ border:`1px solid ${color}60`, background: isDark ? `${color}18` : `${color}12` },
      }}>
        <Box sx={{
          width:42,height:42,borderRadius:"12px", background: isDark ? `${color}18` : `${color}14`,
          border:`1px solid ${color}35`, display:"flex", alignItems:"center", justifyContent:"center", color
        }}>{icon}</Box>
        <Typography sx={{ fontSize:"0.68rem", fontWeight:700, color: isDark?"#94a3b8":"#475569" }}>{label}</Typography>
      </Box>
    </motion.div>
  );
}

/* ─── Status colours shared between table and modal ─────────────────────── */
const STATUS_COLORS = {
  Draft:          { bg: "rgba(148,163,184,0.12)", color: "#94a3b8" },
  Assigned:       { bg: "rgba(99,102,241,0.12)",  color: "#818cf8" },
  "In Progress":  { bg: "rgba(6,182,212,0.12)",   color: "#22d3ee" },
  "Under Review": { bg: "rgba(245,158,11,0.12)",  color: "#fbbf24" },
  Approved:       { bg: "rgba(16,185,129,0.12)",  color: "#34d399" },
  Completed:      { bg: "rgba(16,185,129,0.20)",  color: "#10b981" },
  Archived:       { bg: "rgba(239,68,68,0.12)",   color: "#f87171" },
};

/* ─── Project Details Modal ──────────────────────────────────────────────── */
function ProjectDetailsModal({ trf, onClose, navigate, isDark, users }) {
  if (!trf) return null;

  const headingColor = isDark ? "#f1f5f9" : "#0f172a";
  const subColor     = isDark ? "#64748b"  : "#94a3b8";
  const cardBg       = isDark ? "rgba(0,0,0,0.30)" : "rgba(0,0,0,0.03)";
  const sc           = STATUS_COLORS[trf.status] || STATUS_COLORS.Draft;

  const managerName = (() => {
    if (!trf.assigned_manager_id) return "Unassigned";
    const u = users.find(x => x.id === trf.assigned_manager_id);
    return u ? (u.display_name || u.username) : "Unassigned";
  })();

  const engineerNames = (() => {
    if (!trf.engineer_ids || trf.engineer_ids.length === 0) return ["Unassigned"];
    return trf.engineer_ids.map(id => {
      const u = users.find(x => x.id === id);
      return u ? (u.display_name || u.username) : `User ${id}`;
    });
  })();

  const isOverdue = trf.due_date && new Date(trf.due_date) < new Date() && trf.status !== "Completed" && trf.status !== "Archived";

  const InfoRow = ({ label, value, highlight }) => (
    <Box sx={{ display: "flex", gap: 2, py: 1, borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` }}>
      <Typography sx={{ width: 170, flexShrink: 0, fontSize: "0.78rem", fontWeight: 700, color: subColor }}>{label}</Typography>
      <Typography sx={{ fontSize: "0.82rem", color: highlight || headingColor, fontWeight: highlight ? 700 : 500 }}>{value || "—"}</Typography>
    </Box>
  );

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: {
        borderRadius: "20px",
        background: isDark
          ? "linear-gradient(160deg,rgba(14,18,45,0.98) 0%,rgba(8,12,30,0.96) 100%)"
          : "linear-gradient(160deg,#ffffff 0%,#f8fafc 100%)",
        border: `1px solid ${isDark ? "rgba(99,102,241,0.25)" : "rgba(99,102,241,0.15)"}`,
        backdropFilter: "blur(40px)",
        boxShadow: "0 25px 60px rgba(0,0,0,0.40)",
      }}}>
      <DialogTitle sx={{ p: "24px 28px 16px", display: "flex", alignItems: "center", gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
            <Typography sx={{ fontWeight: 900, fontSize: "1.15rem", color: headingColor }}>
              {trf.trf_number}
            </Typography>
            <Chip label={trf.status} size="small"
              sx={{ fontWeight: 700, fontSize: "0.68rem", height: 22, backgroundColor: sc.bg, color: sc.color }} />
            {isOverdue && (
              <Chip icon={<WarningAmberRoundedIcon sx={{ fontSize: "13px !important" }} />}
                label="OVERDUE" size="small"
                sx={{ fontWeight: 700, fontSize: "0.68rem", height: 22,
                  backgroundColor: "rgba(239,68,68,0.12)", color: "#f87171",
                  "& .MuiChip-icon": { color: "#f87171" } }} />
            )}
          </Box>
          <Typography sx={{ fontSize: "0.85rem", color: subColor }}>{trf.project_name}</Typography>
        </Box>
        <Tooltip title="Open in File Manager">
          <IconButton size="small" onClick={() => { onClose(); navigate(`/files?trf=${trf.trf_number}`); }}
            sx={{ color: "#818cf8", border: "1px solid rgba(99,102,241,0.30)", borderRadius: "10px", mr: 1 }}>
            <OpenInNewRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
        <IconButton size="small" onClick={onClose}
          sx={{ color: subColor, border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)"}`, borderRadius: "10px" }}>
          <CloseRoundedIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: "8px 28px 28px" }}>
        {/* Completion bar */}
        <Box sx={{ mb: 3, p: "14px 18px", borderRadius: "14px", background: cardBg }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: subColor }}>COMPLETION</Typography>
            <Typography sx={{ fontSize: "0.78rem", fontWeight: 900, color: sc.color }}>{trf.completion_pct ?? 0}%</Typography>
          </Box>
          <LinearProgress variant="determinate" value={trf.completion_pct ?? 0}
            sx={{ height: 8, borderRadius: 10,
              "& .MuiLinearProgress-bar": { background: `linear-gradient(90deg,#6366f1,#06b6d4)` } }} />
        </Box>

        <Grid container spacing={3}>
          {/* ── Left column: Project & Status ── */}
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <Box sx={{ width: 28, height: 28, borderRadius: "8px", background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FolderSpecialRoundedIcon sx={{ fontSize: 16, color: "#818cf8" }} />
                </Box>
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 800, color: "#818cf8", letterSpacing: 1.2, textTransform: "uppercase" }}>Project Info</Typography>
              </Box>
              <InfoRow label="TRF Number"     value={trf.trf_number} />
              <InfoRow label="Project Name"   value={trf.project_name} />
              <InfoRow label="Priority"       value={trf.priority}
                highlight={trf.priority === "High" ? "#f87171" : trf.priority === "Critical" ? "#ef4444" : undefined} />
              <InfoRow label="Status"         value={trf.status} highlight={sc.color} />
              <InfoRow label="Due Date"
                value={trf.due_date ? new Date(trf.due_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : null}
                highlight={isOverdue ? "#f87171" : undefined} />
              {trf.remarks && <InfoRow label="Remarks" value={trf.remarks} />}
            </Box>
          </Grid>

          {/* ── Right column: Team & Audit ── */}
          <Grid item xs={12} md={6}>
            {/* Team */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <Box sx={{ width: 28, height: 28, borderRadius: "8px", background: "rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <EngineeringRoundedIcon sx={{ fontSize: 16, color: "#34d399" }} />
                </Box>
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 800, color: "#34d399", letterSpacing: 1.2, textTransform: "uppercase" }}>Assigned Team</Typography>
              </Box>
              <InfoRow label="Manager"      value={managerName} />
              <Box sx={{ display: "flex", gap: 2, py: 1, borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` }}>
                <Typography sx={{ width: 170, flexShrink: 0, fontSize: "0.78rem", fontWeight: 700, color: subColor }}>Engineer(s)</Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8 }}>
                  {engineerNames.map((n, i) => (
                    <Chip key={i} label={n} size="small" icon={<PersonRoundedIcon sx={{ fontSize: "12px !important" }} />}
                      sx={{ height: 22, fontSize: "0.72rem", fontWeight: 600,
                        background: "rgba(6,182,212,0.10)", color: "#22d3ee",
                        "& .MuiChip-icon": { color: "#22d3ee" } }} />
                  ))}
                </Box>
              </Box>
            </Box>

            {/* Audit Metadata */}
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <Box sx={{ width: 28, height: 28, borderRadius: "8px", background: "rgba(245,158,11,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <HistoryRoundedIcon sx={{ fontSize: 16, color: "#fbbf24" }} />
                </Box>
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 800, color: "#fbbf24", letterSpacing: 1.2, textTransform: "uppercase" }}>Audit Trail</Typography>
              </Box>
              <InfoRow label="Created By"       value={trf.created_by} />
              <InfoRow label="Assigned By"      value={trf.assigned_by} />
              <InfoRow label="Last Updated By"  value={trf.last_updated_by} />
              <InfoRow label="Last Updated"
                value={trf.last_updated_time
                  ? new Date(trf.last_updated_time).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                  : null} />
              <InfoRow label="Created On"
                value={trf.created_at
                  ? new Date(trf.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                  : null} />
            </Box>
          </Grid>
        </Grid>

        {/* Attached Documents */}
        {trf.folders && trf.folders.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2, borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }} />
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <Box sx={{ width: 28, height: 28, borderRadius: "8px", background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AttachFileRoundedIcon sx={{ fontSize: 16, color: "#818cf8" }} />
              </Box>
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 800, color: "#818cf8", letterSpacing: 1.2, textTransform: "uppercase" }}>Attached Documents</Typography>
            </Box>
            <Grid container spacing={1.5}>
              {trf.folders.flatMap(folder =>
                (folder.files || []).map(file => (
                  <Grid item xs={12} sm={6} key={file.id}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: "10px 14px",
                      borderRadius: "10px", background: cardBg,
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` }}>
                      <AttachFileRoundedIcon sx={{ fontSize: 16, color: "#818cf8", flexShrink: 0 }} />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: headingColor,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {file.original_name || file.filename}
                        </Typography>
                        <Typography sx={{ fontSize: "0.68rem", color: subColor }}>{folder.folder_name}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))
              )}
            </Grid>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function AdminDashboard() {
  const theme    = useTheme();
  const isDark   = theme.palette.mode === "dark";
  const navigate = useNavigate();
  const greeting = useGreeting();
  const { user } = useApp();
  const clock    = useClock();

  const [stats,       setStats]       = useState(null);
  const [monthly,     setMonthly]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [projects,    setProjects]    = useState([]);
  const [activities,  setActivities]  = useState([]);
  const [trfsList,    setTrfsList]    = useState([]);
  const [users,       setUsers]       = useState([]);
  const [selectedTrf, setSelectedTrf] = useState(null);
  const [trfDetail,   setTrfDetail]   = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const headingColor  = isDark ? "#f1f5f9" : "#0f172a";
  const subColor      = isDark ? "#64748b"  : "#94a3b8";
  const sectionLabel  = isDark ? "#334155"  : "#94a3b8";

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([
      API.get("/dashboard/admin"),
      getAllTRFs({ per_page: 100 }),
      API.get("/users/"),
    ])
      .then(([dashRes, trfRes, userRes]) => {
        const d = dashRes.data;
        setStats(d.stats);

        const acts = Array.isArray(d.recent_activities) ? d.recent_activities : [];
        setActivities(acts.map(log => ({
          id:     log.id,
          action: log.description  || log.action_type || "System action",
          user:   log.username     || "System",
          time:   new Date(log.created_at || Date.now()),
          color:  (log.action_type || "").includes("DELETE") ? "#ef4444"
                : (log.action_type || "").includes("CREATE") ? "#6366f1"
                : "#f59e0b",
        })));

        // Handle both modern paginated response and legacy plain array
        const rawList = trfRes.data?.items ?? (Array.isArray(trfRes.data) ? trfRes.data : []);
        setTrfsList(rawList);
        setMonthly(buildMonthly(rawList));

        const userList = Array.isArray(userRes.data) ? userRes.data : [];
        setUsers(userList);

        const projMap = {};
        rawList.forEach(t => {
          const name = t.project_name || "Unnamed Project";
          if (!projMap[name]) projMap[name] = { name, count: 0, completed: 0, status: t.status };
          projMap[name].count++;
          if (t.status === "Approved" || t.status === "Completed") projMap[name].completed++;
        });
        const derived = Object.values(projMap).map(p => ({
          name: p.name,
          progress: Math.round((p.completed / p.count) * 100) || 15,
          status: p.status,
          color: (p.status === "Completed" || p.status === "Approved") ? "#10b981" : "#06b6d4",
        }));
        setProjects(derived.slice(0, 4));
      })
      .catch(err => console.error("AdminDashboard loading error:", err))
      .finally(() => setLoading(false));
  }, []);

  // Initial load
  useEffect(() => { loadData(); }, [loadData]);

  // Real-time refresh via WebSocket events
  useEffect(() => {
    const handler = () => loadData();
    window.addEventListener("trf_update_event", handler);
    return () => window.removeEventListener("trf_update_event", handler);
  }, [loadData]);

  // Open TRF detail modal — fetch full detail from /trfs/{number}
  const openTrfDetail = useCallback(async (trf) => {
    setSelectedTrf(trf);
    setTrfDetail(null);
    setLoadingDetail(true);
    try {
      const res = await API.get(`/trfs/${trf.trf_number}`);
      setTrfDetail({ ...trf, ...res.data });
    } catch {
      setTrfDetail(trf); // fallback to list data
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const getUserName = (id) => {
    if (!id) return "Unassigned";
    const u = users.find(x => x.id === id);
    return u ? (u.display_name || u.username) : `User ${id}`;
  };

  const getEngineersNames = (ids) => {
    if (!ids || ids.length === 0) return "Unassigned";
    return ids.map(id => getUserName(id)).join(", ");
  };

  const overdueCount = trfsList.filter(t =>
    t.due_date &&
    new Date(t.due_date) < new Date() &&
    t.status !== "Completed" && t.status !== "Archived"
  ).length;

  const IllusOverdue = () => (
    <Box sx={{position:"relative",width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <Box sx={{width:50,height:50,borderRadius:"50%",background:"rgba(239,68,68,0.2)",border:"2px solid #ef4444",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <WarningAmberRoundedIcon sx={{fontSize:28,color:"#f87171"}}/>
      </Box>
    </Box>
  );

  const kpis = [
    { icon: <FolderSpecialRoundedIcon sx={{ fontSize: 24 }}/>,
      value: loading ? "…" : stats?.total_trfs ?? 0, title: "Total TRFs", subtitle: "Live from database",
      gradient: "linear-gradient(135deg,#6366f1,#818cf8)", rgb: "99,102,241", path: "/all" },
    { icon: <PeopleRoundedIcon sx={{ fontSize: 24 }}/>,
      value: loading ? "…" : stats?.total_users ?? 0, title: "Total Users", subtitle: "Active registrations",
      gradient: "linear-gradient(135deg,#06b6d4,#22d3ee)", rgb: "6,182,212", path: "/users" },
    { icon: <WorkRoundedIcon sx={{ fontSize: 24 }}/>,
      value: loading ? "…" : stats?.active_managers ?? 0, title: "Active Managers", subtitle: "Assigned domains",
      gradient: "linear-gradient(135deg,#10b981,#34d399)", rgb: "16,185,129", path: "/users" },
    { icon: <BoltRoundedIcon sx={{ fontSize: 24 }}/>,
      value: loading ? "…" : stats?.active_engineers ?? 0, title: "Active Engineers", subtitle: "Engineering workforce",
      gradient: "linear-gradient(135deg,#f59e0b,#fbbf24)", rgb: "245,158,11", path: "/users" },
    { icon: <WarningAmberRoundedIcon sx={{ fontSize: 24 }}/>,
      value: loading ? "…" : overdueCount, title: "Overdue Projects", subtitle: "Past due date",
      gradient: "linear-gradient(135deg,#ef4444,#f87171)", rgb: "239,68,68", path: "/all" },
  ];

  const quickActions = [
    { label:"Create TRF",  icon:<AddRoundedIcon/>,             color:"#6366f1", path:"/create"    },
    { label:"Assign TRF",  icon:<AssignmentIndRoundedIcon/>,   color:"#8b5cf6", path:"/assign"    },
    { label:"Files",       icon:<FolderOpenRoundedIcon/>,      color:"#06b6d4", path:"/files"     },
    { label:"Users",       icon:<PeopleRoundedIcon/>,          color:"#10b981", path:"/users"     },
    { label:"Audit Log",   icon:<HistoryRoundedIcon/>,         color:"#f59e0b", path:"/audit"     },
    { label:"All TRFs",    icon:<ShowChartRoundedIcon/>,       color:"#a855f7", path:"/all"       },
    { label:"Settings",    icon:<SettingsRoundedIcon/>,        color:"#ec4899", path:"/settings"  },
  ];

  return (
    <motion.div variants={stagger} initial="initial" animate="animate">
      <Grid container spacing={2.5} sx={{mb:3}} alignItems="stretch">
        <Grid item xs={12} md={7.5}>
          <motion.div variants={up} style={{height:"100%"}}>
            <Box sx={{
              p:{xs:3,md:"32px 36px"}, borderRadius:"22px", height:"100%", position:"relative", overflow:"hidden",
              background:"linear-gradient(135deg,rgba(14,18,45,0.96) 0%,rgba(8,12,30,0.92) 100%)",
              border:"1px solid rgba(99,102,241,0.25)", backdropFilter:"blur(36px)",
              display:"flex", flexDirection:"column", justifyContent:"center", minHeight:210,
            }}>
              <Box sx={{ position:"relative", mb: 1.5 }}>
                <Typography sx={{ fontSize:"clamp(1.5rem,3vw,2.1rem)", fontWeight:900, color:"#f1f5f9", mb: 1 }}>
                  {greeting.text}, {user?.displayName || user?.username}! {greeting.emoji}
                </Typography>
                <Box sx={{
                  display:"inline-flex", alignItems:"center", gap:.8,
                  background:"linear-gradient(135deg,rgba(99,102,241,0.20),rgba(168,85,247,0.16))",
                  border:"1px solid rgba(99,102,241,0.45)", borderRadius:"24px", px:2, py:.6, mb:2.5,
                }}>
                  <Box sx={{ width:8, height:8, borderRadius:"50%", background:"linear-gradient(135deg,#818cf8,#a78bfa)", flexShrink:0 }}/>
                  <Typography sx={{ color:"#c4b5fd", fontWeight:800, fontSize:"0.78rem", letterSpacing:1.2, textTransform:"uppercase" }}>
                    Administrator Dashboard
                  </Typography>
                </Box>
                <Typography sx={{ color:"#64748b", fontSize:"0.88rem", lineHeight:1.6, maxWidth:460 }}>
                  System administration, folder management, user roles, and full audit controls.
                </Typography>
              </Box>
            </Box>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={4.5}>
          <motion.div variants={up} style={{height:"100%"}}>
            <GlassCard isDark={isDark} sx={{p:3,height:"100%",display:"flex",flexDirection:"column",gap:2}}>
              <Box sx={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <Box>
                  <Typography sx={{fontSize:"0.68rem",fontWeight:800,color:"#818cf8",letterSpacing:1.8,textTransform:"uppercase"}}>SYSTEM HUB</Typography>
                  <Typography sx={{fontSize:"0.72rem",color:subColor,mt:.3}}>Location: Core Cloud</Typography>
                </Box>
                <Chip icon={<GrainRoundedIcon sx={{color:"#10b981 !important",fontSize:"11px !important"}}/>} label="Optimal" size="small"
                  sx={{fontWeight:700,fontSize:"0.68rem",height:20,background:"rgba(16,185,129,0.12)",color:"#34d399",border:"1px solid rgba(16,185,129,0.28)"}}/>
              </Box>
              <Box sx={{ background: isDark?"rgba(0,0,0,0.50)":"rgba(99,102,241,0.06)", border:"1px solid rgba(99,102,241,0.20)", borderRadius:"14px", p:"14px 16px", textAlign:"center" }}>
                <Typography sx={{ fontSize:"clamp(1.7rem,3.5vw,2.2rem)", fontWeight:900, color: isDark?"#e2e8f0":"#1e293b", fontFamily:"'Courier New',monospace" }}>
                  {clock.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}
                </Typography>
              </Box>
            </GlassCard>
          </motion.div>
        </Grid>
      </Grid>

      <motion.div variants={up}>
        <Typography sx={{fontSize:"0.65rem",fontWeight:800,color:sectionLabel,letterSpacing:2.5,textTransform:"uppercase",mb:1.8}}>
          ADMINISTRATOR SHORTCUTS
        </Typography>
        <Grid container spacing={1.8} sx={{mb:3.5}}>
          {quickActions.map((a,i)=>(
            <Grid item xs={4} sm={2} key={i}>
              <QkBtn {...a} isDark={isDark} navigate={navigate}/>
            </Grid>
          ))}
        </Grid>
      </motion.div>

      <Grid container spacing={2.5} sx={{ mb: 3.5 }} alignItems="stretch">
        {kpis.map((k, i) => (
          <Grid item xs={12} sm={6} md={4} lg={2.4} key={i} sx={{ display: "flex" }}>
            <Box sx={{ width: "100%", minHeight: 180 }}>
              <StatCard {...k} isDark={isDark} onClick={() => navigate(k.path)}/>
            </Box>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2.5} sx={{mb:3.5}}>
        <Grid item xs={12} lg={8}>
          <motion.div variants={up}>
            <GlassCard isDark={isDark} sx={{p:3}}>
              <Typography sx={{fontWeight:700,fontSize:"0.95rem",color:headingColor,mb:2.5}}>Technical Request Trends</Typography>
              <ResponsiveContainer width="100%" height={230}>
                <AreaChart data={monthly} margin={{top:0,right:0,left:-20,bottom:0}}>
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <ChartTooltip />
                  <Area type="monotone" dataKey="trfs" name="TRFs Created" stroke="#6366f1" strokeWidth={2.5} fillOpacity={0.1} fill="#6366f1" />
                </AreaChart>
              </ResponsiveContainer>
            </GlassCard>
          </motion.div>
        </Grid>

        <Grid item xs={12} lg={4}>
          <motion.div variants={up} style={{height:"100%"}}>
            <GlassCard isDark={isDark} sx={{p:3,height:"100%"}}>
              <Typography sx={{fontWeight:700,fontSize:"0.95rem",color:headingColor,mb:2}}>System Activity Log</Typography>
              <Box sx={{display:"flex",flexDirection:"column",gap:1.8,maxHeight:255,overflowY:"auto"}}>
                {activities.length===0 ? (
                  <Typography sx={{color:sectionLabel,fontSize:"0.78rem",textAlign:"center",py:5}}>No system logs available</Typography>
                ) : activities.slice(0,7).map((a,i)=>(
                  <Box key={a.id||i} sx={{display:"flex",gap:1.5,alignItems:"flex-start"}}>
                    <Box sx={{ width:26,height:26,borderRadius:"50%",flexShrink:0,background:`${a.color}18`,border:`1.5px solid ${a.color}35`,display:"flex",alignItems:"center",justifyContent:"center" }}>
                      <Box sx={{width:6,height:6,borderRadius:"50%",background:a.color}}/>
                    </Box>
                    <Box sx={{flex:1,minWidth:0}}>
                      <Typography sx={{fontSize:"0.78rem",fontWeight:700,color:headingColor,textOverflow:"ellipsis",overflow:"hidden",whiteSpace:"nowrap"}}>{a.action}</Typography>
                      <Typography sx={{fontSize:"0.66rem",color:subColor}}>{a.user} · {timeAgo(a.time)}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </GlassCard>
          </motion.div>
        </Grid>
      </Grid>

      <motion.div variants={up}>
        <GlassCard isDark={isDark} sx={{p:3}}>
          <Typography sx={{fontWeight:700,fontSize:"0.95rem",color:headingColor,mb:2.5}}>Project Pipeline Tracking</Typography>
          <Grid container spacing={2.5}>
            {projects.map(p=>(
              <Grid item xs={12} sm={6} key={p.name}>
                <Box sx={{ p:2,borderRadius:"14px",background: isDark?"rgba(0,0,0,0.28)":"rgba(0,0,0,0.02)",border:`1px solid ${p.color}20` }}>
                  <Box sx={{display:"flex",justifyContent:"space-between",mb:1.2}}>
                    <Typography sx={{fontSize:"0.82rem",fontWeight:700,color:headingColor}}>{p.name}</Typography>
                    <Typography sx={{fontWeight:800,color:p.color,fontSize:"0.80rem"}}>{p.progress}%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={p.progress} sx={{ height:7,borderRadius:10 }}/>
                </Box>
              </Grid>
            ))}
          </Grid>
        </GlassCard>
      </motion.div>

      <motion.div variants={up} style={{ marginTop: "24px" }}>
        <GlassCard isDark={isDark} sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: headingColor }}>
              Active Project Assignments
            </Typography>
            <Typography sx={{ fontSize: "0.72rem", color: subColor }}>
              Click any row to view full details
            </Typography>
          </Box>
          <Box sx={{ overflowX: "auto" }}>
            <Box sx={{ minWidth: 820 }}>
              {/* Table Header */}
              <Box sx={{ display: "flex", pb: 1.5, borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`, mb: 2, px: 1 }}>
                <Typography sx={{ width: "14%", fontSize: "0.70rem", fontWeight: 800, color: subColor, letterSpacing: 1 }}>TRF NUMBER</Typography>
                <Typography sx={{ width: "22%", fontSize: "0.70rem", fontWeight: 800, color: subColor, letterSpacing: 1 }}>PROJECT NAME</Typography>
                <Typography sx={{ width: "16%", fontSize: "0.70rem", fontWeight: 800, color: subColor, letterSpacing: 1 }}>MANAGER</Typography>
                <Typography sx={{ width: "20%", fontSize: "0.70rem", fontWeight: 800, color: subColor, letterSpacing: 1 }}>ENGINEER(S)</Typography>
                <Typography sx={{ width: "10%", fontSize: "0.70rem", fontWeight: 800, color: subColor, letterSpacing: 1 }}>PRIORITY</Typography>
                <Typography sx={{ width: "10%", fontSize: "0.70rem", fontWeight: 800, color: subColor, letterSpacing: 1 }}>PROGRESS</Typography>
                <Typography sx={{ width: "8%",  fontSize: "0.70rem", fontWeight: 800, color: subColor, letterSpacing: 1 }}>STATUS</Typography>
              </Box>

              {/* Table Body */}
              {loading ? (
                <Typography sx={{ color: subColor, fontSize: "0.82rem", textAlign: "center", py: 3 }}>Loading assignments...</Typography>
              ) : trfsList.length === 0 ? (
                <Typography sx={{ color: subColor, fontSize: "0.82rem", textAlign: "center", py: 3 }}>No project assignments found</Typography>
              ) : (
                trfsList.map((t, idx) => {
                  const managerName = getUserName(t.assigned_manager_id);
                  const engineers   = getEngineersNames(t.engineer_ids);
                  const sc          = STATUS_COLORS[t.status] || { bg: "rgba(148,163,184,0.1)", color: "#94a3b8" };
                  const pct         = t.completion_pct ?? 0;
                  const isOverdue   = t.due_date && new Date(t.due_date) < new Date() && t.status !== "Completed" && t.status !== "Archived";

                  return (
                    <Tooltip key={t.id || idx} title="Click to view project details" placement="top" arrow>
                      <Box
                        onClick={() => openTrfDetail(t)}
                        sx={{
                          display: "flex", alignItems: "center", py: 1.8, px: 1,
                          borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}`,
                          cursor: "pointer", borderRadius: "8px", transition: "background 0.15s",
                          "&:hover": { background: isDark ? "rgba(99,102,241,0.06)" : "rgba(99,102,241,0.04)" },
                          border: isOverdue ? "1px solid rgba(239,68,68,0.15)" : "1px solid transparent",
                        }}
                      >
                        <Box sx={{ width: "14%" }}>
                          <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#818cf8" }}>{t.trf_number}</Typography>
                          {isOverdue && <Typography sx={{ fontSize: "0.62rem", color: "#f87171", fontWeight: 700 }}>⚠ OVERDUE</Typography>}
                        </Box>
                        <Typography sx={{ width: "22%", fontSize: "0.82rem", fontWeight: 600, color: headingColor, pr: 1 }}>{t.project_name}</Typography>
                        <Typography sx={{ width: "16%", fontSize: "0.82rem", color: theme.palette.text.secondary }}>{managerName}</Typography>
                        <Typography sx={{ width: "20%", fontSize: "0.82rem", color: theme.palette.text.secondary, pr: 1,
                          textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }} title={engineers}>{engineers}</Typography>
                        <Box sx={{ width: "10%" }}>
                          <Chip label={t.priority || "Medium"} size="small" sx={{
                            fontWeight: 700, fontSize: "0.62rem", height: 20,
                            backgroundColor: t.priority === "High" || t.priority === "Critical" ? "rgba(239,68,68,0.12)" : "rgba(99,102,241,0.10)",
                            color: t.priority === "High" || t.priority === "Critical" ? "#f87171" : "#818cf8",
                          }} />
                        </Box>
                        <Box sx={{ width: "10%", pr: 1 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                            <LinearProgress variant="determinate" value={pct}
                              sx={{ flex: 1, height: 5, borderRadius: 10,
                                "& .MuiLinearProgress-bar": { background: sc.color } }} />
                            <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: sc.color }}>{pct}%</Typography>
                          </Box>
                        </Box>
                        <Box sx={{ width: "8%" }}>
                          <Chip label={t.status} size="small" sx={{ fontWeight: 700, fontSize: "0.62rem", height: 20, backgroundColor: sc.bg, color: sc.color }} />
                        </Box>
                      </Box>
                    </Tooltip>
                  );
                })
              )}
            </Box>
          </Box>
        </GlassCard>
      </motion.div>

      {/* Project Details Modal */}
      {selectedTrf && (
        <ProjectDetailsModal
          trf={loadingDetail ? selectedTrf : (trfDetail || selectedTrf)}
          onClose={() => { setSelectedTrf(null); setTrfDetail(null); }}
          navigate={navigate}
          isDark={isDark}
          users={users}
        />
      )}
    </motion.div>
  );
}
