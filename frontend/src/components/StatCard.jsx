import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import Chip from "@mui/material/Chip";
import { useTheme } from "@mui/material/styles";
import { useAnimatedCounter } from "../hooks/useAnimatedCounter";
import TrendingUpRoundedIcon   from "@mui/icons-material/TrendingUpRounded";
import TrendingDownRoundedIcon from "@mui/icons-material/TrendingDownRounded";

/**
 * Premium StatCard — enterprise KPI card
 *
 * Props:
 *   title       — label shown below value
 *   value       — number → animates   |   string → shown as-is
 *   subtitle    — small text beneath title (e.g. "Live from database")
 *   icon        — MUI icon element
 *   gradient    — CSS gradient string for icon bg
 *   glowColor   — hex used for hover glow
 *   delay       — framer-motion stagger delay (seconds)
 *   prefix/suffix — wraps animated number
 *   tooltip     — optional tooltip text
 *   trend       — { value: ±number, label: string }
 *   onClick     — click handler
 */
export default function StatCard({
  title, value, subtitle, icon, gradient, delay = 0, glowColor,
  prefix = "", suffix = "", tooltip = "", trend, onClick,
}) {
  const theme   = useTheme();
  const isDark  = theme.palette.mode === "dark";
  const rippleRef = useRef(null);

  const isNumeric = typeof value === "number";
  const animated  = useAnimatedCounter(isNumeric ? value : 0, 1500, isNumeric);
  const display   = isNumeric
    ? `${prefix}${animated.toLocaleString()}${suffix}`
    : (value ?? "—");

  const trendPositive = trend && trend.value >= 0;

  const handleClick = (e) => {
    if (!rippleRef.current) return;
    const rect = rippleRef.current.getBoundingClientRect();
    const ripple = document.createElement("span");
    const size = Math.max(rect.width, rect.height) * 2;
    ripple.style.cssText = `
      position:absolute; border-radius:50%; pointer-events:none;
      width:${size}px; height:${size}px;
      left:${e.clientX - rect.left - size / 2}px;
      top:${e.clientY - rect.top - size / 2}px;
      background:${glowColor || "#6366f1"}33;
      animation:ripple 0.7s linear forwards;
    `;
    rippleRef.current.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);
    onClick?.();
  };

  const card = (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.93 }}
      animate={{ opacity: 1, y: 0,  scale: 1 }}
      transition={{ delay, duration: 0.48, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.22, ease: "easeOut" } }}
      whileTap={{ scale: 0.98 }}
      style={{ height: "100%", cursor: onClick ? "pointer" : "default" }}
      onClick={handleClick}
    >
      <Box
        ref={rippleRef}
        sx={{
          p: 3, borderRadius: "18px", height: "100%",
          position: "relative", overflow: "hidden",
          background: isDark ? "rgba(15,23,42,0.72)" : "rgba(255,255,255,0.92)",
          backdropFilter: "blur(24px)",
          border: `1px solid ${isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.22)"}`,
          transition: "box-shadow 0.3s ease, border-color 0.3s ease",
          "&:hover": {
            boxShadow: glowColor
              ? `0 24px 48px ${glowColor}30, 0 6px 16px ${glowColor}18`
              : "0 24px 48px rgba(15,23,42,0.12)",
            borderColor: glowColor ? `${glowColor}50` : undefined,
          },
        }}
      >
        {/* Background gradient orb */}
        <Box sx={{
          position: "absolute", top: -30, right: -30,
          width: 130, height: 130, borderRadius: "50%",
          background: gradient, opacity: isDark ? 0.12 : 0.08,
          filter: "blur(22px)", pointerEvents: "none",
          transition: "opacity 0.3s ease",
        }} />

        {/* Top row: icon + trend badge */}
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 2.5 }}>
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Box sx={{
              width: 46, height: 46, borderRadius: "13px",
              background: gradient,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: glowColor ? `0 8px 22px ${glowColor}45` : "0 8px 20px rgba(0,0,0,0.15)",
              "& svg": { fontSize: 22, color: "#fff" },
            }}>
              {icon}
            </Box>
          </motion.div>

          {trend && (
            <Chip
              icon={
                trendPositive
                  ? <TrendingUpRoundedIcon sx={{ fontSize: "13px !important" }} />
                  : <TrendingDownRoundedIcon sx={{ fontSize: "13px !important" }} />
              }
              label={`${trendPositive ? "+" : ""}${trend.value}%`}
              size="small"
              sx={{
                height: 22, fontSize: "0.68rem", fontWeight: 700,
                background: trendPositive ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                color: trendPositive ? "#10b981" : "#ef4444",
                border: `1px solid ${trendPositive ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                "& .MuiChip-icon": { color: "inherit" },
              }}
            />
          )}
        </Box>

        {/* Animated value */}
        <AnimatePresence mode="wait">
          <motion.div
            key={display}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800, fontSize: "clamp(1.5rem, 2.5vw, 2rem)",
                color: theme.palette.text.primary, lineHeight: 1, mb: 0.5,
                fontVariantNumeric: "tabular-nums",
                fontFamily: "'Outfit', 'Inter', sans-serif",
              }}
            >
              {display}
            </Typography>
          </motion.div>
        </AnimatePresence>

        {/* Title */}
        <Typography variant="body2" sx={{
          color: theme.palette.text.secondary, fontWeight: 600,
          fontSize: "0.82rem", mb: 0.3, letterSpacing: "0.01em",
        }}>
          {title}
        </Typography>

        {/* Subtitle */}
        {subtitle && (
          <Typography variant="caption" sx={{
            color: theme.palette.text.disabled, fontWeight: 500, fontSize: "0.7rem",
          }}>
            {subtitle}
          </Typography>
        )}

        {/* Bottom accent line */}
        <Box sx={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "2px",
          background: gradient, opacity: 0.4,
          borderRadius: "0 0 18px 18px",
          transition: "opacity 0.3s",
          ".MuiBox-root:hover > &": { opacity: 0.8 },
        }} />
      </Box>
    </motion.div>
  );

  return tooltip
    ? <Tooltip title={tooltip} placement="top" arrow>{card}</Tooltip>
    : card;
}
