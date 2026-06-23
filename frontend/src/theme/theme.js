import { createTheme, alpha } from "@mui/material/styles";

const baseTypography = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
  h1: { fontWeight: 700, letterSpacing: "-0.02em" },
  h2: { fontWeight: 700, letterSpacing: "-0.02em" },
  h3: { fontWeight: 600, letterSpacing: "-0.01em" },
  h4: { fontWeight: 600, letterSpacing: "-0.01em" },
  h5: { fontWeight: 600 },
  h6: { fontWeight: 600 },
  subtitle1: { fontWeight: 500 },
  subtitle2: { fontWeight: 500 },
  button: { fontWeight: 600, textTransform: "none", letterSpacing: "0.01em" },
};

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#6366f1", light: "#818cf8", dark: "#4f46e5", contrastText: "#fff" },
    secondary: { main: "#06b6d4", light: "#22d3ee", dark: "#0891b2", contrastText: "#fff" },
    success: { main: "#10b981", light: "#34d399", dark: "#059669" },
    warning: { main: "#f59e0b", light: "#fbbf24", dark: "#d97706" },
    error: { main: "#ef4444", light: "#f87171", dark: "#dc2626" },
    info: { main: "#3b82f6", light: "#60a5fa", dark: "#2563eb" },
    background: { default: "#f1f5f9", paper: "#ffffff" },
    text: { primary: "#0f172a", secondary: "#475569", disabled: "#94a3b8" },
    divider: "rgba(148,163,184,0.2)",
  },
  typography: baseTypography,
  shape: { borderRadius: 14 },
  shadows: [
    "none",
    "0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)",
    "0 4px 6px -1px rgba(15,23,42,0.07), 0 2px 4px -1px rgba(15,23,42,0.04)",
    "0 10px 15px -3px rgba(15,23,42,0.08), 0 4px 6px -2px rgba(15,23,42,0.04)",
    "0 20px 25px -5px rgba(15,23,42,0.08), 0 10px 10px -5px rgba(15,23,42,0.03)",
    "0 25px 50px -12px rgba(15,23,42,0.15)",
    ...Array(19).fill("none"),
  ],
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: "1px solid rgba(148,163,184,0.15)",
          backdropFilter: "blur(20px)",
          background: "rgba(255,255,255,0.85)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 10, padding: "8px 20px" },
        contained: {
          boxShadow: "0 4px 14px 0 rgba(99,102,241,0.35)",
          "&:hover": { boxShadow: "0 6px 20px rgba(99,102,241,0.45)" },
        },
      },
    },
    MuiChip: { styleOverrides: { root: { borderRadius: 8, fontWeight: 600 } } },
    MuiTextField: { styleOverrides: { root: { "& .MuiOutlinedInput-root": { borderRadius: 10 } } } },
    MuiTooltip: { styleOverrides: { tooltip: { borderRadius: 8, fontSize: "0.75rem" } } },
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#818cf8", light: "#a5b4fc", dark: "#6366f1", contrastText: "#fff" },
    secondary: { main: "#22d3ee", light: "#67e8f9", dark: "#06b6d4", contrastText: "#000" },
    success: { main: "#34d399", light: "#6ee7b7", dark: "#10b981" },
    warning: { main: "#fbbf24", light: "#fcd34d", dark: "#f59e0b" },
    error: { main: "#f87171", light: "#fca5a5", dark: "#ef4444" },
    info: { main: "#60a5fa", light: "#93c5fd", dark: "#3b82f6" },
    background: { default: "#0a0f1e", paper: "#0f172a" },
    text: { primary: "#f1f5f9", secondary: "#94a3b8", disabled: "#475569" },
    divider: "rgba(148,163,184,0.1)",
  },
  typography: baseTypography,
  shape: { borderRadius: 14 },
  shadows: [
    "none",
    "0 1px 3px rgba(0,0,0,0.4)",
    "0 4px 6px -1px rgba(0,0,0,0.4)",
    "0 10px 15px -3px rgba(0,0,0,0.5)",
    "0 20px 25px -5px rgba(0,0,0,0.5)",
    "0 25px 50px -12px rgba(0,0,0,0.6)",
    ...Array(19).fill("none"),
  ],
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: "1px solid rgba(148,163,184,0.1)",
          backdropFilter: "blur(20px)",
          background: "rgba(15,23,42,0.8)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 10, padding: "8px 20px" },
        contained: {
          boxShadow: "0 4px 14px 0 rgba(129,140,248,0.3)",
          "&:hover": { boxShadow: "0 6px 20px rgba(129,140,248,0.45)" },
        },
      },
    },
    MuiChip: { styleOverrides: { root: { borderRadius: 8, fontWeight: 600 } } },
    MuiTextField: { styleOverrides: { root: { "& .MuiOutlinedInput-root": { borderRadius: 10 } } } },
    MuiTooltip: { styleOverrides: { tooltip: { borderRadius: 8, fontSize: "0.75rem" } } },
  },
});
