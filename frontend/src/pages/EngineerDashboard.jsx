/**
 * EngineerDashboard.jsx — Enterprise Engineer Dashboard
 * Shows only assigned TRFs, live stats, project list, and activity log.
 */
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "@mui/material/styles";
import { useApp } from "../context/AppContext";
import { useGreeting } from "../hooks/useGreeting";
import { getMyAssignedTRFs } from "../services/assignmentService";
import API from "../services/api";
import toast from "react-hot-toast";

import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

import AddRoundedIcon            from "@mui/icons-material/AddRounded";
import FolderOpenRoundedIcon     from "@mui/icons-material/FolderOpenRounded";
import FolderSpecialRoundedIcon  from "@mui/icons-material/FolderSpecialRounded";
import DescriptionRoundedIcon    from "@mui/icons-material/DescriptionRounded";
import WorkRoundedIcon           from "@mui/icons-material/WorkRounded";
import StorageRoundedIcon        from "@mui/icons-material/StorageRounded";
import GrainRoundedIcon          from "@mui/icons-material/GrainRounded";
import SearchRoundedIcon         from "@mui/icons-material/SearchRounded";
import CloudUploadRoundedIcon    from "@mui/icons-material/CloudUploadRounded";
import EditRoundedIcon           from "@mui/icons-material/EditRounded";
import NotificationsRoundedIcon  from "@mui/icons-material/NotificationsRounded";
import RefreshRoundedIcon        from "@mui/icons-material/RefreshRounded";
import AssignmentIndRoundedIcon  from "@mui/icons-material/AssignmentIndRounded";
import CalendarMonthRoundedIcon  from "@mui/icons-material/CalendarMonthRounded";
import PriorityHighRoundedIcon   from "@mui/icons-material/PriorityHighRounded";

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

const STATUS_COLORS = {
  Draft:         "#94a3b8",
  Assigned:      "#6366f1",
  "In Progress": "#f59e0b",
  "Under Review":"#06b6d4",
  Approved:      "#10b981",
  Completed:     "#8b5cf6",
  Archived:      "#475569",
};
const PRIORITY_COLORS = { Low:"#10b981", Medium:"#f59e0b", High:"#f97316", Critical:"#ef4444" };

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

const IllusProjects = () => (
  <Box sx={{position:"relative",width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}>
    <Box sx={{width:50,height:50,borderRadius:"50%",background:"rgba(6,182,212,0.2)",border:"2px solid #06b6d4",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <WorkRoundedIcon sx={{fontSize:26,color:"#22d3ee"}}/>
    </Box>
  </Box>
);

function StatCard({ icon, value, title, subtitle, gradient, rgb, onClick, isDark, illus }) {
  const [hov, setHov] = useState(false);
  const gc = (a) => `rgba(${rgb},${a})`;

  return (
    <motion.div
      variants={up}
      whileHover={{ y:-8, scale:1.03 }}
      whileTap={{ scale:0.97 }}
      onHoverStart={()=>setHov(true)}
      onHoverEnd={()=>setHov(false)}
      onClick={onClick}
      style={{ cursor:"pointer", height:"100%", position:"relative" }}
    >
      <Box sx={{
        position:"absolute",inset:0,borderRadius:"20px",
        transform:"translate(5px,8px) scale(0.98)",
        background:gc("0.18"),filter:"blur(2px) brightness(0.45)",zIndex:-1,
      }}/>
      <Box sx={{
        borderRadius:"20px",overflow:"hidden",height:"100%",
        display:"flex",flexDirection:"column",
        background:"linear-gradient(160deg,rgba(14,18,42,0.97) 0%,rgba(8,10,24,0.95) 100%)",
        border:`1.5px solid ${hov ? gc("0.45") : gc("0.18")}`,
        backdropFilter:"blur(28px)",WebkitBackdropFilter:"blur(28px)",
        boxShadow: hov
          ? `0 4px 8px rgba(0,0,0,0.72),0 16px 40px rgba(0,0,0,0.58),0 0 80px ${gc("0.25")},inset 0 1px 0 rgba(255,255,255,0.11)`
          : `0 2px 6px rgba(0,0,0,0.70),0 10px 28px rgba(0,0,0,0.55),inset 0 1px 0 rgba(255,255,255,0.07)`,
        transition:"border .28s,box-shadow .28s",
      }}>
        <Box sx={{
          height:140,position:"relative",overflow:"hidden",flexShrink:0,
          background:`linear-gradient(145deg,${gc("0.22")} 0%,rgba(5,8,20,0.90) 100%)`,
        }}>
          <Box sx={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>{illus}</Box>
          <Box sx={{position:"absolute",bottom:0,left:0,right:0,height:40,background:"linear-gradient(0deg,rgba(8,10,24,0.95) 0%,transparent 100%)"}}/>
          <Box sx={{position:"absolute",top:0,left:0,right:0,height:"3px",background:gradient,boxShadow:`0 0 16px ${gc("0.65")}`}}/>
        </Box>
        <Box sx={{p:"16px 18px 18px",flex:1,display:"flex",flexDirection:"column",gap:.5}}>
          <Typography sx={{
            fontSize:"2rem",fontWeight:900,lineHeight:1,
            fontVariantNumeric:"tabular-nums",
            background:gradient,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",
            filter:`drop-shadow(0 0 14px ${gc("0.40")})`,
          }}>
            <AnimNum val={value}/>
          </Typography>
          <Typography sx={{fontSize:"0.85rem",fontWeight:700,color:"#e2e8f0"}}>{title}</Typography>
          <Typography sx={{fontSize:"0.72rem",color:"#475569"}}>{subtitle}</Typography>
        </Box>
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
    ? "0 2px 6px rgba(0,0,0,0.65),0 10px 28px rgba(0,0,0,0.50),inset 0 1px 0 rgba(255,255,255,0.06)"
    : "0 2px 6px rgba(0,0,0,0.06),0 10px 28px rgba(0,0,0,0.08),inset 0 1px 0 rgba(255,255,255,1)";

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

export default function EngineerDashboard() {
  const theme    = useTheme();
  const isDark   = theme.palette.mode === "dark";
  const navigate = useNavigate();
  const greeting = useGreeting();
  const { user } = useApp();
  const clock    = useClock();

  const [stats,        setStats]        = useState(null);
  const [monthly,      setMonthly]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [assignedTRFs, setAssignedTRFs] = useState([]);
  const [activities,   setActivities]   = useState([]);
  const [lastRefresh,  setLastRefresh]  = useState(Date.now());

  const headingColor = isDark ? "#f1f5f9" : "#0f172a";
  const subColor     = isDark ? "#64748b"  : "#94a3b8";
  const sectionLabel = isDark ? "#334155"  : "#94a3b8";

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      API.get("/dashboard/engineer"),
      API.get("/assignments/my-trfs"),
    ])
      .then(([dashRes, trfRes]) => {
        const d = dashRes.data;
        setStats(d.stats);

        // Activities — use correct field names from backend
        const acts = Array.isArray(d.recent_activities) ? d.recent_activities : [];
        setActivities(acts.map(log => ({
          id:     log.id,
          action: log.description || log.action_type || "System action",
          user:   log.username    || "System",
          time:   new Date(log.created_at || Date.now()),
          color:  (log.action_type || "").includes("DELETE") ? "#ef4444"
                : (log.action_type || "").includes("CREATE") ? "#6366f1"
                : "#f59e0b",
        })));

        // Assigned TRFs list
        const list = Array.isArray(trfRes.data?.trfs) ? trfRes.data.trfs : [];
        setAssignedTRFs(list);
        setMonthly(buildMonthly(list));
      })
      .catch(err => {
        console.error("EngineerDashboard loading error:", err);
        toast.error("Failed to load dashboard data.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load, lastRefresh]);

  // Real-time sync via WebSocket broadcast events
  useEffect(() => {
    const handler = () => load();
    window.addEventListener("trf_update_event", handler);
    return () => window.removeEventListener("trf_update_event", handler);
  }, [load]);

  // Auto-refresh every 60 seconds to pick up new assignments
  useEffect(() => {
    const t = setInterval(() => setLastRefresh(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);

  const kpis = [
    { icon:<FolderSpecialRoundedIcon sx={{fontSize:26}}/>, illus:<IllusTRF/>,
      // ← FIXED: was stats?.assigned_tasks, backend returns my_assigned_trfs
      value:loading?"…":stats?.my_assigned_trfs??0, title:"Assigned TRFs", subtitle:"Projects assigned to you",
      gradient:"linear-gradient(135deg,#6366f1,#818cf8)", rgb:"99,102,241", path:"/all" },
    { icon:<WorkRoundedIcon sx={{fontSize:26}}/>, illus:<IllusProjects/>,
      // ← FIXED: was stats?.active_tasks, backend returns active_projects
      value:loading?"…":stats?.active_projects??0, title:"Active Projects", subtitle:"Ongoing pipeline works",
      gradient:"linear-gradient(135deg,#06b6d4,#22d3ee)", rgb:"6,182,212", path:"/all" },
    { icon:<DescriptionRoundedIcon sx={{fontSize:26}}/>, illus:<IllusProjects/>,
      // ← FIXED: was stats?.completed_tasks, backend returns completed_projects
      value:loading?"…":stats?.completed_projects??0, title:"Completed", subtitle:"Finished submissions",
      gradient:"linear-gradient(135deg,#10b981,#34d399)", rgb:"16,185,129", path:"/all" },
    { icon:<StorageRoundedIcon sx={{fontSize:26}}/>, illus:<IllusProjects/>,
      // ← FIXED: was stats?.draft_trfs, backend returns upload_history
      value:loading?"…":stats?.upload_history??0, title:"Files Uploaded", subtitle:"Documents contributed",
      gradient:"linear-gradient(135deg,#f59e0b,#fbbf24)", rgb:"245,158,11", path:"/files" },
  ];

  const quickActions = [
    { label:"Create TRF",   icon:<AddRoundedIcon/>,           color:"#6366f1", path:"/create"        },
    { label:"Search TRF",   icon:<SearchRoundedIcon/>,        color:"#06b6d4", path:"/search"        },
    { label:"Upload Files", icon:<CloudUploadRoundedIcon/>,   color:"#10b981", path:"/upload"        },
    { label:"File Manager", icon:<FolderOpenRoundedIcon/>,    color:"#f59e0b", path:"/files"         },
    { label:"Update TRF",   icon:<EditRoundedIcon/>,          color:"#a855f7", path:"/update"        },
    { label:"Notifications",icon:<NotificationsRoundedIcon/>, color:"#ec4899", path:"/notifications" },
  ];

  return (
    <motion.div variants={stagger} initial="initial" animate="animate">
      {/* ── Hero Banner ── */}
      <Grid container spacing={2.5} sx={{mb:3}} alignItems="stretch">
        <Grid item xs={12} md={7.5}>
          <motion.div variants={up} style={{height:"100%"}}>
            <Box sx={{
              p:{xs:3,md:"32px 36px"}, borderRadius:"22px", height:"100%", position:"relative", overflow:"hidden",
              background:"linear-gradient(135deg,rgba(14,18,45,0.96) 0%,rgba(8,12,30,0.92) 100%)",
              border:"1px solid rgba(99,102,241,0.25)", backdropFilter:"blur(36px)",
              display:"flex", flexDirection:"column", justifyContent:"center", minHeight:210,
            }}>
              <Box sx={{ position:"relative" }}>
                <Typography sx={{ fontSize:"clamp(1.5rem,3vw,2.1rem)", fontWeight:900, color:"#f1f5f9", mb:1 }}>
                  {greeting.text}, {user?.displayName || user?.username}! {greeting.emoji}
                </Typography>
                <Box sx={{
                  display:"inline-flex", alignItems:"center", gap:.8,
                  background:"linear-gradient(135deg,rgba(34,211,238,0.20),rgba(6,182,212,0.16))",
                  border:"1px solid rgba(34,211,238,0.45)", borderRadius:"24px", px:2, py:.6, mb:2.5,
                }}>
                  <Box sx={{ width:8, height:8, borderRadius:"50%", background:"linear-gradient(135deg,#67e8f9,#06b6d4)", flexShrink:0 }}/>
                  <Typography sx={{ color:"#67e8f9", fontWeight:800, fontSize:"0.78rem", letterSpacing:1.2, textTransform:"uppercase" }}>
                    Engineer Dashboard
                  </Typography>
                </Box>
                <Typography sx={{ color:"#64748b", fontSize:"0.88rem", lineHeight:1.6, maxWidth:460 }}>
                  Create workspace folders, upload design drawings and reports, and track technical request workflows.
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
                </Box>
                <Box sx={{display:"flex",gap:1,alignItems:"center"}}>
                  <Chip icon={<GrainRoundedIcon sx={{color:"#10b981 !important",fontSize:"11px !important"}}/>} label="Live" size="small"
                    sx={{fontWeight:700,fontSize:"0.68rem",height:20,background:"rgba(16,185,129,0.12)",color:"#34d399",border:"1px solid rgba(16,185,129,0.28)"}}/>
                  <Tooltip title="Refresh dashboard">
                    <IconButton size="small" onClick={() => setLastRefresh(Date.now())} sx={{color:"#818cf8"}}>
                      <RefreshRoundedIcon sx={{fontSize:16}}/>
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              <Box sx={{ background: isDark?"rgba(0,0,0,0.50)":"rgba(99,102,241,0.06)", border:"1px solid rgba(99,102,241,0.20)", borderRadius:"14px", p:"14px 16px", textAlign:"center" }}>
                <Typography sx={{ fontSize:"clamp(1.7rem,3.5vw,2.2rem)", fontWeight:900, color: isDark?"#e2e8f0":"#1e293b", fontFamily:"'Courier New',monospace" }}>
                  {clock.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}
                </Typography>
              </Box>
              <Box sx={{display:"flex",gap:1,flexWrap:"wrap"}}>
                <Chip label={`${assignedTRFs.length} TRFs Assigned`} size="small"
                  sx={{fontSize:"0.7rem",fontWeight:700,background:"rgba(6,182,212,0.12)",color:"#22d3ee"}}/>
                {stats?.upload_history > 0 && (
                  <Chip label={`${stats.upload_history} Files Uploaded`} size="small"
                    sx={{fontSize:"0.7rem",fontWeight:700,background:"rgba(16,185,129,0.12)",color:"#34d399"}}/>
                )}
              </Box>
            </GlassCard>
          </motion.div>
        </Grid>
      </Grid>

      {/* ── Quick Actions ── */}
      <motion.div variants={up}>
        <Typography sx={{fontSize:"0.65rem",fontWeight:800,color:sectionLabel,letterSpacing:2.5,textTransform:"uppercase",mb:1.8}}>
          ENGINEERING ACTIONS
        </Typography>
        <Grid container spacing={1.8} sx={{mb:3.5}}>
          {quickActions.map((a,i)=>(
            <Grid item xs={4} sm={2} key={i}>
              <QkBtn {...a} isDark={isDark} navigate={navigate}/>
            </Grid>
          ))}
        </Grid>
      </motion.div>

      {/* ── KPI Cards ── */}
      <Grid container spacing={2.5} sx={{mb:3.5}} alignItems="stretch">
        {kpis.map((k,i)=>(
          <Grid item xs={12} sm={6} lg={3} key={i} sx={{ display: "flex" }}>
            <StatCard {...k} isDark={isDark} onClick={()=>navigate(k.path)}/>
          </Grid>
        ))}
      </Grid>

      {/* ── Assigned TRFs Table ── */}
      <motion.div variants={up}>
        <GlassCard isDark={isDark} sx={{p:3, mb:3.5}}>
          <Box sx={{display:"flex",justifyContent:"space-between",alignItems:"center",mb:2.5}}>
            <Typography sx={{fontWeight:700,fontSize:"0.95rem",color:headingColor}}>
              My Assigned Projects
            </Typography>
            <Chip
              icon={<AssignmentIndRoundedIcon sx={{fontSize:"14px !important"}}/>}
              label={`${assignedTRFs.length} Projects`}
              size="small"
              sx={{fontWeight:700,fontSize:"0.7rem",background:"rgba(6,182,212,0.12)",color:"#22d3ee"}}
            />
          </Box>

          {loading ? (
            <LinearProgress sx={{borderRadius:4,"& .MuiLinearProgress-bar":{background:"linear-gradient(90deg,#6366f1,#06b6d4)"}}}/>
          ) : assignedTRFs.length === 0 ? (
            <Box sx={{py:5,textAlign:"center"}}>
              <AssignmentIndRoundedIcon sx={{fontSize:40,color:subColor,mb:1}}/>
              <Typography sx={{color:subColor,fontSize:"0.85rem"}}>No projects assigned yet.</Typography>
              <Typography sx={{color:sectionLabel,fontSize:"0.75rem",mt:.5}}>Projects assigned by Admin will appear here automatically.</Typography>
            </Box>
          ) : (
            <Box sx={{overflowX:"auto"}}>
              <Box component="table" sx={{width:"100%",borderCollapse:"collapse"}}>
                <Box component="thead">
                  <Box component="tr" sx={{borderBottom:`1px solid ${isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)"}`}}>
                    {["TRF Number","Project Name","Status","Priority","Due Date"].map(h=>(
                      <Box component="th" key={h} sx={{
                        p:"8px 12px",textAlign:"left",fontSize:"0.68rem",fontWeight:800,
                        color:subColor,letterSpacing:"0.08em",textTransform:"uppercase",whiteSpace:"nowrap"
                      }}>{h}</Box>
                    ))}
                  </Box>
                </Box>
                <Box component="tbody">
                  {assignedTRFs.map((trf,i)=>(
                    <Box component="tr" key={trf.id||i}
                      onClick={()=>navigate(`/all`)}
                      sx={{
                        cursor:"pointer",
                        borderBottom:`1px solid ${isDark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.04)"}`,
                        "&:hover":{background:isDark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.02)"},
                        transition:"background .15s",
                      }}
                    >
                      <Box component="td" sx={{p:"10px 12px"}}>
                        <Chip label={trf.trf_number} size="small"
                          sx={{fontSize:"0.7rem",fontWeight:700,background:"rgba(99,102,241,0.12)",color:"#818cf8",fontFamily:"monospace"}}/>
                      </Box>
                      <Box component="td" sx={{p:"10px 12px"}}>
                        <Typography sx={{fontSize:"0.83rem",fontWeight:600,color:headingColor,maxWidth:220,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                          {trf.project_name}
                        </Typography>
                      </Box>
                      <Box component="td" sx={{p:"10px 12px"}}>
                        <Chip label={trf.status} size="small" sx={{
                          fontSize:"0.68rem",fontWeight:700,
                          background:`${STATUS_COLORS[trf.status]||"#94a3b8"}18`,
                          color:STATUS_COLORS[trf.status]||"#94a3b8",
                        }}/>
                      </Box>
                      <Box component="td" sx={{p:"10px 12px"}}>
                        {trf.priority ? (
                          <Box sx={{display:"flex",alignItems:"center",gap:.5}}>
                            <PriorityHighRoundedIcon sx={{fontSize:13,color:PRIORITY_COLORS[trf.priority]||"#94a3b8"}}/>
                            <Typography sx={{fontSize:"0.75rem",fontWeight:700,color:PRIORITY_COLORS[trf.priority]||"#94a3b8"}}>
                              {trf.priority}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography sx={{fontSize:"0.75rem",color:subColor}}>—</Typography>
                        )}
                      </Box>
                      <Box component="td" sx={{p:"10px 12px"}}>
                        {trf.due_date ? (
                          <Box sx={{display:"flex",alignItems:"center",gap:.5}}>
                            <CalendarMonthRoundedIcon sx={{fontSize:13,color:"#a78bfa"}}/>
                            <Typography sx={{fontSize:"0.75rem",color:headingColor}}>
                              {new Date(trf.due_date).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography sx={{fontSize:"0.75rem",color:subColor}}>—</Typography>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          )}
        </GlassCard>
      </motion.div>

      {/* ── Chart + Activity Log ── */}
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
                  <Area type="monotone" dataKey="trfs" name="TRFs Created" stroke="#67e8f9" strokeWidth={2.5} fillOpacity={0.1} fill="#67e8f9" />
                </AreaChart>
              </ResponsiveContainer>
            </GlassCard>
          </motion.div>
        </Grid>

        <Grid item xs={12} lg={4}>
          <motion.div variants={up} style={{height:"100%"}}>
            <GlassCard isDark={isDark} sx={{p:3,height:"100%"}}>
              <Typography sx={{fontWeight:700,fontSize:"0.95rem",color:headingColor,mb:2}}>Your Recent Actions</Typography>
              <Box sx={{display:"flex",flexDirection:"column",gap:1.8,maxHeight:255,overflowY:"auto"}}>
                {activities.length===0 ? (
                  <Typography sx={{color:sectionLabel,fontSize:"0.78rem",textAlign:"center",py:5}}>No activity logs yet</Typography>
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
    </motion.div>
  );
}
