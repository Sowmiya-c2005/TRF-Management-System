/**
 * Login.jsx — Exact pixel match to reference screenshot
 * Every colour, size, shadow, and layout matched to the image.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { login } from "../services/userService";
import { useApp } from "../context/AppContext";

/* ─────────────────────────────────────────────────────────────────
   SVG ICONS — animated, exact reference style
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

const ViewerIcon = () => (
  <motion.svg width="38" height="38" viewBox="0 0 24 24" fill="none"
    stroke="#6ee7b7" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
    style={{ filter:"drop-shadow(0 0 8px rgba(110,231,183,0.80))" }}>
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/>
    <motion.circle cx="12" cy="12" animate={{ r:[3,4.5,3] }}
      transition={{ duration:2, repeat:Infinity, ease:"easeInOut" }}/>
  </motion.svg>
);

/* ─────────────────────────────────────────────────────────────────
   ROLES — exact reference colours
   Admin:    dark purple glass
   Engineer: teal-blue glass
   Manager:  gold-brown glass
───────────────────────────────────────────────────────────────── */
const ROLES = [
  {
    key:"Admin",    label:"Administrator", username:"admin",    password:"Admin@123",
    cardBg:  "linear-gradient(135deg, rgba(58,22,148,0.80) 0%, rgba(38,12,90,0.68) 100%)",
    backBg:  "linear-gradient(135deg, rgba(45,16,110,0.70) 0%, rgba(28,8,72,0.58) 100%)",
    border:  "rgba(180,155,255,0.62)",
    glow:    "rgba(139,92,246,0.88)",
    accent:  "#c4b5fd",
    Icon: AdminIcon,
  },
  {
    key:"Engineer", label:"Engineer",       username:"engineer", password:"Engineer@123",
    cardBg:  "linear-gradient(135deg, rgba(8,108,155,0.80) 0%, rgba(0,68,108,0.68) 100%)",
    backBg:  "linear-gradient(135deg, rgba(0,82,122,0.70)  0%, rgba(0,50,88,0.58)  100%)",
    border:  "rgba(56,210,245,0.65)",
    glow:    "rgba(6,182,212,0.88)",
    accent:  "#67e8f9",
    Icon: EngineerIcon,
  },
  {
    key:"Manager",  label:"Manager",        username:"manager",  password:"Manager@123",
    cardBg:  "linear-gradient(135deg, rgba(120,72,8,0.78)  0%, rgba(78,42,0,0.65)  100%)",
    backBg:  "linear-gradient(135deg, rgba(95,55,4,0.68)   0%, rgba(62,32,0,0.55)  100%)",
    border:  "rgba(252,196,42,0.62)",
    glow:    "rgba(245,158,11,0.88)",
    accent:  "#fcd34d",
    Icon: ManagerIcon,
  },
];

/* ─────────────────────────────────────────────────────────────────
   SPACE CANVAS — exact reference background
   1. Very dark navy base
   2. Bright teal arc (bottom-left → top-right)
   3. Purple glows right + upper-left
   4. Nebula drifts
   5. 280 twinkling stars
   6. Constellation network (lower 55%) with bright teal nodes
   7. 4 planets with rings + halos
   8. Shooting stars
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
      { bx:.720, by:.046, r:14, os:.00055, orR:3,
        c1:"#c45208", c2:"#7c360e",
        hl:[["rgba(249,115,22,.52)",0],["rgba(249,115,22,.15)",.38],["transparent",1]],
        ring:false },
    ];

    const mkS = () => ({ x:rn(-120,W*.5), y:rn(0,H*.35), vx:rn(5,9), vy:rn(1.2,2.8), len:rn(80,160), a:1 });
    const shots = [mkS(), mkS(), mkS()];

    const draw = () => {
      t += .01;
      ctx.clearRect(0,0,W,H);

      /* base — rich warm purple-navy (exact reference) */
      const bg = ctx.createLinearGradient(0,0,W,H);
      bg.addColorStop(0,   "#0c0820");
      bg.addColorStop(.28, "#080518");
      bg.addColorStop(.55, "#060315");
      bg.addColorStop(.80, "#0a0620");
      bg.addColorStop(1,   "#050210");
      ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

      /* warm purple left half */
      const tl = ctx.createRadialGradient(W*.15,H*.45,0,W*.15,H*.45,W*.70);
      tl.addColorStop(0,"rgba(72,15,140,.55)"); tl.addColorStop(.4,"rgba(55,10,110,.28)"); tl.addColorStop(1,"transparent");
      ctx.fillStyle=tl; ctx.fillRect(0,0,W,H);

      /* deep violet top-right */
      const tr = ctx.createRadialGradient(W*.85,H*.15,0,W*.85,H*.15,W*.65);
      tr.addColorStop(0,"rgba(60,8,115,.68)"); tr.addColorStop(.45,"rgba(42,5,90,.35)"); tr.addColorStop(1,"transparent");
      ctx.fillStyle=tr; ctx.fillRect(0,0,W,H);

      /* center darker for UI readability */
      const mc = ctx.createRadialGradient(W*.42,H*.52,0,W*.42,H*.52,W*.38);
      mc.addColorStop(0,"rgba(0,0,0,.30)"); mc.addColorStop(1,"transparent");
      ctx.fillStyle=mc; ctx.fillRect(0,0,W,H);

      /* nebula — warm purple + teal blends */
      [[W*.20,H*.35,W*.45,H*.44,"rgba(80,20,160,.30)"],[W*.72,H*.25,W*.36,H*.38,"rgba(0,140,200,.22)"],
       [W*.50,H*.68,W*.40,H*.36,"rgba(160,100,15,.16)"],[W*.88,H*.50,W*.28,H*.32,"rgba(90,20,200,.22)"],
       [W*.08,H*.72,W*.32,H*.30,"rgba(0,180,200,.20)"]].forEach(([cx,cy,rx,ry,c],i)=>{
        const ox=Math.sin(t*.06+i)*22, oy=Math.cos(t*.05+i)*16;
        ctx.save(); ctx.translate(cx+ox,cy+oy);
        const g=ctx.createRadialGradient(0,0,0,0,0,Math.max(rx,ry));
        g.addColorStop(0,c); g.addColorStop(.45,c.replace(/[\d.]+\)$/,"0.04)")); g.addColorStop(1,"transparent");
        ctx.scale(rx/Math.max(rx,ry),ry/Math.max(rx,ry));
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(0,0,Math.max(rx,ry),0,PI2); ctx.fill(); ctx.restore();
      });

      /* teal arc — 4 bright layers */
      const sw1=ctx.createLinearGradient(0,H,W*.78,H*.02);
      sw1.addColorStop(0,  "rgba(0,235,220,.78)");
      sw1.addColorStop(.10,"rgba(0,218,215,.60)");
      sw1.addColorStop(.26,"rgba(0,198,208,.34)");
      sw1.addColorStop(.48,"rgba(0,165,198,.16)");
      sw1.addColorStop(.68,"rgba(0,130,185,.06)");
      sw1.addColorStop(1,  "transparent");
      ctx.fillStyle=sw1; ctx.fillRect(0,0,W,H);

      const sw2=ctx.createLinearGradient(0,H*.74,W*.60,0);
      sw2.addColorStop(0,  "rgba(0,220,222,.56)");
      sw2.addColorStop(.22,"rgba(0,195,215,.28)");
      sw2.addColorStop(.52,"rgba(0,158,200,.10)");
      sw2.addColorStop(1,  "transparent");
      ctx.fillStyle=sw2; ctx.fillRect(0,0,W,H);

      /* bright hotspot at bottom-left — arc origin */
      const pool=ctx.createRadialGradient(W*.04,H*.93,0,W*.04,H*.93,H*.52);
      pool.addColorStop(0,  "rgba(0,252,235,.75)");
      pool.addColorStop(.18,"rgba(0,228,222,.46)");
      pool.addColorStop(.42,"rgba(0,198,210,.20)");
      pool.addColorStop(1,  "transparent");
      ctx.fillStyle=pool; ctx.fillRect(0,0,W,H);

      /* arc mid glow */
      const arc3=ctx.createRadialGradient(W*.30,H*.58,0,W*.30,H*.58,W*.28);
      arc3.addColorStop(0,"rgba(0,215,220,.28)");
      arc3.addColorStop(.5,"rgba(0,180,208,.10)");
      arc3.addColorStop(1,"transparent");
      ctx.fillStyle=arc3; ctx.fillRect(0,0,W,H);

      /* stars — white + blue tint mix */
      stars.forEach(s=>{
        s.a+=s.da; if(s.a>1||s.a<.04)s.da=-s.da;
        ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,PI2);
        ctx.fillStyle=`rgba(255,255,255,${s.a.toFixed(2)})`; ctx.fill();
        if(s.r>1.6&&s.a>.75){
          ctx.strokeStyle=`rgba(255,255,255,${(s.a*.25).toFixed(2)})`; ctx.lineWidth=.4;
          ctx.beginPath(); ctx.moveTo(s.x-s.r*4,s.y); ctx.lineTo(s.x+s.r*4,s.y); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(s.x,s.y-s.r*4); ctx.lineTo(s.x,s.y+s.r*4); ctx.stroke();
        }
      });

      /* constellation — GOLDEN nodes + cyan-teal lines (exact reference) */
      nodes.forEach(n=>{n.x+=n.vx;n.y+=n.vy;if(n.x<0||n.x>W)n.vx=-n.vx;if(n.y<H*.42||n.y>H)n.vy=-n.vy;});

      /* lines — cyan connecting golden nodes */
      ctx.lineWidth=.9;
      for(let i=0;i<NN;i++) for(let j=i+1;j<NN;j++){
        const dx=nodes[i].x-nodes[j].x,dy=nodes[i].y-nodes[j].y,d=Math.sqrt(dx*dx+dy*dy);
        if(d<172){
          ctx.beginPath();ctx.moveTo(nodes[i].x,nodes[i].y);ctx.lineTo(nodes[j].x,nodes[j].y);
          ctx.strokeStyle=`rgba(0,210,195,${((1-d/172)*.50).toFixed(3)})`;ctx.stroke();
        }
      }

      /* GOLDEN glowing nodes — exact reference */
      nodes.forEach(n=>{
        /* large amber halo */
        const ng=ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,18);
        ng.addColorStop(0,"rgba(255,210,70,.56)");
        ng.addColorStop(.38,"rgba(255,175,40,.22)");
        ng.addColorStop(1,"transparent");
        ctx.fillStyle=ng; ctx.beginPath(); ctx.arc(n.x,n.y,18,0,PI2); ctx.fill();
        /* amber core */
        ctx.beginPath(); ctx.arc(n.x,n.y,3.2,0,PI2);
        ctx.fillStyle="rgba(255,215,90,.95)"; ctx.fill();
        /* white hot center */
        ctx.beginPath(); ctx.arc(n.x,n.y,1.4,0,PI2);
        ctx.fillStyle="rgba(255,255,255,1)"; ctx.fill();
      });

      /* planets */
      PLN.forEach(p=>{
        const px=p.bx*W+Math.cos(t*p.os*400)*p.orR;
        const py=p.by*H+Math.sin(t*p.os*400)*p.orR*.5;
        const pr=p.r*(1+Math.sin(t*p.os*600)*.018);
        const hg=ctx.createRadialGradient(px,py,0,px,py,pr*4.4);
        p.hl.forEach(([c,s])=>hg.addColorStop(s,c));
        ctx.fillStyle=hg;ctx.beginPath();ctx.arc(px,py,pr*4.4,0,PI2);ctx.fill();
        const atm=ctx.createRadialGradient(px,py,pr*.76,px,py,pr*1.88);
        atm.addColorStop(0,p.hl[0][0].replace(/[\d.]+\)$/,"0.38)"));atm.addColorStop(1,"transparent");
        ctx.fillStyle=atm;ctx.beginPath();ctx.arc(px,py,pr*1.88,0,PI2);ctx.fill();
        ctx.shadowColor=p.c1;ctx.shadowBlur=pr*.85;
        const pg=ctx.createRadialGradient(px-pr*.30,py-pr*.30,pr*.04,px,py,pr);
        pg.addColorStop(0,p.c1);pg.addColorStop(.55,p.c2);pg.addColorStop(1,p.c2+"99");
        ctx.beginPath();ctx.arc(px,py,pr,0,PI2);ctx.fillStyle=pg;ctx.fill();
        const hl=ctx.createRadialGradient(px-pr*.32,py-pr*.32,0,px-pr*.12,py-pr*.12,pr*.70);
        hl.addColorStop(0,"rgba(255,255,255,.26)");hl.addColorStop(1,"transparent");
        ctx.fillStyle=hl;ctx.beginPath();ctx.arc(px,py,pr,0,PI2);ctx.fill();ctx.shadowBlur=0;
        if(p.ring){ctx.save();ctx.translate(px,py);ctx.scale(1,.26);
          ctx.beginPath();ctx.arc(0,0,pr*2.06,0,PI2);ctx.strokeStyle=p.rc;ctx.lineWidth=4.5;ctx.stroke();
          ctx.beginPath();ctx.arc(0,0,pr*2.62,0,PI2);ctx.strokeStyle=p.rc2;ctx.lineWidth=2;ctx.stroke();
          ctx.restore();}
      });

      /* shooting stars */
      shots.forEach((s,i)=>{
        s.x+=s.vx;s.y+=s.vy;s.a-=.013;
        if(s.a<=0||s.x>W+200){shots[i]=mkS();return;}
        const g=ctx.createLinearGradient(s.x,s.y,s.x-s.len,s.y-s.len*.33);
        g.addColorStop(0,`rgba(255,255,255,${s.a.toFixed(2)})`);g.addColorStop(1,"transparent");
        ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(s.x-s.len,s.y-s.len*.33);
        ctx.strokeStyle=g;ctx.lineWidth=1.8;ctx.stroke();
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

/* ─────────────────────────────────────────────────────────────────
   LIVE CLOCK
───────────────────────────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────────────────────────
   ROLE CARD
   Reference shows:
   - Wide horizontal pill-rectangle
   - 3D depth: a back shadow plate offset down-right
   - Icon left (in a rounded box) + label right
   - Frosted glass body with role-specific tint
   - On hover: lift + glow
   - On select: full glow + shimmer
───────────────────────────────────────────────────────────────── */
function RoleCard({ role, selected, onSelect, idx }) {
  const [hov, setHov] = useState(false);
  const Icon = role.Icon;

  return (
    <motion.div
      onClick={() => onSelect(role)}
      onHoverStart={() => setHov(true)}
      onHoverEnd={() => setHov(false)}
      initial={{ opacity:0, y:50, rotateX:22 }}
      animate={{
        opacity: 1,
        y:       selected ? -14 : hov ? -8 : 0,
        rotateX: selected ?  0  : hov ?  4 : 10,
        scale:   selected ? 1.06 : hov ? 1.03 : 1,
      }}
      transition={{ type:"spring", stiffness:240, damping:20, delay: idx*.09 }}
      style={{ cursor:"pointer", position:"relative", transformStyle:"preserve-3d", perspective:"900px" }}
    >
      {/* ── BACK PLATE — 3D depth shadow ── */}
      <div style={{
        position:"absolute", inset:0,
        borderRadius:18,
        transform:"translate(6px, 9px)",
        background: role.backBg,
        border:`1px solid ${role.border.replace(".55",".25")}`,
        filter:"blur(0.5px) brightness(0.55)",
        zIndex:0,
      }}/>

      {/* ── MID PLATE ── */}
      <div style={{
        position:"absolute", inset:0,
        borderRadius:18,
        transform:"translate(3px, 4.5px)",
        background: role.cardBg.replace(".75",".60").replace(".60",".48"),
        border:`1px solid ${role.border.replace(".55",".35")}`,
        zIndex:1,
      }}/>

      {/* ── FRONT CARD — main face ── */}
      <div style={{
        position:"relative", zIndex:2,
        borderRadius:18,
        overflow:"hidden",
        background: selected
          ? role.cardBg.replace(".75",".92").replace(".60",".80")
          : role.cardBg,
        border:`1.5px solid ${selected ? role.border.replace(".55",".90") : role.border}`,
        backdropFilter:"blur(22px)",
        WebkitBackdropFilter:"blur(22px)",
        boxShadow: selected
          ? `0 0 55px ${role.glow}, 0 0 110px ${role.glow.replace(".80",".25")}, inset 0 1px 0 rgba(255,255,255,.26)`
          : hov
          ? `0 0 28px ${role.glow.replace(".80",".45")}, 0 16px 45px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.14)`
          : `0 8px 32px rgba(0,0,0,.48), inset 0 1px 0 rgba(255,255,255,.09)`,
        transition:"box-shadow .28s, border .28s",
      }}>
        {/* shimmer on selected */}
        {selected && (
          <motion.div
            animate={{ x:["-130%","240%"] }}
            transition={{ duration:2.2, repeat:Infinity, ease:"linear", repeatDelay:.8 }}
            style={{
              position:"absolute",inset:0,width:"28%",zIndex:5,pointerEvents:"none",
              background:`linear-gradient(90deg,transparent,${role.border.replace(".55",".45")},transparent)`,
            }}
          />
        )}

        {/* top glass sheen — exact reference */}
        <div style={{
          position:"absolute",top:0,left:0,right:0,height:42,
          background:"linear-gradient(180deg,rgba(255,255,255,.18),transparent)",
          borderRadius:"18px 18px 0 0",pointerEvents:"none",
        }}/>

        {/* content row */}
        <div style={{ display:"flex", alignItems:"center", gap:16, padding:"20px 22px" }}>
          {/* icon box */}
          <div style={{
            width:56, height:56, flexShrink:0,
            borderRadius:14,
            background: selected || hov
              ? `radial-gradient(circle at 32% 28%, ${role.glow.replace(".80",".60")}, ${role.glow.replace(".80",".10")})`
              : "rgba(255,255,255,.08)",
            border:`1.5px solid ${role.border}`,
            display:"flex",alignItems:"center",justifyContent:"center",
            boxShadow: selected || hov
              ? `0 0 24px ${role.glow}, inset 0 0 14px ${role.glow.replace(".80",".12")}`
              : `0 0 10px ${role.glow.replace(".80",".22")}`,
            transition:"box-shadow .28s",
          }}>
            <Icon />
          </div>

          {/* label */}
          <span style={{
            fontSize:20,fontWeight:700,color:"#ffffff",letterSpacing:.15,
            textShadow: selected
              ? `0 0 22px rgba(255,255,255,.55), 0 0 45px ${role.glow.replace(".80",".65")}`
              : hov ? `0 0 14px rgba(255,255,255,.28)` : "none",
            transition:"text-shadow .28s",
          }}>
            {role.label}
          </span>
        </div>

        {/* bottom glow line */}
        <div style={{
          position:"absolute",bottom:0,left:0,right:0,height:1.5,
          background:`linear-gradient(90deg,transparent,${role.border.replace(".55",".60")},transparent)`,
        }}/>
      </div>
    </motion.div>
  );
}

/* helpers */
function EyeToggle({ show }) {
  return show ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
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

const CSS = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  body{overflow:hidden;}
  .li::placeholder{color:rgba(148,163,184,.55);}
  .li:focus::placeholder{color:rgba(148,163,184,.22);}
`;

/* ─────────────────────────────────────────────────────────────────
   MAIN EXPORT
───────────────────────────────────────────────────────────────── */
export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useApp();
  const [sel,     setSel]    = useState(null);
  const [usr,     setUsr]    = useState("");
  const [pw,      setPw]     = useState("");
  const [showPw,  setShowPw] = useState(false);
  const [loading, setLoad]   = useState(false);
  const [toast,   setToast]  = useState(null);
  const [fU,      setFU]     = useState(false);
  const [fP,      setFP]     = useState(false);
  const [mouse,   setMouse]  = useState({x:0,y:0});

  const onMove = useCallback(e => setMouse({
    x:(e.clientX/window.innerWidth-.5)*2,
    y:(e.clientY/window.innerHeight-.5)*2,
  }),[]);

  const pick = r => { setSel(r.key); setUsr(r.username); setPw(r.password); };
  const toast$ = (type,msg) => { setToast({type,msg}); setTimeout(()=>setToast(null),3500); };

  const submit = async e => {
    e.preventDefault();
    if(!usr.trim()){toast$("error","Username is required");return;}
    if(!pw){toast$("error","Password is required");return;}
    setLoad(true);
    try {
      const res = await login(usr.trim(), pw);
      const d   = res?.data || {};
      const tok = d.access_token||d.token||d.access||"";
      if(!tok) throw new Error("No token received");
      signIn({username:d.username||usr.trim(), role:d.role||"Engineer",
              displayName:d.displayName||usr.trim(),
              email:d.email||`${usr.trim()}@trf.com`, token:tok});
      toast$("success",`Welcome, ${d.username||usr}!`);
      setTimeout(()=>navigate("/dashboard"),900);
    } catch(err) {
      toast$("error",err?.response?.data?.detail||err?.message||"Login failed");
    } finally { setLoad(false); }
  };

  const inp = f => ({
    width:"100%",
    background: f ? "rgba(255,255,255,.15)" : "rgba(255,255,255,.09)",
    border:`1.5px solid ${f?"rgba(232,121,249,.92)":"rgba(255,255,255,.22)"}`,
    borderRadius:10, padding:"12px 46px 12px 14px",
    color:"#f1f5f9", fontSize:14, outline:"none", fontFamily:"inherit",
    transition:"border .22s,background .22s,box-shadow .22s",
    boxShadow: f ? "0 0 0 3px rgba(232,121,249,.18),0 0 22px rgba(232,121,249,.28)" : "none",
  });

  return (
    <>
      <style>{CSS}</style>
      <div onMouseMove={onMove} style={{
        minHeight:"100vh", display:"flex", flexDirection:"column",
        fontFamily:"'Inter','Segoe UI',system-ui,sans-serif",
        overflow:"hidden", position:"relative", background:"#020610",
      }}>
        <SpaceCanvas />

        {/* ── HEADER ── */}
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
          {/* Logo */}
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
                ● Enterprise Live
              </div>
            </div>
          </div>
          {/* Clock centered */}
          <div style={{position:"absolute",left:"50%",transform:"translateX(-50%)"}}>
            <LiveClock />
          </div>
          <div style={{flex:1}}/>
        </motion.header>

        {/* ── BODY ── */}
        <div style={{flex:1,display:"flex",position:"relative",zIndex:5}}>

          {/* LEFT 60% */}
          <motion.div
            initial={{opacity:0,x:-50}} animate={{opacity:1,x:0}}
            transition={{duration:.70,ease:[.22,.61,.36,1]}}
            style={{
              flex:"0 0 60%",display:"flex",flexDirection:"column",justifyContent:"center",
              padding:"28px 42px 28px 56px",
              transform:`translate(${mouse.x*-5}px,${mouse.y*-3}px)`,
              transition:"transform .18s linear",
            }}
          >
            <motion.div initial={{opacity:0,y:26}} animate={{opacity:1,y:0}} transition={{delay:.18}}>
              <h1 style={{
                margin:"0 0 10px",
                fontSize:"clamp(28px,3.4vw,50px)",
                fontWeight:900,lineHeight:1.06,letterSpacing:-.5,
                background:"linear-gradient(112deg,#f7c515 0%,#ffe878 16%,#ffffff 44%,#c8e8ff 88%)",
                WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",
              }}>
                Welcome To The Automatic TRF Folder Creation & Document Management System!!
              </h1>
              <p style={{margin:"0 0 28px",color:"#94a3b8",fontSize:15,lineHeight:1.5}}>
                Access your complete enterprise intelligence, unified.
              </p>
            </motion.div>

            {/* 3-card grid — perspective container */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:20,maxWidth:660,perspective:"1000px"}}>
              {ROLES.map((r,i) => (
                <motion.div key={r.key} initial={{opacity:0,y:32}} animate={{opacity:1,y:0}} transition={{delay:.26+i*.09}}>
                  <RoleCard role={r} idx={i} selected={sel===r.key} onSelect={pick}/>
                </motion.div>
              ))}
            </div>

            <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1}}
              style={{marginTop:22,color:"#1e293b",fontSize:11,letterSpacing:.3}}>
              © 2026 TRF Management System · Enterprise Edition
            </motion.p>
          </motion.div>

          {/* RIGHT 40% — Sign In card */}
          <motion.div
            initial={{opacity:0,x:50}} animate={{opacity:1,x:0}}
            transition={{duration:.70,ease:[.22,.61,.36,1]}}
            style={{
              flex:"0 0 40%",display:"flex",alignItems:"center",justifyContent:"center",
              padding:"28px 28px",
              transform:`translate(${mouse.x*6}px,${mouse.y*4}px)`,
              transition:"transform .18s linear",
            }}
          >
            {/* floating glass card */}
            <motion.div
              animate={{y:[0,-11,0]}}
              transition={{duration:5.5,repeat:Infinity,ease:"easeInOut"}}
              style={{
                width:"100%",maxWidth:390,
                /* reference: notably bright white-lavender glass */
                background:"rgba(215,225,255,.16)",
                backdropFilter:"blur(52px)",WebkitBackdropFilter:"blur(52px)",
                borderRadius:22,
                border:"1.5px solid rgba(255,255,255,.35)",
                boxShadow:"0 28px 80px rgba(0,0,0,.72), 0 0 130px rgba(80,20,220,.24), inset 0 1px 0 rgba(255,255,255,.32)",
                padding:"36px 32px 28px",
                position:"relative",overflow:"hidden",
              }}
            >
              {/* glass top sheen */}
              <div style={{position:"absolute",top:0,left:0,right:0,height:55,
                background:"linear-gradient(180deg,rgba(255,255,255,.11),transparent)",
                borderRadius:"22px 22px 0 0",pointerEvents:"none"}}/>

              <h2 style={{margin:"0 0 5px",fontSize:28,fontWeight:700,color:"#f8fafc"}}>Sign In</h2>
              <p style={{margin:"0 0 22px",fontSize:13,color:"#94a3b8",lineHeight:1.5}}>
                {sel ? `Signing in as ${sel} · credentials auto-filled` : "Select a role card — enter credentials below"}
              </p>

              <form onSubmit={submit} autoComplete="off" style={{display:"flex",flexDirection:"column",gap:17}}>
                <div>
                  <label style={{display:"block",fontSize:12,fontWeight:600,color:"#94a3b8",letterSpacing:.9,marginBottom:7}}>
                    Username
                  </label>
                  <input className="li" value={usr} onChange={e=>setUsr(e.target.value)}
                    onFocus={()=>setFU(true)} onBlur={()=>setFU(false)}
                    placeholder="your.name" autoComplete="username" style={inp(fU)}/>
                </div>
                <div>
                  <label style={{display:"block",fontSize:12,fontWeight:600,color:"#94a3b8",letterSpacing:.9,marginBottom:7}}>
                    Password
                  </label>
                  <div style={{position:"relative"}}>
                    <input className="li" type={showPw?"text":"password"} value={pw}
                      onChange={e=>setPw(e.target.value)}
                      onFocus={()=>setFP(true)} onBlur={()=>setFP(false)}
                      placeholder="••••••••" autoComplete="current-password"
                      style={{...inp(fP),paddingRight:46}}/>
                    <button type="button" onClick={()=>setShowPw(v=>!v)} style={{
                      position:"absolute",right:13,top:"50%",transform:"translateY(-50%)",
                      background:"none",border:"none",cursor:"pointer",padding:0,display:"flex",alignItems:"center"}}>
                      <EyeToggle show={showPw}/>
                    </button>
                  </div>
                </div>

                <motion.button type="submit" disabled={loading}
                  whileHover={{scale:loading?1:1.024}} whileTap={{scale:loading?1:.975}}
                  style={{
                    marginTop:4,padding:"14px 0",borderRadius:12,border:"none",
                    cursor:loading?"not-allowed":"pointer",
                    background:loading
                      ?"rgba(109,40,217,.45)"
                      :"linear-gradient(135deg,#3b0a8a 0%,#6d28d9 42%,#7c3aed 70%,#a855f7 100%)",
                    color:"#fff",fontSize:16,fontWeight:700,letterSpacing:.5,
                    boxShadow:loading?"none":"0 6px 32px rgba(109,40,217,.65)",
                    transition:"box-shadow .3s",
                    display:"flex",alignItems:"center",justifyContent:"center",gap:10,
                  }}>
                  {loading ? (
                    <>
                      <motion.div animate={{rotate:360}} transition={{duration:.85,repeat:Infinity,ease:"linear"}}
                        style={{width:18,height:18,border:"2.5px solid rgba(255,255,255,.30)",borderTopColor:"#fff",borderRadius:"50%"}}/>
                      Authenticating…
                    </>
                  ) : "Sign In →"}
                </motion.button>

                <div style={{textAlign:"center"}}>
                  <button type="button" onClick={()=>toast$("info","Contact your administrator to reset password")}
                    style={{background:"none",border:"none",cursor:"pointer",color:"#a78bfa",fontSize:12,fontWeight:600,padding:0}}>
                    Forgot Password?
                  </button>
                </div>
              </form>

              <p style={{textAlign:"center",color:"#334155",fontSize:10.5,marginTop:22,marginBottom:0}}>
                TRF Management System – 2026 · Enterprise Edition. All rights reserved.
              </p>
            </motion.div>
          </motion.div>
        </div>

        {/* right edge pills */}
        <div style={{position:"fixed",right:0,top:"50%",transform:"translateY(-50%)",display:"flex",flexDirection:"column",gap:5,zIndex:20}}>
          {["Help","Forgot\nPassword","Sign In"].map(l=>(
            <div key={l} style={{background:"rgba(0,200,220,.08)",backdropFilter:"blur(12px)",
              border:"1px solid rgba(0,200,220,.20)",borderRadius:"8px 0 0 8px",padding:"9px 12px",
              textAlign:"center",cursor:"pointer",fontSize:10,color:"#22d3ee",fontWeight:600,
              whiteSpace:"pre-line",lineHeight:1.35,transition:"background .2s,color .2s"}}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(0,200,220,.18)";e.currentTarget.style.color="#e2e8f0";}}
              onMouseLeave={e=>{e.currentTarget.style.background="rgba(0,200,220,.08)";e.currentTarget.style.color="#22d3ee";}}>
              {l}
            </div>
          ))}
        </div>

        <AnimatePresence>
          {toast && <Toast key="t" type={toast.type} msg={toast.msg} onClose={()=>setToast(null)}/>}
        </AnimatePresence>
      </div>
    </>
  );
}
