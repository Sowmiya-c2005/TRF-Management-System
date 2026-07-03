import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@mui/material/styles";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Switch from "@mui/material/Switch";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import toast from "react-hot-toast";

import SettingsRoundedIcon      from "@mui/icons-material/SettingsRounded";
import PaletteRoundedIcon       from "@mui/icons-material/PaletteRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import TuneRoundedIcon          from "@mui/icons-material/TuneRounded";
import InfoRoundedIcon          from "@mui/icons-material/InfoRounded";
import DarkModeRoundedIcon      from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon     from "@mui/icons-material/LightModeRounded";
import CheckRoundedIcon         from "@mui/icons-material/CheckRounded";
import RestartAltRoundedIcon    from "@mui/icons-material/RestartAltRounded";
import SaveRoundedIcon          from "@mui/icons-material/SaveRounded";
import FolderSpecialRoundedIcon from "@mui/icons-material/FolderSpecialRounded";
import StorageRoundedIcon       from "@mui/icons-material/StorageRounded";
import FolderOpenRoundedIcon    from "@mui/icons-material/FolderOpenRounded";
import CheckCircleRoundedIcon   from "@mui/icons-material/CheckCircleRounded";
import WarningRoundedIcon       from "@mui/icons-material/WarningRounded";
import RefreshRoundedIcon       from "@mui/icons-material/RefreshRounded";

import { useThemeMode } from "../context/ThemeContext";
import { useApp }       from "../context/AppContext";
import API              from "../services/api";

const TABS = [
  { id: "appearance",    label: "Appearance",    icon: <PaletteRoundedIcon sx={{ fontSize: 18 }} /> },
  { id: "notifications", label: "Notifications", icon: <NotificationsRoundedIcon sx={{ fontSize: 18 }} /> },
  { id: "system",        label: "System",        icon: <TuneRoundedIcon sx={{ fontSize: 18 }} /> },
  { id: "storage",       label: "Storage",       icon: <StorageRoundedIcon sx={{ fontSize: 18 }} />, adminOnly: true },
  { id: "about",         label: "About",         icon: <InfoRoundedIcon sx={{ fontSize: 18 }} /> },
];

function SettingRow({ label, desc, checked, onChange }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1.5 }}>
      <Box>
        <Typography sx={{ fontWeight: 600, fontSize: "0.88rem" }}>{label}</Typography>
        {desc && <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", mt: 0.25 }}>{desc}</Typography>}
      </Box>
      <Switch checked={checked} onChange={e => onChange(e.target.checked)}
        sx={{
          "& .MuiSwitch-thumb": { background: "#fff" },
          "& .Mui-checked + .MuiSwitch-track": { background: "linear-gradient(90deg,#6366f1,#06b6d4) !important" },
        }}
      />
    </Box>
  );
}

const STACK = [
  { label: "React 18", color: "#61dafb" },
  { label: "MUI v5",   color: "#007fff" },
  { label: "FastAPI",  color: "#009688" },
  { label: "SQLite",   color: "#64748b" },
  { label: "Vite",     color: "#646cff" },
  { label: "Recharts", color: "#ff6d00" },
];

// ─── Storage Panel (Admin only) ───────────────────────────────────────────────
function StoragePanel({ cardBg, border, isDark }) {
  const [config,      setConfig]      = useState(null);
  const [customPath,  setCustomPath]  = useState("");
  const [loading,     setLoading]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [validating,  setValidating]  = useState(false);
  const [validation,  setValidation]  = useState(null);  // { usable, path, exists, can_write }

  const load = async () => {
    setLoading(true);
    try {
      const r = await API.get("/admin/storage/");
      setConfig(r.data);
      setCustomPath(r.data.storage_root || "");
    } catch { toast.error("Failed to load storage config"); }
    finally   { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const validate = async () => {
    if (!customPath.trim()) { setValidation(null); return; }
    setValidating(true);
    try {
      const r = await API.post("/admin/storage/validate", { path: customPath.trim() });
      setValidation(r.data);
    } catch { toast.error("Validation failed"); }
    finally { setValidating(false); }
  };

  const save = async () => {
    setSaving(true);
    try {
      const r = await API.put("/admin/storage/", { storage_root: customPath.trim() || null });
      setConfig(r.data);
      setValidation(null);
      toast.success(customPath.trim()
        ? `Storage set to: ${r.data.active_root}`
        : "Storage reset to default");
    } catch (e) { toast.error(e.message || "Save failed"); }
    finally { setSaving(false); }
  };

  const reset = async () => {
    setCustomPath("");
    setSaving(true);
    try {
      const r = await API.put("/admin/storage/", { storage_root: null });
      setConfig(r.data);
      setValidation(null);
      toast.success("Storage reset to default");
    } catch (e) { toast.error(e.message || "Reset failed"); }
    finally { setSaving(false); }
  };

  return (
    <Box>
      <Typography sx={{ fontWeight: 700, fontSize: "1rem", mb: 0.5 }}>Storage Configuration</Typography>
      <Typography sx={{ fontSize: "0.8rem", color: "text.secondary", mb: 3 }}>
        Set a custom directory where all TRF folders and uploaded files will be stored.
        Leave blank to use the default <code style={{ color: "#818cf8" }}>uploads/</code> directory.
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={28} sx={{ color: "#6366f1" }} />
        </Box>
      ) : config && (
        <>
          {/* Current active path */}
          <Box sx={{ p: 2, borderRadius: "12px", background: isDark ? "rgba(16,185,129,0.08)" : "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.25)", mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
              <CheckCircleRoundedIcon sx={{ fontSize: 16, color: "#10b981" }} />
              <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Active Storage Path
              </Typography>
              {config.is_custom && (
                <Chip label="Custom" size="small" sx={{ fontSize: "0.6rem", height: 17, background: "rgba(99,102,241,0.15)", color: "#818cf8", ml: "auto" }} />
              )}
            </Box>
            <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, fontFamily: "monospace", color: "text.primary", wordBreak: "break-all" }}>
              {config.active_root}
            </Typography>
            <Typography sx={{ fontSize: "0.7rem", color: "text.disabled", mt: 0.5 }}>
              Default: {config.env_default}
            </Typography>
          </Box>

          {/* Input */}
          <Box sx={{ mb: 1.5 }}>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, mb: 0.75, color: "text.secondary" }}>
              Custom Storage Directory
            </Typography>
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <TextField
                fullWidth
                placeholder={`e.g. C:\\TRFFiles  or  /data/trf-storage`}
                value={customPath}
                onChange={e => { setCustomPath(e.target.value); setValidation(null); }}
                size="small"
                InputProps={{
                  startAdornment: <InputAdornment position="start"><FolderOpenRoundedIcon sx={{ fontSize: 18 }} /></InputAdornment>,
                  sx: { borderRadius: "10px", fontFamily: "monospace", fontSize: "0.85rem" },
                }}
              />
              <Button variant="outlined" size="small" onClick={validate} disabled={validating || !customPath.trim()}
                sx={{ borderRadius: "10px", minWidth: 100, flexShrink: 0 }}
                startIcon={validating ? <CircularProgress size={14} color="inherit" /> : <CheckRoundedIcon sx={{ fontSize: 15 }} />}>
                {validating ? "Checking…" : "Validate"}
              </Button>
            </Box>
          </Box>

          {/* Validation result */}
          {validation && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Alert
                severity={validation.usable ? "success" : "error"}
                sx={{ mb: 2, borderRadius: "10px", fontSize: "0.78rem" }}
                icon={validation.usable ? <CheckCircleRoundedIcon fontSize="small" /> : <WarningRoundedIcon fontSize="small" />}
              >
                <Box>
                  <b>{validation.usable ? "Path is valid and usable" : "Path cannot be used"}</b>
                  <Box sx={{ mt: 0.5 }}>
                    <code style={{ fontSize: "0.8rem" }}>{validation.path}</code>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1.5, mt: 0.75, flexWrap: "wrap" }}>
                    {[
                      { label: "Exists",    ok: validation.exists },
                      { label: "Directory", ok: validation.is_dir },
                      { label: "Writable",  ok: validation.can_write },
                      { label: "Parent OK", ok: validation.parent_ok },
                    ].map(i => (
                      <Chip key={i.label} label={i.label} size="small"
                        sx={{ fontSize: "0.62rem", height: 18,
                          background: i.ok ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.12)",
                          color: i.ok ? "#10b981" : "#ef4444" }} />
                    ))}
                  </Box>
                </Box>
              </Alert>
            </motion.div>
          )}

          {/* Actions */}
          <Box sx={{ display: "flex", gap: 1.5, mt: 1 }}>
            <Button variant="contained" onClick={save} disabled={saving}
              startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <SaveRoundedIcon />}
              sx={{ borderRadius: "10px", background: "linear-gradient(135deg,#6366f1,#06b6d4)", boxShadow: "none" }}>
              {saving ? "Saving…" : "Save Path"}
            </Button>
            {config.is_custom && (
              <Button variant="outlined" onClick={reset} disabled={saving}
                startIcon={<RestartAltRoundedIcon />}
                sx={{ borderRadius: "10px" }}>
                Reset to Default
              </Button>
            )}
            <Button variant="text" onClick={load} startIcon={<RefreshRoundedIcon sx={{ fontSize: 16 }} />}
              sx={{ borderRadius: "10px", ml: "auto", fontSize: "0.78rem" }}>
              Refresh
            </Button>
          </Box>

          {/* Help note */}
          <Box sx={{ mt: 3, p: 2, borderRadius: "10px", background: isDark ? "rgba(99,102,241,0.07)" : "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.15)" }}>
            <Typography sx={{ fontSize: "0.75rem", color: "text.secondary", lineHeight: 1.7 }}>
              <b>How it works:</b> When you set a custom path, all new TRF folders and uploaded files
              will be created inside that directory (e.g. <code style={{ color: "#818cf8" }}>D:\TRFStore\TRF-2026-101\Documents\</code>).
              Existing file paths stored in the database are not moved. The new path takes effect
              immediately for all new uploads.
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );
}


export default function Settings() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { toggle } = useThemeMode();
  const { prefs, setPrefs, resetPrefs, user } = useApp();

  const [activeTab, setActiveTab] = useState("appearance");
  const [saved,     setSaved]     = useState(false);

  const isAdmin   = user?.role === "Admin";
  const visibleTabs = TABS.filter(t => !t.adminOnly || isAdmin);

  const cardBg = isDark ? "rgba(15,23,42,0.72)" : "rgba(255,255,255,0.88)";
  const border  = isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.2)";

  const handleSave = () => {
    setSaved(true);
    toast.success("Settings saved");
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    resetPrefs();
    toast("Settings reset to defaults", { icon: "♻️" });
  };

  return (
    <Box>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
          <Box sx={{
            width: 44, height: 44, borderRadius: "13px",
            background: "linear-gradient(135deg,#64748b,#334155)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 20px rgba(100,116,139,0.35)",
          }}>
            <SettingsRoundedIcon sx={{ color: "#fff", fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, fontSize: "1.65rem", color: theme.palette.text.primary, lineHeight: 1.2 }}>
              Settings
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: "0.82rem" }}>
              Customize your TRF Portal experience
            </Typography>
          </Box>
        </Box>
      </motion.div>

      <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start" }}>
        {/* Left: Tab list */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 }}>
          <Box sx={{
            width: 200, flexShrink: 0, p: 1.5,
            borderRadius: "18px", background: cardBg,
            border: `1px solid ${border}`, backdropFilter: "blur(20px)",
          }}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              if (tab.adminOnly && !isAdmin) return null;
              return (
                <motion.div key={tab.id} whileHover={{ x: 3 }} whileTap={{ scale: 0.97 }}>
                  <Box
                    onClick={() => setActiveTab(tab.id)}
                    sx={{
                      display: "flex", alignItems: "center", gap: 1.5, px: 1.5, py: 1.2,
                      borderRadius: "11px", cursor: "pointer", mb: 0.5,
                      background: isActive ? "linear-gradient(135deg,rgba(99,102,241,0.18),rgba(6,182,212,0.12))" : "transparent",
                      border: `1px solid ${isActive ? "rgba(99,102,241,0.35)" : "transparent"}`,
                      color: isActive ? "#818cf8" : theme.palette.text.secondary,
                      transition: "all 0.15s",
                    }}
                  >
                    {tab.icon}
                    <Typography sx={{ fontSize: "0.83rem", fontWeight: isActive ? 700 : 500 }}>
                      {tab.label}
                    </Typography>
                  </Box>
                </motion.div>
              );
            })}
          </Box>
        </motion.div>

        {/* Right: Panel */}
        <Box sx={{ flex: 1 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.22 }}
            >
              <Box sx={{ p: 3.5, borderRadius: "20px", background: cardBg, border: `1px solid ${border}`, backdropFilter: "blur(20px)" }}>

                {/* ─ Appearance ─ */}
                {activeTab === "appearance" && (
                  <>
                    <Typography sx={{ fontWeight: 700, fontSize: "1rem", mb: 0.5, color: theme.palette.text.primary }}>
                      Appearance
                    </Typography>
                    <Typography sx={{ fontSize: "0.8rem", color: theme.palette.text.secondary, mb: 3 }}>
                      Customize how the portal looks
                    </Typography>

                    {/* Theme toggle cards */}
                    <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                      {[
                        { mode: "dark",  label: "Dark",  icon: <DarkModeRoundedIcon sx={{ fontSize: 22 }} />, active: isDark },
                        { mode: "light", label: "Light", icon: <LightModeRoundedIcon sx={{ fontSize: 22 }} />, active: !isDark },
                      ].map(t => (
                        <Box
                          key={t.mode}
                          onClick={() => !t.active && toggle()}
                          sx={{
                            flex: 1, p: 2.5, borderRadius: "14px", cursor: "pointer", textAlign: "center",
                            background: t.active ? "rgba(99,102,241,0.1)" : "transparent",
                            border: `2px solid ${t.active ? "#6366f1" : border}`,
                            transition: "all 0.2s",
                            "&:hover": { borderColor: "#6366f1" },
                          }}
                        >
                          <Box sx={{ color: t.active ? "#818cf8" : theme.palette.text.secondary, mb: 1, display: "flex", justifyContent: "center" }}>
                            {t.icon}
                          </Box>
                          <Typography sx={{ fontSize: "0.82rem", fontWeight: t.active ? 700 : 500, color: t.active ? "#818cf8" : theme.palette.text.secondary }}>
                            {t.label}
                          </Typography>
                          {t.active && <CheckRoundedIcon sx={{ fontSize: 14, color: "#6366f1", mt: 0.5 }} />}
                        </Box>
                      ))}
                    </Box>

                    <Divider sx={{ borderColor: border, mb: 2 }} />

                    <SettingRow label="Compact View" desc="Reduce padding for denser information display" checked={prefs.compactView} onChange={v => setPrefs({ compactView: v })} />
                    <Divider sx={{ borderColor: border }} />
                    <SettingRow label="Collapsed Sidebar" desc="Start with the sidebar collapsed by default" checked={prefs.sidebarCollapsed} onChange={v => setPrefs({ sidebarCollapsed: v })} />
                  </>
                )}

                {/* ─ Notifications ─ */}
                {activeTab === "notifications" && (
                  <>
                    <Typography sx={{ fontWeight: 700, fontSize: "1rem", mb: 0.5, color: theme.palette.text.primary }}>
                      Notifications
                    </Typography>
                    <Typography sx={{ fontSize: "0.8rem", color: theme.palette.text.secondary, mb: 3 }}>
                      Control when and how you get notified
                    </Typography>
                    <SettingRow label="Email Notifications" desc="Receive updates via email" checked={prefs.emailNotifications} onChange={v => setPrefs({ emailNotifications: v })} />
                    <Divider sx={{ borderColor: border }} />
                    <SettingRow label="Push Notifications" desc="Browser push alerts for real-time events" checked={prefs.pushNotifications} onChange={v => setPrefs({ pushNotifications: v })} />
                    <Divider sx={{ borderColor: border }} />
                    <SettingRow label="TRF Creation Alerts" desc="Notify when new TRFs are created" checked={prefs.trfCreationAlerts} onChange={v => setPrefs({ trfCreationAlerts: v })} />
                  </>
                )}

                {/* ─ System ─ */}
                {activeTab === "system" && (
                  <>
                    <Typography sx={{ fontWeight: 700, fontSize: "1rem", mb: 0.5, color: theme.palette.text.primary }}>
                      System Settings
                    </Typography>
                    <Typography sx={{ fontSize: "0.8rem", color: theme.palette.text.secondary, mb: 3 }}>
                      Configure core system behavior
                    </Typography>
                    <SettingRow label="Auto-Generate TRF Number" desc="Automatically suggest the next TRF number" checked={prefs.autoGenerateTRF} onChange={v => setPrefs({ autoGenerateTRF: v })} />
                    <Divider sx={{ borderColor: border }} />
                    <SettingRow label="Require Approval" desc="TRFs require admin approval before becoming active" checked={prefs.requireApproval} onChange={v => setPrefs({ requireApproval: v })} />
                  </>
                )}

                {/* ─ Storage ─ */}
                {activeTab === "storage" && (
                  <StoragePanel cardBg={cardBg} border={border} isDark={isDark} />
                )}

                {/* ─ About ─ */}
                {activeTab === "about" && (                  <>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                      <Box sx={{
                        width: 56, height: 56, borderRadius: "16px",
                        background: "linear-gradient(135deg,#6366f1,#06b6d4)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 8px 24px rgba(99,102,241,0.4)",
                      }}>
                        <FolderSpecialRoundedIcon sx={{ color: "#fff", fontSize: 28 }} />
                      </Box>
                      <Box>
                        <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: theme.palette.text.primary }}>
                          TRF Portal
                        </Typography>
                        <Typography sx={{ fontSize: "0.8rem", color: theme.palette.text.secondary }}>
                          Enterprise Edition
                        </Typography>
                        <Chip label="v2.1.0" size="small" sx={{ mt: 0.5, fontSize: "0.65rem", background: "rgba(99,102,241,0.12)", color: "#818cf8" }} />
                      </Box>
                    </Box>

                    <Box sx={{ p: 2, borderRadius: "12px", background: isDark ? "rgba(99,102,241,0.07)" : "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.15)", mb: 3 }}>
                      <Typography sx={{ fontSize: "0.78rem", color: theme.palette.text.secondary, lineHeight: 1.7 }}>
                        A full-featured Technical Request Form management platform with file organization, team collaboration, and real-time analytics.
                      </Typography>
                    </Box>

                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: theme.palette.text.disabled, letterSpacing: "0.08em", textTransform: "uppercase", mb: 1.5 }}>
                      Technology Stack
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {STACK.map(s => (
                        <Chip key={s.label} label={s.label} size="small" sx={{ fontSize: "0.72rem", background: `${s.color}14`, color: s.color, border: `1px solid ${s.color}25` }} />
                      ))}
                    </Box>
                  </>
                )}

                {/* Save/Reset buttons (not on About or Storage tab) */}
                {activeTab !== "about" && activeTab !== "storage" && (
                  <Box sx={{ display: "flex", gap: 1.5, mt: 3.5, pt: 2.5, borderTop: `1px solid ${border}` }}>
                    <Button
                      variant="outlined" size="small"
                      startIcon={<RestartAltRoundedIcon />}
                      onClick={handleReset}
                      sx={{ borderRadius: "10px" }}
                    >
                      Reset
                    </Button>
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <Button
                        variant="contained" size="small"
                        startIcon={saved ? <CheckRoundedIcon /> : <SaveRoundedIcon />}
                        onClick={handleSave}
                        sx={{
                          borderRadius: "10px", fontWeight: 700,
                          background: saved ? "linear-gradient(135deg,#10b981,#34d399)" : "linear-gradient(135deg,#6366f1,#06b6d4)",
                          boxShadow: "none",
                        }}
                      >
                        {saved ? "Saved!" : "Save Changes"}
                      </Button>
                    </motion.div>
                  </Box>
                )}
              </Box>
            </motion.div>
          </AnimatePresence>
        </Box>
      </Box>
    </Box>
  );
}
