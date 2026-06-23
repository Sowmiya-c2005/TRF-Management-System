import { motion } from "framer-motion";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import { useTheme } from "@mui/material/styles";
import { useAnimatedCounter } from "../hooks/useAnimatedCounter";

/**
 * value — numeric → animated counter   |   string → displayed as-is
 * prefix / suffix — e.g. "$" / " GB"
 */
export default function StatCard({
  title, value, subtitle, icon, gradient, delay = 0, glowColor,
  prefix = "", suffix = "", tooltip = "",
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const isNumeric = typeof value === "number";
  const animated  = useAnimatedCounter(isNumeric ? value : 0, 1400, isNumeric);
  const display   = isNumeric ? `${prefix}${animated.toLocaleString()}${suffix}` : value;

  const card = (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -5, scale: 1.018, transition: { duration: 0.2 } }}
      style={{ height: "100%" }}
    >
      <Box
        sx={{
          p: 3, borderRadius: "18px", height: "100%",
          position: "relative", overflow: "hidden",
          background: isDark ? "rgba(15,23,42,0.72)" : "rgba(255,255,255,0.88)",
          backdropFilter: "blur(20px)",
          border: `1px solid ${isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.2)"}`,
          cursor: "default",
          transition: "box-shadow 0.3s ease, border-color 0.3s ease",
          "&:hover": {
            boxShadow: glowColor
              ? `0 20px 42px ${glowColor}38, 0 4px 12px ${glowColor}18`
              : "0 20px 40px rgba(15,23,42,0.1)",
            borderColor: glowColor ? `${glowColor}55` : undefined,
          },
        }}
      >
        {/* Decorative orb */}
        <Box sx={{
          position: "absolute", top: -28, right: -28,
          width: 110, height: 110, borderRadius: "50%",
          background: gradient, opacity: 0.1, filter: "blur(18px)",
          pointerEvents: "none",
        }} />

        {/* Icon */}
        <Box sx={{ mb: 2.5 }}>
          <Box sx={{
            width: 44, height: 44, borderRadius: "12px",
            background: gradient,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: glowColor ? `0 8px 20px ${glowColor}45` : "none",
            "& svg": { fontSize: 22, color: "#fff" },
          }}>
            {icon}
          </Box>
        </Box>

        {/* Value */}
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800, fontSize: "1.9rem",
            color: theme.palette.text.primary, lineHeight: 1, mb: 0.5,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {display}
        </Typography>

        {/* Title */}
        <Typography variant="body2" sx={{
          color: theme.palette.text.secondary, fontWeight: 500,
          fontSize: "0.82rem", mb: 0.3,
        }}>
          {title}
        </Typography>

        {/* Subtitle / trend */}
        {subtitle && (
          <Typography variant="caption" sx={{
            color: theme.palette.success.main, fontWeight: 600, fontSize: "0.72rem",
          }}>
            {subtitle}
          </Typography>
        )}
      </Box>
    </motion.div>
  );

  return tooltip ? <Tooltip title={tooltip} placement="top">{card}</Tooltip> : card;
}
