import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@mui/material/styles";
import { useSearchParams } from "react-router-dom";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import toast from "react-hot-toast";

import PersonRoundedIcon        from "@mui/icons-material/PersonRounded";
import EditRoundedIcon          from "@mui/icons-material/EditRounded";
import LockRoundedIcon          from "@mui/icons-material/LockRounded";
import SaveRoundedIcon          from "@mui/icons-material/SaveRounded";
import VisibilityRoundedIcon    from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import EmailRoundedIcon         from "@mui/icons-material/EmailRounded";
import BadgeRoundedIcon         from "@mui/icons-material/BadgeRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import CheckRoundedIcon         from "@mui/icons-material/CheckRounded";

import { useApp } from "../context/AppContext";

const TABS = [
  { id: "view",     label: "View Profile",    icon: <PersonRoundedIcon sx={{ fontSize: 16 }} /> },
  { id: "edit",     label: "Edit Profile",    icon: <EditRoundedIcon sx={{ fontSize: 16 }} /> },
  { id: "password", label: "Change Password", icon: <LockRoundedIcon sx={{ fontSize: 16 }} /> },
];

const ROLE_META = {
  Admin:    { color: "#6366f1", bg: "rgba(99,102,241,0.12)" },
  Engineer: { color: "#06b6d4", bg: "rgba(6,182,212,0.12)" },
  Manager:  { color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  Viewer:   { color: "#94a3b8", bg: "rgba(148,163,184,0.1)" },
};

function InfoRow({ icon, label, value }) {
  const theme = useTheme();
  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, py: 1.5 }}>
      <Box sx={{ color: theme.palette.text.disabled, display: "flex", mt: 0.2 }}>{icon}</Box>
      <Box>
        <Typography sx={{ fontSize: "0.72rem", color: theme.palette.text.disabled, textTransform: "uppercase", letterSpacing: "0.06em", mb: 0.2 }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: "0.9rem", fontWeight: 600, color: theme.palette.text.primary }}>
          {value || "—"}
        </Typography>
      </Box>
    </Box>
  );
}

export default function Profile() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { user, updateUser } = useApp();
  const [urlParams] = useSearchParams();

  const initTab = urlParams.get("tab") || "view";
  const [activeTab,    setActiveTab]    = useState(TABS.find(t => t.id === initTab) ? initTab : "view");
  const [displayName,  setDisplayName]  = useState(user?.displayName || "");
  const [email,        setEmail]        = useState(user?.email || "");
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [curPwd,       setCurPwd]       = useState("");
  const [newPwd,       setNewPwd]       = useState("");
  const [conPwd,       setConPwd]       = useState("");
  const [showCur,      setShowCur]      = useState(false);
  const [showNew,      setShowNew]      = useState(false);
  const [showCon,      setShowCon]      = useState(false);

  const cardBg = isDark ? "rgba(15,23,42,0.72)" : "rgba(255,255,255,0.88)";
  const border  = isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.2)";

  const initials = (user?.displayName || user?.username || "U").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const role = user?.role || "Engineer";
  const roleMeta = ROLE_META[role] || ROLE_META.Viewer;

  const handleSaveProfile = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600)); // UX feedback delay
    updateUser({ displayName: displayName.trim(), email: email.trim() });
    setSaved(true);
    toast.success("Profile updated!");
    setTimeout(() => setSaved(false), 2500);
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (!curPwd || !newPwd || !conPwd) { toast.error("Fill in all fields"); return; }
    if (newPwd !== conPwd) { toast.error("Passwords do not match"); return; }
    if (newPwd.length < 6) { toast.error("New password must be at least 6 characters"); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 700));
    toast.success("Password changed successfully!");
    setCurPwd(""); setNewPwd(""); setConPwd("");
    setSaving(false);
  };

  return (
    <Box sx={{ maxWidth: 700, mx: "auto" }}>
      {/* Hero Banner */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{
          borderRadius: "24px", overflow: "hidden", mb: 3,
          background: "linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#0c4a6e 100%)",
          position: "relative", minHeight: 140,
        }}>
          {/* Grid pattern */}
          <Box sx={{
            position: "absolute", inset: 0,
            backgroundImage: "linear-gradient(rgba(99,102,241,0.08) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.08) 1px,transparent 1px)",
            backgroundSize: "32px 32px",
          }} />
          {/* Orb */}
          <Box sx={{
            position: "absolute", right: -40, top: -40,
            width: 200, height: 200, borderRadius: "50%",
            background: "radial-gradient(rgba(99,102,241,0.25),transparent 70%)",
          }} />

          {/* Avatar centered on banner */}
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 4, position: "relative", zIndex: 1 }}>
            <motion.div whileHover={{ scale: 1.05 }} style={{ position: "relative" }}>
              <Avatar sx={{
                width: 84, height: 84, fontSize: "1.8rem", fontWeight: 800, mb: 1.5,
                background: "linear-gradient(135deg,#6366f1,#06b6d4)",
                boxShadow: "0 8px 28px rgba(99,102,241,0.5)",
                border: "3px solid rgba(255,255,255,0.15)",
              }}>
                {initials}
              </Avatar>
            </motion.div>
            <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1.15rem", mb: 0.5 }}>
              {user?.displayName || user?.username}
            </Typography>
            <Chip
              label={role}
              size="small"
              sx={{ fontSize: "0.7rem", fontWeight: 700, background: roleMeta.bg, color: roleMeta.color, border: `1px solid ${roleMeta.color}35` }}
            />
          </Box>
        </Box>
      </motion.div>

      {/* Tab bar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <Box sx={{
          display: "flex", gap: 1, p: 1, mb: 3,
          borderRadius: "16px", background: cardBg,
          border: `1px solid ${border}`, backdropFilter: "blur(20px)",
        }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <Box
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                sx={{
                  display: "flex", alignItems: "center", gap: 1,
                  px: 2, py: 1, borderRadius: "10px", cursor: "pointer", flex: 1, justifyContent: "center",
                  background: isActive ? "linear-gradient(135deg,rgba(99,102,241,0.18),rgba(6,182,212,0.12))" : "transparent",
                  border: `1px solid ${isActive ? "rgba(99,102,241,0.35)" : "transparent"}`,
                  color: isActive ? "#818cf8" : theme.palette.text.secondary,
                  transition: "all 0.18s",
                }}
              >
                {tab.icon}
                <Typography sx={{ fontSize: "0.8rem", fontWeight: isActive ? 700 : 500 }}>
                  {tab.label}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </motion.div>

      {/* Panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        >
          <Box sx={{ p: 3.5, borderRadius: "20px", background: cardBg, border: `1px solid ${border}`, backdropFilter: "blur(20px)" }}>

            {/* ─ View Profile ─ */}
            {activeTab === "view" && (
              <>
                <Typography sx={{ fontWeight: 700, mb: 2, color: theme.palette.text.primary }}>Account Information</Typography>
                <InfoRow icon={<BadgeRoundedIcon sx={{ fontSize: 18 }} />}         label="Username"      value={user?.username} />
                <Divider sx={{ borderColor: border }} />
                <InfoRow icon={<PersonRoundedIcon sx={{ fontSize: 18 }} />}        label="Display Name"  value={user?.displayName} />
                <Divider sx={{ borderColor: border }} />
                <InfoRow icon={<EmailRoundedIcon sx={{ fontSize: 18 }} />}         label="Email"         value={user?.email} />
                <Divider sx={{ borderColor: border }} />
                <InfoRow icon={<ManageAccountsRoundedIcon sx={{ fontSize: 18 }} />} label="Role"         value={user?.role} />
                <Divider sx={{ borderColor: border }} />
                <InfoRow
                  icon={<CalendarTodayRoundedIcon sx={{ fontSize: 18 }} />}
                  label="Member Since"
                  value={user?.joinedAt ? new Date(user.joinedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "Today"}
                />
              </>
            )}

            {/* ─ Edit Profile ─ */}
            {activeTab === "edit" && (
              <>
                <Typography sx={{ fontWeight: 700, mb: 0.5, color: theme.palette.text.primary }}>Edit Profile</Typography>
                <Typography sx={{ fontSize: "0.8rem", color: theme.palette.text.secondary, mb: 3 }}>Update your display name and email address</Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                  <TextField
                    label="Display Name" fullWidth
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><PersonRoundedIcon sx={{ fontSize: 18 }} /></InputAdornment>, sx: { borderRadius: "12px" } }}
                  />
                  <TextField
                    label="Email Address" fullWidth
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    type="email"
                    InputProps={{ startAdornment: <InputAdornment position="start"><EmailRoundedIcon sx={{ fontSize: 18 }} /></InputAdornment>, sx: { borderRadius: "12px" } }}
                  />
                </Box>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    fullWidth variant="contained"
                    onClick={handleSaveProfile}
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={16} color="inherit" /> : saved ? <CheckRoundedIcon /> : <SaveRoundedIcon />}
                    sx={{
                      mt: 3, py: 1.4, borderRadius: "12px", fontWeight: 700,
                      background: saved ? "linear-gradient(135deg,#10b981,#34d399)" : "linear-gradient(135deg,#6366f1,#06b6d4)",
                      boxShadow: "0 8px 24px rgba(99,102,241,0.35)",
                    }}
                  >
                    {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
                  </Button>
                </motion.div>
              </>
            )}

            {/* ─ Change Password ─ */}
            {activeTab === "password" && (
              <>
                <Typography sx={{ fontWeight: 700, mb: 0.5, color: theme.palette.text.primary }}>Change Password</Typography>
                <Typography sx={{ fontSize: "0.8rem", color: theme.palette.text.secondary, mb: 3 }}>Update your account password</Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                  {[
                    { label: "Current Password", val: curPwd, set: setCurPwd, show: showCur, setShow: setShowCur },
                    { label: "New Password",      val: newPwd, set: setNewPwd, show: showNew, setShow: setShowNew },
                    { label: "Confirm Password",  val: conPwd, set: setConPwd, show: showCon, setShow: setShowCon },
                  ].map(f => (
                    <TextField
                      key={f.label} label={f.label} fullWidth
                      type={f.show ? "text" : "password"}
                      value={f.val}
                      onChange={e => f.set(e.target.value)}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><LockRoundedIcon sx={{ fontSize: 18 }} /></InputAdornment>,
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={() => f.setShow(v => !v)}>
                              {f.show ? <VisibilityOffRoundedIcon sx={{ fontSize: 16 }} /> : <VisibilityRoundedIcon sx={{ fontSize: 16 }} />}
                            </IconButton>
                          </InputAdornment>
                        ),
                        sx: { borderRadius: "12px" },
                      }}
                    />
                  ))}
                </Box>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    fullWidth variant="contained"
                    onClick={handleChangePassword}
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <LockRoundedIcon />}
                    sx={{
                      mt: 3, py: 1.4, borderRadius: "12px", fontWeight: 700,
                      background: "linear-gradient(135deg,#a855f7,#6366f1)",
                      boxShadow: "0 8px 24px rgba(168,85,247,0.35)",
                    }}
                  >
                    {saving ? "Updating…" : "Change Password"}
                  </Button>
                </motion.div>
              </>
            )}
          </Box>
        </motion.div>
      </AnimatePresence>
    </Box>
  );
}
