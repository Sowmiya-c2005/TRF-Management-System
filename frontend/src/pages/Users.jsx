import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@mui/material/styles";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import toast from "react-hot-toast";

import PeopleRoundedIcon       from "@mui/icons-material/PeopleRounded";
import PersonAddRoundedIcon    from "@mui/icons-material/PersonAddRounded";
import SearchRoundedIcon       from "@mui/icons-material/SearchRounded";
import VisibilityRoundedIcon   from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import StarRoundedIcon         from "@mui/icons-material/StarRounded";

import { register } from "../services/userService";
import { useApp }   from "../context/AppContext";

const ROLE_META = {
  Admin:    { color: "#6366f1", bg: "rgba(99,102,241,0.12)" },
  Engineer: { color: "#06b6d4", bg: "rgba(6,182,212,0.12)" },
  Manager:  { color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  Viewer:   { color: "#94a3b8", bg: "rgba(148,163,184,0.1)" },
};

function avatarColor(name) {
  const colors = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#a855f7", "#ef4444"];
  let h = 0; for (const c of name) h = c.charCodeAt(0) + h * 31;
  return colors[Math.abs(h) % colors.length];
}

function UserCard({ u, isCurrentUser, isDark, border }) {
  const theme = useTheme();
  const color = avatarColor(u.username);
  const initials = (u.displayName || u.username).split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const role = u.role || "Engineer";
  const roleMeta = ROLE_META[role] || ROLE_META.Viewer;

  return (
    <motion.div initial={{ opacity: 0, y: 18, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} whileHover={{ y: -3 }}>
      <Box sx={{
        p: 3, borderRadius: "18px",
        background: isDark ? "rgba(15,23,42,0.72)" : "rgba(255,255,255,0.88)",
        border: `1px solid ${border}`, backdropFilter: "blur(20px)",
        position: "relative", overflow: "hidden",
        transition: "box-shadow 0.2s",
        "&:hover": { boxShadow: isDark ? "0 12px 36px rgba(0,0,0,0.35)" : "0 12px 36px rgba(15,23,42,0.1)" },
      }}>
        {isCurrentUser && (
          <Box sx={{
            position: "absolute", top: 12, right: 12,
            display: "flex", alignItems: "center", gap: 0.5,
            px: 1, py: 0.25, borderRadius: "20px",
            background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)",
          }}>
            <StarRoundedIcon sx={{ fontSize: 11, color: "#f59e0b" }} />
            <Typography sx={{ fontSize: "0.64rem", color: "#f59e0b", fontWeight: 700 }}>You</Typography>
          </Box>
        )}

        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <Avatar sx={{
            width: 48, height: 48, fontSize: "1.1rem", fontWeight: 700,
            background: `linear-gradient(135deg,${color},${color}99)`,
            boxShadow: `0 4px 14px ${color}40`,
          }}>
            {initials}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.92rem", color: theme.palette.text.primary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {u.displayName || u.username}
            </Typography>
            <Typography sx={{ fontSize: "0.75rem", color: theme.palette.text.secondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {u.email || `${u.username}@trf.com`}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Chip
            label={role}
            size="small"
            sx={{ fontSize: "0.7rem", fontWeight: 700, background: roleMeta.bg, color: roleMeta.color, border: `1px solid ${roleMeta.color}28` }}
          />
          <Chip
            label="Active"
            size="small"
            sx={{ fontSize: "0.7rem", background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.22)" }}
          />
        </Box>
      </Box>
    </motion.div>
  );
}

export default function Users() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { user } = useApp();

  const [users,       setUsers]       = useState([]);
  const [search,      setSearch]      = useState("");
  const [inviteOpen,  setInviteOpen]  = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole,     setNewRole]     = useState("Engineer");
  const [showPwd,     setShowPwd]     = useState(false);
  const [loading,     setLoading]     = useState(false);

  const border = isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.2)";

  // Seed with current user
  useEffect(() => {
    if (user) {
      setUsers([{ username: user.username, displayName: user.displayName, email: user.email, role: user.role }]);
    }
  }, [user]);

  const filtered = search.trim()
    ? users.filter(u => u.username.toLowerCase().includes(search.toLowerCase()) || (u.displayName || "").toLowerCase().includes(search.toLowerCase()))
    : users;

  const handleInvite = async () => {
    if (!newUsername.trim() || !newPassword) { toast.error("Fill in all fields"); return; }
    setLoading(true);
    try {
      await register(newUsername.trim(), newPassword);
      const newUser = { username: newUsername.trim(), displayName: newUsername.trim(), email: `${newUsername.trim()}@trf.com`, role: newRole };
      setUsers(prev => [newUser, ...prev]);
      toast.success(`${newUsername.trim()} added!`);
      setInviteOpen(false);
      setNewUsername(""); setNewPassword(""); setNewRole("Engineer");
    } catch (e) {
      toast.error(e.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 4, flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{
              width: 44, height: 44, borderRadius: "13px",
              background: "linear-gradient(135deg,#a855f7,#6366f1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 8px 20px rgba(168,85,247,0.35)",
            }}>
              <PeopleRoundedIcon sx={{ color: "#fff", fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, fontSize: "1.65rem", color: theme.palette.text.primary, lineHeight: 1.2 }}>
                User Management
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: "0.82rem" }}>
                {users.length} member{users.length !== 1 ? "s" : ""} in the system
              </Typography>
            </Box>
          </Box>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              variant="contained"
              startIcon={<PersonAddRoundedIcon />}
              onClick={() => setInviteOpen(true)}
              sx={{
                borderRadius: "12px", fontWeight: 700,
                background: "linear-gradient(135deg,#6366f1,#06b6d4)",
                boxShadow: "0 6px 18px rgba(99,102,241,0.35)",
              }}
            >
              Invite User
            </Button>
          </motion.div>
        </Box>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <TextField
          fullWidth size="small"
          placeholder="Search by name or username…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ fontSize: 18 }} /></InputAdornment>,
            sx: { borderRadius: "12px" },
          }}
        />
      </motion.div>

      {/* User grid */}
      <Grid container spacing={2}>
        {filtered.map((u, i) => (
          <Grid item xs={12} sm={6} lg={4} key={u.username}>
            <UserCard u={u} isCurrentUser={u.username === user?.username} isDark={isDark} border={border} />
          </Grid>
        ))}
        {filtered.length === 0 && (
          <Grid item xs={12}>
            <Box sx={{ py: 8, textAlign: "center" }}>
              <Typography sx={{ color: theme.palette.text.secondary }}>No users found</Typography>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Invite Dialog */}
      <Dialog
        open={inviteOpen}
        onClose={() => !loading && setInviteOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: "22px", minWidth: 400, p: 1,
            background: isDark ? "rgba(10,15,30,0.97)" : "#fff",
            backdropFilter: "blur(30px)", border: `1px solid ${border}`,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: "1.05rem", pb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <PersonAddRoundedIcon sx={{ color: "#6366f1" }} />
            Invite New User
          </Box>
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
          <TextField
            label="Username" fullWidth
            value={newUsername}
            onChange={e => setNewUsername(e.target.value)}
            InputProps={{ sx: { borderRadius: "12px" } }}
          />
          <TextField
            label="Password" fullWidth
            type={showPwd ? "text" : "password"}
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            InputProps={{
              sx: { borderRadius: "12px" },
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setShowPwd(v => !v)}>
                    {showPwd ? <VisibilityOffRoundedIcon sx={{ fontSize: 16 }} /> : <VisibilityRoundedIcon sx={{ fontSize: 16 }} />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select value={newRole} label="Role" onChange={e => setNewRole(e.target.value)} sx={{ borderRadius: "12px" }}>
              {Object.keys(ROLE_META).map(r => (
                <MenuItem key={r} value={r}>
                  <Chip label={r} size="small" sx={{ fontSize: "0.7rem", background: ROLE_META[r].bg, color: ROLE_META[r].color }} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setInviteOpen(false)} disabled={loading} sx={{ borderRadius: "10px" }}>Cancel</Button>
          <Button
            variant="contained" onClick={handleInvite} disabled={loading}
            startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <PersonAddRoundedIcon />}
            sx={{ borderRadius: "10px", background: "linear-gradient(135deg,#6366f1,#06b6d4)", boxShadow: "none" }}
          >
            {loading ? "Inviting…" : "Send Invite"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
