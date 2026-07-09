/**
 * Dashboard.jsx — Ultra-premium, dark/light adaptive
 * 3D cards · animated sparklines · animated counter · glassmorphism
 * Role-specific dashboards: Admin, Manager, Engineer
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "@mui/material/styles";
import { useApp } from "../context/AppContext";
import { useGreeting } from "../hooks/useGreeting";
import { getAllTRFs } from "../services/trfService";
import { listFiles }  from "../services/fileService";
import axios from "axios";

import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";

import AddRoundedIcon           from "@mui/icons-material/AddRounded";
import FolderOpenRoundedIcon    from "@mui/icons-material/FolderOpenRounded";
import FolderSpecialRoundedIcon from "@mui/icons-material/FolderSpecialRounded";
import DescriptionRoundedIcon   from "@mui/icons-material/DescriptionRounded";
import WorkRoundedIcon           from "@mui/icons-material/WorkRounded";
import StorageRoundedIcon        from "@mui/icons-material/StorageRounded";
import GrainRoundedIcon          from "@mui/icons-material/GrainRounded";
import TrendingUpRoundedIcon     from "@mui/icons-material/TrendingUpRounded";
import BarChartRoundedIcon       from "@mui/icons-material/BarChartRounded";
import AssessmentRoundedIcon     from "@mui/icons-material/AssessmentRounded";
import SettingsRoundedIcon       from "@mui/icons-material/SettingsRounded";
import BoltRoundedIcon           from "@mui/icons-material/BoltRounded";
import ShowChartRoundedIcon      from "@mui/icons-material/ShowChartRounded";

import {
  AreaChart, Area, XAxis, YAxis,
  Tooltip as ChartTooltip, ResponsiveContainer, CartesianGrid, Legend,
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
const BARS=[28,48,34,62,42,76,50,68,44,84,58,78];

/* ── CSS Illustrations for KPI cards (matching reference art style) ── */
const IllusTRF = () => (
  <Box sx={{position:"relative",width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}>
    {/* stacked document layers */}
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
    {/* bar chart lines on top document */}
    <Box sx={{position:"absolute",bottom:"22%",left:"18%",right:"18%",display:"flex",alignItems:"flex-end",gap:"4px",height:32}}>
      {[40,70,50,90,60,80,45].map((h,i)=>(
        <Box key={i} sx={{flex:1,borderRadius:"2px 2px 0 0",height:`${h}%`,
          background:i%2===0?"rgba(129,140,248,0.85)":"rgba(99,102,241,0.50)"}}/>
      ))}
    </Box>
    {/* gear icon */}
    <Box sx={{position:"absolute",bottom:"14%",right:"18%",width:28,height:28,
      borderRadius:"50%",background:"rgba(99,102,241,0.30)",border:"1px solid rgba(129,140,248,0.40)",
      display:"flex",alignItems:"center",justifyContent:"center"}}>
      <SettingsRoundedIcon sx={{fontSize:14,color:"#818cf8"}}/>
    </Box>
  </Box>
);

const IllusDocs = () => (
  <Box sx={{position:"relative",width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}>
    {/* layered paper stack perspective */}
    {[3,2,1,0].map(i=>(
      <Box key={i} sx={{
        position:"absolute",
        width:`${60+i*5}%`,height:`${55+i*5}%`,
        borderRadius:"8px",
        background:`linear-gradient(135deg,rgba(6,182,212,${0.15+i*0.08}),rgba(34,211,238,${0.08+i*0.05}))`,
        border:"1px solid rgba(34,211,238,0.25)",
        transform:`translateY(${(3-i)*12}px) translateX(${(i-1.5)*4}px) rotate(${(i-1.5)*3}deg)`,
        boxShadow:`0 6px 24px rgba(6,182,212,0.15)`,
      }}>
        {/* lines on each doc */}
        <Box sx={{p:"6px 8px",display:"flex",flexDirection:"column",gap:"3px"}}>
          {[80,60,90,50].map((w,j)=>(
            <Box key={j} sx={{height:2,borderRadius:2,background:"rgba(34,211,238,0.35)",width:`${w}%`}}/>
          ))}
        </Box>
      </Box>
    ))}
    {/* teal glow sphere */}
    <Box sx={{position:"absolute",top:"10%",right:"15%",width:22,height:22,borderRadius:"50%",
      background:"radial-gradient(circle,rgba(34,211,238,0.70),rgba(6,182,212,0.30))",
      boxShadow:"0 0 18px rgba(34,211,238,0.60)"}}/>
  </Box>
);

const IllusProjects = () => (
  <Box sx={{position:"relative",width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}>
    {/* 3D network/hologram mesh */}
    <svg width="70%" height="70%" viewBox="0 0 120 100" style={{position:"absolute"}}>
      {/* grid lines */}
      {[0,1,2,3,4].map(i=>(
        <line key={`h${i}`} x1="10" y1={20+i*16} x2="110" y2={20+i*16}
          stroke="rgba(16,185,129,0.25)" strokeWidth="0.8"/>
      ))}
      {[0,1,2,3,4,5].map(i=>(
        <line key={`v${i}`} x1={10+i*20} y1="20" x2={10+i*20} y2="84"
          stroke="rgba(16,185,129,0.25)" strokeWidth="0.8"/>
      ))}
      {/* glowing nodes */}
      {[[30,36],[70,52],[50,20],[90,68],[20,68]].map(([x,y],i)=>(
        <g key={i}>
          <circle cx={x} cy={y} r="6" fill={`rgba(16,185,129,0.20)`} stroke="rgba(52,211,153,0.50)" strokeWidth="1"/>
          <circle cx={x} cy={y} r="3" fill="rgba(52,211,153,0.85)"/>
        </g>
      ))}
      {/* connecting lines */}
      {[[30,36,70,52],[70,52,50,20],[70,52,90,68],[30,36,20,68]].map(([x1,y1,x2,y2],i)=>(
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="rgba(52,211,153,0.40)" strokeWidth="1.2"/>
      ))}
    </svg>
    {/* floating person icon */}
    <Box sx={{position:"absolute",bottom:"16%",right:"16%",
      width:32,height:32,borderRadius:"50%",
      background:"linear-gradient(135deg,rgba(16,185,129,0.40),rgba(52,211,153,0.20))",
      border:"1.5px solid rgba(52,211,153,0.50)",
      display:"flex",alignItems:"center",justifyContent:"center"}}>
      <WorkRoundedIcon sx={{fontSize:16,color:"#34d399"}}/>
    </Box>
  </Box>
);

const IllusStorage = () => (
  <Box sx={{position:"relative",width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}>
    {/* cloud shape */}
    <Box sx={{position:"absolute",
      width:"55%",height:"42%",
      borderRadius:"50px",
      background:"linear-gradient(135deg,rgba(245,158,11,0.35),rgba(251,191,36,0.18))",
      border:"1.5px solid rgba(251,191,36,0.40)",
      boxShadow:"0 0 40px rgba(245,158,11,0.25)",
      display:"flex",alignItems:"center",justifyContent:"center",
    }}>
      <StorageRoundedIcon sx={{fontSize:30,color:"#fbbf24",filter:"drop-shadow(0 0 10px rgba(251,191,36,0.80))"}}/>
    </Box>
    {/* particles around cloud */}
    {[[15,20],[80,15],[10,70],[85,65],[50,85]].map(([l,t],i)=>(
      <Box key={i} sx={{
        position:"absolute",left:`${l}%`,top:`${t}%`,
        width:i%2===0?8:5,height:i%2===0?8:5,borderRadius:"50%",
        background:`rgba(251,191,36,${i%2===0?0.65:0.40})`,
        boxShadow:`0 0 ${i%2===0?12:8}px rgba(251,191,36,0.50)`,
      }}/>
    ))}
    {/* teal accent sparkle */}
    <Box sx={{position:"absolute",top:"18%",right:"20%",
      width:14,height:14,borderRadius:"50%",
      background:"rgba(52,211,153,0.70)",
      boxShadow:"0 0 14px rgba(52,211,153,0.80)"}}/>
  </Box>
);

/* ─── ILLUSTRATED KPI CARD — matches reference screenshot ── */
/* Top half: unique CSS/SVG illustration per card
   Bottom half: big number + title + subtitle              */
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
      {/* depth back-plate */}
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
          ? `0 4px 8px rgba(0,0,0,0.72),0 16px 40px rgba(0,0,0,0.58),0 32px 64px rgba(0,0,0,0.42),0 0 80px ${gc("0.25")},inset 0 1px 0 rgba(255,255,255,0.11)`
          : `0 2px 6px rgba(0,0,0,0.70),0 10px 28px rgba(0,0,0,0.55),0 24px 48px rgba(0,0,0,0.40),inset 0 1px 0 rgba(255,255,255,0.07)`,
        transition:"border .28s,box-shadow .28s",
      }}>
        {/* ── ILLUSTRATION TOP HALF ── */}
        <Box sx={{
          height:170,position:"relative",overflow:"hidden",flexShrink:0,
          background:`linear-gradient(145deg,${gc("0.22")} 0%,rgba(5,8,20,0.90) 100%)`,
        }}>
          {/* glow backdrop */}
          <Box sx={{
            position:"absolute",inset:0,
            background:`radial-gradient(ellipse at 60% 35%,${gc("0.28")} 0%,transparent 70%)`,
          }}/>
          {/* illustration */}
          <Box sx={{
            position:"absolute",inset:0,
            display:"flex",alignItems:"center",justifyContent:"center",
          }}>
            {illus}
          </Box>
          {/* bottom fade into card */}
          <Box sx={{
            position:"absolute",bottom:0,left:0,right:0,height:60,
            background:"linear-gradient(0deg,rgba(8,10,24,0.95) 0%,transparent 100%)",
          }}/>
          {/* top accent bar */}
          <Box sx={{
            position:"absolute",top:0,left:0,right:0,height:"3px",
            background:gradient,
            boxShadow:`0 0 16px ${gc("0.65")}`,
          }}/>
        </Box>

        {/* ── STATS BOTTOM ── */}
        <Box sx={{p:"16px 18px 18px",flex:1,display:"flex",flexDirection:"column",gap:.5}}>
          <Typography sx={{
            fontSize:"2.2rem",fontWeight:900,lineHeight:1,
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

/* ─── GLASS CARD — dark/light adaptive ─────────────────────── */
function GlassCard({ children, sx={}, onClick, rgb, isDark }) {
  const bg = isDark
    ? "linear-gradient(160deg,rgba(18,22,48,0.92) 0%,rgba(10,13,28,0.88) 100%)"
    : "linear-gradient(160deg,rgba(255,255,255,0.94) 0%,rgba(244,247,255,0.90) 100%)";
  const border = isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.08)";
  const shadow = isDark
    ? "0 2px 6px rgba(0,0,0,0.65),0 10px 28px rgba(0,0,0,0.50),0 24px 48px rgba(0,0,0,0.35),inset 0 1px 0 rgba(255,255,255,0.06)"
    : "0 2px 6px rgba(0,0,0,0.06),0 10px 28px rgba(0,0,0,0.08),0 24px 48px rgba(0,0,0,0.05),inset 0 1px 0 rgba(255,255,255,1)";
  const hoverShadow = isDark
    ? "0 4px 8px rgba(0,0,0,0.70),0 16px 42px rgba(0,0,0,0.55),0 32px 64px rgba(0,0,0,0.40),inset 0 1px 0 rgba(255,255,255,0.10)"
    : "0 8px 24px rgba(0,0,0,0.12),0 24px 56px rgba(0,0,0,0.08),inset 0 1px 0 rgba(255,255,255,1)";

  return (
    <Box onClick={onClick} sx={{
      borderRadius:"20px",
      background:bg,
      border:`1px solid ${border}`,
      backdropFilter:"blur(36px)",WebkitBackdropFilter:"blur(36px)",
      boxShadow:shadow,
      cursor:onClick?"pointer":"default",
      transition:"all .28s cubic-bezier(.4,0,.2,1)",
      position:"relative",overflow:"hidden",
      "&::before":{
        content:'""',position:"absolute",inset:0,borderRadius:"20px",pointerEvents:"none",
        background: isDark
          ? "linear-gradient(135deg,rgba(255,255,255,0.03) 0%,transparent 50%,rgba(0,0,0,0.08) 100%)"
          : "linear-gradient(135deg,rgba(255,255,255,0.80) 0%,transparent 50%,rgba(0,0,0,0.02) 100%)",
      },
      "&:hover": onClick?{
        transform:"translateY(-4px)",boxShadow:hoverShadow,
      }:{},
      ...sx,
    }}>
      <Box sx={{position:"relative",zIndex:1}}>{children}</Box>
    </Box>
  );
}

/* ─── QUICK ACTION TILE ─────────────────────────────────────── */
function QkBtn({ label, icon, color, path, isDark, navigate }) {
  return (
    <motion.div whileHover={{y:-5,scale:1.06}} whileTap={{scale:.96}}>
      <Box onClick={()=>navigate(path)} sx={{
        borderRadius:"16px",p:"14px 10px",
        background: isDark ? `rgba(255,255,255,0.04)` : `rgba(0,0,0,0.03)`,
        border:`1px solid ${color}30`,
        backdropFilter:"blur(20px)",
        cursor:"pointer",textAlign:"center",
        display:"flex",flexDirection:"column",alignItems:"center",gap:.9,
        transition:"all .22s",
        "&:hover":{
          border:`1px solid ${color}60`,
          background: isDark ? `${color}18` : `${color}12`,
          boxShadow:`0 8px 28px ${color}22`,
        },
      }}>
        <Box sx={{
          width:42,height:42,borderRadius:"12px",
          background: isDark ? `${color}18` : `${color}14`,
          border:`1px solid ${color}35`,
          display:"flex",alignItems:"center",justifyContent:"center",
          color, boxShadow:`0 0 16px ${color}22`,
        }}>{icon}</Box>
        <Typography sx={{
          fontSize:"0.68rem",fontWeight:700,
          color: isDark?"#94a3b8":"#475569",
          lineHeight:1.2,
        }}>{label}</Typography>
      </Box>
    </motion.div>
  );
}

/* ─── MAIN ──────────────────────────────────────────────────── */
export default function Dashboard() {
  const theme    = useTheme();
  const isDark   = theme.palette.mode === "dark";
  const navigate = useNavigate();
  const greeting = useGreeting();
  const { user, activities } = useApp();
  const clock    = useClock();

  const [stats,   setStats]   = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [loading, setLoading] = useState(true);

  const displayName = user?.displayName || user?.username || "there";

  /* chart colours */
  const chartText  = isDark ? "#475569" : "#94a3b8";
  const chartGrid  = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)";
  const ttStyle    = {
    background: isDark ? "rgba(10,14,30,0.97)" : "rgba(255,255,255,0.98)",
    border: `1px solid ${isDark?"rgba(99,102,241,0.22)":"rgba(99,102,241,0.18)"}`,
    borderRadius:10,fontSize:"0.78rem",
    boxShadow: isDark?"0 8px 32px rgba(0,0,0,0.5)":"0 8px 32px rgba(0,0,0,0.12)",
    color: isDark?"#e2e8f0":"#1e293b",
  };

  /* theme-aware colours */
  const headingColor  = isDark ? "#f1f5f9" : "#0f172a";
  const subColor      = isDark ? "#64748b"  : "#94a3b8";
  const sectionLabel  = isDark ? "#334155"  : "#94a3b8";

  const TRF_FOLDERS = ["Documents","Drawings","Reports","Approvals","Final Submission"];

  useEffect(()=>{
    setLoading(true);

    // Use new dashboard API for role-specific statistics
    const token = localStorage.getItem('token');
    axios.get('http://localhost:8000/dashboard/stats', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        const apiStats = res.data;
        setStats({
          total_trfs: apiStats.total_trfs || 0,
          total_documents: apiStats.active_projects || 0,  // Using as proxy
          active_projects: apiStats.active_projects || 0,
          storage_used: "0 MB",  // Not in API yet
          pending_reviews: apiStats.pending_reviews || 0,
          unread_notifications: apiStats.unread_notifications || 0,
        });
        
        // Also get monthly data from TRFs
        return getAllTRFs();
      })
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : [];
        setMonthly(buildMonthly(list));
      })
      .catch(err => {
        console.error('Dashboard API error:', err);
        // Fallback to legacy method
        getAllTRFs()
          .then(async res=>{
            const list = Array.isArray(res.data) ? res.data : [];
            const uniq = new Set(list.map(t=>(t.project_name||"").trim()).filter(Boolean));

            let totalFiles = 0;
            let totalBytes = 0;
            try {
              const fileFetches = list.flatMap(trf =>
                TRF_FOLDERS.map(folder =>
                  listFiles(trf.trf_number, folder)
                    .then(r => {
                      const files = Array.isArray(r.data?.files) ? r.data.files : [];
                      totalFiles += files.length;
                      files.forEach(f => {
                        if (f?.size) totalBytes += Number(f.size) || 0;
                      });
                    })
                    .catch(() => {})
                )
              );
              await Promise.all(fileFetches);
            } catch(_) {}

            const storageMB = totalBytes > 0
              ? `~${(totalBytes / (1024*1024)).toFixed(1)} MB`
              : list.length > 0 ? `~${(list.length * 0.5).toFixed(1)} MB` : "0 MB";

            setStats({
              total_trfs:      list.length,
              total_documents: totalFiles,
              active_projects: uniq.size || list.length,
              storage_used:    storageMB,
            });
            setMonthly(buildMonthly(list));
          })
          .catch(()=>{
            setStats({total_trfs:0,total_documents:0,active_projects:0,storage_used:"0 MB"});
            setMonthly([]);
          });
      })
      .finally(()=>setLoading(false));
  },[]);

  /* KPI data */
  const kpis = [
    { icon:<FolderSpecialRoundedIcon sx={{fontSize:26}}/>,
      illus:<IllusTRF/>,
      value:loading?"…":stats?.total_trfs??0,
      title:"Total TRFs", subtitle:"Live from database",
      gradient:"linear-gradient(135deg,#6366f1,#818cf8)", rgb:"99,102,241", path:"/all" },
    { icon:<DescriptionRoundedIcon sx={{fontSize:26}}/>,
      illus:<IllusDocs/>,
      value:loading?"…":stats?.total_documents??0,
      title:"Est. Documents", subtitle:"Actual uploaded files",
      gradient:"linear-gradient(135deg,#06b6d4,#22d3ee)", rgb:"6,182,212", path:"/files" },
    { icon:<WorkRoundedIcon sx={{fontSize:26}}/>,
      illus:<IllusProjects/>,
      value:loading?"…":stats?.active_projects??0,
      title:"Unique Projects", subtitle:"Distinct project names",
      gradient:"linear-gradient(135deg,#10b981,#34d399)", rgb:"16,185,129", path:"/analytics" },
    { icon:<StorageRoundedIcon sx={{fontSize:26}}/>,
      illus:<IllusStorage/>,
      value:loading?"…":stats?.storage_used??"0 MB",
      title:"Storage", subtitle:"Estimated file storage",
      gradient:"linear-gradient(135deg,#f59e0b,#fbbf24)", rgb:"245,158,11", path:"/reports" },
  ];

  const quickActions = [
    { label:"Create TRF",   icon:<AddRoundedIcon/>,        color:"#6366f1", path:"/create"    },
    { label:"Files",        icon:<FolderOpenRoundedIcon/>, color:"#06b6d4", path:"/files"     },
    { label:"Analytics",    icon:<BarChartRoundedIcon/>,    color:"#10b981", path:"/analytics" },
    { label:"Reports",      icon:<AssessmentRoundedIcon/>, color:"#f59e0b", path:"/reports"   },
    { label:"All TRFs",     icon:<ShowChartRoundedIcon/>,  color:"#a855f7", path:"/all"       },
    { label:"Settings",     icon:<SettingsRoundedIcon/>,   color:"#ec4899", path:"/settings"  },
  ];

  const projects = [
    {name:"Project Alpha",progress:78, status:"Active",        color:"#6366f1"},
    {name:"Project Beta", progress:45, status:"In Progress",   color:"#06b6d4"},
    {name:"Project Gamma",progress:92, status:"Near Complete", color:"#10b981"},
    {name:"Project Delta",progress:23, status:"Starting",      color:"#f59e0b"},
  ];

  return (
    <motion.div variants={stagger} initial="initial" animate="animate">

      {/* ═══ ROW 1: WELCOME + SYSTEM HUB ═══ */}
      <Grid container spacing={2.5} sx={{mb:3}} alignItems="stretch">

        {/* Welcome — premium dark glass card */}
          <Grid item xs={12} md={7.5}>
          <motion.div variants={up} style={{height:"100%"}}>
            <Box sx={{
              p:{xs:3,md:"32px 36px"},
              borderRadius:"22px",height:"100%",
              position:"relative",overflow:"hidden",
              background:"linear-gradient(135deg,rgba(14,18,45,0.96) 0%,rgba(8,12,30,0.92) 100%)",
              border:"1px solid rgba(99,102,241,0.25)",
              backdropFilter:"blur(36px)",WebkitBackdropFilter:"blur(36px)",
              boxShadow:"0 8px 48px rgba(0,0,0,0.60),0 0 90px rgba(99,102,241,0.10),inset 0 1px 0 rgba(255,255,255,0.07)",
              display:"flex",flexDirection:"column",justifyContent:"center",
              minHeight:210,
            }}>
              {/* indigo aurora top-right */}
              <Box sx={{position:"absolute",top:-80,right:-80,width:320,height:320,borderRadius:"50%",
                background:"radial-gradient(circle,rgba(99,102,241,0.22) 0%,transparent 70%)",pointerEvents:"none"}}/>
              {/* cyan aurora bottom-left */}
              <Box sx={{position:"absolute",bottom:-60,left:-60,width:280,height:280,borderRadius:"50%",
                background:"radial-gradient(circle,rgba(6,182,212,0.14) 0%,transparent 70%)",pointerEvents:"none"}}/>
              {/* purple center */}
              <Box sx={{position:"absolute",top:"35%",left:"40%",width:220,height:130,borderRadius:"50%",
                background:"radial-gradient(circle,rgba(168,85,247,0.09) 0%,transparent 70%)",pointerEvents:"none"}}/>

              <Typography sx={{
                fontSize:"clamp(1.5rem,3vw,2.1rem)",fontWeight:900,
                color:"#f1f5f9",mb:.9,lineHeight:1.15,
                fontFamily:"'Outfit','Inter',sans-serif",
                position:"relative",
              }}>
                {greeting.text}, {displayName}! {greeting.emoji}
              </Typography>
              <Typography sx={{
                color:"#64748b",fontSize:"0.88rem",lineHeight:1.6,
                mb:3,maxWidth:480,position:"relative",
              }}>
                Logged in as{" "}
                <Box component="span" sx={{
                  color:"#a5b4fc",fontWeight:700,
                  background:"rgba(99,102,241,0.14)",
                  border:"1px solid rgba(99,102,241,0.28)",
                  borderRadius:"6px",px:1,py:.15,
                }}>{user?.role||"Admin"}</Box>
                . Manage TRFs, browse RIFs, and track real-time activity.
              </Typography>

              <Box sx={{display:"flex",gap:1.5,flexWrap:"wrap",position:"relative"}}>
                <motion.button whileHover={{scale:1.04,y:-2}} whileTap={{scale:.97}}
                  onClick={()=>navigate("/create")}
                  style={{
                    display:"flex",alignItems:"center",gap:8,
                    background:"linear-gradient(135deg,#6366f1,#4f46e5)",
                    border:"none",borderRadius:12,padding:"10px 22px",
                    color:"#fff",fontWeight:700,fontSize:"0.86rem",
                    cursor:"pointer",fontFamily:"inherit",
                    boxShadow:"0 4px 22px rgba(99,102,241,0.55)",
                  }}>
                  <AddRoundedIcon style={{fontSize:18}}/> + Create TRF
                </motion.button>
                <motion.button whileHover={{scale:1.04,y:-2}} whileTap={{scale:.97}}
                  onClick={()=>navigate("/files")}
                  style={{
                    display:"flex",alignItems:"center",gap:8,
                    background:"rgba(255,255,255,0.06)",
                    backdropFilter:"blur(12px)",
                    border:"1px solid rgba(255,255,255,0.14)",
                    borderRadius:12,padding:"10px 22px",
                    color:"#e2e8f0",fontWeight:700,fontSize:"0.86rem",
                    cursor:"pointer",fontFamily:"inherit",
                  }}>
                  <FolderOpenRoundedIcon style={{fontSize:18}}/> Browse Files
                </motion.button>
              </Box>

              {/* decorative bolt icon watermark */}
              <Box sx={{position:"absolute",bottom:14,right:20,opacity:.05,pointerEvents:"none"}}>
                <BoltRoundedIcon sx={{fontSize:110,color:"#6366f1"}}/>
              </Box>
            </Box>
          </motion.div>
        </Grid>

        {/* System Hub */}
        <Grid item xs={12} md={4.5}>
          <motion.div variants={up} style={{height:"100%"}}>
            <GlassCard isDark={isDark} rgb="99,102,241" sx={{p:3,height:"100%",display:"flex",flexDirection:"column",gap:2}}>
              <Box sx={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <Box>
                  <Typography sx={{fontSize:"0.68rem",fontWeight:800,color:"#818cf8",letterSpacing:1.8,textTransform:"uppercase"}}>
                    SYSTEM HUB
                  </Typography>
                  <Typography sx={{fontSize:"0.72rem",color:subColor,mt:.3}}>Location: Head Office</Typography>
                </Box>
                <Chip icon={<GrainRoundedIcon sx={{color:"#10b981 !important",fontSize:"11px !important"}}/>}
                  label="Online" size="small"
                  sx={{fontWeight:700,fontSize:"0.68rem",height:20,
                    background:"rgba(16,185,129,0.12)",color:"#34d399",border:"1px solid rgba(16,185,129,0.28)"}}/>
              </Box>

              <Typography sx={{fontSize:"0.62rem",fontWeight:700,color:sectionLabel,letterSpacing:1.5}}>
                SYSTEM STATUS: OPTIMAL
              </Typography>

              {/* digital clock */}
              <Box sx={{
                background: isDark?"rgba(0,0,0,0.50)":"rgba(99,102,241,0.06)",
                border: isDark?"1px solid rgba(99,102,241,0.20)":"1px solid rgba(99,102,241,0.18)",
                borderRadius:"14px",p:"14px 16px",textAlign:"center",
                boxShadow: isDark?"inset 0 0 40px rgba(99,102,241,0.07)":"0 4px 16px rgba(99,102,241,0.08)",
              }}>
                <Typography sx={{
                  fontSize:"clamp(1.7rem,3.5vw,2.2rem)",fontWeight:900,
                  color: isDark?"#e2e8f0":"#1e293b",
                  fontVariantNumeric:"tabular-nums",letterSpacing:3,lineHeight:1,
                  fontFamily:"'Courier New',monospace",
                  textShadow: isDark?"0 0 24px rgba(99,102,241,0.55)":"0 0 12px rgba(99,102,241,0.25)",
                }}>
                  {clock.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}
                </Typography>
              </Box>

              <Box sx={{display:"flex",justifyContent:"space-between",alignItems:"center",pt:.5}}>
                <Typography sx={{fontSize:"0.73rem",color:subColor,fontWeight:500}}>
                  {clock.toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})}
                </Typography>
                <Box sx={{display:"flex",alignItems:"center",gap:.8}}>
                  <Box sx={{width:7,height:7,borderRadius:"50%",background:"#10b981",
                    boxShadow:"0 0 8px rgba(16,185,129,0.8)",animation:"pulseDot 2s ease infinite"}}/>
                  <Typography sx={{fontSize:"0.68rem",color:"#34d399",fontWeight:700}}>Live</Typography>
                </Box>
              </Box>
            </GlassCard>
          </motion.div>
        </Grid>
      </Grid>

      {/* ═══ ROW 2: QUICK SHORTCUTS ═══ */}
      <motion.div variants={up}>
        <Typography sx={{fontSize:"0.65rem",fontWeight:800,color:sectionLabel,
          letterSpacing:2.5,textTransform:"uppercase",mb:1.8}}>
          QUICK SHORTCUTS
        </Typography>
        <Grid container spacing={1.8} sx={{mb:3.5}}>
          {quickActions.map((a,i)=>(
            <Grid item xs={4} sm={2} key={i}>
              <QkBtn {...a} isDark={isDark} navigate={navigate}/>
            </Grid>
          ))}
        </Grid>
      </motion.div>

      {/* ═══ ROW 3: KPI CARDS ═══ */}
      <Grid container spacing={2.5} sx={{mb:3.5}}>
        {kpis.map((k,i)=>(
          <Grid item xs={12} sm={6} lg={3} key={i}>
            <StatCard {...k} isDark={isDark} onClick={()=>navigate(k.path)}/>
          </Grid>
        ))}
      </Grid>

      {/* ═══ ROW 4: CHART + ACTIVITY ═══ */}
      <Grid container spacing={2.5} sx={{mb:3.5}}>
        <Grid item xs={12} lg={8}>
          <motion.div variants={up}>
            <GlassCard isDark={isDark} sx={{p:3}}>
              <Box sx={{display:"flex",alignItems:"center",justifyContent:"space-between",mb:2.5}}>
                <Box>
                  <Typography sx={{fontWeight:700,fontSize:"0.95rem",color:headingColor}}>
                    Technical Request Trends
                  </Typography>
                  <Typography sx={{fontSize:"0.72rem",color:subColor,mt:.3}}>
                    Monthly TRFs and estimated document logs
                  </Typography>
                </Box>
                <Chip icon={<TrendingUpRoundedIcon sx={{fontSize:"14px !important"}}/>}
                  label="Live" size="small"
                  sx={{fontWeight:700,fontSize:"0.68rem",
                    background:"rgba(16,185,129,0.12)",color:"#34d399",
                    border:"1px solid rgba(16,185,129,0.25)"}}/>
              </Box>
              <ResponsiveContainer width="100%" height={230}>
                <AreaChart data={monthly} margin={{top:0,right:0,left:-20,bottom:0}}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={isDark?.35:.22}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#06b6d4" stopOpacity={isDark?.35:.22}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGrid}/>
                  <XAxis dataKey="month" tick={{fill:chartText,fontSize:11}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:chartText,fontSize:11}} axisLine={false} tickLine={false} allowDecimals={false}/>
                  <ChartTooltip contentStyle={ttStyle}/>
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:"0.75rem",color:chartText}}/>
                  <Area type="monotone" dataKey="trfs" name="TRFs" stroke="#6366f1" strokeWidth={2.5} fill="url(#g1)" dot={false}/>
                  <Area type="monotone" dataKey="docs" name="Docs" stroke="#06b6d4" strokeWidth={2.5} fill="url(#g2)" dot={false}/>
                </AreaChart>
              </ResponsiveContainer>
            </GlassCard>
          </motion.div>
        </Grid>

        {/* Activity */}
        <Grid item xs={12} lg={4}>
          <motion.div variants={up} style={{height:"100%"}}>
            <GlassCard isDark={isDark} sx={{p:3,height:"100%"}}>
              <Box sx={{display:"flex",alignItems:"center",gap:1,mb:2}}>
                <Typography sx={{fontWeight:700,fontSize:"0.95rem",color:headingColor,flex:1}}>
                  Audit Trail
                </Typography>
                <Box sx={{width:7,height:7,borderRadius:"50%",background:"#10b981",
                  boxShadow:"0 0 10px rgba(16,185,129,0.8)",animation:"pulseDot 2s ease infinite"}}/>
              </Box>
              <Box sx={{display:"flex",flexDirection:"column",gap:1.8,maxHeight:255,overflowY:"auto",
                "&::-webkit-scrollbar":{width:3},
                "&::-webkit-scrollbar-thumb":{background:isDark?"rgba(148,163,184,0.18)":"rgba(0,0,0,0.12)",borderRadius:4}}}>
                {activities.length===0?(
                  <Typography sx={{color:sectionLabel,fontSize:"0.78rem",textAlign:"center",py:5}}>
                    No recent activity
                  </Typography>
                ):activities.slice(0,7).map((a,i)=>(
                  <Box key={a.id||i} sx={{display:"flex",gap:1.5,alignItems:"flex-start"}}>
                    <Box sx={{
                      width:26,height:26,borderRadius:"50%",flexShrink:0,mt:.1,
                      background:`${a.color}18`,border:`1.5px solid ${a.color}35`,
                      display:"flex",alignItems:"center",justifyContent:"center",
                    }}>
                      <Box sx={{width:6,height:6,borderRadius:"50%",background:a.color}}/>
                    </Box>
                    <Box sx={{flex:1,minWidth:0}}>
                      <Typography sx={{fontSize:"0.78rem",fontWeight:700,color:headingColor,lineHeight:1.3,
                        overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                        {a.action}
                      </Typography>
                      <Typography sx={{fontSize:"0.66rem",color:subColor}}>
                        {a.user} · {timeAgo(a.time)}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </GlassCard>
          </motion.div>
        </Grid>
      </Grid>

      {/* ═══ ROW 5: PROJECT TRACKING ═══ */}
      <motion.div variants={up}>
        <GlassCard isDark={isDark} sx={{p:3}}>
          <Typography sx={{fontWeight:700,fontSize:"0.95rem",color:headingColor,mb:.5}}>
            Project Tracking
          </Typography>
          <Typography sx={{fontSize:"0.72rem",color:subColor,mb:2.5}}>
            Current status of active pipeline installations
          </Typography>
          <Grid container spacing={2.5}>
            {projects.map(p=>(
              <Grid item xs={12} sm={6} key={p.name}>
                <Box sx={{
                  p:2,borderRadius:"14px",
                  background: isDark?"rgba(0,0,0,0.28)":"rgba(0,0,0,0.02)",
                  border:`1px solid ${p.color}20`,
                  transition:"all .22s",
                  "&:hover":{border:`1px solid ${p.color}40`,boxShadow:`0 4px 20px ${p.color}14`},
                }}>
                  <Box sx={{display:"flex",justifyContent:"space-between",mb:1.2}}>
                    <Typography sx={{fontSize:"0.82rem",fontWeight:700,color:headingColor}}>{p.name}</Typography>
                    <Box sx={{display:"flex",alignItems:"center",gap:1}}>
                      <Chip label={p.status} size="small" sx={{
                        height:18,fontSize:"0.60rem",fontWeight:800,
                        background:`${p.color}15`,color:p.color,border:`1px solid ${p.color}30`,
                      }}/>
                      <Typography sx={{fontWeight:800,color:p.color,fontSize:"0.80rem"}}>{p.progress}%</Typography>
                    </Box>
                  </Box>
                  <LinearProgress variant="determinate" value={p.progress} sx={{
                    height:7,borderRadius:10,
                    backgroundColor: isDark?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.06)",
                    "& .MuiLinearProgress-bar":{
                      borderRadius:10,
                      background:`linear-gradient(90deg,${p.color},${p.color}88)`,
                      boxShadow:`0 0 10px ${p.color}66`,
                    },
                  }}/>
                </Box>
              </Grid>
            ))}
          </Grid>
        </GlassCard>
      </motion.div>

    </motion.div>
  );
}
