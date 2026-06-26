import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import Chip from "@mui/material/Chip";
import { useTheme } from "@mui/material/styles";

import { useAnimatedCounter } from "../hooks/useAnimatedCounter";
import TrendingUpRoundedIcon   from "@mui/icons-material/TrendingUpRounded";
import TrendingDownRoundedIcon from "@mui/icons-material/TrendingDownRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

/**
 * Premium StatCard — enterprise KPI card with:
 * ── Animated counter (viewport-triggered, ease-out-quart)
 * ── Hover: lift + glow shadow + gradient border brightens
 * ── Floating icon animation
 * ── Click ripple + navigation
 * ── Mouse parallax on orb
 * ── Animated gradient bottom accent
 *
 * Props:
 *   title       — label
 *   value       — number → counter-animates   |   string → shown as-is
 *   subtitle    — caption below title
 *   icon        — MUI icon JSX
 *   gradient    — CSS gradient for icon bg
 *   glowColor   — hex color for glow/ripple
 *   delay       — entrance stagger (seconds)
 *   prefix/suffix
 *   tooltip
 *   trend       — { value: number }  (+8 → "+8%", -3 → "-3%")
 *   navigateTo  — route string — card becomes clickable
 */
export default function StatCard({
  title, value, subtitle, icon, gradient, delay = 0, glowColor,
  prefix = "", suffix = "", tooltip = "", trend, navigateTo,
}) {
  const theme   = useTheme();
  const isDark  = theme.palette.mode === "dark";
  const navigate = useNavigate();
  const rippleRef = useRef(null);
  const [hovered, setHovered] = useState(false);

  const isNumeric = typeof value === "number";
  const { value: animated, ref: viewportRef } = useAnimatedCounter(
    isNumeric ? value : 0,
    1400,
    isNumeric
  );
  // Always show real value once animation completes or if non-numeric
  const display = isNumeric
    ? `${prefix}${animated.toLocaleString()}${suffix}`
    : (value ?? "—");

  const trendPositive = trend && trend.value >= 0;
  const isClickable   = !!navigateTo;

  // ── Ripple ───────────────────────────────────────────────────────────────
  const spawnRipple = (e) => {
    if (!rippleRef.current) return;
    const rect = rippleRef.current.getBoundingClientRect();
    const span = document.createElement("span");
    const size = Math.max(rect.width, rect.height) * 2.2;
    span.style.cssText = `
      position:absolute; border-radius:50%; pointer-events:none;
      width:${size}px; height:${size}px;
      left:${e.clientX - rect.left - size / 2}px;
      top:${e.clientY - rect.top - size / 2}px;
      background:${glowColor || "#6366f1"}2a;
      animation:ripple 0.65s linear forwards;
    `;
    rippleRef.current.appendChild(span);
    setTimeout(() => span.remove(), 700);
  };

  const handleClick = (e) => {
    spawnRipple(e);
    if (navigateTo) navigate(navigateTo);
  };

  // ── Parallax mouse tracking ───────────────────────────────────────────────
  const [orbStyle, setOrbStyle] = useState({});
  const handleMouseMove = (e) => {
    if (!rippleRef.current) return;
    const rect = rippleRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 18;
    const y = ((e.clientY - rect.top)  / rect.height - 0.5) * 18;
    setOrbStyle({ transform: `translate(${x}px,${y}px)` });
  };
  const resetOrb = () => setOrbStyle({});

  const card = (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.92 }}
      animate={{ opacity: 1, y: 0,  scale: 1   }}
      transition={{ delay, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -7, scale: 1.025, transition: { duration: 0.22, ease: "easeOut" } }}
      whileTap={isClickable ? { scale: 0.97 } : {}}
      style={{ height: "100%", cursor: isClickable ? "pointer" : "default" }}
      onClick={isClickable ? handleClick : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); resetOrb(); }}
      onMouseMove={handleMouseMove}
    >
      <Box
        ref={(el) => {
          rippleRef.current = el;
          viewportRef.current = el;
        }}
        sx={{
          p: 3, borderRadius: "18px", height: "100%",
          position: "relative", overflow: "hidden",
          background: isDark ? "rgba(15,23,42,0.72)" : "rgba(255,255,255,0.92)",
          backdropFilter: "blur(24px)",
          border: `1px solid ${hovered && glowColor
            ? `${glowColor}45`
            : isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.22)"}`,
          transition: "box-shadow 0.3s ease, border-color 0.3s ease",
          boxShadow: hovered && glowColor
            ? `0 24px 52px ${glowColor}28, 0 6px 16px ${glowColor}14`
            : "none",
        }}
      >
        {/* ── Parallax orb ── */}
        <Box
          sx={{
            position: "absolute", top: -36, right: -36,
            width: 140, height: 140, borderRadius: "50%",
            background: gradient, opacity: isDark ? 0.13 : 0.09,
            filter: "blur(24px)", pointerEvents: "none",
            transition: "transform 0.12s ease-out, opacity 0.3s",
            opacity: hovered ? (isDark ? 0.22 : 0.16) : (isDark ? 0.13 : 0.09),
            ...orbStyle,
          }}
        />

        {/* ── Top row: floating icon + trend badge ── */}
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 2.5 }}>
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: delay * 2 }}
          >
            <Box sx={{
              width: 48, height: 48, borderRadius: "14px",
              background: gradient,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: glowColor
                ? `0 8px 24px ${glowColor}40`
                : "0 8px 20px rgba(0,0,0,0.18)",
              "& svg": { fontSize: 23, color: "#fff" },
              transition: "transform 0.2s, box-shadow 0.2s",
              transform: hovered ? "scale(1.08)" : "scale(1)",
            }}>
              {icon}
            </Box>
          </motion.div>

          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.75 }}>
            {trend && (
              <Chip
                icon={
                  trendPositive
                    ? <TrendingUpRoundedIcon   sx={{ fontSize: "13px !important" }} />
                    : <TrendingDownRoundedIcon sx={{ fontSize: "13px !important" }} />
                }
                label={`${trendPositive ? "+" : ""}${trend.value}%`}
                size="small"
                sx={{
                  height: 22, fontSize: "0.68rem", fontWeight: 700,
                  background: trendPositive ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                  color:      trendPositive ? "#10b981" : "#ef4444",
                  border: `1px solid ${trendPositive ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                  "& .MuiChip-icon": { color: "inherit" },
                }}
              />
            )}
            {isClickable && hovered && (
              <motion.div
                initial={{ opacity: 0, x: 4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.18 }}
              >
                <Box sx={{
                  width: 22, height: 22, borderRadius: "6px",
                  background: glowColor ? `${glowColor}18` : "rgba(99,102,241,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <ArrowForwardRoundedIcon sx={{ fontSize: 13, color: glowColor || "#6366f1" }} />
                </Box>
              </motion.div>
            )}
          </Box>
        </Box>

        {/* ── Animated value ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={String(display)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
          >
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                fontSize: "clamp(1.5rem,2.5vw,2rem)",
                color: theme.palette.text.primary,
                lineHeight: 1, mb: 0.5,
                fontVariantNumeric: "tabular-nums",
                fontFamily: "'Outfit', 'Inter', sans-serif",
                letterSpacing: "-0.02em",
              }}
            >
              {display}
            </Typography>
          </motion.div>
        </AnimatePresence>

        {/* ── Title ── */}
        <Typography variant="body2" sx={{
          color: theme.palette.text.secondary,
          fontWeight: 600, fontSize: "0.82rem",
          mb: 0.3, letterSpacing: "0.01em",
        }}>
          {title}
        </Typography>

        {/* ── Subtitle ── */}
        {subtitle && (
          <Typography variant="caption" sx={{
            color: theme.palette.text.disabled,
            fontWeight: 500, fontSize: "0.7rem",
          }}>
            {subtitle}
          </Typography>
        )}

        {/* ── Click hint ── */}
        {isClickable && hovered && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18 }}>
            <Typography variant="caption" sx={{
              display: "block", mt: 0.5,
              color: glowColor || "#6366f1",
              fontSize: "0.68rem", fontWeight: 600,
            }}>
              Click to view →
            </Typography>
          </motion.div>
        )}

        {/* ── Bottom accent line ── */}
        <Box sx={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "2.5px",
          background: gradient,
          borderRadius: "0 0 18px 18px",
          opacity: hovered ? 0.75 : 0.3,
          transition: "opacity 0.3s",
        }} />
      </Box>
    </motion.div>
  );

  return tooltip
    ? <Tooltip title={tooltip} placement="top" arrow>{card}</Tooltip>
    : card;
}
