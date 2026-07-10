import { useEffect, useState, useCallback } from "react";
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
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import InputAdornment from "@mui/material/InputAdornment";
import CircularProgress from "@mui/material/CircularProgress";
import Skeleton from "@mui/material/Skeleton";
import toast from "react-hot-toast";

import AddRoundedIcon            from "@mui/icons-material/AddRounded";
import EditRoundedIcon           from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon         from "@mui/icons-material/DeleteRounded";
import RefreshRoundedIcon        from "@mui/icons-material/RefreshRounded";
import PersonRoundedIcon         from "@mui/icons-material/PersonRounded";
import LockRoundedIcon           from "@mui/icons-material/LockRounded";
import PeopleRoundedIcon         from "@mui/icons-material/PeopleRounded";
import VisibilityRoundedIcon     from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon  from "@mui/icons-material/VisibilityOffRounded";

import API from "../services/api";
import { useApp } from "../context/AppContext";

const ROLES = ["Admin", "Engineer", "Manager"];
const ROLE_COLORS = {
  Admin:     { bg: "rgba(99,102,241,0.12)",  color: "#818cf8" },
  Engineer:  { bg: "rgba(6,182,212,0.12)",   color: "#22d3ee" },
  Manager:   { bg: "rgba(245,158,11,0.12)",  color: "#fbbf24" },
};

function avatarColor(name = "") {
  const COLORS = ["#6366f1","#06b6d4","#10b981","#f59e0b","#a855f7","#ef4444","#ec4899"];
  let h = 0;
  for (const c of name) h = name.charCodeAt(0) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
}

// ─── Invite dialog ────────────────────────────────────────────────────────────
function InviteDialog({ open, onClose, onSuccess }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [form,    setForm]    = useState({ display_name: "", password: "", email: "", role: "Engineer" });
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);

  const reset = () => setForm({ display_name: "", password: "", email: "", role: "Engineer" });

  const handleSubmit = async () => {
    if (!form.display_name.trim()) {
      toast.error("Full Name is required."); return;
    }
    if (!form.email.trim() || !form.email.includes("@")) {
      toast.error("A valid Email Address is required."); return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be ≥ 6 characters."); return;
    }
    setLoading(true);
    try {
      const emailVal = form.email.trim().toLowerCase();
      // Map email directly to username since username is unique and required in backend DB schema
      await API.post("/users/", {
        username: emailVal,
        email: emailVal,
        display_name: form.display_name.trim(),
        password: form.password,
        role: form.role
      });
      toast.success(`User "${form.display_name}" created!`);
      onSuccess(form);
      reset(); onClose();
    } catch (e) {
      toast.error(e.response?.data?.detail || e.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => { reset(); onClose(); }}
      PaperProps={{ sx: { borderRadius: "18px", width: 420,
        background: isDark ? "rgba(10,15,30,0.97)" : "#fff", backdropFilter: "blur(30px)",
        border: `1px solid ${isDark ? "rgba(148,163,184,0.12)" : "rgba(148,163,184,0.25)"}` } }}>
      <DialogTitle sx={{ fontWeight: 700, fontSize: "1.05rem", pb: 1 }}>Invite New User</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: "8px !important" }}>
        <TextField label="Full Name" value={form.display_name} autoFocus
          onChange={e => setForm(p => ({ ...p, display_name: e.target.value }))}
          InputProps={{ startAdornment: <InputAdornment position="start"><PersonRoundedIcon sx={{ fontSize: 17 }} /></InputAdornment>, sx: { borderRadius: "10px" } }} />
        <TextField label="Email Address" type="email" value={form.email}
          onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
          InputProps={{ sx: { borderRadius: "10px" } }} />
        <TextField label="Password" type={showPw ? "text" : "password"} value={form.password}
          onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
          helperText="Min 6 characters"
          InputProps={{
            startAdornment: <InputAdornment position="start"><LockRoundedIcon sx={{ fontSize: 17 }} /></InputAdornment>,
            endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => setShowPw(v => !v)}>
              {showPw ? <VisibilityOffRoundedIcon sx={{ fontSize: 16 }} /> : <VisibilityRoundedIcon sx={{ fontSize: 16 }} />}
            </IconButton></InputAdornment>,
            sx: { borderRadius: "10px" },
          }} />
        <FormControl>
          <InputLabel>Role</InputLabel>
          <Select value={form.role} label="Role" onChange={e => setForm(p => ({ ...p, role: e.target.value }))} sx={{ borderRadius: "10px" }}>
            {ROLES.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={() => { reset(); onClose(); }} sx={{ borderRadius: "10px" }}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <AddRoundedIcon />}
          sx={{ borderRadius: "10px", background: "linear-gradient(135deg,#6366f1,#06b6d4)" }}>
          {loading ? "Creating…" : "Create User"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Role edit dialog ─────────────────────────────────────────────────────────
function RoleDialog({ open, onClose, target, onSuccess }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [role,    setRole]    = useState(target?.role || "Engineer");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (target) setRole(target.role); }, [target]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await API.put(`/users/${target.id}/role`, { role });
      toast.success(`Role updated to ${role}`);
      onSuccess(target.id, role);
      onClose();
    } catch (e) { toast.error(e.message || "Update failed"); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onClose={onClose}
      PaperProps={{ sx: { borderRadius: "18px", width: 340,
        background: isDark ? "rgba(10,15,30,0.97)" : "#fff", backdropFilter: "blur(30px)",
        border: `1px solid ${isDark ? "rgba(148,163,184,0.12)" : "rgba(148,163,184,0.25)"}` } }}>
      <DialogTitle sx={{ fontWeight: 700, fontSize: "1.05rem" }}>
        Change Role — {target?.username}
      </DialogTitle>
      <DialogContent>
        <FormControl fullWidth sx={{ mt: 1 }}>
          <InputLabel>Role</InputLabel>
          <Select value={role} label="Role" onChange={e => setRole(e.target.value)} sx={{ borderRadius: "10px" }}>
            {ROLES.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} sx={{ borderRadius: "10px" }}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={loading}
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <EditRoundedIcon />}
          sx={{ borderRadius: "10px", background: "linear-gradient(135deg,#f59e0b,#fbbf24)", color: "#fff" }}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
const stagger = { animate: { transition: { staggerChildren: 0.06 } } };
const fadeUp  = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0, transition: { duration: 0.32 } } };

export default function Users() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { user: me } = useApp();

  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [roleTarget, setRoleTarget] = useState(null);

  const cardBg = isDark ? "rgba(15,23,42,0.72)" : "rgba(255,255,255,0.88)";
  const border = isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.2)";

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/users/");
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch { toast.error("Failed to load users"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleInviteSuccess = () => fetchUsers();

  const handleRoleSuccess = (userId, newRole) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Delete user "${u.username}"?`)) return;
    try {
      await API.delete(`/users/${u.id}`);
      setUsers(prev => prev.filter(x => x.id !== u.id));
      toast.success(`User "${u.username}" deleted`);
    } catch (e) { toast.error(e.message || "Delete failed"); }
  };

  const handleToggleActive = async (u) => {
    const action = u.is_active === false ? "activate" : "deactivate";
    if (!window.confirm(`${action.charAt(0).toUpperCase()+action.slice(1)} "${u.username}"?`)) return;
    try {
      const { data } = await API.put(`/users/${u.id}/status`, { is_active: u.is_active === false });
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_active: data.is_active } : x));
      toast.success(`User "${u.username}" ${action}d`);
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed"); }
  };

  const handleResetPassword = async (u) => {
    const newPwd = window.prompt(`Enter new password for "${u.username}" (min 6 chars):`);
    if (!newPwd) return;
    if (newPwd.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    try {
      await API.post(`/users/${u.id}/reset-password`, { new_password: newPwd });
      toast.success(`Password reset for "${u.username}"`);
    } catch (e) { toast.error(e?.response?.data?.detail || "Reset failed"); }
  };

  return (
    <motion.div variants={stagger} initial="initial" animate="animate">
      <motion.div variants={fadeUp}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mb: 4, flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{
              width: 44, height: 44, borderRadius: "13px",
              background: "linear-gradient(135deg,#6366f1,#06b6d4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 8px 20px rgba(99,102,241,0.35)",
            }}>
              <PeopleRoundedIcon sx={{ color: "#fff", fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, fontSize: "1.65rem", color: theme.palette.text.primary, lineHeight: 1.2 }}>
                User Management
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: "0.82rem" }}>
                {loading ? "Loading…" : `${users.length} registered user${users.length !== 1 ? "s" : ""}`}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchUsers}
                sx={{ background: isDark ? "rgba(148,163,184,0.08)" : "rgba(100,116,139,0.08)", borderRadius: "10px" }}>
                <RefreshRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Button variant="contained" startIcon={<AddRoundedIcon />}
              onClick={() => setInviteOpen(true)}
              component={motion.button} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              sx={{ background: "linear-gradient(135deg,#6366f1,#06b6d4)", borderRadius: "12px", boxShadow: "0 6px 16px rgba(99,102,241,0.3)" }}>
              Invite User
            </Button>
          </Box>
        </Box>
      </motion.div>

      {/* User list */}
      {loading
        ? Array.from({ length: 4 }).map((_, i) => (
            <Box key={i} sx={{ display: "flex", gap: 2, p: 2.5, mb: 1.5, borderRadius: "16px", background: cardBg, border: `1px solid ${border}` }}>
              <Skeleton variant="circular" width={44} height={44} />
              <Box sx={{ flex: 1 }}>
                <Skeleton width="40%" height={18} sx={{ mb: 0.5 }} />
                <Skeleton width="60%" height={14} />
              </Box>
              <Skeleton width={70} height={22} sx={{ borderRadius: "6px" }} />
            </Box>
          ))
        : (
          <AnimatePresence initial={false}>
            {users.map((u) => {
              const displayName = u.display_name || u.username;
              const initials    = displayName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
              const color       = avatarColor(displayName);
              const isMe        = u.username === me?.username;
              const rc          = ROLE_COLORS[u.role] || { bg: "rgba(148,163,184,0.1)", color: "#94a3b8" };

              return (
                <motion.div key={u.id} variants={fadeUp} layout
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <Box sx={{
                    display: "flex", alignItems: "center", gap: 2, p: 2.5, mb: 1.5,
                    borderRadius: "16px", background: cardBg,
                    border: `1px solid ${isMe ? "rgba(99,102,241,0.3)" : border}`,
                    backdropFilter: "blur(20px)",
                    boxShadow: isMe ? "0 4px 16px rgba(99,102,241,0.1)" : "none",
                    "&:hover": { borderColor: "rgba(99,102,241,0.25)", boxShadow: "0 8px 24px rgba(99,102,241,0.08)" },
                    transition: "all 0.2s",
                  }}>
                    <Avatar sx={{
                      width: 44, height: 44, fontWeight: 700, fontSize: "0.9rem",
                      background: `${color}25`, color, border: `1.5px solid ${color}45`,
                    }}>
                      {initials}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: "0.88rem" }}>
                          {displayName}
                        </Typography>
                        {isMe && (
                          <Chip label="You" size="small" sx={{ height: 16, fontSize: "0.58rem", fontWeight: 700, background: "rgba(99,102,241,0.12)", color: "#818cf8" }} />
                        )}
                      </Box>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: "0.75rem" }}>
                        @{u.username}{u.email ? ` · ${u.email}` : ""}
                      </Typography>
                    </Box>
                    <Chip label={u.role} size="small"
                      sx={{ fontWeight: 700, fontSize: "0.7rem", height: 22, background: rc.bg, color: rc.color }} />
                    {/* Active/Inactive badge */}
                    <Chip
                      label={u.is_active === false ? "Inactive" : "Active"}
                      size="small"
                      sx={{
                        height: 18, fontSize: "0.62rem", fontWeight: 700,
                        background: u.is_active === false ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)",
                        color: u.is_active === false ? "#f87171" : "#34d399",
                      }}
                    />
                    {/* Admin actions */}
                    {me?.role === "Admin" && !isMe && (
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        <Tooltip title="Change role">
                          <IconButton size="small" onClick={() => setRoleTarget(u)}
                            sx={{ "&:hover": { color: "#f59e0b", background: "rgba(245,158,11,0.1)" }, borderRadius: "8px" }}>
                            <EditRoundedIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={u.is_active === false ? "Activate user" : "Deactivate user"}>
                          <IconButton size="small" onClick={() => handleToggleActive(u)}
                            sx={{ "&:hover": { color: u.is_active === false ? "#34d399" : "#f87171", background: u.is_active === false ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)" }, borderRadius: "8px" }}>
                            {u.is_active === false
                              ? <VisibilityRoundedIcon sx={{ fontSize: 16 }} />
                              : <VisibilityOffRoundedIcon sx={{ fontSize: 16 }} />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reset password">
                          <IconButton size="small" onClick={() => handleResetPassword(u)}
                            sx={{ "&:hover": { color: "#a855f7", background: "rgba(168,85,247,0.1)" }, borderRadius: "8px" }}>
                            <LockRoundedIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete user">
                          <IconButton size="small" onClick={() => handleDelete(u)}
                            sx={{ "&:hover": { color: "#ef4444", background: "rgba(239,68,68,0.1)" }, borderRadius: "8px" }}>
                            <DeleteRoundedIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                  </Box>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )
      }

      <InviteDialog open={inviteOpen} onClose={() => setInviteOpen(false)} onSuccess={handleInviteSuccess} />
      {roleTarget && (
        <RoleDialog open={!!roleTarget} onClose={() => setRoleTarget(null)} target={roleTarget} onSuccess={handleRoleSuccess} />
      )}
    </motion.div>
  );
}
