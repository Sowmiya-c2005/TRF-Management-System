import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Chip from "@mui/material/Chip";
import toast from "react-hot-toast";

import EditRoundedIcon          from "@mui/icons-material/EditRounded";
import CheckCircleRoundedIcon   from "@mui/icons-material/CheckCircleRounded";
import SearchRoundedIcon        from "@mui/icons-material/SearchRounded";
import ArrowForwardRoundedIcon  from "@mui/icons-material/ArrowForwardRounded";
import TagRoundedIcon           from "@mui/icons-material/TagRounded";
import InfoOutlinedIcon         from "@mui/icons-material/InfoOutlined";

import { updateTRF, searchTRF } from "../services/trfService";
import { useApp }               from "../context/AppContext";

export default function UpdateTRF() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { addActivity, addNotification, user } = useApp();

  const [trfNumber,    setTrfNumber]    = useState("");
  const [projectName,  setProjectName]  = useState("");
  const [currentName,  setCurrentName]  = useState("");
  const [lookupDone,   setLookupDone]   = useState(false);
  const [lookupLoading,setLookupLoading]= useState(false);
  const [loading,      setLoading]      = useState(false);
  const [success,      setSuccess]      = useState(false);

  const cardBg = isDark ? "rgba(15,23,42,0.72)" : "rgba(255,255,255,0.88)";
  const border = isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.2)";

  const handleLookup = async () => {
    if (!trfNumber.trim()) { toast.error("Enter a TRF number"); return; }
    setLookupLoading(true);
    setLookupDone(false);
    setCurrentName("");
    setProjectName("");
    try {
      const r = await searchTRF(trfNumber.trim());
      if (r.data?.message) {
        toast.error("TRF not found");
      } else {
        setCurrentName(r.data.project_name || "");
        setProjectName(r.data.project_name || "");
        setLookupDone(true);
        toast.success("TRF found!", { icon: "🔍" });
      }
    } catch (e) {
      toast.error(e.message || "TRF not found");
    } finally {
      setLookupLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!projectName.trim()) { toast.error("Enter a new project name"); return; }
    if (projectName.trim() === currentName) { toast("No change detected", { icon: "ℹ️" }); return; }
    setLoading(true);
    try {
      await updateTRF(trfNumber.trim(), projectName.trim());
      setSuccess(true);

      const actor = user?.username || "Admin";
      addActivity(`${trfNumber.trim()} updated — "${projectName.trim()}"`, actor);
      addNotification({
        title: `${trfNumber.trim()} updated`,
        body:  `New name: ${projectName.trim()}`,
        color: "#f59e0b",
        type:  "trf",
      });

      toast.success("TRF updated successfully!");
      setTimeout(() => {
        setTrfNumber(""); setProjectName(""); setCurrentName("");
        setLookupDone(false); setSuccess(false);
      }, 2800);
    } catch (e) {
      toast.error(e.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 620, mx: "auto" }}>
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
            <Box sx={{
              width: 44, height: 44, borderRadius: "13px",
              background: "linear-gradient(135deg,#f59e0b,#fbbf24)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 8px 20px rgba(245,158,11,0.35)",
            }}>
              <EditRoundedIcon sx={{ color: "#fff", fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, fontSize: "1.65rem", color: theme.palette.text.primary, lineHeight: 1.2 }}>
                Update TRF
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: "0.85rem" }}>
                Look up and modify a TRF's project details
              </Typography>
            </Box>
          </Box>
        </Box>
      </motion.div>

      {/* Step 1 — Lookup */}
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <Box sx={{
          p: 3.5, borderRadius: "20px", background: cardBg,
          border: `1px solid ${border}`, backdropFilter: "blur(20px)",
          boxShadow: isDark ? "0 16px 40px rgba(0,0,0,0.3)" : "0 16px 40px rgba(15,23,42,0.08)",
          mb: 2.5,
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
            <Box sx={{
              width: 28, height: 28, borderRadius: "50%",
              background: lookupDone ? "linear-gradient(135deg,#10b981,#34d399)" : "linear-gradient(135deg,#6366f1,#818cf8)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.72rem", fontWeight: 800, color: "#fff", flexShrink: 0,
            }}>
              {lookupDone ? <CheckCircleRoundedIcon sx={{ fontSize: 16 }} /> : "1"}
            </Box>
            <Typography sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
              Find TRF
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 1.5 }}>
            <TextField
              fullWidth
              label="TRF Number"
              placeholder="e.g. TRF-2026-101"
              value={trfNumber}
              onChange={(e) => { setTrfNumber(e.target.value); setLookupDone(false); }}
              onKeyDown={(e) => e.key === "Enter" && handleLookup()}
              InputProps={{
                startAdornment: (
                  <Box sx={{ display: "flex", alignItems: "center", mr: 0.5, color: theme.palette.text.secondary }}>
                    <TagRoundedIcon sx={{ fontSize: 18 }} />
                  </Box>
                ),
                sx: { borderRadius: "12px" },
              }}
            />
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                variant="outlined"
                onClick={handleLookup}
                disabled={lookupLoading || !trfNumber.trim()}
                startIcon={lookupLoading ? <CircularProgress size={14} color="inherit" /> : <SearchRoundedIcon />}
                sx={{
                  borderRadius: "12px", minWidth: 120, height: 56, alignSelf: "flex-start",
                  borderColor: theme.palette.primary.main,
                  "&:hover": { background: "rgba(99,102,241,0.08)" },
                }}
              >
                {lookupLoading ? "Looking…" : "Look Up"}
              </Button>
            </motion.div>
          </Box>

          {/* Found result banner */}
          <AnimatePresence>
            {lookupDone && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Box sx={{
                  display: "flex", alignItems: "center", gap: 1.5,
                  px: 2, py: 1.4, borderRadius: "12px",
                  background: isDark ? "rgba(16,185,129,0.1)" : "rgba(16,185,129,0.07)",
                  border: "1px solid rgba(16,185,129,0.28)",
                }}>
                  <CheckCircleRoundedIcon sx={{ fontSize: 18, color: "#10b981", flexShrink: 0 }} />
                  <Box>
                    <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#10b981" }}>
                      TRF Found
                    </Typography>
                    <Typography sx={{ fontSize: "0.75rem", color: theme.palette.text.secondary }}>
                      Current name: <b style={{ color: theme.palette.text.primary }}>{currentName}</b>
                    </Typography>
                  </Box>
                  <Chip
                    label={trfNumber}
                    size="small"
                    sx={{ ml: "auto", fontSize: "0.68rem", background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}
                  />
                </Box>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      </motion.div>

      {/* Step 2 — Edit */}
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
        <Box sx={{
          p: 3.5, borderRadius: "20px", background: cardBg,
          border: `1px solid ${border}`, backdropFilter: "blur(20px)",
          boxShadow: isDark ? "0 16px 40px rgba(0,0,0,0.3)" : "0 16px 40px rgba(15,23,42,0.08)",
          opacity: lookupDone ? 1 : 0.55,
          transition: "opacity 0.25s",
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
            <Box sx={{
              width: 28, height: 28, borderRadius: "50%",
              background: success ? "linear-gradient(135deg,#10b981,#34d399)" : "linear-gradient(135deg,#f59e0b,#fbbf24)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.72rem", fontWeight: 800, color: "#fff", flexShrink: 0,
            }}>
              {success ? <CheckCircleRoundedIcon sx={{ fontSize: 16 }} /> : "2"}
            </Box>
            <Typography sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
              Edit Details
            </Typography>
          </Box>

          <TextField
            fullWidth
            label="New Project Name"
            placeholder="Enter updated project name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && lookupDone && handleUpdate()}
            disabled={!lookupDone || success}
            helperText={
              !lookupDone
                ? "Complete Step 1 first"
                : projectName && projectName !== currentName
                ? "✓ Ready to update"
                : "Make changes to the project name above"
            }
            FormHelperTextProps={{ sx: { color: projectName && projectName !== currentName ? "#10b981" : "inherit" } }}
            InputProps={{ sx: { borderRadius: "12px" } }}
          />

          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1.5, color: theme.palette.text.disabled }}>
            <InfoOutlinedIcon sx={{ fontSize: 14 }} />
            <Typography sx={{ fontSize: "0.72rem" }}>
              Changes will be logged in the audit trail and team notified.
            </Typography>
          </Box>

          <motion.div whileHover={lookupDone && !success ? { scale: 1.02 } : {}} whileTap={lookupDone && !success ? { scale: 0.98 } : {}}>
            <Button
              variant="contained"
              fullWidth
              disabled={loading || success || !lookupDone}
              onClick={handleUpdate}
              startIcon={
                loading ? <CircularProgress size={16} color="inherit" /> :
                success  ? <CheckCircleRoundedIcon /> :
                <EditRoundedIcon />
              }
              endIcon={!loading && !success && <ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />}
              sx={{
                mt: 3, py: 1.4, borderRadius: "12px", fontSize: "0.95rem", fontWeight: 700,
                background: success
                  ? "linear-gradient(135deg,#10b981,#34d399)"
                  : "linear-gradient(135deg,#f59e0b,#fbbf24)",
                color: "#fff",
                boxShadow: success
                  ? "0 8px 24px rgba(16,185,129,0.35)"
                  : "0 8px 24px rgba(245,158,11,0.35)",
                "&:hover": { boxShadow: "0 12px 32px rgba(245,158,11,0.5)" },
                "&:disabled": { opacity: 0.6 },
              }}
            >
              {loading ? "Updating…" : success ? "Updated Successfully!" : "Update TRF"}
            </Button>
          </motion.div>
        </Box>
      </motion.div>
    </Box>
  );
}
