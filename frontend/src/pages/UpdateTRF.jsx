import { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import toast from "react-hot-toast";

import EditRoundedIcon          from "@mui/icons-material/EditRounded";
import CheckCircleRoundedIcon   from "@mui/icons-material/CheckCircleRounded";
import SearchRoundedIcon        from "@mui/icons-material/SearchRounded";

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

  // ── Step 1: look up existing TRF ─────────────────────────────────────────
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
      }
    } catch (e) {
      toast.error(e.message || "TRF not found");
    } finally {
      setLookupLoading(false);
    }
  };

  // ── Step 2: save the update ───────────────────────────────────────────────
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
        type:  "update",
      });

      toast.success("TRF updated successfully!");
      setTimeout(() => {
        setTrfNumber(""); setProjectName(""); setCurrentName("");
        setLookupDone(false); setSuccess(false);
      }, 2500);
    } catch (e) {
      toast.error(e.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 580, mx: "auto" }}>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, fontSize: "1.6rem", color: theme.palette.text.primary }}>
            Update TRF
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
            Look up a TRF by number, then modify its project name.
          </Typography>
        </Box>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <Box sx={{ p: 3.5, borderRadius: "18px", background: cardBg, border: `1px solid ${border}`, backdropFilter: "blur(20px)" }}>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
            <Box sx={{
              width: 40, height: 40, borderRadius: "10px",
              background: "linear-gradient(135deg,#f59e0b,#fbbf24)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <EditRoundedIcon sx={{ color: "#fff", fontSize: 20 }} />
            </Box>
            <Typography variant="subtitle1" fontWeight={700}>Update Details</Typography>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>

            {/* TRF number + lookup */}
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <TextField
                label="TRF Number"
                placeholder="e.g. TRF-2026-101"
                value={trfNumber}
                onChange={(e) => { setTrfNumber(e.target.value); setLookupDone(false); }}
                onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                sx={{ flex: 1 }}
                InputProps={{ sx: { borderRadius: "10px" } }}
              />
              <Button
                variant="outlined"
                onClick={handleLookup}
                disabled={lookupLoading || !trfNumber.trim()}
                startIcon={lookupLoading ? <CircularProgress size={14} color="inherit" /> : <SearchRoundedIcon />}
                sx={{ borderRadius: "10px", minWidth: 110, alignSelf: "flex-start", mt: 0 }}
              >
                {lookupLoading ? "Looking…" : "Look Up"}
              </Button>
            </Box>

            {/* Current name — shown after lookup */}
            {lookupDone && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Box sx={{
                  px: 2, py: 1.2, borderRadius: "10px",
                  background: isDark ? "rgba(16,185,129,0.08)" : "rgba(16,185,129,0.06)",
                  border: "1px solid rgba(16,185,129,0.25)",
                }}>
                  <Typography variant="caption" sx={{ color: "#10b981", fontWeight: 600, fontSize: "0.72rem" }}>
                    Current name: <b>{currentName}</b>
                  </Typography>
                </Box>
              </motion.div>
            )}

            {/* New name */}
            <TextField
              label="New Project Name"
              placeholder="Enter updated name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && lookupDone && handleUpdate()}
              disabled={!lookupDone}
              InputProps={{ sx: { borderRadius: "10px" } }}
              helperText={lookupDone ? "Edit the name above then click Update" : "Look up a TRF first"}
            />
          </Box>

          <Button
            variant="contained" fullWidth
            disabled={loading || success || !lookupDone}
            onClick={handleUpdate}
            component={motion.button}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            startIcon={
              loading ? <CircularProgress size={16} color="inherit" /> :
              success ? <CheckCircleRoundedIcon /> :
              <EditRoundedIcon />
            }
            sx={{
              mt: 3, py: 1.3, borderRadius: "12px", fontSize: "0.9rem",
              background: success
                ? "linear-gradient(135deg,#10b981,#34d399)"
                : "linear-gradient(135deg,#f59e0b,#fbbf24)",
              color: "#fff",
              boxShadow: "0 6px 16px rgba(245,158,11,0.3)",
            }}
          >
            {loading ? "Updating…" : success ? "Updated!" : "Update TRF"}
          </Button>
        </Box>
      </motion.div>
    </Box>
  );
}
