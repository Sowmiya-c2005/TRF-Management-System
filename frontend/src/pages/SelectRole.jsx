import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import API from "../services/api";
import { useApp } from "../context/AppContext";

/* ─────────────────────────────────────────────────────────────────
   SVG ICONS
   ───────────────────────────────────────────────────────────────── */
const AdminIcon = () => (
  <motion.svg width="38" height="38" viewBox="0 0 24 24" fill="none"
    stroke="#c4b5fd" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
    animate={{ filter:["drop-shadow(0 0 4px #c4b5fd66)","drop-shadow(0 0 14px #c4b5fdcc)","drop-shadow(0 0 4px #c4b5fd66)"] }}
    transition={{ duration:2.5, repeat:Infinity, ease:"easeInOut" }}>
    <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7z"/>
    <motion.polyline points="9 12 11 14 15 10" stroke="#e9d5ff"
      animate={{ pathLength:[0,1,1,0] }}
      transition={{ duration:2.5, repeat:Infinity, ease:"easeInOut", times:[0,0.4,0.8,1] }}/>
  </motion.svg>
);

const EngineerIcon = () => (
  <motion.svg width="38" height="38" viewBox="0 0 24 24" fill="none"
    stroke="#67e8f9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
    animate={{ rotate:360 }}
    transition={{ duration:5, repeat:Infinity, ease:"linear" }}
    style={{ filter:"drop-shadow(0 0 10px rgba(34,211,238,0.90))" }}>
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
  </motion.svg>
);

const ManagerIcon = () => (
  <svg width="38" height="38" viewBox="0 0 24 24" fill="none"
    stroke="#fcd34d" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
    style={{ filter:"drop-shadow(0 0 8px rgba(252,211,77,0.80))" }}>
    <motion.line x1="18" y1="20" x2="18" animate={{ y2:[10,5,10] }} transition={{ duration:1.4, repeat:Infinity, ease:"easeInOut" }}/>
    <motion.line x1="12" y1="20" x2="12" animate={{ y2:[4,10,4] }} transition={{ duration:1.4, repeat:Infinity, ease:"easeInOut", delay:0.3 }}/>
    <motion.line x1="6"  y1="20" x2="6"  animate={{ y2:[14,8,14] }} transition={{ duration:1.4, repeat:Infinity, ease:"easeInOut", delay:0.6 }}/>
    <line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
);

const ROLES = [
  {
    key:"Admin",    label:"Administrator",
    cardBg:  "linear-gradient(135deg, rgba(58,22,148,0.80) 0%, rgba(38,12,90,0.68) 100%)",
    backBg:  "linear-gradient(135deg, rgba(45,16,110,0.70) 0%, rgba(28,8,72,0.58) 100%)",
    border:  "rgba(180,155,255,0.62)",
    glow:    "rgba(139,92,246,0.88)",
    accent:  "#c4b5fd",
    Icon: AdminIcon,
  },
  {
    key:"Manager",  label:"Manager",
    cardBg:  "linear-gradient(135deg, rgba(120,72,8,0.78)  0%, rgba(78,42,0,0.65)  100%)",
    backBg:  "linear-gradient(135deg, rgba(95,55,4,0.68)   0%, rgba(62,32,0,0.55)  100%)",
    border:  "rgba(252,196,42,0.62)",
    glow:    "rgba(245,158,11,0.88)",
    accent:  "#fcd34d",
    Icon: ManagerIcon,
  },
  {
    key:"Engineer", label:"Engineer",
    cardBg:  "linear-gradient(135deg, rgba(8,108,155,0.80) 0%, rgba(0,68,108,0.68) 100%)",
    backBg:  "linear-gradient(135deg, rgba(0,82,122,0.70)  0%, rgba(0,50,88,0.58)  100%)",
    border:  "rgba(56,210,245,0.65)",
    glow:    "rgba(6,182,212,0.88)",
    accent:  "#67e8f9",
    Icon: EngineerIcon,
  },
];

/* ─────────────────────────────────────────────────────────────────
   SPACE CANVAS
   ───────────────────────────────────────────────────────────────── */
function SpaceCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext("2d");
    let W = cv.width = window.innerWidth;
    let H = cv.height = window.innerHeight;
    let raf, t = 0;
    const rn = (a,b) => Math.random()*(b-a)+a;
    const PI2 = Math.PI*2;

    const stars = Array.from({length:280}, () => ({
      x:rn(0,W), y:rn(0,H), r:rn(0.1,1.9),
      a:rn(.1,1), da:rn(.003,.009)*(Math.random()>.5?1:-1),
    }));

    const NN = 55;
    const nodes = Array.from({length:NN}, () => ({
      x:rn(0,W), y:rn(H*.44, H*1.02),
      vx:rn(-.28,.28), vy:rn(-.20,.20),
    }));

    const PLN = [
      { bx:.635, by:.20, r:44, os:.00020, orR:8,
        c1:"#6d28d9", c2:"#1e0660",
        hl:[["rgba(124,58,237,.62)",0],["rgba(109,40,217,.26)",.38],["transparent",1]],
        ring:true, rc:"rgba(196,181,253,.72)", rc2:"rgba(221,214,254,.25)" },
      { bx:.800, by:.11, r:26, os:.00034, orR:5,
        c1:"#0284c7", c2:"#082f4e",
        hl:[["rgba(14,165,233,.58)",0],["rgba(14,165,233,.22)",.38],["transparent",1]],
        ring:true, rc:"rgba(56,190,250,.68)", rc2:"rgba(125,215,255,.24)" },
    ];

    const mkS = () => ({ x:rn(-120,W*.5), y:rn(0,H*.35), vx:rn(5,9), vy:rn(1.2,2.8), len:rn(80,160), a:1 });
    const shots = [mkS(), mkS(), mkS()];

    const draw = () => {
      t += .01;
      ctx.clearRect(0,0,W,H);

      const bg = ctx.createLinearGradient(0,0,W,H);
      bg.addColorStop(0,   "#0c0820");
      bg.addColorStop(.28, "#080518");
      bg.addColorStop(.55, "#060315");
      bg.addColorStop(.80, "#0a0620");
      bg.addColorStop(1,   "#050210");
      ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

      const tl = ctx.createRadialGradient(W*.15,H*.45,0,W*.15,H*.45,W*.70);
      tl.addColorStop(0,"rgba(72,15,140,.55)"); tl.addColorStop(.4,"rgba(55,10,110,.28)"); tl.addColorStop(1,"transparent");
      ctx.fillStyle=tl; ctx.fillRect(0,0,W,H);

      const tr = ctx.createRadialGradient(W*.85,H*.15,0,W*.85,H*.15,W*.65);
      tr.addColorStop(0,"rgba(60,8,115,.68)"); tr.addColorStop(.45,"rgba(42,5,90,.35)"); tr.addColorStop(1,"transparent");
      ctx.fillStyle=tr; ctx.fillRect(0,0,W,H);

      stars.forEach(s=>{
        s.a+=s.da; if(s.a>1||s.a<.04)s.da=-s.da;
        ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,PI2);
        ctx.fillStyle=`rgba(255,255,255,${s.a.toFixed(2)})`; ctx.fill();
      });

      nodes.forEach(n=>{n.x+=n.vx;n.y+=n.vy;if(n.x<0||n.x>W)n.vx=-n.vx;if(n.y<H*.42||n.y>H)n.vy=-n.vy;});
      ctx.lineWidth=.9;
      for(let i=0;i<NN;i++) for(let j=i+1;j<NN;j++){
        const dx=nodes[i].x-nodes[j].x,dy=nodes[i].y-nodes[j].y,d=Math.sqrt(dx*dx+dy*dy);
        if(d<172){
          ctx.beginPath();ctx.moveTo(nodes[i].x,nodes[i].y);ctx.lineTo(nodes[j].x,nodes[j].y);
          ctx.strokeStyle=`rgba(0,210,195,${((1-d/172)*.50).toFixed(3)})`;ctx.stroke();
        }
      }

      nodes.forEach(n=>{
        const ng=ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,18);
        ng.addColorStop(0,"rgba(255,210,70,.56)");
        ng.addColorStop(.38,"rgba(255,175,40,.22)");
        ng.addColorStop(1,"transparent");
        ctx.fillStyle=ng; ctx.beginPath(); ctx.arc(n.x,n.y,18,0,PI2); ctx.fill();
        ctx.beginPath(); ctx.arc(n.x,n.y,3.2,0,PI2);
        ctx.fillStyle="rgba(255,215,90,.95)"; ctx.fill();
      });

      PLN.forEach(p=>{
        const px=p.bx*W+Math.cos(t*p.os*400)*p.orR;
        const py=p.by*H+Math.sin(t*p.os*400)*p.orR*.5;
        const pr=p.r*(1+Math.sin(t*p.os*600)*.018);
        const hg=ctx.createRadialGradient(px,py,0,px,py,pr*4.4);
        p.hl.forEach(([c,s])=>hg.addColorStop(s,c));
        ctx.fillStyle=hg;ctx.beginPath();ctx.arc(px,py,pr*4.4,0,PI2);ctx.fill();
      });

      raf=requestAnimationFrame(draw);
    };
    draw();
    const onR=()=>{W=cv.width=window.innerWidth;H=cv.height=window.innerHeight;};
    window.addEventListener("resize",onR);
    return()=>{cancelAnimationFrame(raf);window.removeEventListener("resize",onR);};
  },[]);
  return <canvas ref={ref} style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none"}}/>;
}

function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(()=>setNow(new Date()),1000); return ()=>clearInterval(t); }, []);
  const tm = now.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
  const dt = now.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
  return (
    <div style={{textAlign:"center",userSelect:"none"}}>
      <div style={{fontSize:17,fontWeight:700,color:"#e2e8f0",fontVariantNumeric:"tabular-nums",letterSpacing:.5}}>{tm}</div>
      <div style={{fontSize:11,color:"#94a3b8",marginTop:2,letterSpacing:.4}}>{dt}</div>
    </div>
  );
}

function Toast({ type, msg, onClose }) {
  const c = {success:"#10b981",error:"#ef4444",info:"#6366f1"}[type]||"#6366f1";
  return (
    <motion.div initial={{opacity:0,y:38}} animate={{opacity:1,y:0}} exit={{opacity:0,y:20}}
      onClick={onClose} style={{
        position:"fixed",bottom:28,left:"50%",transform:"translateX(-50%)",
        background:c+"f2",backdropFilter:"blur(14px)",color:"#fff",
        borderRadius:12,padding:"12px 28px",fontSize:14,fontWeight:600,
        zIndex:9999,cursor:"pointer",boxShadow:`0 4px 30px ${c}70`,whiteSpace:"nowrap",
      }}>
      {{success:"✅",error:"❌",info:"ℹ️"}[type]} {msg}
    </motion.div>
  );
}

export default function SelectRole() {
  const navigate = useNavigate();
  const { signIn } = useApp();
  const [selectedRole, setSelectedRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [tempUser, setTempUser] = useState(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("tempAuth");
    if (!raw) {
      navigate("/login");
      return;
    }
    setTempUser(JSON.parse(raw));
  }, [navigate]);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const handleVerify = async () => {
    if (!selectedRole) {
      showToast("error", "Please select a role first");
      return;
    }
    setLoading(true);
    try {
      const res = await API.post("/users/verify-role", { role: selectedRole });
      
      signIn({
        username: tempUser.username,
        role: selectedRole,
        displayName: tempUser.displayName || tempUser.display_name || tempUser.username,
        email: tempUser.email,
        phone: tempUser.phone || "",
        token: tempUser.token,
        refresh_token: tempUser.refresh_token,
      });

      showToast("success", `Role ${selectedRole} verified! Redirecting...`);
      sessionStorage.removeItem("tempAuth");

      setTimeout(() => {
        if (selectedRole === "Admin") navigate("/dashboard/admin");
        else if (selectedRole === "Manager") navigate("/dashboard/manager");
        else navigate("/dashboard/engineer");
      }, 1000);

    } catch (err) {
      const backendMsg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.message ||
        "Role verification failed.";
      showToast("error", backendMsg);
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      sessionStorage.removeItem("tempAuth");
      setTimeout(() => navigate("/login"), 2500);
    } finally {
      setLoading(false);
    }
  };

  if (!tempUser) return null;

  return (
    <div style={{
      minHeight:"100vh", display:"flex", flexDirection:"column",
      fontFamily:"'Inter','Segoe UI',system-ui,sans-serif",
      overflow:"hidden", position:"relative", background:"#020610",
    }}>
      <SpaceCanvas />

      <motion.header
        initial={{opacity:0,y:-22}} animate={{opacity:1,y:0}} transition={{duration:.5}}
        style={{
          position:"relative",zIndex:10,
          display:"flex",alignItems:"center",padding:"12px 36px",
          background:"rgba(2,4,14,.82)",
          borderBottom:"1px solid rgba(0,210,220,.15)",
          backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",
        }}
      >
        <div style={{display:"flex",alignItems:"center",gap:11,flexShrink:0}}>
          <div style={{width:38,height:38,borderRadius:10,
            background:"linear-gradient(135deg,#1d4ed8,#7c3aed)",
            display:"flex",alignItems:"center",justifyContent:"center",
            boxShadow:"0 0 22px rgba(99,102,241,.70)"}}>
            <svg viewBox="0 0 20 20" width="18" height="18" fill="white">
              <rect x="2"  y="2"  width="7" height="7" rx="1.5"/>
              <rect x="11" y="2"  width="7" height="7" rx="1.5"/>
              <rect x="2"  y="11" width="7" height="7" rx="1.5"/>
              <rect x="11" y="11" width="7" height="7" rx="1.5"/>
            </svg>
          </div>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:"#e2e8f0"}}>TRF Portal</div>
            <div style={{fontSize:10,fontWeight:600,color:"#22d3ee",letterSpacing:1.4,textTransform:"uppercase"}}>
              ● Role Selection
            </div>
          </div>
        </div>
        <div style={{position:"absolute",left:"50%",transform:"translateX(-50%)"}}>
          <LiveClock />
        </div>
        <div style={{flex:1}}/>
      </motion.header>

      <div style={{flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", position:"relative", zIndex:5, padding:"40px 20px"}}>
        <motion.div
          initial={{opacity:0, y:20}} animate={{opacity:1, y:0}}
          style={{textAlign:"center", marginBottom:40}}
        >
          <h2 style={{fontSize:32, fontWeight:800, color:"#fff", margin:"0 0 10px"}}>Select Your Portal Role</h2>
          <p style={{color:"#94a3b8", fontSize:15}}>Please choose a role to complete authentication.</p>
        </motion.div>

        <div style={{display:"flex", gap:30, flexWrap:"wrap", justifyContent:"center", width:"100%", maxWidth:1000, marginBottom:40}}>
          {ROLES.map((role, idx) => {
            const selected = selectedRole === role.key;
            const Icon = role.Icon;
            return (
              <motion.div
                key={role.key}
                onClick={() => setSelectedRole(role.key)}
                whileHover={{scale:1.03, y:-5}}
                style={{
                  cursor:"pointer", position:"relative", width:260, height:150,
                  transformStyle:"preserve-3d", perspective:"900px"
                }}
              >
                {/* BACK PLATE */}
                <div style={{
                  position:"absolute", inset:0, borderRadius:18,
                  transform:"translate(6px, 9px)", background: role.backBg,
                  border:`1px solid ${role.border.replace(".62",".25")}`,
                  filter:"blur(0.5px) brightness(0.55)", zIndex:0
                }}/>

                {/* FRONT CARD */}
                <div style={{
                  position:"relative", zIndex:2, borderRadius:18, height:"100%",
                  background: selected ? role.cardBg.replace(".80",".95").replace(".78",".95") : role.cardBg,
                  border:`1.5px solid ${selected ? "#fff" : role.border}`,
                  backdropFilter:"blur(22px)",
                  boxShadow: selected
                    ? `0 0 55px ${role.glow}, 0 0 110px ${role.glow.replace(".88",".25")}, inset 0 1px 0 rgba(255,255,255,.26)`
                    : `0 8px 32px rgba(0,0,0,.48), inset 0 1px 0 rgba(255,255,255,.09)`,
                  transition:"box-shadow .28s, border .28s",
                  display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:15
                }}>
                  <div style={{
                    width:56, height:56, borderRadius:14,
                    background: selected ? `radial-gradient(circle at 32% 28%, ${role.glow.replace(".88",".60")}, ${role.glow.replace(".88",".10")})` : "rgba(255,255,255,.08)",
                    border:`1.5px solid ${role.border}`, display:"flex", alignItems:"center", justifyContent:"center",
                    boxShadow: selected ? `0 0 24px ${role.glow}` : "none"
                  }}>
                    <Icon />
                  </div>
                  <span style={{fontSize:18, fontWeight:700, color:"#fff", textShadow: selected ? "0 0 15px rgba(255,255,255,0.6)" : "none"}}>
                    {role.label}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.button
          onClick={handleVerify} disabled={loading || !selectedRole}
          whileHover={{scale: loading || !selectedRole ? 1 : 1.03}}
          whileTap={{scale: loading || !selectedRole ? 1 : 0.97}}
          style={{
            width:220, padding:"14px 0", borderRadius:12, border:"none",
            cursor: loading || !selectedRole ? "not-allowed" : "pointer",
            background: loading || !selectedRole ? "rgba(109,40,217,.3)" : "linear-gradient(135deg,#6d28d9 0%,#7c3aed 100%)",
            color:"#fff", fontSize:16, fontWeight:700, letterSpacing:.5,
            boxShadow: loading || !selectedRole ? "none" : "0 6px 32px rgba(109,40,217,.5)"
          }}
        >
          {loading ? "Verifying..." : "Confirm Role →"}
        </motion.button>
      </div>

      <AnimatePresence>
        {toast && <Toast key="t" type={toast.type} msg={toast.msg} onClose={()=>setToast(null)}/>}
      </AnimatePresence>
    </div>
  );
}
