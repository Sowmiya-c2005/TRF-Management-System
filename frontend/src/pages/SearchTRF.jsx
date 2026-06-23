import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import InputAdornment from "@mui/material/InputAdornment";
import CircularProgress from "@mui/material/CircularProgress";
import toast from "react-hot-toast";

import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import LabelRoundedIcon from "@mui/icons-material/LabelRounded";

import { searchTRF } from "../services/trfService";

export default function SearchTRF() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [trfNumber, setTrfNumber] = useState("");
  const [trf, setTrf] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const cardBg = isDark ? "rgba(15,23,42,0.7)" : "rgba(255,255,255,0.85)";
  const border = isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.2)";

  const handleSearch = async () => {
    if (!trfNumber.trim()) return;
    setLoading(true); setTrf(null); setNotFound(false);
    try {
      const r = await searchTRF(trfNumber.trim());
      if (r.data?.message) { setNotFound(true); }
      else { setTrf(r.data); }
    } catch { setNotFound(true); toast.error("TRF not found"); }
    finally { setLoading(false); }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: "auto" }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, fontSize: "1.6rem", color: theme.palette.text.primary }}>Search TRF</Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
            Lookup any TRF by its unique number.
          </Typography>
        </Box>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Box sx={{ p: 3, borderRadius: "18px", background: cardBg, border: `1px solid ${border}`, backdropFilter: "blur(20px)", mb: 2.5 }}>
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <TextField
              placeholder="Enter TRF Number (e.g. TRF-2026-101)"
              fullWidth value={trfNumber}
              onChange={(e) => setTrfNumber(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                  </InputAdornment>
                ),
                sx: { borderRadius: "12px" },
              }}
            />
            <Button
              variant="contained" disabled={loading || !trfNumber.trim()}
              onClick={handleSearch}
              component={motion.button}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              sx={{
                px: 3, borderRadius: "12px", minWidth: 110,
                background: "linear-gradient(135deg,#6366f1,#06b6d4)",
                boxShadow: "0 6px 16px rgba(99,102,241,0.3)",
              }}
            >
              {loading ? <CircularProgress size={18} color="inherit" /> : "Search"}
            </Button>
          </Box>
        </Box>
      </motion.div>

      <AnimatePresence mode="wait">
        {trf && (
          <motion.div key="result"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.35 }}
          >
            <Box sx={{ p: 3, borderRadius: "18px", background: cardBg, border: `1px solid rgba(99,102,241,0.3)`, backdropFilter: "blur(20px)",
              boxShadow: "0 12px 30px rgba(99,102,241,0.1)" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
                <Box sx={{ width: 44, height: 44, borderRadius: "12px", background: "linear-gradient(135deg,#6366f1,#06b6d4)",
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FolderRoundedIcon sx={{ color: "#fff", fontSize: 22 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ fontSize: "1rem" }}>TRF Found</Typography>
                  <Chip label="Active" size="small" sx={{ height: 18, fontSize: "0.62rem", fontWeight: 700, background: "rgba(16,185,129,0.12)", color: "#10b981" }} />
                </Box>
              </Box>

              {[
                { icon: <LabelRoundedIcon />,         label: "TRF Number",   value: trf.trf_number },
                { icon: <FolderRoundedIcon />,         label: "Project Name", value: trf.project_name },
                { icon: <CalendarTodayRoundedIcon />,  label: "Created At",   value: trf.created_at ? new Date(trf.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—" },
              ].map((item) => (
                <Box key={item.label} sx={{
                  display: "flex", alignItems: "center", gap: 1.5, py: 1.2,
                  borderBottom: `1px solid ${border}`,
                  "&:last-child": { borderBottom: "none" },
                }}>
                  <Box sx={{ "& svg": { fontSize: 16, color: theme.palette.primary.main } }}>{item.icon}</Box>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary, minWidth: 100, fontSize: "0.78rem" }}>{item.label}</Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ fontSize: "0.85rem" }}>{item.value}</Typography>
                </Box>
              ))}
            </Box>
          </motion.div>
        )}

        {notFound && (
          <motion.div key="notfound"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          >
            <Box sx={{ p: 4, borderRadius: "18px", background: cardBg, border: `1px solid rgba(239,68,68,0.3)`, backdropFilter: "blur(20px)",
              display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Typography variant="h6" fontWeight={700} sx={{ color: theme.palette.error.main, mb: 0.5 }}>TRF Not Found</Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, textAlign: "center" }}>
                No TRF matches "<b>{trfNumber}</b>". Check the number and try again.
              </Typography>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}
