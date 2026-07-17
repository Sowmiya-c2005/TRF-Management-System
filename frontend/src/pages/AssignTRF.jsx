/**
 * AssignTRF.jsx — Enterprise Project Assignment Module
 * Admin-only page to assign TRFs to Managers and Engineers
 * with Priority, Due Date, and Remarks.
 */
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@mui/material/styles";
import toast from "react-hot-toast";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Avatar from "@mui/material/Avatar";
import Autocomplete from "@mui/material/Autocomplete";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import Grid from "@mui/material/Grid";
import LinearProgress from "@mui/material/LinearProgress";

import AssignmentIndRoundedIcon   from "@mui/icons-material/AssignmentIndRounded";
import PersonRoundedIcon          from "@mui/icons-material/PersonRounded";
import EngineeringRoundedIcon     from "@mui/icons-material/EngineeringRounded";
import PriorityHighRoundedIcon    from "@mui/icons-material/PriorityHighRounded";
import CalendarMonthRoundedIcon   from "@mui/icons-material/CalendarMonthRounded";
import NotesRoundedIcon           from "@mui/icons-material/NotesRounded";
import CheckCircleRoundedIcon     from "@mui/icons-material/CheckCircleRounded";
import SearchRoundedIcon          from "@mui/icons-material/SearchRounded";
import TagRoundedIcon             from "@mui/icons-material/TagRounded";
import WarningAmberRoundedIcon    from "@mui/icons-material/WarningAmberRounded";
import InfoRoundedIcon            from "@mui/icons-material/InfoRounded";

import { getAllTRFs } from "../services/trfService";
import { getAssignableUsers, assignTRF, getTRFAssignmentDetail } from "../services/assignmentService";
import { useApp } from "../context/AppContext";

const PRIORITY_OPTIONS = [
  { value: "Low",      label: "Low",      color: "#10b981", bg: "rgba(16,185,129,0.12)"  },
  { value: "Medium",   label: "Medium",   color: "#f59e0b", bg: "rgba(245,158,11,0.12)"  },
  { value: "High",     label: "High",     color: "#f97316", bg: "rgba(249,115,22,0.12)"  },
  { value: "Critical", label: "Critical", color: "#ef4444", bg: "rgba(239,68,68,0.12)"   },
];

const STATUS_COLORS = {
  Draft:        { color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
  Assigned:     { color: "#6366f1", bg: "rgba(99,102,241,0.12)"  },
  "In Progress":{ color: "#f59e0b", bg: "rgba(245,158,11,0.12)"  },
  "Under Review":{ color: "#06b6d4", bg: "rgba(6,182,212,0.12)"  },
  Approved:     { color: "#10b981", bg: "rgba(16,185,129,0.12)"  },
  Completed:    { color: "#8b5cf6", bg: "rgba(139,92,246,0.12)"  },
  Archived:     { color: "#475569", bg: "rgba(71,85,105,0.12)"   },
};

function PriorityBadge({ value }) {
  const p = PRIORITY_OPTIONS.find(o => o.value === value) || PRIORITY_OPTIONS[1];
  return (
    <Chip
      size="small"
      label={p.label}
      sx={{ fontSize: "0.7rem", fontWeight: 700, background: p.bg, color: p.color, border: `1px solid ${p.color}33` }}
    />
  );
}

function StatusBadge({ value }) {
  const s = STATUS_COLORS[value] || STATUS_COLORS.Draft;
  return (
    <Chip
      size="small"
      label={value}
      sx={{ fontSize: "0.7rem", fontWeight: 700, background: s.bg, color: s.color, border: `1px solid ${s.color}33` }}
    />
  );
}

function UserAvatar({ name, size = 28 }) {
  const initials = (name || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  return (
    <Avatar sx={{ width: size, height: size, fontSize: size * 0.38, fontWeight: 800, background: "linear-gradient(135deg,#6366f1,#06b6d4)" }}>
      {initials}
    </Avatar>
  );
}

export default function AssignTRF() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { user, addActivity, addNotification } = useApp();
  const [searchParams] = useSearchParams();

  // Data state
  const [trfs,      setTrfs]      = useState([]);
  const [managers,  setManagers]  = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [submitting,setSubmitting]= useState(false);
  const [success,   setSuccess]   = useState(false);

  // Form state
  const [selectedTRF,       setSelectedTRF]       = useState(null);
  const [selectedManager,   setSelectedManager]   = useState(null);
  const [selectedEngineers, setSelectedEngineers] = useState([]);
  const [priority,          setPriority]          = useState("Medium");
  const [dueDate,           setDueDate]           = useState("");
  const [remarks,           setRemarks]           = useState("");

  // Existing assignment preview
  const [existingAssignment, setExistingAssignment] = useState(null);
  const [loadingExisting,    setLoadingExisting]    = useState(false);

  const cardBg = isDark ? "rgba(15,23,42,0.72)" : "rgba(255,255,255,0.88)";
  const border  = isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.2)";

  // Load TRFs and users
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [trfRes, userRes] = await Promise.all([getAllTRFs(), getAssignableUsers()]);
        const allTrfs = Array.isArray(trfRes.data) ? trfRes.data : [];
        setTrfs(allTrfs);
        setManagers(userRes.data?.managers  || []);
        setEngineers(userRes.data?.engineers || []);

        // Pre-select TRF from URL param
        const paramTrf = searchParams.get("trf");
        if (paramTrf) {
          const found = allTrfs.find(t => t.trf_number === paramTrf);
          if (found) setSelectedTRF(found);
        }
      } catch (e) {
        toast.error("Failed to load data. Please check your connection.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []); // eslint-disable-line

  // Load existing assignment when a TRF is selected
  useEffect(() => {
    if (!selectedTRF?.id) { setExistingAssignment(null); return; }
    setLoadingExisting(true);
    getTRFAssignmentDetail(selectedTRF.id)
      .then(res => {
        const d = res.data;
        setExistingAssignment(d);
        // Pre-fill form with existing values
        if (d.manager)    setSelectedManager(managers.find(m => m.id === d.manager.id) || null);
        if (d.engineers && d.engineers.length) {
          setSelectedEngineers(engineers.filter(e => d.engineers.some(ae => ae.id === e.id)));
        }
        if (d.priority)   setPriority(d.priority);
        if (d.due_date)   setDueDate(d.due_date.slice(0, 10)); // ISO → YYYY-MM-DD
        if (d.remarks)    setRemarks(d.remarks);
      })
      .catch(() => setExistingAssignment(null))
      .finally(() => setLoadingExisting(false));
  }, [selectedTRF?.id, managers, engineers]); // eslint-disable-line

  const handleSubmit = async () => {
    if (!selectedTRF) { toast.error("Select a TRF first"); return; }

    setSubmitting(true);
    try {
      const payload = {
        trf_id:      selectedTRF.id,
        manager_id:  selectedManager?.id  || null,
        engineer_ids: selectedEngineers.map(e => e.id),
        priority,
        due_date:    dueDate ? new Date(dueDate).toISOString() : null,
        remarks:     remarks || null,
      };

      const res = await assignTRF(payload);
      const data = res.data;

      addActivity(
        `${selectedTRF.trf_number} assigned — ${selectedManager?.display_name || "no manager"}, ${selectedEngineers.length} engineer(s)`,
        user?.displayName || "Admin"
      );
      addNotification({
        title: `${selectedTRF.trf_number} Assigned`,
        body:  `Manager: ${selectedManager?.display_name || "—"} · Engineers: ${selectedEngineers.length}`,
        color: "#6366f1",
        type:  "assignment",
      });

      toast.success(`TRF ${data.trf_number} assigned successfully!`);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3500);

      // Refresh existing assignment preview
      const refreshed = await getTRFAssignmentDetail(selectedTRF.id);
      setExistingAssignment(refreshed.data);
    } catch (e) {
      toast.error(e?.response?.data?.detail || e?.message || "Assignment failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedTRF(null);
    setSelectedManager(null);
    setSelectedEngineers([]);
    setPriority("Medium");
    setDueDate("");
    setRemarks("");
    setExistingAssignment(null);
    setSuccess(false);
  };

  const priorityInfo = PRIORITY_OPTIONS.find(p => p.value === priority) || PRIORITY_OPTIONS[1];

  if (loading) {
    return (
      <Box sx={{ maxWidth: 900, mx: "auto" }}>
        <LinearProgress sx={{ borderRadius: 4, mb: 4, "& .MuiLinearProgress-bar": { background: "linear-gradient(90deg,#6366f1,#06b6d4)" } }} />
        <Typography sx={{ color: theme.palette.text.secondary, textAlign: "center" }}>Loading assignment data…</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 960, mx: "auto" }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
          <Box sx={{
            width: 48, height: 48, borderRadius: "14px",
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 24px rgba(99,102,241,0.40)",
          }}>
            <AssignmentIndRoundedIcon sx={{ color: "#fff", fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, fontSize: "1.65rem", color: theme.palette.text.primary, lineHeight: 1.2 }}>
              Project Assignment
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: "0.83rem" }}>
              Assign TRFs to Managers and Engineers with priority, deadlines, and remarks
            </Typography>
          </Box>
        </Box>
      </motion.div>

      <Grid container spacing={3}>
        {/* ─── LEFT: Assignment Form ─── */}
        <Grid item xs={12} md={7}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Box sx={{ p: 3.5, borderRadius: "22px", background: cardBg, border: `1px solid ${border}`, backdropFilter: "blur(24px)", display: "flex", flexDirection: "column", gap: 3 }}>

              {/* TRF Selector */}
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <TagRoundedIcon sx={{ fontSize: 15, color: "#818cf8" }} />
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: theme.palette.text.secondary, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    Select TRF *
                  </Typography>
                </Box>
                <Autocomplete
                  options={trfs}
                  value={selectedTRF}
                  onChange={(_, v) => { setSelectedTRF(v); }}
                  getOptionLabel={o => `${o.trf_number} — ${o.project_name}`}
                  renderInput={params => (
                    <TextField {...params}
                      placeholder="Search TRF number or project name…"
                      InputProps={{ ...params.InputProps, startAdornment: <SearchRoundedIcon sx={{ fontSize: 18, color: theme.palette.text.secondary, mr: 0.5 }} />, sx: { borderRadius: "12px" } }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Chip label={option.trf_number} size="small" sx={{ fontSize: "0.68rem", fontWeight: 700, background: "rgba(99,102,241,0.12)", color: "#818cf8" }} />
                      <Typography sx={{ fontSize: "0.84rem", color: theme.palette.text.primary }}>{option.project_name}</Typography>
                      <Box sx={{ ml: "auto" }}><StatusBadge value={option.status || "Draft"} /></Box>
                    </Box>
                  )}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                />
                {loadingExisting && <LinearProgress sx={{ mt: 1, borderRadius: 4, height: 2 }} />}
              </Box>

              <Divider sx={{ opacity: 0.4 }} />

              {/* Manager */}
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <PersonRoundedIcon sx={{ fontSize: 15, color: "#fcd34d" }} />
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: theme.palette.text.secondary, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    Assign Manager
                  </Typography>
                </Box>
                <Autocomplete
                  options={managers}
                  value={selectedManager}
                  onChange={(_, v) => setSelectedManager(v)}
                  getOptionLabel={o => o.display_name}
                  renderInput={params => (
                    <TextField {...params}
                      placeholder="Select a Manager…"
                      InputProps={{ ...params.InputProps, sx: { borderRadius: "12px" } }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <UserAvatar name={option.display_name} size={28} />
                      <Box>
                        <Typography sx={{ fontSize: "0.84rem", fontWeight: 600, color: theme.palette.text.primary }}>{option.display_name}</Typography>
                        <Typography sx={{ fontSize: "0.7rem", color: theme.palette.text.secondary }}>{option.email}</Typography>
                      </Box>
                    </Box>
                  )}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                />
              </Box>

              {/* Engineers (multi-select) */}
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <EngineeringRoundedIcon sx={{ fontSize: 15, color: "#67e8f9" }} />
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: theme.palette.text.secondary, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    Assign Engineers
                  </Typography>
                  {selectedEngineers.length > 0 && (
                    <Chip label={`${selectedEngineers.length} selected`} size="small"
                      sx={{ fontSize: "0.68rem", background: "rgba(6,182,212,0.12)", color: "#06b6d4", ml: "auto" }} />
                  )}
                </Box>
                <Autocomplete
                  multiple
                  options={engineers}
                  value={selectedEngineers}
                  onChange={(_, v) => setSelectedEngineers(v)}
                  getOptionLabel={o => o.display_name}
                  renderInput={params => (
                    <TextField {...params}
                      placeholder={selectedEngineers.length ? "" : "Select one or more Engineers…"}
                      InputProps={{ ...params.InputProps, sx: { borderRadius: "12px" } }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <UserAvatar name={option.display_name} size={28} />
                      <Box>
                        <Typography sx={{ fontSize: "0.84rem", fontWeight: 600, color: theme.palette.text.primary }}>{option.display_name}</Typography>
                        <Typography sx={{ fontSize: "0.7rem", color: theme.palette.text.secondary }}>{option.email}</Typography>
                      </Box>
                    </Box>
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        key={option.id}
                        {...getTagProps({ index })}
                        label={option.display_name}
                        avatar={<UserAvatar name={option.display_name} size={20} />}
                        size="small"
                        sx={{ fontSize: "0.75rem", fontWeight: 600, background: "rgba(6,182,212,0.10)", color: "#06b6d4" }}
                      />
                    ))
                  }
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                />
              </Box>

              <Divider sx={{ opacity: 0.4 }} />

              {/* Priority + Due Date */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <PriorityHighRoundedIcon sx={{ fontSize: 15, color: priorityInfo.color }} />
                    <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: theme.palette.text.secondary, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                      Priority
                    </Typography>
                  </Box>
                  <TextField
                    select fullWidth value={priority}
                    onChange={e => setPriority(e.target.value)}
                    InputProps={{ sx: { borderRadius: "12px" } }}
                  >
                    {PRIORITY_OPTIONS.map(p => (
                      <MenuItem key={p.value} value={p.value}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: p.color }} />
                          <Typography sx={{ fontSize: "0.85rem", color: p.color, fontWeight: 600 }}>{p.label}</Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <CalendarMonthRoundedIcon sx={{ fontSize: 15, color: "#a78bfa" }} />
                    <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: theme.palette.text.secondary, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                      Due Date
                    </Typography>
                  </Box>
                  <TextField
                    fullWidth type="date" value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    InputProps={{ sx: { borderRadius: "12px" } }}
                    inputProps={{ min: new Date().toISOString().slice(0, 10) }}
                  />
                </Grid>
              </Grid>

              {/* Remarks */}
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <NotesRoundedIcon sx={{ fontSize: 15, color: "#94a3b8" }} />
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: theme.palette.text.secondary, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    Remarks / Notes
                  </Typography>
                </Box>
                <TextField
                  fullWidth multiline rows={3} value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  placeholder="Optional notes or instructions for the assigned team…"
                  InputProps={{ sx: { borderRadius: "12px" } }}
                />
              </Box>

              {/* Actions */}
              <Box sx={{ display: "flex", gap: 1.5, mt: 0.5 }}>
                <Button variant="outlined" onClick={handleReset} sx={{ borderRadius: "12px", flex: 1 }}>
                  Reset
                </Button>
                <motion.div style={{ flex: 2 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    fullWidth variant="contained"
                    onClick={handleSubmit}
                    disabled={submitting || !selectedTRF}
                    startIcon={
                      submitting ? <CircularProgress size={16} color="inherit" /> :
                      success    ? <CheckCircleRoundedIcon /> :
                      <AssignmentIndRoundedIcon />
                    }
                    sx={{
                      py: 1.5, borderRadius: "12px", fontWeight: 700, fontSize: "0.95rem",
                      background: success
                        ? "linear-gradient(135deg,#10b981,#34d399)"
                        : "linear-gradient(135deg,#6366f1,#8b5cf6)",
                      boxShadow: success
                        ? "0 8px 24px rgba(16,185,129,0.35)"
                        : "0 8px 24px rgba(99,102,241,0.40)",
                      "&:disabled": { opacity: 0.6 },
                    }}
                  >
                    {submitting ? "Assigning…" : success ? "Assigned!" : "Assign Project"}
                  </Button>
                </motion.div>
              </Box>
            </Box>
          </motion.div>
        </Grid>

        {/* ─── RIGHT: Preview & Info ─── */}
        <Grid item xs={12} md={5}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>

            {/* Current Assignment Preview */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Box sx={{ p: 3, borderRadius: "22px", background: cardBg, border: `1px solid ${border}`, backdropFilter: "blur(24px)" }}>
                <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: "#818cf8", mb: 2, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Current Assignment
                </Typography>

                <AnimatePresence mode="wait">
                  {!selectedTRF ? (
                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <Box sx={{ py: 4, display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
                        <AssignmentIndRoundedIcon sx={{ fontSize: 40, color: theme.palette.text.disabled }} />
                        <Typography sx={{ color: theme.palette.text.secondary, fontSize: "0.85rem", fontWeight: 500 }}>
                          Select a TRF to view its current assignment
                        </Typography>
                      </Box>
                    </motion.div>
                  ) : loadingExisting ? (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <LinearProgress sx={{ borderRadius: 4, "& .MuiLinearProgress-bar": { background: "linear-gradient(90deg,#6366f1,#06b6d4)" } }} />
                    </motion.div>
                  ) : existingAssignment ? (
                    <motion.div key="data" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {/* TRF Info */}
                        <Box sx={{ p: 2, borderRadius: "12px", background: isDark ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.15)" }}>
                          <Typography sx={{ fontSize: "0.72rem", color: "#818cf8", fontWeight: 700, mb: 0.5 }}>TRF</Typography>
                          <Typography sx={{ fontSize: "0.9rem", fontWeight: 700, color: theme.palette.text.primary }}>{existingAssignment.trf_number}</Typography>
                          <Typography sx={{ fontSize: "0.78rem", color: theme.palette.text.secondary, mt: 0.25 }}>{existingAssignment.project_name}</Typography>
                          <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
                            <StatusBadge value={existingAssignment.status} />
                            <PriorityBadge value={existingAssignment.priority} />
                          </Box>
                        </Box>

                        {/* Manager */}
                        <Box>
                          <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: theme.palette.text.disabled, letterSpacing: "0.08em", textTransform: "uppercase", mb: 1 }}>Manager</Typography>
                          {existingAssignment.manager ? (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                              <UserAvatar name={existingAssignment.manager.display_name} />
                              <Box>
                                <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: theme.palette.text.primary }}>{existingAssignment.manager.display_name}</Typography>
                                <Typography sx={{ fontSize: "0.7rem", color: theme.palette.text.secondary }}>{existingAssignment.manager.email}</Typography>
                              </Box>
                            </Box>
                          ) : (
                            <Typography sx={{ fontSize: "0.83rem", color: theme.palette.text.disabled }}>Not assigned</Typography>
                          )}
                        </Box>

                        {/* Engineers */}
                        <Box>
                          <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: theme.palette.text.disabled, letterSpacing: "0.08em", textTransform: "uppercase", mb: 1 }}>
                            Engineers ({existingAssignment.engineers?.length || 0})
                          </Typography>
                          {existingAssignment.engineers?.length > 0 ? (
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                              {existingAssignment.engineers.map(e => (
                                <Box key={e.id} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                  <UserAvatar name={e.display_name} size={26} />
                                  <Box>
                                    <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: theme.palette.text.primary }}>{e.display_name}</Typography>
                                    <Typography sx={{ fontSize: "0.68rem", color: theme.palette.text.secondary }}>{e.email}</Typography>
                                  </Box>
                                </Box>
                              ))}
                            </Box>
                          ) : (
                            <Typography sx={{ fontSize: "0.83rem", color: theme.palette.text.disabled }}>No engineers assigned</Typography>
                          )}
                        </Box>

                        {/* Due Date & Remarks */}
                        {(existingAssignment.due_date || existingAssignment.remarks) && (
                          <Box sx={{ pt: 1, borderTop: `1px solid ${border}` }}>
                            {existingAssignment.due_date && (
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75 }}>
                                <CalendarMonthRoundedIcon sx={{ fontSize: 14, color: "#a78bfa" }} />
                                <Typography sx={{ fontSize: "0.78rem", color: theme.palette.text.secondary }}>
                                  Due: <b style={{ color: theme.palette.text.primary }}>{new Date(existingAssignment.due_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</b>
                                </Typography>
                              </Box>
                            )}
                            {existingAssignment.remarks && (
                              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                                <NotesRoundedIcon sx={{ fontSize: 14, color: "#94a3b8", mt: 0.2 }} />
                                <Typography sx={{ fontSize: "0.78rem", color: theme.palette.text.secondary, fontStyle: "italic" }}>
                                  {existingAssignment.remarks}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        )}
                      </Box>
                    </motion.div>
                  ) : (
                    <motion.div key="unassigned" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <Box sx={{ py: 3, display: "flex", alignItems: "center", gap: 1.5 }}>
                        <WarningAmberRoundedIcon sx={{ fontSize: 20, color: "#f59e0b" }} />
                        <Typography sx={{ color: theme.palette.text.secondary, fontSize: "0.83rem" }}>
                          This TRF has no assignment yet.
                        </Typography>
                      </Box>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Box>
            </motion.div>

            {/* Info card */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
              <Box sx={{ p: 2.5, borderRadius: "18px", background: isDark ? "rgba(99,102,241,0.06)" : "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.18)" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                  <InfoRoundedIcon sx={{ fontSize: 16, color: "#818cf8" }} />
                  <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, color: "#818cf8", letterSpacing: "0.08em", textTransform: "uppercase" }}>How it works</Typography>
                </Box>
                {[
                  "Select the TRF to assign from the dropdown",
                  "Pick a Manager who will oversee the project",
                  "Select one or more Engineers to work on it",
                  "Set priority level and due date",
                  "Add optional notes/remarks for the team",
                  "Click Assign — email + in-app notifications sent automatically",
                ].map((text, i) => (
                  <Box key={i} sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 0.75 }}>
                    <Box sx={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(99,102,241,0.20)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, mt: 0.15 }}>
                      <Typography sx={{ fontSize: "0.6rem", fontWeight: 800, color: "#818cf8" }}>{i + 1}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: "0.78rem", color: theme.palette.text.secondary }}>{text}</Typography>
                  </Box>
                ))}
              </Box>
            </motion.div>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
