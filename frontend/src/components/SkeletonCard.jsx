import { motion } from "framer-motion";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";

function Bone({ width = "100%", height = 16, borderRadius = 8, sx = {} }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";
  return (
    <Box sx={{
      width, height, borderRadius,
      background: isDark
        ? "linear-gradient(90deg, rgba(148,163,184,0.05) 0%, rgba(148,163,184,0.14) 40%, rgba(148,163,184,0.2) 50%, rgba(148,163,184,0.14) 60%, rgba(148,163,184,0.05) 100%)"
        : "linear-gradient(90deg, rgba(148,163,184,0.1) 0%, rgba(148,163,184,0.22) 40%, rgba(148,163,184,0.32) 50%, rgba(148,163,184,0.22) 60%, rgba(148,163,184,0.1) 100%)",
      backgroundSize: "400% 100%",
      animation: "shimmer 2s ease-in-out infinite",
      ...sx,
    }} />
  );
}

export default function SkeletonCard() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0,  scale: 1   }}
      transition={{ duration: 0.4 }}
      style={{ height: "100%" }}
    >
      <Box sx={{
        p: 3, borderRadius: "18px", height: 140,
        background: isDark ? "rgba(15,23,42,0.55)" : "rgba(255,255,255,0.75)",
        backdropFilter: "blur(20px)",
        border: `1px solid ${isDark ? "rgba(148,163,184,0.08)" : "rgba(148,163,184,0.18)"}`,
        display: "flex", flexDirection: "column", gap: 1.5,
      }}>
        {/* Icon placeholder */}
        <Bone width={48} height={48} borderRadius={14} />
        {/* Value */}
        <Bone width="55%" height={28} borderRadius={8} />
        {/* Label */}
        <Bone width="75%" height={14} borderRadius={6} />
      </Box>
    </motion.div>
  );
}
