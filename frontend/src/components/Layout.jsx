import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import { Toaster } from "react-hot-toast";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const pageVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0,  transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.18 } },
};

/* ─── Premium animated background canvas ─────────────────────────────────── */
function PremiumBg() {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext("2d");
    let W = cv.width = window.innerWidth;
    let H = cv.height = window.innerHeight;
    let raf, t = 0;
    const rn = (a,b) => Math.random()*(b-a)+a;
    const PI2 = Math.PI*2;

    /* floating particles */
    const PARTICLES = Array.from({length:55}, () => ({
      x:rn(0,W), y:rn(0,H),
      vx:rn(-0.18,0.18), vy:rn(-0.18,0.18),
      r:rn(1,3.5), a:rn(.1,.6),
      da:rn(.003,.007)*(Math.random()>.5?1:-1),
      color: Math.random()>.6 ? "#6366f1" : Math.random()>.5 ? "#06b6d4" : "#a855f7",
    }));

    /* constellation nodes */
    const NN = 32;
    const nodes = Array.from({length:NN}, () => ({
      x:rn(0,W), y:rn(0,H),
      vx:rn(-.25,.25), vy:rn(-.25,.25),
    }));

    const draw = () => {
      t += .008;
      ctx.clearRect(0,0,W,H);

      /* rich deep bg */
      const bg = ctx.createLinearGradient(0,0,W,H);
      bg.addColorStop(0,   "#060918");
      bg.addColorStop(.35, "#080520");
      bg.addColorStop(.65, "#060310");
      bg.addColorStop(1,   "#080618");
      ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

      /* indigo aurora top-left */
      const a1=ctx.createRadialGradient(0,0,0,0,0,W*.70);
      a1.addColorStop(0,"rgba(99,102,241,0.18)"); a1.addColorStop(.5,"rgba(99,102,241,0.06)"); a1.addColorStop(1,"transparent");
      ctx.fillStyle=a1; ctx.fillRect(0,0,W,H);

      /* cyan aurora bottom-right */
      const a2=ctx.createRadialGradient(W,H,0,W,H,W*.65);
      a2.addColorStop(0,"rgba(6,182,212,0.16)"); a2.addColorStop(.5,"rgba(6,182,212,0.05)"); a2.addColorStop(1,"transparent");
      ctx.fillStyle=a2; ctx.fillRect(0,0,W,H);

      /* purple mid */
      const a3=ctx.createRadialGradient(W*.45,H*.45,0,W*.45,H*.45,W*.40);
      a3.addColorStop(0,"rgba(168,85,247,0.10)"); a3.addColorStop(1,"transparent");
      ctx.fillStyle=a3; ctx.fillRect(0,0,W,H);

      /* animated aurora wave */
      ctx.beginPath();
      ctx.moveTo(0,H*.55);
      for(let x=0;x<=W;x+=8){
        const y=H*.55+Math.sin(x*.004+t*.5)*45+Math.sin(x*.008+t*.3)*22;
        ctx.lineTo(x,y);
      }
      ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.closePath();
      const wg=ctx.createLinearGradient(0,H*.4,0,H);
      wg.addColorStop(0,"rgba(99,102,241,0.08)"); wg.addColorStop(.5,"rgba(6,182,212,0.05)"); wg.addColorStop(1,"transparent");
      ctx.fillStyle=wg; ctx.fill();

      /* second wave */
      ctx.beginPath();
      ctx.moveTo(0,H*.70);
      for(let x=0;x<=W;x+=8){
        const y=H*.70+Math.sin(x*.005+t*.4+1)*30+Math.sin(x*.007+t*.25+2)*18;
        ctx.lineTo(x,y);
      }
      ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.closePath();
      const wg2=ctx.createLinearGradient(0,H*.6,0,H);
      wg2.addColorStop(0,"rgba(168,85,247,0.07)"); wg2.addColorStop(1,"transparent");
      ctx.fillStyle=wg2; ctx.fill();

      /* constellation lines */
      nodes.forEach(n=>{n.x+=n.vx;n.y+=n.vy;if(n.x<0||n.x>W)n.vx=-n.vx;if(n.y<0||n.y>H)n.vy=-n.vy;});
      ctx.lineWidth=.6;
      for(let i=0;i<NN;i++) for(let j=i+1;j<NN;j++){
        const dx=nodes[i].x-nodes[j].x, dy=nodes[i].y-nodes[j].y, d=Math.sqrt(dx*dx+dy*dy);
        if(d<185){
          ctx.beginPath(); ctx.moveTo(nodes[i].x,nodes[i].y); ctx.lineTo(nodes[j].x,nodes[j].y);
          ctx.strokeStyle=`rgba(99,102,241,${((1-d/185)*.25).toFixed(3)})`; ctx.stroke();
        }
      }
      nodes.forEach(n=>{
        const g=ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,6);
        g.addColorStop(0,"rgba(129,140,248,0.55)"); g.addColorStop(1,"transparent");
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(n.x,n.y,6,0,PI2); ctx.fill();
        ctx.beginPath(); ctx.arc(n.x,n.y,1.8,0,PI2); ctx.fillStyle="rgba(165,180,252,0.90)"; ctx.fill();
      });

      /* floating glow particles */
      PARTICLES.forEach(p=>{
        p.x+=p.vx; p.y+=p.vy; p.a+=p.da;
        if(p.a>.65||p.a<.08)p.da=-p.da;
        if(p.x<0)p.x=W; if(p.x>W)p.x=0;
        if(p.y<0)p.y=H; if(p.y>H)p.y=0;
        const pg=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*3);
        pg.addColorStop(0,p.color.replace(")"  ,`,${p.a.toFixed(2)})`).replace("#6366f1",`rgba(99,102,241`).replace("#06b6d4",`rgba(6,182,212`).replace("#a855f7",`rgba(168,85,247`));
        pg.addColorStop(1,"transparent");

        // simple glow dot
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r*3,0,PI2);
        const hex = p.color;
        const rgb = hex==="#6366f1"?"99,102,241":hex==="#06b6d4"?"6,182,212":"168,85,247";
        const gg=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*3);
        gg.addColorStop(0,`rgba(${rgb},${p.a.toFixed(2)})`); gg.addColorStop(1,"transparent");
        ctx.fillStyle=gg; ctx.fill();
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,PI2);
        ctx.fillStyle=`rgba(${rgb},${(p.a*1.5).toFixed(2)})`; ctx.fill();
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

export default function Layout({ children }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";
  const location = useLocation();

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", background: "#060918", position:"relative" }}>
      {/* Animated premium background — always dark space theme */}
      <PremiumBg />

      <Sidebar />

      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden", position:"relative", zIndex:1 }}>
        <Navbar />
        <Box sx={{ flex: 1, overflowY: "auto" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{ padding: "28px 32px", minHeight: "calc(100vh - 64px)" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </Box>
      </Box>

      {/* Global toast container */}
      <Toaster
        position="bottom-right"
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            background: isDark ? "#1e293b" : "#fff",
            color:      isDark ? "#f1f5f9" : "#0f172a",
            border: `1px solid ${isDark ? "rgba(148,163,184,0.12)" : "rgba(148,163,184,0.25)"}`,
            borderRadius: "12px",
            fontSize: "0.83rem",
            fontWeight: 500,
            boxShadow: isDark ? "0 8px 24px rgba(0,0,0,0.4)" : "0 8px 24px rgba(15,23,42,0.1)",
          },
          success: { iconTheme: { primary: "#10b981", secondary: "#fff" } },
          error:   { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
        }}
      />
    </Box>
  );
}
