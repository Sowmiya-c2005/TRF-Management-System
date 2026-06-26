import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@mui/material/styles";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import toast from "react-hot-toast";

import AddBoxRoundedIcon        from "@mui/icons-material/AddBoxRounded";
import CheckCircleRoundedIcon   from "@mui/icons-material/CheckCircleRounded";
import FolderRoundedIcon        from "@mui/icons-material/FolderRounded";
import ListAltRoundedIcon       from "@mui/icons-material/ListAltRounded";
import CloudUploadRoundedIcon   from "@mui/icons-material/CloudUploadRounded";
import ArrowForwardRoundedIcon  from "@mui/icons-material/ArrowForwardRounded";
import ArrowBackRoundedIcon     from "@mui/icons-material/ArrowBackRounded";
import TagRoundedIcon           from "@mui/icons-material/TagRounded";
import BusinessCenterRoundedIcon from "@mui/icons-material/BusinessCenterRounded";

import { createTRF } from "../services/trfService";
import { useApp }    from "../context/AppContext";

const FOLDERS = [
  { name: "Documents",         color: "#6366f1", bg: "rgba(99,102,241,0.12)" },
  { name: "Reports",           color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  { name: "Drawings",          color: "#06b6d4", bg: "rgba(6,182,212,0.12)" },
  { name: "Approvals",         color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  { name: "Final Submission",  color: "#a855f7", bg: "rgba(168,85,247,0.12)" },
];

const STEPS = ["Enter Details", "Preview Structure", "Success"];

export default function CreateTRF() {
  const theme   = useTheme();
  const isDark  = theme.palette.mode === "dark";
  const navigate = useNavigate();
  const { addActivity, addNotification, user } = useApp();

  const [step,        setStep]       = useState(0);
  const [trfNumber,   setTrfNumber]  = useState("");
  const [projectName, setProjectName]= useState("");
  const [errors,      setErrors]     = useState({});
  const [loading,     setLoading]    = useState(false);

  const cardBg = isDark ? "rgba(15,23,42,0.72)" : "rgba(255,255,255,0.88)";
  const border  = isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.2)";

  const validate = () => {
    const e = {};
    if (!trfNumber.trim())   e.trfNumber   = "TRF number is required";
    if (!projectName.trim()) e.projectName = "Project name is required";
    return e;
  };

  const handleNext = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setStep(1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await createTRF(trfNumber.trim(), projectName.trim());
      const actor = user?.username || "Admin";
      const spStatus = res.data?.sharepoint_status || "success";
      const spMsg    = res.data?.sharepoint_message || "";

      addActivity(`${trfNumber.trim()} created — "${projectName.trim()}"`, actor);
      addNotification({
        title: `${trfNumber.trim()} created`,
        body:  `"${projectName.trim()}" is ready · SharePoint: ${spStatus}`,
        color: spStatus === "failed" ? "#ef4444" : spStatus === "partial" ? "#f59e0b" : "#6366f1",
        type:  "trf",
      });

      // Show SharePoint-aware success message
      if (spStatus === "failed") {
        toast(`TRF created (local only — SharePoint unavailable)`, { icon: "⚠️" });
      } else if (spStatus === "partial") {
        toast(`TRF created — some SharePoint folders failed`, { icon: "⚠️" });
      } else {
        toast.success("TRF created successfully! 🎉");
      }
      setStep(2);
    } catch (e) {
      toast.error(e.message || "Failed to create TRF");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setTrfNumber(""); setProjectName(""); setErrors({}); setStep(0);
  };

  return (
    <Box sx={{ maxWidth: 640, mx: "auto" }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
          <Box sx={{
            width: 44, height: 44, borderRadius: "13px",
            background: "linear-gradient(135deg,#6366f1,#06b6d4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 20px rgba(99,102,241,0.35)",
          }}>
            <AddBoxRoundedIcon sx={{ color: "#fff", fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, fontSize: "1.65rem", color: theme.palette.text.primary, lineHeight: 1.2 }}>
              Create TRF
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: "0.82rem" }}>
              New Technical Request Form with auto-generated folders
            </Typography>
          </Box>
        </Box>
      </motion.div>

      {/* Stepper */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }}>
        <Box sx={{ mb: 4 }}>
          <Stepper activeStep={step} alternativeLabel>
            {STEPS.map((label, i) => (
              <Step key={label} completed={step > i}>
                <StepLabel
                  StepIconProps={{
                    sx: {
                      "&.Mui-active":    { color: "#6366f1" },
                      "&.Mui-completed": { color: "#10b981" },
                    },
                  }}
                >
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: step === i ? 700 : 400 }}>
                    {label}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
      </motion.div>

      {/* Step panels */}
      <AnimatePresence mode="wait">
        {/* ─ Step 0: Fill details ─ */}
        {step === 0 && (
          <motion.div
            key="step0"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
          >
            <Box sx={{ p: 4, borderRadius: "20px", background: cardBg, border: `1px solid ${border}`, backdropFilter: "blur(20px)" }}>
              <Typography sx={{ fontWeight: 700, fontSize: "1rem", mb: 3, color: theme.palette.text.primary }}>
                TRF Information
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <Box>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, mb: 0.75, color: theme.palette.text.secondary }}>
                    TRF Number *
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="e.g. TRF-2026-101"
                    value={trfNumber}
                    onChange={e => { setTrfNumber(e.target.value); setErrors(p => ({ ...p, trfNumber: "" })); }}
                    error={!!errors.trfNumber}
                    helperText={errors.trfNumber}
                    onKeyDown={e => e.key === "Enter" && handleNext()}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 0.5, color: errors.trfNumber ? theme.palette.error.main : theme.palette.text.secondary, display: "flex" }}>
                          <TagRoundedIcon sx={{ fontSize: 18 }} />
                        </Box>
                      ),
                      sx: { borderRadius: "12px" },
                    }}
                  />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, mb: 0.75, color: theme.palette.text.secondary }}>
                    Project Name *
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="e.g. Bridge Expansion Phase 3"
                    value={projectName}
                    onChange={e => { setProjectName(e.target.value); setErrors(p => ({ ...p, projectName: "" })); }}
                    error={!!errors.projectName}
                    helperText={errors.projectName}
                    onKeyDown={e => e.key === "Enter" && handleNext()}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 0.5, color: errors.projectName ? theme.palette.error.main : theme.palette.text.secondary, display: "flex" }}>
                          <BusinessCenterRoundedIcon sx={{ fontSize: 18 }} />
                        </Box>
                      ),
                      sx: { borderRadius: "12px" },
                    }}
                  />
                </Box>
              </Box>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  fullWidth variant="contained"
                  onClick={handleNext}
                  endIcon={<ArrowForwardRoundedIcon />}
                  sx={{
                    mt: 3.5, py: 1.4, borderRadius: "12px", fontWeight: 700,
                    background: "linear-gradient(135deg,#6366f1,#06b6d4)",
                    boxShadow: "0 8px 24px rgba(99,102,241,0.35)",
                  }}
                >
                  Preview Structure
                </Button>
              </motion.div>
            </Box>
          </motion.div>
        )}

        {/* ─ Step 1: Preview ─ */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
          >
            <Box sx={{ p: 4, borderRadius: "20px", background: cardBg, border: `1px solid ${border}`, backdropFilter: "blur(20px)" }}>
              {/* Summary */}
              <Box sx={{ mb: 3, p: 2.5, borderRadius: "14px", background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.18)" }}>
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#818cf8", mb: 1, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  TRF Summary
                </Typography>
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  <Box>
                    <Typography sx={{ fontSize: "0.68rem", color: theme.palette.text.disabled }}>TRF Number</Typography>
                    <Typography sx={{ fontSize: "0.9rem", fontWeight: 700, color: theme.palette.text.primary }}>{trfNumber}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: "0.68rem", color: theme.palette.text.disabled }}>Project Name</Typography>
                    <Typography sx={{ fontSize: "0.9rem", fontWeight: 700, color: theme.palette.text.primary }}>{projectName}</Typography>
                  </Box>
                </Box>
              </Box>

              <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", mb: 2, color: theme.palette.text.primary }}>
                Folders to be created automatically
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 3 }}>
                {FOLDERS.map((f, i) => (
                  <motion.div key={f.name} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.07 }}>
                    <Chip
                      icon={<FolderRoundedIcon sx={{ fontSize: 15, color: `${f.color} !important` }} />}
                      label={f.name}
                      sx={{ fontSize: "0.8rem", fontWeight: 600, background: f.bg, color: f.color, border: `1px solid ${f.color}33`, px: 0.5 }}
                    />
                  </motion.div>
                ))}
              </Box>

              <Box sx={{ display: "flex", gap: 1.5 }}>
                <Button
                  variant="outlined" onClick={() => setStep(0)}
                  startIcon={<ArrowBackRoundedIcon />}
                  sx={{ borderRadius: "12px", flex: 1 }}
                >
                  Back
                </Button>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={{ flex: 2 }}>
                  <Button
                    fullWidth variant="contained"
                    onClick={handleSubmit}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AddBoxRoundedIcon />}
                    sx={{
                      py: 1.4, borderRadius: "12px", fontWeight: 700,
                      background: "linear-gradient(135deg,#6366f1,#06b6d4)",
                      boxShadow: "0 8px 24px rgba(99,102,241,0.35)",
                    }}
                  >
                    {loading ? "Creating…" : "Create TRF"}
                  </Button>
                </motion.div>
              </Box>
            </Box>
          </motion.div>
        )}

        {/* ─ Step 2: Success ─ */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, type: "spring", stiffness: 180 }}
          >
            <Box sx={{
              p: 5, borderRadius: "20px", background: cardBg,
              border: `1px solid ${border}`, backdropFilter: "blur(20px)",
              textAlign: "center",
            }}>
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 220, delay: 0.1 }}
              >
                <Box sx={{
                  width: 80, height: 80, borderRadius: "50%",
                  background: "linear-gradient(135deg,#10b981,#34d399)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  mx: "auto", mb: 3,
                  boxShadow: "0 12px 40px rgba(16,185,129,0.45)",
                }}>
                  <CheckCircleRoundedIcon sx={{ color: "#fff", fontSize: 42 }} />
                </Box>
              </motion.div>

              <Typography variant="h5" sx={{ fontWeight: 800, color: theme.palette.text.primary, mb: 1 }}>
                TRF Created!
              </Typography>
              <Typography sx={{ color: theme.palette.text.secondary, mb: 0.75, fontSize: "0.9rem" }}>
                <Chip label={trfNumber} size="small" sx={{ fontSize: "0.75rem", background: "rgba(99,102,241,0.12)", color: "#818cf8" }} />
                {" "}has been created with all 5 folders.
              </Typography>
              <Typography sx={{ color: theme.palette.text.disabled, fontSize: "0.8rem", mb: 3.5 }}>
                {projectName}
              </Typography>

              <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
                <Button
                  variant="outlined"
                  startIcon={<ListAltRoundedIcon />}
                  onClick={() => navigate("/all")}
                  sx={{ borderRadius: "12px" }}
                >
                  View All TRFs
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CloudUploadRoundedIcon />}
                  onClick={() => navigate(`/upload?trf=${trfNumber}`)}
                  sx={{ borderRadius: "12px" }}
                >
                  Upload Files
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddBoxRoundedIcon />}
                  onClick={handleReset}
                  sx={{ borderRadius: "12px", background: "linear-gradient(135deg,#6366f1,#06b6d4)" }}
                >
                  Create Another
                </Button>
              </Box>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}
