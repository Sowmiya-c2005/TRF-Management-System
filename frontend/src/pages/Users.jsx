import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import InputAdornment from "@mui/material/InputAdornment";
import CircularProgress from "@mui/material/CircularProgress";
import toast from "react-hot-toast";

import AddRoundedIcon          from "@mui/icons-material/AddRounded";
import PersonRoundedIcon       from "@mui/icons-material/PersonRounded";
import LockRoundedIcon         from "@mui/icons-material/LockRounded";
import VisibilityRoundedIcon   from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import RefreshRoundedIcon      from "@mui/icons-material/RefreshRounded";

import { register } from "../services/userService";
import { useApp } from "../context/AppContext";

const ROLE_COLORS = {
  Administrator: { bg: "rgba(99,102,241,0.12)",  color: "#818cf8" },
  Engineer:      { bg: "rgba(6,182,212,0.12)",   color: "#22d3ee" },
  Viewer:        { bg: "rgba(16,185,129,0.12)",  color: "#34d399" },
  Manager:       { bg: "rgba(245,158,11,0.12)",  color: "#fbbf24" },
};

const AVATAR_COLORS = ["#6366f1","#06b6d4","#10b981","#f59e0b","#a855f7","#ef4444","#ec4899"];

function avatarColor(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ─── Invite dialog ────────────────────────────────────────────────────────────
function InviteDialog({ open, onClose, onSuccess }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [username,  setUsername]  = useState("");
  const [password,  setPassword]  = useState("");
  const [showPass,  setShowPass]  = useState(false);
  const [loading,   setLoading]   = useState(false);

  const reset = () => { setUsername(""); setPassword(""); setShowPass(false); };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async () => {
    if (!username.trim()) { toast.error("Username is required"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      await register(username.trim(), password);
      toast.success(`User "${username.trim()}" registered successfully!`);
      onSuccess({ username: username.trim(), role: "Engineer" });
      handleClose();
    } catch (e) {
      toast.error(e.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      PaperProps={{
        sx: {
          borderRadius: "18px", width: 400,
          background: isDark ? "rgba(10,15,30,0.97)" : "#fff",
          backdropFilter: "blur(30px)",
          border: `1px solid ${isDark ? "rgba(148,163,184,0.12)" : "rgba(148,163,184,0.25)"}`,
          boxShadow: isDark ? "0 32px 64px rgba(0,0,0,0.5)" : "0 32px 64px rgba(15,23,42,0.14)",
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: "1.05rem", pb: 1 }}>
        Invite New User
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: "8px !important" }}>
        <TextField
          label="Username" autoFocus
          value={username} onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          InputProps={{
            startAdornment: <InputAdornment position="start"><PersonRoundedIcon sx={{ fontSize: 17 }} /></InputAdornment>,
            sx: { borderRadius: "10px" },
          }}
        />
        <TextField
          label="Password"
          type={showPass ? "text" : "password"}
          value={password} onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          helperText="Minimum 6 characters"
          InputProps={{
            startAdornment: <InputAdornment position="start"><LockRoundedIcon sx={{ fontSize: 17 }} /></InputAdornment>,
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setShowPass((v) => !v)}>
                  {showPass ? <VisibilityOffRoundedIcon sx={{ fontSize: 16 }} /> : <VisibilityRoundedIcon sx={{ fontSize: 16 }} />}
                </IconButton>
              </InputAdornment>
            ),
            sx: { borderRadius: "10px" },
          }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={handleClose} sx={{ borderRadius: "10px" }}>Cancel</Button>
        <Button
          variant="contained" onClick={handleSubmit} disabled={loading}
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <AddRoundedIcon />}
          sx={{ borderRadius: "10px", background: "linear-gradient(135deg,#6366f1,#06b6d4)" }}
        >
          {loading ? "Creating…" : "Create User"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
const stagger = { animate: { transition: { staggerChildren: 0.07 } } };
const fadeUp  = { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0, transition: { duration: 0.32 } } };

// Fallback local user list — used when API doesn't return a /users list endpoint
// (the backend only has /register and /login — there's no GET /users endpoint yet)
const FALLBACK_USERS = [
  { id: 1, username: "admin",  displayName: "Admin User",    email: "admin@trf.com",    role: "Administrator", status: "Active" },
  { id: 2, username: "john",   displayName: "John Engineer", email: "john@trf.com",     role: "Engineer",      status: "Active" },
  { id: 3, username: "sarah",  displayName: "Sarah Viewer",  email: "sarah@trf.com",    role: "Viewer",        status: "Active" },
  { id: 4, username: "mike",   displayName: "Mike Manager",  email: "mike@trf.com",     role: "Manager",       status: "Inactive" },
];

export default function Users() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { user: currentUser, addActivity, addNotification } = useApp();

  const [users,       setUsers]       = useState(FALLBACK_USERS);
  const [inviteOpen,  setInviteOpen]  = useState(false);
  const [loading,     setLoading]     = useState(false);

  const cardBg = isDark ? "rgba(15,23,42,0.72)" : "rgba(255,255,255,0.88)";
  const border = isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.2)";

  // Merge current logged-in user into list so it's always shown
  useEffect(() => {
    if (currentUser?.username) {
      setUsers((prev) => {
        const exists = prev.some((u) => u.username === currentUser.username);
        if (exists) return prev.map((u) =>
          u.username === currentUser.username
            ? { ...u, displayName: currentUser.displayName || currentUser.username, email: currentUser.email, role: currentUser.role }
            : u
        );
        return [
          { id: Date.now(), username: currentUser.username, displayName: currentUser.displayName || currentUser.username,
            email: currentUser.email || `${currentUser.username}@trf.com`, role: currentUser.role || "Administrator", status: "Active" },
          ...prev,
        ];
      });
    }
  }, [currentUser]);

  const handleInviteSuccess = ({ username, role }) => {
    const newUser = {
      id: Date.now(), username, displayName: username,
      email: `${username}@trf.com`, role, status: "Active",
    };
    setUsers((prev) => [newUser, ...prev]);
    addActivity(`New user "${username}" registered`, currentUser?.username || "Admin");
    addNotification({ title: `New user registered`, body: `${username} joined as ${role}`, color: "#f59e0b", type: "user" });
  };

  return (
    <motion.div variants={stagger} initial="initial" animate="animate">

      {/* Header */}
      <motion.div variants={fadeUp}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mb: 4, flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, fontSize: "1.6rem", color: theme.palette.text.primary }}>
              User Management
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
              {users.length} registered user{users.length !== 1 ? "s" : ""}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Tooltip title="Refresh">
              <IconButton size="small" onClick={() => setLoading((v) => !v)}
                sx={{ background: isDark ? "rgba(148,163,184,0.08)" : "rgba(100,116,139,0.08)", borderRadius: "10px" }}>
                <RefreshRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddRoundedIcon />}
              onClick={() => setInviteOpen(true)}
              component={motion.button}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              sx={{ background: "linear-gradient(135deg,#6366f1,#06b6d4)", borderRadius: "12px", boxShadow: "0 6px 16px rgba(99,102,241,0.3)" }}
            >
              Invite User
            </Button>
          </Box>
        </Box>
      </motion.div>

      {/* User list */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <AnimatePresence initial={false}>
          {users.map((u) => {
            const name    = u.displayName || u.username;
            const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
            const color   = avatarColor(name);
            const isCurrentUser = u.username === currentUser?.username;

            return (
              <motion.div
                key={u.id}
                variants={fadeUp}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Box sx={{
                  display: "flex", alignItems: "center", gap: 2, p: 2.5,
                  borderRadius: "16px", background: cardBg,
                  border: `1px solid ${isCurrentUser ? "rgba(99,102,241,0.3)" : border}`,
                  backdropFilter: "blur(20px)",
                  boxShadow: isCurrentUser ? "0 4px 16px rgba(99,102,241,0.1)" : "none",
                  "&:hover": { borderColor: "rgba(99,102,241,0.25)", boxShadow: "0 8px 24px rgba(99,102,241,0.08)" },
                  transition: "all 0.2s",
                }}>
                  <Avatar sx={{
                    width: 44, height: 44, fontWeight: 700, fontSize: "0.9rem",
                    background: u.avatar ? "transparent" : `${color}25`,
                    color, border: `1.5px solid ${color}45`,
                  }}>
                    {u.avatar
                      ? <Box component="img" src={u.avatar} sx={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} alt="" />
                      : initials
                    }
                  </Avatar>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: "0.88rem" }}>
                        {name}
                      </Typography>
                      {isCurrentUser && (
                        <Chip label="You" size="small" sx={{ height: 16, fontSize: "0.6rem", fontWeight: 700, background: "rgba(99,102,241,0.12)", color: "#818cf8" }} />
                      )}
                    </Box>
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: "0.75rem" }}>
                      {u.email}
                    </Typography>
                  </Box>

                  <Chip
                    label={u.role}
                    size="small"
                    sx={{
                      fontWeight: 700, fontSize: "0.7rem", height: 22,
                      background: ROLE_COLORS[u.role]?.bg || "rgba(148,163,184,0.12)",
                      color: ROLE_COLORS[u.role]?.color || "#94a3b8",
                    }}
                  />
                  <Chip
                    label={u.status}
                    size="small"
                    sx={{
                      fontWeight: 700, fontSize: "0.7rem", height: 22,
                      background: u.status === "Active" ? "rgba(16,185,129,0.12)" : "rgba(100,116,139,0.12)",
                      color:      u.status === "Active" ? "#10b981" : "#64748b",
                    }}
                  />
                </Box>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </Box>

      {/* Invite dialog */}
      <InviteDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSuccess={handleInviteSuccess}
      />
    </motion.div>
  );
}
