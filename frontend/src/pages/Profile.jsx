import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { motion, AnimatePresence } from "framer-motion";import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import toast from "react-hot-toast";

import PersonRoundedIcon         from "@mui/icons-material/PersonRounded";
import EditRoundedIcon           from "@mui/icons-material/EditRounded";
import LockRoundedIcon           from "@mui/icons-material/LockRounded";
import SaveRoundedIcon           from "@mui/icons-material/SaveRounded";
import VisibilityRoundedIcon     from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon  from "@mui/icons-material/VisibilityOffRounded";
import EmailRoundedIcon          from "@mui/icons-material/EmailRounded";
import BadgeRoundedIcon          from "@mui/icons-material/BadgeRounded";
import PhoneRoundedIcon          from "@mui/icons-material/PhoneRounded";
import CalendarTodayRoundedIcon  from "@mui/icons-material/CalendarTodayRounded";
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import CheckRoundedIcon          from "@mui/icons-material/CheckRounded";
import ShieldRoundedIcon         from "@mui/icons-material/ShieldRounded";

import { useApp } from "../context/AppContext";
import API from "../services/api";

/* ─── constants ─────────────────────────────────────────────────── */
const TABS = [
  { id:"view",     label:"View Profile",    icon:<PersonRoundedIcon sx={{fontSize:16}}/> },
  { id:"edit",     label:"Edit Profile",    icon:<EditRoundedIcon sx={{fontSize:16}}/> },
  { id:"password", label:"Change Password", icon:<LockRoundedIcon sx={{fontSize:16}}/> },
];

const ROLE_META = {
  Admin:    { color:"#818cf8", bg:"rgba(99,102,241,0.14)",   gradient:"linear-gradient(135deg,#6366f1,#4f46e5)" },
  Engineer: { color:"#22d3ee", bg:"rgba(6,182,212,0.14)",    gradient:"linear-gradient(135deg,#06b6d4,#0891b2)" },
  Manager:  { color:"#34d399", bg:"rgba(16,185,129,0.14)",   gradient:"linear-gradient(135deg,#10b981,#059669)" },
};

function InfoRow({ icon, label, value }) {
  const theme = useTheme();
  return (
    <Box sx={{display:"flex",alignItems:"flex-start",gap:2,py:1.6}}>
      <Box sx={{color:theme.palette.text.disabled,display:"flex",mt:.2}}>{icon}</Box>
      <Box>
        <Typography sx={{fontSize:"0.68rem",color:theme.palette.text.disabled,
          textTransform:"uppercase",letterSpacing:"0.08em",mb:.2}}>
          {label}
        </Typography>
        <Typography sx={{fontSize:"0.9rem",fontWeight:600,color:theme.palette.text.primary}}>
          {value || "—"}
        </Typography>
      </Box>
    </Box>
  );
}

export default function Profile() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { user, updateUser, signIn } = useApp();
  const [urlParams] = useSearchParams();

  const initTab   = urlParams.get("tab") || "view";
  const [tab,     setTab]     = useState(TABS.find(t=>t.id===initTab)?initTab:"view");
  const [dispName,setDispName]= useState(user?.displayName || "");
  const [email,   setEmail]   = useState(user?.email || "");
  const [phone,   setPhone]   = useState(user?.phone || "");

  useEffect(() => {
    let active = true;
    const fetchLatestProfile = async () => {
      try {
        const res = await API.get("/users/me");
        if (active && res?.data) {
          const d = res.data;
          setDispName(d.display_name || d.username || "");
          setEmail(d.email || "");
          setPhone(d.phone || "");
          updateUser({
            displayName: d.display_name || d.username,
            email: d.email,
            phone: d.phone,
            username: d.username,
            role: d.role,
          });
        }
      } catch (err) {
        console.error("Failed to fetch fresh profile data:", err);
      }
    };
    fetchLatestProfile();
    return () => { active = false; };
  }, [updateUser]);

  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [curPwd,  setCurPwd]  = useState("");
  const [newPwd,  setNewPwd]  = useState("");

  const [conPwd,  setConPwd]  = useState("");
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showCon, setShowCon] = useState(false);

  const cardBg = isDark?"rgba(15,23,42,0.82)":"rgba(255,255,255,0.92)";
  const border = isDark?"rgba(148,163,184,0.10)":"rgba(148,163,184,0.20)";

  const initials = (user?.displayName||user?.username||"U")
    .split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  const role     = user?.role || "Engineer";
  const roleMeta = ROLE_META[role] || ROLE_META.Engineer;

  /* ── save profile ─────────────────────────────────────────────── */
  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await API.put("/users/me", {
        display_name: dispName.trim() || null,
        email:        email.trim()    || null,
        phone:        phone.trim()    || null,
      });

      /* Immediately reflect in UI */
      updateUser({
        displayName: data.display_name || dispName.trim(),
        email:       data.email        || email.trim(),
        phone:       data.phone        || phone.trim(),
      });

      const emailChanged =
        email.trim() &&
        email.trim().toLowerCase() !== (user?.email || "").toLowerCase();

      if (emailChanged) {
        toast.success("Profile updated! Email changed — please log in again.", { duration: 5000 });
        setTimeout(() => {
          localStorage.removeItem("token");
          localStorage.removeItem("authUser");
          window.location.href = "/login";
        }, 2500);
      } else {
        setSaved(true);
        toast.success("Profile updated successfully!");
        setTimeout(() => setSaved(false), 2500);
      }
    } catch (err) {
      /* api.js interceptor wraps detail into err.message */
      const msg = err?.message || "Failed to update profile. Please try again.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  /* ── change password ──────────────────────────────────────────── */
  const handleChangePwd = async () => {
    if (!curPwd||!newPwd||!conPwd){ toast.error("Fill in all fields"); return; }
    if (newPwd!==conPwd)           { toast.error("Passwords do not match"); return; }
    if (newPwd.length<6)           { toast.error("Min 6 characters required"); return; }
    setSaving(true);
    try {
      await API.put("/users/me/password", {
        current_password: curPwd,
        new_password:     newPwd,
      });
      toast.success("Password changed successfully!");
      setCurPwd(""); setNewPwd(""); setConPwd("");
    } catch (err) {
      toast.error(err?.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{maxWidth:700,mx:"auto"}}>

      {/* ── Hero banner ── */}
      <motion.div initial={{opacity:0,y:-12}} animate={{opacity:1,y:0}}>
        <Box sx={{
          borderRadius:"24px",overflow:"hidden",mb:3,
          background:"linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#0c4a6e 100%)",
          position:"relative",minHeight:148,
        }}>
          <Box sx={{
            position:"absolute",inset:0,
            backgroundImage:"linear-gradient(rgba(99,102,241,0.09) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.09) 1px,transparent 1px)",
            backgroundSize:"32px 32px",
          }}/>
          <Box sx={{
            position:"absolute",right:-40,top:-40,width:220,height:220,borderRadius:"50%",
            background:"radial-gradient(rgba(99,102,241,0.28),transparent 70%)",
          }}/>

          <Box sx={{display:"flex",flexDirection:"column",alignItems:"center",py:4,position:"relative",zIndex:1}}>
            <motion.div whileHover={{scale:1.06}}>
              <Avatar sx={{
                width:86,height:86,fontSize:"1.9rem",fontWeight:800,mb:1.5,
                background:roleMeta.gradient,
                boxShadow:`0 8px 30px rgba(99,102,241,0.55)`,
                border:"3px solid rgba(255,255,255,0.18)",
              }}>
                {initials}
              </Avatar>
            </motion.div>
            <Typography sx={{color:"#fff",fontWeight:800,fontSize:"1.18rem",mb:.6}}>
              {user?.displayName||user?.username}
            </Typography>
            <Box sx={{display:"flex",alignItems:"center",gap:1}}>
              <Chip label={role} size="small" sx={{
                fontSize:"0.7rem",fontWeight:700,
                background:roleMeta.bg,color:roleMeta.color,
                border:`1px solid ${roleMeta.color}40`,
              }}/>
              {user?.phone && (
                <Chip label={user.phone} size="small" icon={<PhoneRoundedIcon sx={{fontSize:"12px !important",color:"#94a3b8 !important"}}/>}
                  sx={{fontSize:"0.68rem",background:"rgba(148,163,184,0.10)",color:"#94a3b8"}}/>
              )}
            </Box>
          </Box>
        </Box>
      </motion.div>

      {/* ── Tab bar ── */}
      <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.1}}>
        <Box sx={{
          display:"flex",gap:1,p:1,mb:3,
          borderRadius:"16px",background:cardBg,
          border:`1px solid ${border}`,backdropFilter:"blur(20px)",
        }}>
          {TABS.map(t=>{
            const active = tab===t.id;
            return (
              <Box key={t.id} onClick={()=>setTab(t.id)} sx={{
                display:"flex",alignItems:"center",gap:1,
                px:2,py:1,borderRadius:"10px",cursor:"pointer",flex:1,justifyContent:"center",
                background:active?"linear-gradient(135deg,rgba(99,102,241,0.18),rgba(6,182,212,0.12))":"transparent",
                border:`1px solid ${active?"rgba(99,102,241,0.35)":"transparent"}`,
                color:active?"#818cf8":theme.palette.text.secondary,
                transition:"all .18s",
              }}>
                {t.icon}
                <Typography sx={{fontSize:"0.8rem",fontWeight:active?700:500}}>{t.label}</Typography>
              </Box>
            );
          })}
        </Box>
      </motion.div>

      {/* ── Panel ── */}
      <AnimatePresence mode="wait">
        <motion.div key={tab}
          initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}}
          transition={{duration:.22}}>
          <Box sx={{
            p:3.5,borderRadius:"20px",background:cardBg,
            border:`1px solid ${border}`,backdropFilter:"blur(20px)",
          }}>

            {/* VIEW */}
            {tab==="view" && (
              <>
                <Typography sx={{fontWeight:700,mb:2,color:theme.palette.text.primary}}>
                  Account Information
                </Typography>
                <InfoRow icon={<BadgeRoundedIcon sx={{fontSize:18}}/>}          label="Username"     value={user?.username}/>
                <Divider sx={{borderColor:border}}/>
                <InfoRow icon={<PersonRoundedIcon sx={{fontSize:18}}/>}         label="Display Name" value={user?.displayName}/>
                <Divider sx={{borderColor:border}}/>
                <InfoRow icon={<EmailRoundedIcon sx={{fontSize:18}}/>}          label="Email"        value={user?.email}/>
                <Divider sx={{borderColor:border}}/>
                <InfoRow icon={<PhoneRoundedIcon sx={{fontSize:18}}/>}          label="Phone"        value={user?.phone}/>
                <Divider sx={{borderColor:border}}/>
                <InfoRow icon={<ShieldRoundedIcon sx={{fontSize:18}}/>}         label="Role"         value={user?.role}/>
                <Divider sx={{borderColor:border}}/>
                <InfoRow
                  icon={<CalendarTodayRoundedIcon sx={{fontSize:18}}/>}
                  label="Member Since"
                  value={user?.joinedAt
                    ? new Date(user.joinedAt).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})
                    : "Today"}
                />
              </>
            )}

            {/* EDIT */}
            {tab==="edit" && (
              <>
                <Typography sx={{fontWeight:700,mb:.5,color:theme.palette.text.primary}}>Edit Profile</Typography>
                <Typography sx={{fontSize:"0.8rem",color:theme.palette.text.secondary,mb:3}}>
                  Update your display name, email, and phone number.
                </Typography>
                <Box sx={{display:"flex",flexDirection:"column",gap:2.5}}>
                  <TextField label="Display Name" fullWidth value={dispName}
                    onChange={e=>setDispName(e.target.value)}
                    InputProps={{startAdornment:<InputAdornment position="start"><PersonRoundedIcon sx={{fontSize:18}}/></InputAdornment>,sx:{borderRadius:"12px"}}}
                  />
                  <TextField label="Email Address" fullWidth value={email} type="email"
                    onChange={e=>setEmail(e.target.value)}
                    helperText="Changing email will require you to log in again."
                    InputProps={{startAdornment:<InputAdornment position="start"><EmailRoundedIcon sx={{fontSize:18}}/></InputAdornment>,sx:{borderRadius:"12px"}}}
                  />
                  <TextField label="Phone Number" fullWidth value={phone}
                    onChange={e=>setPhone(e.target.value)}
                    InputProps={{startAdornment:<InputAdornment position="start"><PhoneRoundedIcon sx={{fontSize:18}}/></InputAdornment>,sx:{borderRadius:"12px"}}}
                  />
                </Box>
                <motion.div whileHover={{scale:1.02}} whileTap={{scale:.98}}>
                  <Button fullWidth variant="contained" onClick={handleSave} disabled={saving}
                    startIcon={saving?<CircularProgress size={16} color="inherit"/>:saved?<CheckRoundedIcon/>:<SaveRoundedIcon/>}
                    sx={{
                      mt:3,py:1.4,borderRadius:"12px",fontWeight:700,
                      background:saved?"linear-gradient(135deg,#10b981,#34d399)":"linear-gradient(135deg,#6366f1,#06b6d4)",
                      boxShadow:"0 8px 24px rgba(99,102,241,0.35)",
                    }}>
                    {saving?"Saving…":saved?"Saved!":"Save Changes"}
                  </Button>
                </motion.div>
              </>
            )}

            {/* PASSWORD */}
            {tab==="password" && (
              <>
                <Typography sx={{fontWeight:700,mb:.5,color:theme.palette.text.primary}}>Change Password</Typography>
                <Typography sx={{fontSize:"0.8rem",color:theme.palette.text.secondary,mb:3}}>
                  Update your account password. Minimum 6 characters.
                </Typography>
                <Box sx={{display:"flex",flexDirection:"column",gap:2.5}}>
                  {[
                    {label:"Current Password",val:curPwd,set:setCurPwd,show:showCur,setShow:setShowCur},
                    {label:"New Password",     val:newPwd,set:setNewPwd,show:showNew,setShow:setShowNew},
                    {label:"Confirm Password", val:conPwd,set:setConPwd,show:showCon,setShow:setShowCon},
                  ].map(f=>(
                    <TextField key={f.label} label={f.label} fullWidth
                      type={f.show?"text":"password"} value={f.val}
                      onChange={e=>f.set(e.target.value)}
                      InputProps={{
                        startAdornment:<InputAdornment position="start"><LockRoundedIcon sx={{fontSize:18}}/></InputAdornment>,
                        endAdornment:<InputAdornment position="end">
                          <IconButton size="small" onClick={()=>f.setShow(v=>!v)}>
                            {f.show?<VisibilityOffRoundedIcon sx={{fontSize:16}}/>:<VisibilityRoundedIcon sx={{fontSize:16}}/>}
                          </IconButton>
                        </InputAdornment>,
                        sx:{borderRadius:"12px"},
                      }}
                    />
                  ))}
                </Box>
                <motion.div whileHover={{scale:1.02}} whileTap={{scale:.98}}>
                  <Button fullWidth variant="contained" onClick={handleChangePwd} disabled={saving}
                    startIcon={saving?<CircularProgress size={16} color="inherit"/>:<LockRoundedIcon/>}
                    sx={{
                      mt:3,py:1.4,borderRadius:"12px",fontWeight:700,
                      background:"linear-gradient(135deg,#a855f7,#6366f1)",
                      boxShadow:"0 8px 24px rgba(168,85,247,0.35)",
                    }}>
                    {saving?"Updating…":"Change Password"}
                  </Button>
                </motion.div>
              </>
            )}

          </Box>
        </motion.div>
      </AnimatePresence>
    </Box>
  );
}
