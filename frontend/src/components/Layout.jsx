import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
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

export default function Layout({ children }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";
  const location = useLocation();

  const pageBg = isDark
    ? "radial-gradient(ellipse 80% 50% at 10% 0%, rgba(99,102,241,0.06) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 90% 100%, rgba(6,182,212,0.04) 0%, transparent 60%), #0a0f1e"
    : "radial-gradient(ellipse 80% 50% at 10% 0%, rgba(99,102,241,0.04) 0%, transparent 60%), #f1f5f9";

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", background: pageBg }}>
      <Sidebar />

      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        {/* Sticky navbar — contains notification drawer + command palette internally */}
        <Navbar />

        {/* Page content */}
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
