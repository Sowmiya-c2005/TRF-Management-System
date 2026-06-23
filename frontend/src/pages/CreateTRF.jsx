import { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import AddBoxRoundedIcon        from "@mui/icons-material/AddBoxRounded";
import CheckCircleRoundedIcon   from "@mui/icons-material/CheckCircleRounded";
import FolderOpenRoundedIcon    from "@mui/icons-material/FolderOpenRounded";
import DescriptionRoundedIcon   from "@mui/icons-material/DescriptionRounded";
import AssessmentRoundedIcon    from "@mui/icons-material/AssessmentRounded";
import DrawRoundedIcon          from "@mui/icons-material/DrawRounded";
import GavelRoundedIcon         from "@mui/icons-material/GavelRounded";
import TaskRoundedIcon          from "@mui/icons-material/TaskRounded";
import ListAltRoundedIcon       from "@mui/icons-material/ListAltRounded";

import { createTRF } from "../services/trfService";
import { useApp }    from "../context/AppContext";

const FOLDERS = [
  { name: "Documents",       icon: <DescriptionRoundedIcon /> },
  { name: "Reports",         icon: <AssessmentRoundedIcon /> },
  { name: "Drawings",        icon: <DrawRoundedIcon /> },
  { name: "Approvals",       icon: <GavelRoundedIcon /> },
  { name: "Final Submission",icon: <TaskRoundedIcon /> },
];

const chipFade = {
  initial: { opacity: 0, y: 10 },
  animate: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.3 } }),
};

export default function CreateTRF() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";
  const navigate = useNavigate();
  const { addActivity, addNotification, user } = useApp();

  const [trfNumber,   setTrfNumber]   = useState("");
  const [projectName, setProjectName] = useState("");
  const [loading,     setLoading]     = useState(false);
  const [success,     setSuccess]     = useState(false);

  const cardBg = isDark ? "rgba(15,23,42,0.72)" : "rgba(255,255,255,0.88)";
  const border = isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.2)";

  const handleCreate = async () => {
    if (!trfNumber.trim() || !projectName.trim()) {
      toast.error("Please fill in both fields.");
      return;
    }
    setLoading(true);
    try {
      const res = await createTRF(trfNumber.trim(), projectName.trim());
      setSuccess(true);

      // ── Wire activity feed + notification ──────────────────────────────
      const actor = user?.username || "Admin";
      addActivity(`${trfNumber.trim()} created — ${projectName.trim()}`, actor);
      addNotification({
        title: `${trfNumber.trim()} created`,
        body:  `Project: ${projectName.trim()}`,
        color: "#6366f1",
        type:  "trf",
      });

      toast.success(`TRF ${trfNumber.trim()} created successfully!`);
      setTimeout(() => {
        setTrfNumber("");
        setProjectName("");
        setSuccess(false);
      }, 2000);
    } catch (e) {
      toast.error(e.message || "Failed to create TRF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 680, mx: "auto" }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, fontSize: "1.6rem", color: theme.palette.text.primary }}>
            Create TRF
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
            Register a new Technical Review Form. Folders are created automatically.
          </Typography>
        </Box>
      </motion.div>

      {/* Form */}
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.35 }}>
        <Box sx={{ p: 3.5, borderRadius: "18px", background: cardBg, backdropFilter: "blur(20px)", border: `1px solid ${border}`, mb: 2.5 }}>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
            <Box sx={{
              width: 40, height: 40, borderRadius: "10px",
              background: "linear-gradient(135deg,#6366f1,#06b6d4)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <AddBoxRoundedIcon sx={{ color: "#fff", fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={700} sx={{ fontSize: "0.95rem" }}>TRF Details</Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>Fill in the required information below</Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField
              label="TRF Number"
              placeholder="e.g. TRF-2026-105"
              fullWidth
              value={trfNumber}
              onChange={(e) => setTrfNumber(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              helperText="Unique identifier — must not already exist"
              InputProps={{ sx: { borderRadius: "10px", fontSize: "0.9rem" } }}
            />
            <TextField
              label="Project Name"
              placeholder="e.g. Bridge Inspection Phase 2"
              fullWidth
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              helperText="Descriptive name for the associated project"
              InputProps={{ sx: { borderRadius: "10px", fontSize: "0.9rem" } }}
            />
          </Box>

          <Box sx={{ display: "flex", gap: 1.5, mt: 3.5 }}>
            <Button
              variant="contained" fullWidth
              disabled={loading || success}
              onClick={handleCreate}
              component={motion.button}
              whileHover={!loading && !success ? { scale: 1.02 } : {}}
              whileTap={!loading  && !success ? { scale: 0.98 } : {}}
              startIcon={
                loading ? <CircularProgress size={16} color="inherit" /> :
                success ? <CheckCircleRoundedIcon /> :
                <AddBoxRoundedIcon />
              }
              sx={{
                py: 1.3, borderRadius: "12px", fontSize: "0.9rem",
                background: success
                  ? "linear-gradient(135deg,#10b981,#34d399)"
                  : "linear-gradient(135deg,#6366f1,#06b6d4)",
                boxShadow: "0 8px 20px rgba(99,102,241,0.28)",
                "&:hover": { boxShadow: "0 12px 28px rgba(99,102,241,0.4)" },
              }}
            >
              {loading ? "Creating…" : success ? "Created!" : "Create TRF"}
            </Button>
            <Button
              variant="outlined"
              startIcon={<ListAltRoundedIcon />}
              sx={{ py: 1.3, borderRadius: "12px", minWidth: 120 }}
              onClick={() => navigate("/all")}
            >
              View All
            </Button>
          </Box>
        </Box>
      </motion.div>

      {/* Folder info */}
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.35 }}>
        <Box sx={{ p: 3, borderRadius: "18px", background: cardBg, backdropFilter: "blur(20px)", border: `1px solid ${border}` }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
            <FolderOpenRoundedIcon sx={{ color: theme.palette.primary.main, fontSize: 19 }} />
            <Typography variant="subtitle2" fontWeight={700}>Auto-created folder structure</Typography>
          </Box>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {FOLDERS.map((f, i) => (
              <motion.div key={f.name} custom={i} variants={chipFade} initial="initial" animate="animate">
                <Chip
                  icon={<Box sx={{ "& svg": { fontSize: "14px !important", color: theme.palette.primary.main } }}>{f.icon}</Box>}
                  label={f.name}
                  variant="outlined"
                  sx={{
                    fontWeight: 500, fontSize: "0.78rem", borderRadius: "8px",
                    borderColor: isDark ? "rgba(148,163,184,0.2)" : "rgba(148,163,184,0.3)",
                    "&:hover": { borderColor: theme.palette.primary.main, background: "rgba(99,102,241,0.05)" },
                  }}
                />
              </motion.div>
            ))}
          </Box>
        </Box>
      </motion.div>
    </Box>
  );
}
