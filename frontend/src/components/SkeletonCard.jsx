import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";

function Pulse({ isDark }) {
  return (
    <Box sx={{
      background: isDark ? "rgba(148,163,184,0.08)" : "rgba(148,163,184,0.12)",
      borderRadius: "8px",
      animation: "shimmer 2s ease-in-out infinite",
      backgroundSize: "400% 100%",
      backgroundImage: isDark
        ? "linear-gradient(90deg,rgba(148,163,184,0.05) 0%,rgba(148,163,184,0.15) 50%,rgba(148,163,184,0.05) 100%)"
        : "linear-gradient(90deg,rgba(148,163,184,0.07) 0%,rgba(148,163,184,0.2) 50%,rgba(148,163,184,0.07) 100%)",
    }} />
  );
}

export default function SkeletonCard() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box sx={{
      p: 3, borderRadius: "18px", height: "100%", minHeight: 148,
      background: isDark ? "rgba(15,23,42,0.65)" : "rgba(255,255,255,0.85)",
      backdropFilter: "blur(20px)",
      border: `1px solid ${isDark ? "rgba(148,163,184,0.08)" : "rgba(148,163,184,0.18)"}`,
      display: "flex", flexDirection: "column", gap: 1.5,
    }}>
      {/* Icon placeholder */}
      <Pulse isDark={isDark} />
      <Box sx={{ height: 46, width: 46, borderRadius: "13px" }}>
        <Pulse isDark={isDark} />
      </Box>

      {/* Value placeholder */}
      <Box sx={{ height: 36, width: "60%", borderRadius: "8px" }}>
        <Pulse isDark={isDark} />
      </Box>

      {/* Title placeholder */}
      <Box sx={{ height: 14, width: "75%", borderRadius: "6px" }}>
        <Pulse isDark={isDark} />
      </Box>

      {/* Subtitle placeholder */}
      <Box sx={{ height: 11, width: "50%", borderRadius: "6px" }}>
        <Pulse isDark={isDark} />
      </Box>
    </Box>
  );
}
