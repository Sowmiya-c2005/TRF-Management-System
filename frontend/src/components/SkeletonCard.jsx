import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";

function SkeletonBlock({ width = "100%", height = 16, borderRadius = 6, sx = {} }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  return (
    <Box
      sx={{
        width, height, borderRadius,
        background: isDark
          ? "linear-gradient(90deg, rgba(148,163,184,0.06) 25%, rgba(148,163,184,0.12) 50%, rgba(148,163,184,0.06) 75%)"
          : "linear-gradient(90deg, rgba(148,163,184,0.12) 25%, rgba(148,163,184,0.22) 50%, rgba(148,163,184,0.12) 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
        ...sx,
      }}
    />
  );
}

export default function SkeletonCard() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  return (
    <Box
      sx={{
        p: 3, borderRadius: "18px",
        background: isDark ? "rgba(15,23,42,0.7)" : "rgba(255,255,255,0.85)",
        border: `1px solid ${isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.2)"}`,
        height: 140,
      }}
    >
      <SkeletonBlock width={44} height={44} borderRadius={12} sx={{ mb: 2 }} />
      <SkeletonBlock width="50%" height={28} sx={{ mb: 1 }} />
      <SkeletonBlock width="70%" height={14} />
    </Box>
  );
}
