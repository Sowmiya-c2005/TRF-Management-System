import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@mui/material/styles";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import toast from "react-hot-toast";

import QrCode2RoundedIcon from "@mui/icons-material/QrCode2Rounded";
import QRCodeModal from "../components/QRCodeModal";

import SearchRoundedIcon        from "@mui/icons-material/SearchRounded";
import FolderRoundedIcon        from "@mui/icons-material/FolderRounded";
import FolderOpenRoundedIcon    from "@mui/icons-material/FolderOpenRounded";
import EditRoundedIcon          from "@mui/icons-material/EditRounded";
import CheckCircleRoundedIcon   from "@mui/icons-material/CheckCircleRounded";
import ErrorRoundedIcon         from "@mui/icons-material/ErrorRounded";
import ClearRoundedIcon         from "@mui/icons-material/ClearRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";

import { searchTRF } from "../services/trfService";

const FOLDERS = [
  { name: "Documents",        color: "#6366f1", bg: "rgba(99,102,241,0.12)" },
  { name: "Reports",          color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  { name: "Drawings",         color: "#06b6d4", bg: "rgba(6,182,212,0.12)" },
  { name: "Approvals",        color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  { name: "Final Submission", color: "#a855f7", bg: "rgba(168,85,247,0.12)" },
];

export default function SearchTRF() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";
  const navigate = useNavigate();

  const [query,   setQuery]   = useState("");
  const [result,  setResult]  = useState(null);
  const [status,  setStatus]  = useState("idle");
  const [error,   setError]   = useState("");
  const [qrOpen,  setQrOpen]  = useState(false);

  const cardBg = isDark ? "rgba(15,23,42,0.72)" : "rgba(255,255,255,0.88)";
  const border  = isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.2)";

  const handleSearch = async () => {
    if (!query.trim()) { toast.error("Enter a TRF number to search"); return; }
    setStatus("loading");
    setResult(null); setError("");
    try {
      const res = await searchTRF(query.trim());
      if (res.data?.message || !res.data?.trf_number) {
        setStatus("notfound");
        setError(`No TRF found matching "${query.trim()}"`);
      } else {
        setResult(res.data);
        setStatus("found");
      }
    } catch {
      setStatus("notfound");
      setError(`No TRF found matching "${query.trim()}"`);
    }
  };

  const handleClear = () => { setQuery(""); setResult(null); setStatus("idle"); setError(""); };

  return (
    <Box sx={{ maxWidth: 640, mx: "auto" }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
          <Box sx={{
            width: 44, height: 44, borderRadius: "13px",
            background: "linear-gradient(135deg,#06b6d4,#6366f1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 20px rgba(6,182,212,0.35)",
          }}>
            <SearchRoundedIcon sx={{ color: "#fff", fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, fontSize: "1.65rem", color: theme.palette.text.primary, lineHeight: 1.2 }}>
              Search TRF
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: "0.82rem" }}>
              Look up any TRF by its number
            </Typography>
          </Box>
        </Box>
      </motion.div>

      {/* Search input */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Box sx={{
          p: 3, borderRadius: "20px", background: cardBg,
          border: `1px solid ${border}`, backdropFilter: "blur(20px)",
          mb: 3, display: "flex", gap: 1.5, alignItems: "flex-start",
        }}>
          <TextField
            fullWidth
            placeholder="Enter TRF number, e.g. TRF-2026-101"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                </InputAdornment>
              ),
              endAdornment: query ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleClear}>
                    <ClearRoundedIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
              sx: { borderRadius: "12px" },
            }}
          />
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={status === "loading" || !query.trim()}
              startIcon={status === "loading" ? <CircularProgress size={15} color="inherit" /> : <SearchRoundedIcon />}
              sx={{
                borderRadius: "12px", height: 56, minWidth: 110, fontWeight: 700,
                background: "linear-gradient(135deg,#6366f1,#06b6d4)",
                boxShadow: "0 6px 18px rgba(99,102,241,0.35)",
              }}
            >
              {status === "loading" ? "Searching" : "Search"}
            </Button>
          </motion.div>
        </Box>
      </motion.div>

      {/* Results */}
      <AnimatePresence mode="wait">
        {/* Found */}
        {status === "found" && result && (
          <motion.div
            key="found"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35 }}
          >
            <Box sx={{ p: 3.5, borderRadius: "20px", background: cardBg, border: `1px solid ${border}`, backdropFilter: "blur(20px)" }}>
              {/* Result header */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5, pb: 2.5, borderBottom: `1px solid ${border}` }}>
                <Box sx={{
                  width: 50, height: 50, borderRadius: "14px",
                  background: "linear-gradient(135deg,#6366f1,#06b6d4)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 6px 18px rgba(99,102,241,0.35)",
                }}>
                  <FolderOpenRoundedIcon sx={{ color: "#fff", fontSize: 24 }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.3 }}>
                    <Chip
                      label={result.trf_number}
                      size="small"
                      sx={{ fontSize: "0.75rem", fontWeight: 700, background: "rgba(99,102,241,0.12)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.22)" }}
                    />
                    <Chip
                      icon={<CheckCircleRoundedIcon sx={{ fontSize: 12 }} />}
                      label="Found"
                      size="small"
                      sx={{ fontSize: "0.68rem", height: 20, background: "rgba(16,185,129,0.1)", color: "#10b981" }}
                    />
                  </Box>
                  <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: theme.palette.text.primary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {result.project_name}
                  </Typography>
                </Box>
              </Box>

              {/* Meta */}
              {result.created_at && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}>
                  <CalendarTodayRoundedIcon sx={{ fontSize: 14, color: theme.palette.text.disabled }} />
                  <Typography sx={{ fontSize: "0.78rem", color: theme.palette.text.secondary }}>
                    Created {new Date(result.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                  </Typography>
                </Box>
              )}

              {/* Folders */}
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: theme.palette.text.disabled, mb: 1.5, letterSpacing: "0.07em", textTransform: "uppercase" }}>
                Available Folders
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 3 }}>
                {FOLDERS.map((f, i) => (
                  <motion.div key={f.name} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}>
                    <Chip
                      icon={<FolderRoundedIcon sx={{ fontSize: 14, color: `${f.color} !important` }} />}
                      label={f.name} size="small"
                      sx={{ fontSize: "0.76rem", background: f.bg, color: f.color, border: `1px solid ${f.color}33` }}
                    />
                  </motion.div>
                ))}
              </Box>

              {/* Actions */}
              <Box sx={{ display: "flex", gap: 1.5 }}>
                <Button
                  variant="outlined" size="small"
                  startIcon={<FolderOpenRoundedIcon />}
                  onClick={() => navigate(`/files?trf=${result.trf_number}`)}
                  sx={{ borderRadius: "10px", flex: 1 }}
                >
                  Open Files
                </Button>
                <Button
                  variant="outlined" size="small"
                  startIcon={<EditRoundedIcon />}
                  onClick={() => navigate(`/update?trf=${result.trf_number}`)}
                  sx={{ borderRadius: "10px", flex: 1 }}
                >
                  Update TRF
                </Button>
                <Button
                  variant="outlined" size="small"
                  startIcon={<QrCode2RoundedIcon />}
                  onClick={() => setQrOpen(true)}
                  sx={{ borderRadius: "10px" }}
                >
                  QR
                </Button>
              </Box>

              {/* QR Modal */}
              <QRCodeModal
                open={qrOpen}
                onClose={() => setQrOpen(false)}
                trfNumber={result.trf_number}
                projectName={result.project_name}
              />
            </Box>
          </motion.div>
        )}

        {/* Not found */}
        {status === "notfound" && (
          <motion.div
            key="notfound"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Box sx={{
              p: 4, borderRadius: "20px", textAlign: "center",
              background: isDark ? "rgba(239,68,68,0.07)" : "rgba(239,68,68,0.04)",
              border: "1px solid rgba(239,68,68,0.22)",
            }}>
              <Box sx={{
                width: 60, height: 60, borderRadius: "18px",
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2,
              }}>
                <ErrorRoundedIcon sx={{ color: "#ef4444", fontSize: 28 }} />
              </Box>
              <Typography sx={{ fontWeight: 700, color: "#ef4444", mb: 0.5 }}>
                TRF Not Found
              </Typography>
              <Typography sx={{ fontSize: "0.85rem", color: theme.palette.text.secondary, mb: 2.5 }}>
                {error}
              </Typography>
              <Button variant="outlined" size="small" onClick={handleClear}
                sx={{ borderRadius: "10px", borderColor: "rgba(239,68,68,0.4)", color: "#ef4444" }}>
                Clear & Try Again
              </Button>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}
