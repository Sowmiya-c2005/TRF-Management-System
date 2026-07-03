/**
 * Dashboard.jsx — Redesigned to match reference screenshot
 * Golden welcome banner · digital clock system hub · illustrated KPI cards
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useApp } from "../context/AppContext";
import { useGreeting } from "../hooks/useGreeting";
import { getAllTRFs } from "../services/trfService";

import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import { useTheme } from "@mui/material/styles";

import AddRoundedIcon          from "@mui/icons-material/AddRounded";
import FolderOpenRoundedIcon   from "@mui/icons-material/FolderOpenRounded";
import FolderSpecialRoundedIcon from "@mui/icons-material/FolderSpecialRounded";
import DescriptionRoundedIcon  from "@mui/icons-material/DescriptionRounded";
import WorkRoundedIcon          from "@mui/icons-material/WorkRounded";
import StorageRoundedIcon       from "@mui/icons-material/StorageRounded";
import GrainRoundedIcon         from "@mui/icons-material/GrainRounded";

import {
  AreaChart, Area, XAxis, YAxis, Tooltip as ChartTooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function buildMonthly(trfs) {
  const now = new Date();
  const months = Array.from({length:6},(_,i)=>{
    const d = new Date(now.getFullYear(), now.getMonth()-5+i, 1);
    return MONTH_NAMES[d.getMonth()];
  });
  const counts = {};
  months.forEach(m=>(counts[m]={trfs:0,docs:0}));
  trfs.forEach(t=>{
    if(!t.created_at) return;
    const m = MONTH_NAMES[new Date(t.created_at).getMonth()];
    if(counts[m]){counts[m].trfs+=1;counts[m].docs+=3;}
  });
  return months.map(m=>({month:m,...counts[m]}));
}

function timeAgo(time) {
  if(!time) return "";
  const sec = Math.floor((Date.now()-new Date(time).getTime())/1000);
  if(sec<60) return "just now";
  if(sec<3600) return `${Math.floor(sec/60)}m ago`;
  if(sec<86400) return `${Math.floor(sec/3600)}h ago`;
  return `${Math.floor(sec/86400)}d ago`;
}

const stagger = {animate:{transition:{staggerChildren:0.06}}};
const fadeUp  = {initial:{opacity:0,y:18},animate:{opacity:1,y:0,transition:{duration:0.4}}};

/* ── KPI Card with 3D illustration area (matches reference screenshot) ── */
function KpiCard({ icon, value, title, subtitle, gradient, glowColor, illustration, onClick }) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y:-6, scale:1.025 }}
      whileTap={{ scale:0.98 }}
      onClick={onClick}
      style={{ cursor:"pointer", height:"100%" }}
    >
      <Box sx={{
        borderRadius:"20px", overflow:"hidden", height:"100%",
        background:"linear-gradient(145deg,rgba(15,20,40,0.85),rgba(10,14,30,0.92))",
        border:"1px solid rgba(255,255,255,0.10)",
        backdropFilter:"blur(20px)",
        boxShadow:`0 8px 32px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.05)`,
        display:"flex", flexDirection:"column",
        transition:"box-shadow .25s",
        "&:hover":{ boxShadow:`0 12px 40px ${glowColor}44, 0 0 0 1px ${glowColor}44` },
      }}>
        {/* illustration top half */}
        <Box sx={{
          height:160, position:"relative", overflow:"hidden",
          background:`linear-gradient(145deg, ${gradient.split(",")[1]?.trim().slice(0,-1) || "#1e293b"}22, rgba(0,0,0,0.4))`,
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          {/* gradient overlay */}
          <Box sx={{
            position:"absolute", inset:0,
            background:`radial-gradient(ellipse at 60% 40%, ${glowColor}30 0%, transparent 70%)`,
          }}/>
          {/* big icon as illustration */}
          <Box sx={{
            fontSize:72, color:glowColor, opacity:0.85, position:"relative",
            filter:`drop-shadow(0 0 20px ${glowColor}88)`,
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            {illustration}
          </Box>
          {/* decorative bar chart lines at bottom of illustration */}
          <Box sx={{
            position:"absolute", bottom:0, left:0, right:0, height:45,
            display:"flex", alignItems:"flex-end", gap:"3px", px:2, pb:1,
          }}>
            {[30,55,40,70,45,80,60,75,50,90,65,85].map((h,i)=>(
              <Box key={i} sx={{
                flex:1, borderRadius:"2px 2px 0 0",
                height:`${h}%`,
                background:i%2===0 ? `${glowColor}70` : `${glowColor}40`,
              }}/>
            ))}
          </Box>
        </Box>

        {/* stats bottom half */}
        <Box sx={{ p:2.5, flex:1, display:"flex", flexDirection:"column", gap:0.5 }}>
          <Typography sx={{ fontSize:"2rem", fontWeight:900, color:"#f1f5f9", lineHeight:1.1, fontVariantNumeric:"tabular-nums" }}>
            {value}
          </Typography>
          <Typography sx={{ fontSize:"0.85rem", fontWeight:700, color:"#e2e8f0" }}>
            {title}
          </Typography>
          <Typography sx={{ fontSize:"0.72rem", color:"#64748b" }}>
            {subtitle}
          </Typography>
        </Box>
      </Box>
    </motion.div>
  );
}

/* ── Digital clock ── */
function DigitalClock() {
  const [now, setNow] = useState(new Date());
  useEffect(()=>{const t=setInterval(()=>setNow(new Date()),1000);return()=>clearInterval(t);},[]);
  const time = now.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
  const date = now.toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"});
  const time2= now.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
  return { time, date, time2, now };
}

export default function Dashboard() {
  const theme    = useTheme();
  const isDark   = theme.palette.mode === "dark";
  const navigate = useNavigate();
  const greeting = useGreeting();
  const { user, activities } = useApp();

  const [stats,   setStats]   = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [loading, setLoading] = useState(true);
  const clock = DigitalClock();

  const displayName = user?.displayName || user?.username || "there";
  const cardBg = "linear-gradient(145deg,rgba(15,20,40,0.85),rgba(10,14,30,0.92))";
  const border = "rgba(255,255,255,0.10)";
  const chartText = "#64748b";
  const chartGrid = "rgba(255,255,255,0.05)";
  const ttStyle = { background:"#1e293b", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, fontSize:"0.78rem" };

  useEffect(()=>{
    setLoading(true);
    getAllTRFs()
      .then(res=>{
        const list = Array.isArray(res.data)?res.data:[];
        const uniq = new Set(list.map(t=>(t.project_name||"").trim()).filter(Boolean));
        setStats({
          total_trfs:      list.length,
          total_documents: list.length*3,
          active_projects: uniq.size||list.length,
          storage_used:    list.length>0?`~${(list.length*0.5).toFixed(1)} MB`:"0 MB",
        });
        setMonthly(buildMonthly(list));
      })
      .catch(()=>{
        setStats({total_trfs:0,total_documents:0,active_projects:0,storage_used:"0 MB"});
        setMonthly([]);
      })
      .finally(()=>setLoading(false));
  },[]);

  const kpiCards = [
    { icon:<FolderSpecialRoundedIcon sx={{fontSize:72}}/>, value:loading?"…":stats?.total_trfs??0,
      title:"Total TRFs", subtitle:"Live from database",
      gradient:"linear-gradient(135deg,#6366f1,#818cf8)", glowColor:"#6366f1",
      path:"/all" },
    { icon:<DescriptionRoundedIcon sx={{fontSize:72}}/>, value:loading?"…":stats?.total_documents??0,
      title:"Est. Documents", subtitle:"~3 fires per TRP (est.)",
      gradient:"linear-gradient(135deg,#06b6d4,#22d3ee)", glowColor:"#06b6d4",
      path:"/files" },
    { icon:<WorkRoundedIcon sx={{fontSize:72}}/>, value:loading?"…":stats?.active_projects??0,
      title:"Unique Projects", subtitle:"Distinct project names",
      gradient:"linear-gradient(135deg,#10b981,#34d399)", glowColor:"#10b981",
      path:"/analytics" },
    { icon:<StorageRoundedIcon sx={{fontSize:72}}/>, value:loading?"…":stats?.storage_used??"0 MB",
      title:"Storage", subtitle:"Estimated file storage",
      gradient:"linear-gradient(135deg,#f59e0b,#fbbf24)", glowColor:"#f59e0b",
      path:"/reports" },
  ];

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" style={{minHeight:"100%"}}>

      {/* ══ HERO BANNER ══ */}
      <motion.div variants={fadeUp}>
        <Grid container spacing={2.5} sx={{mb:3}} alignItems="stretch">

          {/* ── Golden welcome card (left) ── */}
          <Grid item xs={12} md={7.5}>
            <Box sx={{
              p:{xs:3,md:4}, borderRadius:"22px", height:"100%", position:"relative", overflow:"hidden",
              /* golden/amber gradient matching reference */
              background:"linear-gradient(135deg, #7a5c10 0%, #b8860b 30%, #8b6914 60%, #5a3e0a 100%)",
              border:"1px solid rgba(255,200,80,0.25)",
              boxShadow:"0 8px 40px rgba(180,120,0,0.35)",
              display:"flex", flexDirection:"column", justifyContent:"center",
              minHeight:200,
            }}>
              {/* ornamental pattern overlay */}
              <Box sx={{
                position:"absolute", right:-20, top:-20, bottom:-20, width:"45%",
                backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Ccircle cx='100' cy='100' r='80' fill='none' stroke='rgba(255,200,50,0.12)' stroke-width='1'/%3E%3Ccircle cx='100' cy='100' r='60' fill='none' stroke='rgba(255,200,50,0.10)' stroke-width='1'/%3E%3Ccircle cx='100' cy='100' r='40' fill='none' stroke='rgba(255,200,50,0.08)' stroke-width='1'/%3E%3Cpath d='M100 20 Q120 60 100 100 Q80 140 100 180' fill='none' stroke='rgba(255,200,50,0.15)' stroke-width='1'/%3E%3Cpath d='M20 100 Q60 80 100 100 Q140 120 180 100' fill='none' stroke='rgba(255,200,50,0.15)' stroke-width='1'/%3E%3C/svg%3E")`,
                backgroundRepeat:"no-repeat", backgroundPosition:"center",
                backgroundSize:"contain", opacity:0.6,
                pointerEvents:"none",
              }}/>

              <Typography variant="h4" sx={{
                fontWeight:900, fontSize:"clamp(1.4rem,3vw,2rem)",
                color:"#fff8e7", mb:1,
                textShadow:"0 2px 8px rgba(0,0,0,0.4)",
                fontFamily:"'Outfit','Inter',sans-serif",
                position:"relative",
              }}>
                {greeting.text}, {displayName}! {greeting.emoji}
              </Typography>
              <Typography variant="body2" sx={{
                color:"rgba(255,240,180,0.85)", maxWidth:480, lineHeight:1.6,
                mb:3, fontSize:"0.88rem", position:"relative",
              }}>
                Logged in as <strong style={{color:"#fde68a"}}>{user?.role||"Admin"}</strong>.
                Manage TRFs, browse RIFs, and track real-time activity below.
              </Typography>

              <Box sx={{display:"flex",gap:1.5,flexWrap:"wrap",position:"relative"}}>
                <Button
                  variant="contained"
                  startIcon={<AddRoundedIcon/>}
                  onClick={()=>navigate("/create")}
                  sx={{
                    background:"rgba(0,0,0,0.35)", backdropFilter:"blur(10px)",
                    border:"1px solid rgba(255,200,80,0.40)",
                    color:"#fde68a", borderRadius:"12px", px:2.5, py:1,
                    fontWeight:700, fontSize:"0.85rem",
                    "&:hover":{background:"rgba(0,0,0,0.50)"},
                    boxShadow:"none",
                  }}>
                  + Create TRF
                </Button>
                <Button
                  variant="contained"
                  startIcon={<FolderOpenRoundedIcon/>}
                  onClick={()=>navigate("/files")}
                  sx={{
                    background:"rgba(255,200,80,0.18)", backdropFilter:"blur(10px)",
                    border:"1px solid rgba(255,200,80,0.35)",
                    color:"#fde68a", borderRadius:"12px", px:2.5, py:1,
                    fontWeight:700, fontSize:"0.85rem",
                    "&:hover":{background:"rgba(255,200,80,0.28)"},
                    boxShadow:"none",
                  }}>
                  Browse Files
                </Button>
              </Box>
            </Box>
          </Grid>

          {/* ── System Hub (right) ── */}
          <Grid item xs={12} md={4.5}>
            <Box sx={{
              p:3, borderRadius:"22px", height:"100%",
              background:cardBg, border:`1px solid ${border}`,
              backdropFilter:"blur(20px)",
              display:"flex", flexDirection:"column", gap:1.5,
            }}>
              <Box sx={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <Box>
                  <Typography sx={{fontSize:"0.7rem",fontWeight:800,color:"#60a5fa",letterSpacing:1.5,textTransform:"uppercase"}}>
                    SYSTEM HUB
                  </Typography>
                  <Typography sx={{fontSize:"0.75rem",color:"#64748b"}}>Location: Head Office</Typography>
                </Box>
                <Chip
                  icon={<GrainRoundedIcon sx={{color:"#10b981 !important",fontSize:"12px !important"}}/>}
                  label="Online" size="small"
                  sx={{fontWeight:700,fontSize:"0.7rem",height:22,
                    background:"rgba(16,185,129,0.12)",color:"#10b981",
                    border:"1px solid rgba(16,185,129,0.30)"}}
                />
              </Box>

              <Typography sx={{fontSize:"0.7rem",fontWeight:700,color:"#475569",letterSpacing:1.2}}>
                SYSTEM STATUS: OPTIMAL
              </Typography>

              {/* Digital clock — matches reference */}
              <Box sx={{
                background:"rgba(0,0,0,0.45)", borderRadius:"14px",
                border:"1px solid rgba(255,255,255,0.08)",
                p:2, textAlign:"center",
              }}>
                <Typography sx={{
                  fontSize:"clamp(1.8rem,4vw,2.4rem)", fontWeight:900,
                  color:"#f1f5f9", fontVariantNumeric:"tabular-nums",
                  letterSpacing:2, lineHeight:1.1,
                  fontFamily:"'Courier New','Consolas',monospace",
                  textShadow:"0 0 20px rgba(99,102,241,0.50)",
                }}>
                  {clock.time}
                </Typography>
              </Box>

              <Box sx={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <Typography sx={{fontSize:"0.75rem",color:"#64748b",fontWeight:500}}>
                  {clock.date}
                </Typography>
                <Typography sx={{fontSize:"0.75rem",color:"#94a3b8",fontWeight:600}}>
                  {clock.time2}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </motion.div>

      {/* ══ QUICK SHORTCUTS ══ */}
      <motion.div variants={fadeUp}>
        <Typography sx={{
          fontSize:"0.72rem", fontWeight:800, color:"#475569",
          letterSpacing:2, textTransform:"uppercase", mb:2,
        }}>
          QUICK SHORTCUTS
        </Typography>

        {/* ── KPI Cards with illustrations ── */}
        <Grid container spacing={2.5} sx={{mb:3.5}}>
          {kpiCards.map((card,i)=>(
            <Grid item xs={12} sm={6} lg={3} key={i}>
              <KpiCard
                icon={card.icon}
                value={card.value}
                title={card.title}
                subtitle={card.subtitle}
                gradient={card.gradient}
                glowColor={card.glowColor}
                onClick={()=>navigate(card.path)}
              />
            </Grid>
          ))}
        </Grid>
      </motion.div>

      {/* ══ CHARTS ROW ══ */}
      <Grid container spacing={2.5} sx={{mb:3.5}}>
        <Grid item xs={12} lg={8}>
          <motion.div variants={fadeUp}>
            <Box sx={{p:3,borderRadius:"20px",background:cardBg,backdropFilter:"blur(20px)",border:`1px solid ${border}`}}>
              <Typography sx={{fontWeight:700,fontSize:"0.95rem",mb:.5,color:"#e2e8f0"}}>
                Technical Request Trends
              </Typography>
              <Typography sx={{fontSize:"0.72rem",color:"#64748b",mb:2.5}}>
                Monthly TRFs created and estimated document logs
              </Typography>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={monthly} margin={{top:0,right:0,left:-20,bottom:0}}>
                  <defs>
                    <linearGradient id="dTRF" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.30}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="dDocs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.30}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGrid}/>
                  <XAxis dataKey="month" tick={{fill:chartText,fontSize:11}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:chartText,fontSize:11}} axisLine={false} tickLine={false} allowDecimals={false}/>
                  <ChartTooltip contentStyle={ttStyle}/>
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:"0.75rem"}}/>
                  <Area type="monotone" dataKey="trfs" name="TRFs" stroke="#6366f1" strokeWidth={2.5} fill="url(#dTRF)" dot={false}/>
                  <Area type="monotone" dataKey="docs" name="Docs" stroke="#06b6d4" strokeWidth={2.5} fill="url(#dDocs)" dot={false}/>
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </motion.div>
        </Grid>

        {/* Activity feed */}
        <Grid item xs={12} lg={4}>
          <motion.div variants={fadeUp} style={{height:"100%"}}>
            <Box sx={{p:3,borderRadius:"20px",background:cardBg,backdropFilter:"blur(20px)",border:`1px solid ${border}`,height:"100%"}}>
              <Box sx={{display:"flex",alignItems:"center",gap:1,mb:2}}>
                <Typography sx={{fontWeight:700,fontSize:"0.95rem",color:"#e2e8f0"}}>Audit Trail</Typography>
                <Box sx={{ml:"auto",width:6,height:6,borderRadius:"50%",background:"#10b981"}}/>
              </Box>
              <Box sx={{display:"flex",flexDirection:"column",gap:1.5,maxHeight:260,overflowY:"auto"}}>
                {activities.length===0?(
                  <Typography sx={{color:"#475569",fontSize:"0.78rem",textAlign:"center",py:4}}>
                    No recent activity
                  </Typography>
                ):activities.slice(0,6).map((act,i)=>(
                  <Box key={act.id||i} sx={{display:"flex",gap:1.5,alignItems:"flex-start"}}>
                    <Box sx={{
                      width:24,height:24,borderRadius:"50%",flexShrink:0,mt:.2,
                      background:`${act.color}20`,border:`1.5px solid ${act.color}40`,
                      display:"flex",alignItems:"center",justifyContent:"center",
                    }}>
                      <Box sx={{width:5,height:5,borderRadius:"50%",background:act.color}}/>
                    </Box>
                    <Box sx={{flex:1,minWidth:0}}>
                      <Typography sx={{fontSize:"0.78rem",fontWeight:700,color:"#e2e8f0",lineHeight:1.3}}>
                        {act.action}
                      </Typography>
                      <Typography sx={{fontSize:"0.68rem",color:"#64748b"}}>
                        {act.user} · {timeAgo(act.time)}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </motion.div>
        </Grid>
      </Grid>

      {/* ══ BOTTOM ROW — Projects ══ */}
      <motion.div variants={fadeUp}>
        <Box sx={{p:3,borderRadius:"20px",background:cardBg,backdropFilter:"blur(20px)",border:`1px solid ${border}`}}>
          <Typography sx={{fontWeight:700,fontSize:"0.95rem",mb:.5,color:"#e2e8f0"}}>Project Tracking</Typography>
          <Typography sx={{fontSize:"0.72rem",color:"#64748b",mb:2.5}}>Current status of active pipeline installations</Typography>
          <Grid container spacing={2.5}>
            {[
              {name:"Project Alpha",progress:78,status:"Active",color:"#6366f1"},
              {name:"Project Beta", progress:45,status:"In Progress",color:"#06b6d4"},
              {name:"Project Gamma",progress:92,status:"Near Complete",color:"#10b981"},
              {name:"Project Delta",progress:23,status:"Starting",color:"#f59e0b"},
            ].map(p=>(
              <Grid item xs={12} sm={6} key={p.name}>
                <Box>
                  <Box sx={{display:"flex",justifyContent:"space-between",mb:.8}}>
                    <Typography sx={{fontSize:"0.80rem",fontWeight:700,color:"#e2e8f0"}}>{p.name}</Typography>
                    <Box sx={{display:"flex",alignItems:"center",gap:1}}>
                      <Chip label={p.status} size="small" sx={{
                        height:18,fontSize:"0.60rem",fontWeight:800,
                        background:`${p.color}15`,color:p.color,border:`1px solid ${p.color}30`,
                      }}/>
                      <Typography sx={{fontWeight:800,color:p.color,fontSize:"0.78rem"}}>{p.progress}%</Typography>
                    </Box>
                  </Box>
                  <LinearProgress variant="determinate" value={p.progress} sx={{
                    height:6,borderRadius:10,
                    backgroundColor:"rgba(255,255,255,0.06)",
                    "& .MuiLinearProgress-bar":{borderRadius:10,background:`linear-gradient(90deg,${p.color},${p.color}88)`},
                  }}/>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </motion.div>

    </motion.div>
  );
}
