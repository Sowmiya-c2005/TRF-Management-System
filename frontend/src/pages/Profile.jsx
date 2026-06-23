import { useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@mui/material/styles";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import CircularProgress from "@mui/material/CircularProgress";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import toast from "react-hot-toast";

import PersonRoundedIcon         from "@mui/icons-material/PersonRounded";
import EditRoundedIcon            from "@mui/icons-material/EditRounded";
import LockRoundedIcon            from "@mui/icons-material/LockRounded";
import CameraAltRoundedIcon       from "@mui/icons-material/CameraAltRounded";
import VisibilityRoundedIcon      from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon   from "@mui/icons-material/VisibilityOffRounded";
import CheckCircleRoundedIcon     from "@mui/icons-material/CheckCircleRounded";
import EmailRoundedIcon           from "@mui/icons-material/EmailRounded";
import BadgeRoundedIcon           from "@mui/icons-material/BadgeRounded";
import CalendarTodayRoundedIcon   from "@mui/icons-material/CalendarTodayRounded";
import ShieldRoundedIcon          from "@mui/icons-material/ShieldRounded";

import { useApp } from "../context/AppContext";

const stagger = { animate: { transition: { staggerChildren: 0.08 } } };
const fadeUp  = { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

// ─── Avatar uploader ──────────────────────────────────────────────────────────
function AvatarSection({ user, onAvatarChange }) {
  const theme   = useTheme();
  const fileRef = useRef(null);
  const displayName = user?.displayName || user?.username || "Admin";
  const initials    = displayName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Image must be under 2 MB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => onAvatarChange(ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
      <Box sx={{ position: "relative" }}>
        <Avatar
          sx={{
            width: 90, height: 90, fontSize: "1.8rem", fontWeight: 800,
            background: user?.avatar ? "transparent" : "linear-gradient(135deg,#6366f1,#06b6d4)",
            border: "3px solid",
            borderColor: theme.palette.primary.main,
            boxShadow: "0 0 0 4px rgba(99,102,241,0.15)",
          }}
        >
          {user?.avatar
            ? <Box component="img" src={user.avatar} sx={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} alt="avatar" />
            : initials
          }
        </Avatar>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
          style={{ position: "absolute", bottom: 0, right: 0 }}>
          <IconButton
            size="small"
            onClick={() => fileRef.current?.click()}
            sx={{
              width: 28, height: 28,
              background: "linear-gradient(135deg,#6366f1,#06b6d4)",
              color: "#fff",
              "&:hover": { background: "linear-gradient(135deg,#4f46e5,#0891b2)" },
              boxShadow: "0 2px 8px rgba(99,102,241,0.4)",
            }}
          >
            <CameraAltRoundedIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </motion.div>
      </Box>
      <Box sx={{ textAlign: "center" }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ fontSize: "1rem" }}>{displayName}</Typography>
        <Chip
          label={user?.role || "Engineer"}
          size="small"
          sx={{ mt: 0.5, fontWeight: 700, fontSize: "0.7rem", background: "rgba(99,102,241,0.12)", color: "#818cf8" }}
        />
      </Box>
      <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: "0.72rem", textAlign: "center" }}>
        Click the camera icon to upload a profile photo.
        <br />JPG, PNG or GIF — max 2 MB
      </Typography>
    </Box>
  );
}

// ─── View tab ─────────────────────────────────────────────────────────────────
function ViewProfile({ user }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";
  const border = isDark ? "rgba(148,163,184,0.08)" : "rgba(148,163,184,0.18)";

  const rows = [
    { icon: <BadgeRoundedIcon />,          label: "Username",    value: user?.username || "—" },
    { icon: <PersonRoundedIcon />,         label: "Display Name",value: user?.displayName || user?.username || "—" },
    { icon: <EmailRoundedIcon />,          label: "Email",        value: user?.email || "—" },
    { icon: <ShieldRoundedIcon />,         label: "Role",         value: user?.role || "Engineer" },
    { icon: <CalendarTodayRoundedIcon />,  label: "Member Since",
      value: user?.joinedAt ? new Date(user.joinedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—" },
  ];

  return (
    <Box>
      {rows.map((row, i) => (
        <Box key={row.label}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, py: 1.6 }}>
            <Box sx={{ "& svg": { fontSize: 18, color: theme.palette.primary.main } }}>{row.icon}</Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {row.label}
              </Typography>
              <Typography variant="body2" fontWeight={600} sx={{ fontSize: "0.88rem" }}>{row.value}</Typography>
            </Box>
          </Box>
          {i < rows.length - 1 && <Divider sx={{ borderColor: border }} />}
        </Box>
      ))}
    </Box>
  );
}

// ─── Edit tab ─────────────────────────────────────────────────────────────────
function EditProfile({ user, updateUser }) {
  const [form, setForm] = useState({
    displayName: user?.displayName || user?.username || "",
    email:       user?.email || "",
  });
  const [saving, setSaving] = useState(false);
  const [done,   setDone]   = useState(false);

  const update = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.displayName.trim() || !form.email.trim()) { toast.error("All fields are required"); return; }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600)); // simulate async save
    updateUser({ displayName: form.displayName.trim(), email: form.email.trim() });
    setSaving(false);
    setDone(true);
    toast.success("Profile updated!");
    setTimeout(() => setDone(false), 2500);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <TextField
        label="Display Name"
        value={form.displayName}
        onChange={update("displayName")}
        fullWidth
        InputProps={{ sx: { borderRadius: "10px" } }}
        helperText="This is how your name appears throughout the app"
      />
      <TextField
        label="Email Address"
        type="email"
        value={form.email}
        onChange={update("email")}
        fullWidth
        InputProps={{ sx: { borderRadius: "10px" } }}
        helperText="Used for notifications and account recovery"
      />
      <TextField
        label="Username"
        value={user?.username || ""}
        disabled
        fullWidth
        InputProps={{ sx: { borderRadius: "10px" } }}
        helperText="Username cannot be changed"
      />
      <Button
        variant="contained"
        onClick={handleSave}
        disabled={saving || done}
        startIcon={saving ? <CircularProgress size={15} color="inherit" /> : done ? <CheckCircleRoundedIcon /> : <EditRoundedIcon />}
        component={motion.button}
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        sx={{
          py: 1.3, borderRadius: "12px", alignSelf: "flex-start", px: 3,
          background: done
            ? "linear-gradient(135deg,#10b981,#34d399)"
            : "linear-gradient(135deg,#6366f1,#06b6d4)",
          boxShadow: "0 6px 16px rgba(99,102,241,0.3)",
        }}
      >
        {saving ? "Saving…" : done ? "Saved!" : "Save Changes"}
      </Button>
    </Box>
  );
}

// ─── Password tab ─────────────────────────────────────────────────────────────
function ChangePassword() {
  const [form, setForm]    = useState({ current: "", next: "", confirm: "" });
  const [show, setShow]    = useState({ current: false, next: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [done,   setDone]   = useState(false);

  const update = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const toggleShow = (k) => setShow((p) => ({ ...p, [k]: !p[k] }));

  const handleSave = async () => {
    if (!form.current || !form.next || !form.confirm) { toast.error("Fill in all fields"); return; }
    if (form.next.length < 6) { toast.error("New password must be at least 6 characters"); return; }
    if (form.next !== form.confirm) { toast.error("Passwords do not match"); return; }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setDone(true);
    setForm({ current: "", next: "", confirm: "" });
    toast.success("Password changed successfully!");
    setTimeout(() => setDone(false), 2500);
  };

  const fields = [
    { key: "current", label: "Current Password" },
    { key: "next",    label: "New Password" },
    { key: "confirm", label: "Confirm New Password" },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      {fields.map(({ key, label }) => (
        <TextField
          key={key}
          label={label}
          type={show[key] ? "text" : "password"}
          value={form[key]}
          onChange={update(key)}
          fullWidth
          InputProps={{
            sx: { borderRadius: "10px" },
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => toggleShow(key)}>
                  {show[key] ? <VisibilityOffRoundedIcon sx={{ fontSize: 17 }} /> : <VisibilityRoundedIcon sx={{ fontSize: 17 }} />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      ))}
      <Button
        variant="contained"
        onClick={handleSave}
        disabled={saving || done}
        startIcon={saving ? <CircularProgress size={15} color="inherit" /> : done ? <CheckCircleRoundedIcon /> : <LockRoundedIcon />}
        component={motion.button}
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        sx={{
          py: 1.3, borderRadius: "12px", alignSelf: "flex-start", px: 3,
          background: done
            ? "linear-gradient(135deg,#10b981,#34d399)"
            : "linear-gradient(135deg,#ef4444,#f87171)",
          boxShadow: "0 6px 16px rgba(239,68,68,0.25)",
        }}
      >
        {saving ? "Updating…" : done ? "Updated!" : "Update Password"}
      </Button>
    </Box>
  );
}

// ─── Root page ────────────────────────────────────────────────────────────────
export default function Profile() {
  const theme   = useTheme();
  const isDark  = theme.palette.mode === "dark";
  const [params] = useSearchParams();
  const initialTab = params.get("tab") === "edit" ? 1 : 0;
  const [tab, setTab] = useState(initialTab);

  const { user, updateUser } = useApp();

  const cardBg = isDark ? "rgba(15,23,42,0.72)" : "rgba(255,255,255,0.88)";
  const border = isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.2)";

  const handleAvatarChange = (dataUrl) => {
    updateUser({ avatar: dataUrl });
    toast.success("Profile photo updated!");
  };

  return (
    <motion.div variants={stagger} initial="initial" animate="animate">
      <motion.div variants={fadeUp}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, fontSize: "1.6rem", color: theme.palette.text.primary }}>
            My Profile
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
            Manage your account information and security settings.
          </Typography>
        </Box>
      </motion.div>

      <Grid container spacing={3}>
        {/* Left — avatar + quick info */}
        <Grid item xs={12} md={3}>
          <motion.div variants={fadeUp}>
            <Box sx={{ p: 3, borderRadius: "18px", background: cardBg, border: `1px solid ${border}`, backdropFilter: "blur(20px)" }}>
              <AvatarSection user={user} onAvatarChange={handleAvatarChange} />
            </Box>
          </motion.div>
        </Grid>

        {/* Right — tabs */}
        <Grid item xs={12} md={9}>
          <motion.div variants={fadeUp}>
            <Box sx={{ borderRadius: "18px", background: cardBg, border: `1px solid ${border}`, backdropFilter: "blur(20px)", overflow: "hidden" }}>
              {/* Tabs */}
              <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                sx={{
                  px: 2,
                  borderBottom: `1px solid ${border}`,
                  "& .MuiTab-root": { textTransform: "none", fontWeight: 600, fontSize: "0.85rem", minHeight: 48 },
                  "& .MuiTabs-indicator": { background: "linear-gradient(90deg,#6366f1,#06b6d4)", height: 2, borderRadius: 2 },
                }}
              >
                <Tab icon={<PersonRoundedIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="View Profile" />
                <Tab icon={<EditRoundedIcon sx={{ fontSize: 16 }} />}   iconPosition="start" label="Edit Profile" />
                <Tab icon={<LockRoundedIcon sx={{ fontSize: 16 }} />}   iconPosition="start" label="Change Password" />
              </Tabs>

              {/* Tab panels */}
              <Box sx={{ p: 3 }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22 }}
                  >
                    {tab === 0 && <ViewProfile user={user} />}
                    {tab === 1 && <EditProfile user={user} updateUser={updateUser} />}
                    {tab === 2 && <ChangePassword />}
                  </motion.div>
                </AnimatePresence>
              </Box>
            </Box>
          </motion.div>
        </Grid>
      </Grid>
    </motion.div>
  );
}
