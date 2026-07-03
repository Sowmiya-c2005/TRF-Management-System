import { createTheme } from "@mui/material/styles";

const baseTypography = {
  fontFamily: "'Inter', 'Outfit', 'Segoe UI', system-ui, -apple-system, sans-serif",
  h1: { fontWeight: 800, letterSpacing: "-0.025em" },
  h2: { fontWeight: 800, letterSpacing: "-0.02em" },
  h3: { fontWeight: 700, letterSpacing: "-0.015em" },
  h4: { fontWeight: 700, letterSpacing: "-0.01em" },
  h5: { fontWeight: 600, letterSpacing: "-0.005em" },
  h6: { fontWeight: 600 },
  subtitle1: { fontWeight: 500 },
  subtitle2: { fontWeight: 500 },
  button: { fontWeight: 600, textTransform: "none", letterSpacing: "0.01em" },
  caption: { letterSpacing: "0.01em" },
};

const lightComponents = {
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 18,
        border: "1px solid rgba(148,163,184,0.18)",
        backdropFilter: "blur(20px)",
        background: "rgba(255,255,255,0.88)",
        boxShadow: "0 4px 24px rgba(15,23,42,0.06)",
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: { borderRadius: 10, padding: "8px 20px", fontWeight: 600 },
      contained: {
        boxShadow: "0 4px 14px rgba(99,102,241,0.32)",
        "&:hover": { boxShadow: "0 8px 24px rgba(99,102,241,0.48)", transform: "translateY(-1px)" },
        transition: "all 0.22s cubic-bezier(0.4,0,0.2,1)",
      },
      outlined: {
        borderWidth: "1.5px",
        "&:hover": { borderWidth: "1.5px", transform: "translateY(-1px)" },
        transition: "all 0.22s ease",
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: { borderRadius: 8, fontWeight: 600, fontSize: "0.75rem" },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        "& .MuiOutlinedInput-root": {
          borderRadius: 12,
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(99,102,241,0.5)",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#6366f1",
            borderWidth: "2px",
          },
        },
      },
    },
  },
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        borderRadius: 8,
        fontSize: "0.74rem",
        fontWeight: 500,
        background: "rgba(15,23,42,0.92)",
        backdropFilter: "blur(12px)",
        padding: "6px 12px",
      },
      arrow: { color: "rgba(15,23,42,0.92)" },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: 20,
        background: "rgba(255,255,255,0.96)",
        backdropFilter: "blur(30px)",
        border: "1px solid rgba(148,163,184,0.2)",
      },
    },
  },
  MuiMenu: {
    styleOverrides: {
      paper: {
        borderRadius: 14,
        background: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(30px)",
        border: "1px solid rgba(148,163,184,0.2)",
        boxShadow: "0 20px 48px rgba(15,23,42,0.12)",
      },
    },
  },
  MuiTableHead: {
    styleOverrides: {
      root: { "& .MuiTableCell-head": { fontWeight: 700, fontSize: "0.78rem", letterSpacing: "0.03em" } },
    },
  },
  MuiLinearProgress: {
    styleOverrides: {
      root: { borderRadius: 10 },
      bar: { borderRadius: 10 },
    },
  },
  MuiSwitch: {
    styleOverrides: {
      root: { padding: 6 },
      track: { borderRadius: 10 },
      thumb: { boxShadow: "0 2px 6px rgba(0,0,0,0.2)" },
    },
  },
};

const darkComponents = {
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 18,
        border: "1px solid rgba(148,163,184,0.10)",
        backdropFilter: "blur(24px)",
        background: "rgba(13,16,34,0.82)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.05)",
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: { borderRadius: 10, padding: "8px 20px", fontWeight: 600 },
      contained: {
        boxShadow: "0 4px 14px rgba(129,140,248,0.28)",
        "&:hover": { boxShadow: "0 8px 24px rgba(129,140,248,0.45)", transform: "translateY(-1px)" },
        transition: "all 0.22s cubic-bezier(0.4,0,0.2,1)",
      },
      outlined: {
        borderWidth: "1.5px",
        "&:hover": { borderWidth: "1.5px", transform: "translateY(-1px)" },
        transition: "all 0.22s ease",
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: { borderRadius: 8, fontWeight: 600, fontSize: "0.75rem" },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        "& .MuiOutlinedInput-root": {
          borderRadius: 12,
          background: "rgba(148,163,184,0.05)",
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(129,140,248,0.5)",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#818cf8",
            borderWidth: "2px",
          },
        },
      },
    },
  },
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        borderRadius: 8,
        fontSize: "0.74rem",
        fontWeight: 500,
        background: "rgba(10,15,30,0.96)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(148,163,184,0.1)",
        padding: "6px 12px",
      },
      arrow: { color: "rgba(10,15,30,0.96)" },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: 20,
        background: "rgba(10,15,30,0.96)",
        backdropFilter: "blur(40px)",
        border: "1px solid rgba(148,163,184,0.12)",
        boxShadow: "0 32px 64px rgba(0,0,0,0.6)",
      },
    },
  },
  MuiMenu: {
    styleOverrides: {
      paper: {
        borderRadius: 14,
        background: "rgba(10,15,30,0.97)",
        backdropFilter: "blur(40px)",
        border: "1px solid rgba(148,163,184,0.12)",
        boxShadow: "0 24px 48px rgba(0,0,0,0.5)",
      },
    },
  },
  MuiTableHead: {
    styleOverrides: {
      root: { "& .MuiTableCell-head": { fontWeight: 700, fontSize: "0.78rem", letterSpacing: "0.03em" } },
    },
  },
  MuiLinearProgress: {
    styleOverrides: {
      root: { borderRadius: 10 },
      bar: { borderRadius: 10 },
    },
  },
  MuiSwitch: {
    styleOverrides: {
      root: { padding: 6 },
      track: { borderRadius: 10 },
      thumb: { boxShadow: "0 2px 6px rgba(0,0,0,0.4)" },
    },
  },
};

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary:    { main: "#6366f1", light: "#818cf8", dark: "#4f46e5", contrastText: "#fff" },
    secondary:  { main: "#06b6d4", light: "#22d3ee", dark: "#0891b2", contrastText: "#fff" },
    success:    { main: "#10b981", light: "#34d399", dark: "#059669" },
    warning:    { main: "#f59e0b", light: "#fbbf24", dark: "#d97706" },
    error:      { main: "#ef4444", light: "#f87171", dark: "#dc2626" },
    info:       { main: "#3b82f6", light: "#60a5fa", dark: "#2563eb" },
    background: { default: "#f1f5f9", paper: "#ffffff" },
    text:       { primary: "#0f172a", secondary: "#475569", disabled: "#94a3b8" },
    divider:    "rgba(148,163,184,0.18)",
  },
  typography: baseTypography,
  shape: { borderRadius: 14 },
  shadows: [
    "none",
    "0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)",
    "0 4px 8px rgba(15,23,42,0.07), 0 2px 4px rgba(15,23,42,0.04)",
    "0 8px 16px rgba(15,23,42,0.08), 0 4px 6px rgba(15,23,42,0.04)",
    "0 16px 24px rgba(15,23,42,0.09), 0 8px 10px rgba(15,23,42,0.04)",
    "0 24px 40px rgba(15,23,42,0.12)",
    ...Array(19).fill("none"),
  ],
  components: lightComponents,
});

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary:    { main: "#818cf8", light: "#a5b4fc", dark: "#6366f1", contrastText: "#fff" },
    secondary:  { main: "#22d3ee", light: "#67e8f9", dark: "#06b6d4", contrastText: "#000" },
    success:    { main: "#34d399", light: "#6ee7b7", dark: "#10b981" },
    warning:    { main: "#fbbf24", light: "#fcd34d", dark: "#f59e0b" },
    error:      { main: "#f87171", light: "#fca5a5", dark: "#ef4444" },
    info:       { main: "#60a5fa", light: "#93c5fd", dark: "#3b82f6" },
    background: { default: "#060918", paper: "#0d1022" },
    text:       { primary: "#f1f5f9", secondary: "#94a3b8", disabled: "#475569" },
    divider:    "rgba(148,163,184,0.1)",
  },
  typography: baseTypography,
  shape: { borderRadius: 14 },
  shadows: [
    "none",
    "0 1px 3px rgba(0,0,0,0.4)",
    "0 4px 8px rgba(0,0,0,0.4)",
    "0 8px 16px rgba(0,0,0,0.5)",
    "0 16px 24px rgba(0,0,0,0.5)",
    "0 24px 48px rgba(0,0,0,0.6)",
    ...Array(19).fill("none"),
  ],
  components: darkComponents,
});
