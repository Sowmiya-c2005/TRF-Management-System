import { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Switch from "@mui/material/Switch";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import toast from "react-hot-toast";

import PaletteRoundedIcon        from "@mui/icons-material/PaletteRounded";
import NotificationsRoundedIcon  from "@mui/icons-material/NotificationsRounded";
import TuneRoundedIcon           from "@mui/icons-material/TuneRounded";
import CheckCircleRoundedIcon    from "@mui/icons-material/CheckCircleRounded";
import RestartAltRoundedIcon     from "@mui/icons-material/RestartAltRounded";

import { useThemeMode } from "../context/ThemeContext";
import { useApp }       from "../context/AppContext";

const stagger = { animate: { transition: { staggerChildren: 0.07 } } };
const fadeUp  = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, icon, children }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";
  return (
    <motion.div variants={fadeUp}>
      <Box sx={{
        p: 3, borderRadius: "18px", mb: 2.5,
        background: isDark ? "rgba(15,23,42,0.72)" : "rgba(255,255,255,0.88)",
        border: `1px solid ${isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.2)"}`,
        backdropFilter: "blur(20px)",
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <Box sx={{
            width: 34, height: 34, borderRadius: "9px",
            background: "linear-gradient(135deg,#6366f1,#06b6d4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            "& svg": { fontSize: 17, color: "#fff" },
          }}>
            {icon}
          </Box>
          <Typography variant="subtitle1" fontWeight={700} sx={{ fontSize: "0.95rem" }}>{title}</Typography>
        </Box>
        <Divider sx={{ mb: 1.5, borderColor: isDark ? "rgba(148,163,184,0.08)" : "rgba(148,163,184,0.18)" }} />
        {children}
      </Box>
    </motion.div>
  );
}

// ─── Individual row ───────────────────────────────────────────────────────────
function SettingRow({ label, description, control, last = false }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";
  return (
    <>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1.4 }}>
        <Box>
          <Typography variant="body2" fontWeight={600} sx={{ fontSize: "0.85rem" }}>{label}</Typography>
          {description && (
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: "0.75rem" }}>
              {description}
            </Typography>
          )}
        </Box>
        {control}
      </Box>
      {!last && <Divider sx={{ borderColor: isDark ? "rgba(148,163,184,0.06)" : "rgba(148,163,184,0.12)" }} />}
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Settings() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { mode, toggle } = useThemeMode();
  const { prefs, setPrefs, resetPrefs } = useApp();

  // Local state mirrors context prefs so we can "Save" explicitly
  const [local, setLocal] = useState({ ...prefs });
  const [saved, setSaved] = useState(false);

  const update = (key, value) => setLocal((p) => ({ ...p, [key]: value }));

  const handleSave = () => {
    setPrefs(local);
    // Persist theme preference too (already done by ThemeContext but mirror here)
    localStorage.setItem("themeMode", mode);
    setSaved(true);
    toast.success("Settings saved successfully!");
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    resetPrefs();
    setLocal({
      compactView: false,
      emailNotifications: true,
      pushNotifications: false,
      trfCreationAlerts: true,
      autoGenerateTRF: true,
      requireApproval: false,
    });
    toast("Settings reset to defaults.", { icon: "↺" });
  };

  return (
    <motion.div variants={stagger} initial="initial" animate="animate">
      <motion.div variants={fadeUp}>
        <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, fontSize: "1.6rem", color: theme.palette.text.primary }}>
              Settings
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
              Manage your preferences. All changes are saved to your browser.
            </Typography>
          </Box>
          {saved && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <Chip icon={<CheckCircleRoundedIcon sx={{ fontSize: "14px !important" }} />}
                label="Saved" color="success" size="small" sx={{ fontWeight: 700 }} />
            </motion.div>
          )}
        </Box>
      </motion.div>

      <Box sx={{ maxWidth: 640 }}>

        {/* ── Appearance ── */}
        <Section title="Appearance" icon={<PaletteRoundedIcon />}>
          <SettingRow
            label="Dark Mode"
            description="Switch between dark and light theme"
            control={
              <Switch
                checked={mode === "dark"}
                onChange={toggle}
                color="primary"
              />
            }
          />
          <SettingRow
            label="Compact View"
            description="Reduce spacing in tables and lists"
            control={
              <Switch
                checked={local.compactView}
                onChange={(e) => update("compactView", e.target.checked)}
                color="primary"
              />
            }
            last
          />
        </Section>

        {/* ── Notifications ── */}
        <Section title="Notifications" icon={<NotificationsRoundedIcon />}>
          <SettingRow
            label="Email Notifications"
            description="Receive activity alerts via email"
            control={
              <Switch
                checked={local.emailNotifications}
                onChange={(e) => update("emailNotifications", e.target.checked)}
                color="primary"
              />
            }
          />
          <SettingRow
            label="Browser Push Notifications"
            description="Allow push notifications in this browser"
            control={
              <Switch
                checked={local.pushNotifications}
                onChange={(e) => update("pushNotifications", e.target.checked)}
                color="primary"
              />
            }
          />
          <SettingRow
            label="TRF Creation Alerts"
            description="Notify me when a new TRF is created"
            control={
              <Switch
                checked={local.trfCreationAlerts}
                onChange={(e) => update("trfCreationAlerts", e.target.checked)}
                color="primary"
              />
            }
            last
          />
        </Section>

        {/* ── System ── */}
        <Section title="System" icon={<TuneRoundedIcon />}>
          <SettingRow
            label="Auto-generate TRF Numbers"
            description="System automatically assigns unique TRF IDs"
            control={
              <Switch
                checked={local.autoGenerateTRF}
                onChange={(e) => update("autoGenerateTRF", e.target.checked)}
                color="primary"
              />
            }
          />
          <SettingRow
            label="Require Approval Workflow"
            description="TRFs must be approved before becoming active"
            control={
              <Switch
                checked={local.requireApproval}
                onChange={(e) => update("requireApproval", e.target.checked)}
                color="primary"
              />
            }
            last
          />
        </Section>

        {/* ── Actions ── */}
        <motion.div variants={fadeUp}>
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Button
              variant="contained"
              startIcon={saved ? <CheckCircleRoundedIcon /> : null}
              onClick={handleSave}
              component={motion.button}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              sx={{
                background: saved
                  ? "linear-gradient(135deg,#10b981,#34d399)"
                  : "linear-gradient(135deg,#6366f1,#06b6d4)",
                borderRadius: "12px", px: 3, boxShadow: "0 6px 16px rgba(99,102,241,0.3)",
              }}
            >
              {saved ? "Saved!" : "Save Settings"}
            </Button>
            <Button
              variant="outlined"
              startIcon={<RestartAltRoundedIcon />}
              onClick={handleReset}
              sx={{ borderRadius: "12px", px: 3 }}
            >
              Reset Defaults
            </Button>
          </Box>
        </motion.div>
      </Box>
    </motion.div>
  );
}
