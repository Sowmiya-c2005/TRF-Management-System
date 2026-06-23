import { createContext, useContext, useState, useMemo } from "react";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { lightTheme, darkTheme } from "../theme/theme";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem("themeMode") || "dark");

  const toggle = () =>
    setMode((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("themeMode", next);
      return next;
    });

  const theme = useMemo(() => (mode === "dark" ? darkTheme : lightTheme), [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggle }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

export const useThemeMode = () => useContext(ThemeContext);
