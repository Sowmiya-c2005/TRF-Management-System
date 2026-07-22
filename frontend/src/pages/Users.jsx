/**
 * Users.jsx — Enterprise User Management
 * Features: Add User, Edit User (name/email/phone/role), Activate/Deactivate,
 *           Reset Password, Delete User, Live Search, Role & Status Filters.
 * Every user must have a real email address — no @trf.com addresses allowed.
 */
import { useEffect, useState, useCallback, useMemo } from "react";
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
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import toast from "react-hot-toast";

import AddRoundedIcon            from "@mui/icons-material/AddRounded";
import EditRoundedIcon           from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon         from "@mui/icons-material/DeleteRounded";
import RefreshRoundedIcon        from "@mui/icons-material/RefreshRounded";
import PersonRoundedIcon         from "@mui/icons-material/PersonRounded";
import LockRoundedIcon           from "@mui/icons-material/LockRounded";
import PeopleRoundedIcon         from "@mui/icons-material/PeopleRounded";
import SearchRoundedIcon         from "@mui/icons-material/SearchRounded";
import EmailRoundedIcon          from "@mui/icons-material/EmailRounded";
import PhoneRoundedIcon          from "@mui/icons-material/PhoneRounded";
import VisibilityRoundedIcon     from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon  from "@mui/icons-material/VisibilityOffRounded";
import BadgeRoundedIcon          from "@mui/icons-material/BadgeRounded";
import CheckCircleRoundedIcon    from "@mui/icons-material/CheckCircleRounded";
import BlockRoundedIcon          from "@mui/icons-material/BlockRounded";
import { useLocation }           from "react-router-dom";

import API from "../services/api";
import { useApp } from "../context/AppContext";

const ROLES = ["Admin", "Manager", "Engineer"];
const ROLE_COLORS = {
  Admin:    { bg: "rgba(99,102,241,0.12)",  color: "#818cf8" },
  Manager:  { bg: "rgba(245,158,11,0.12)",  color: "#fbbf24" },
  Engineer: { bg: "rgba(6,182,212,0.12)",   color: "#22d3ee" },
};

const stagger = { animate: { transition: { staggerChildren: 0.05 } } };
const fadeUp  = { initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

function avatarColor(name = "") {
  const COLORS = ["#6366f1","#06b6d4","#10b981","#f59e0b","#a855f7","#ef4444","#ec4899"];
  let h = 0;
  for (const c of name) h = name.charCodeAt(0) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
}

function fieldStyle(isDark) {
  return {
    "& .MuiOutlinedInput-root": {
      borderRadius: "10px",
      background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
    },
  };
}

// ─── Add User Dialog ──────────────────────────────────────────────────────────
function AddUserDialog({ open, onClose, onSuccess, isDark }) {
  const [form,    setForm]    = useState({ display_name: "", email: "", password: "", role: "Engineer", phone: "" });
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);

  const reset = () => setForm({ display_name: "", email: "", password: "", role: "Engineer", phone: "" });

  const handleSubmit = async () => {
    if (!form.display_name.trim()) { toast.error("Full Name is required."); return; }
    const emailVal = form.email.trim().toLowerCase();
    if (!emailVal || !emailVal.includes("@")) { toast.error("A valid real email address is required."); return; }
    if (emailVal.endsWith("@trf.com")) { toast.error("Please use a real email (Gmail, Outlook, company email) — not @trf.com."); return; }
    if (form.password.length < 6) { toast.error("Password must be ≥ 6 characters."); return; }

    setLoading(true);
    try {
      await API.post("/users/", {
        username:     emailVal,
        email:        emailVal,
        display_name: form.display_name.trim(),
        password:     form.password,
        role:         form.role,
        phone:        form.phone.trim() || undefined,
      });
      toast.success(`User "${form.display_name}" created successfully!`);
      onSuccess();
      reset(); onClose();
    } catch (e) {
      toast.error(e.response?.data?.detail || e.message || "Failed to create user.");
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onClose={() => { reset(); onClose(); }}
      PaperProps={{ sx: { borderRadius: "18px", width: 460,
        background: isDark ? "rgba(10,15,30,0.97)" : "#fff", backdropFilter: "blur(30px)",
        border: `1px solid ${isDark ? "rgba(148,163,184,0.12)" : "rgba(148,163,184,0.25)"}` } }}>
      <DialogTitle sx={{ fontWeight: 800, fontSize: "1.1rem", pb: 0.5 }}>
        Add New User
      </DialogTitle>
      <Typography sx={{ px: 3, pb: 1.5, fontSize: "0.78rem", color: "text.secondary" }}>
        Enter the user's real email address — it will be used for login and notifications.
      </Typography>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: "4px !important" }}>
        <TextField label="Full Name *" value={form.display_name} autoFocus
          onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
          fullWidth size="small" sx={fieldStyle(isDark)} />
        <TextField label="Email Address *" value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          placeholder="e.g., user@gmail.com" fullWidth size="small" sx={fieldStyle(isDark)} />
        <TextField label="Phone Number" value={form.phone}
          onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
          placeholder="+91 98765 43210" fullWidth size="small" sx={fieldStyle(isDark)} />
        <FormControl fullWidth size="small" sx={fieldStyle(isDark)}>
          <InputLabel>Role *</InputLabel>
          <Select value={form.role} label="Role *" onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
            {ROLES.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField label="Initial Password *" type={showPw ? "text" : "password"} value={form.password}
          onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          fullWidth size="small" sx={fieldStyle(isDark)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPw(!showPw)} edge="end" size="small">
                  {showPw ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
                </IconButton>
              </InputAdornment>
            ),
          }} />
      </DialogContent>
      <DialogActions sx={{ p: "16px 24px" }}>
        <Button onClick={() => { reset(); onClose(); }} disabled={loading}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AddRoundedIcon />}
          sx={{ background: "linear-gradient(135deg,#6366f1,#06b6d4)", borderRadius: "10px", fontWeight: 700 }}>
          {loading ? "Creating…" : "Create User"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Edit User Dialog ─────────────────────────────────────────────────────────
function EditUserDialog({ open, onClose, target, onSuccess, isDark }) {
  const [form,    setForm]    = useState({ display_name: "", email: "", phone: "", role: "Engineer" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (target) {
      setForm({
        display_name: target.display_name || "",
        email:        target.email        || "",
        phone:        target.phone        || "",
        role:         target.role         || "Engineer",
      });
    }
  }, [target]);

  const handleSubmit = async () => {
    if (!form.display_name.trim()) { toast.error("Full Name is required."); return; }
    const emailVal = form.email.trim().toLowerCase();
    if (!emailVal || !emailVal.includes("@")) { toast.error("A valid email address is required."); return; }
    if (emailVal.endsWith("@trf.com")) { toast.error("Please use a real email — not @trf.com."); return; }

    setLoading(true);
    try {
      const { data } = await API.put(`/users/${target.id}`, {
        display_name: form.display_name.trim(),
        email:        emailVal,
        phone:        form.phone.trim() || undefined,
        role:         form.role,
      });
      toast.success(`User "${data.display_name || data.username}" updated!`);
      onSuccess(target.id, data);
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.detail || e.message || "Failed to update user.");
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onClose={onClose}
      PaperProps={{ sx: { borderRadius: "18px", width: 440,
        background: isDark ? "rgba(10,15,30,0.97)" : "#fff", backdropFilter: "blur(30px)",
        border: `1px solid ${isDark ? "rgba(148,163,184,0.12)" : "rgba(148,163,184,0.25)"}` } }}>
      <DialogTitle sx={{ fontWeight: 800, fontSize: "1.1rem", pb: 0.5 }}>
        Edit User Profile
      </DialogTitle>
      <Typography sx={{ px: 3, pb: 1.5, fontSize: "0.78rem", color: "text.secondary" }}>
        Update details for {target?.username}.
      </Typography>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: "4px !important" }}>
        <TextField label="Full Name *" value={form.display_name}
          onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
          fullWidth size="small" sx={fieldStyle(isDark)} />
        <TextField label="Email Address *" value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          fullWidth size="small" sx={fieldStyle(isDark)} />
        <TextField label="Phone Number" value={form.phone}
          onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
          fullWidth size="small" sx={fieldStyle(isDark)} />
        <FormControl fullWidth size="small" sx={fieldStyle(isDark)}>
          <InputLabel>Role *</InputLabel>
          <Select value={form.role} label="Role *" onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
            {ROLES.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions sx={{ p: "16px 24px" }}>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <EditRoundedIcon />}
          sx={{ background: "linear-gradient(135deg,#6366f1,#06b6d4)", borderRadius: "10px", fontWeight: 700 }}>
          {loading ? "Saving…" : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Reset Password Dialog ────────────────────────────────────────────────────
function ResetPasswordDialog({ open, onClose, target, isDark }) {
  const [newPw,   setNewPw]   = useState("");
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (newPw && newPw.length < 6) { toast.error("Password must be ≥ 6 characters."); return; }
    setLoading(true);
    try {
      const { data } = await API.post(`/users/${target.id}/reset-password`, { new_password: newPw.trim() || undefined });
      toast.success(data.message || "Password reset successfully!");
      setNewPw(""); onClose();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to reset password.");
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onClose={() => { setNewPw(""); onClose(); }}
      PaperProps={{ sx: { borderRadius: "18px", width: 420,
        background: isDark ? "rgba(10,15,30,0.97)" : "#fff", backdropFilter: "blur(30px)",
        border: `1px solid ${isDark ? "rgba(148,163,184,0.12)" : "rgba(148,163,184,0.25)"}` } }}>
      <DialogTitle sx={{ fontWeight: 800, fontSize: "1.1rem", pb: 0.5 }}>
        Reset Password for {target?.display_name || target?.username}
      </DialogTitle>
      <Typography sx={{ px: 3, pb: 1.5, fontSize: "0.78rem", color: "text.secondary" }}>
        Enter a new password, or leave blank to auto-generate a secure random password and notify the user via email.
      </Typography>
      <DialogContent sx={{ pt: "4px !important" }}>
        <TextField label="New Password (optional)" type={showPw ? "text" : "password"} value={newPw}
          onChange={e => setNewPw(e.target.value)} placeholder="Auto-generate if empty"
          fullWidth size="small" sx={fieldStyle(isDark)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPw(!showPw)} edge="end" size="small">
                  {showPw ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
                </IconButton>
              </InputAdornment>
            ),
          }} />
      </DialogContent>
      <DialogActions sx={{ p: "16px 24px" }}>
        <Button onClick={() => { setNewPw(""); onClose(); }} disabled={loading}>Cancel</Button>
        <Button variant="contained" onClick={handleReset} disabled={loading} color="warning"
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <LockRoundedIcon />}
          sx={{ borderRadius: "10px", fontWeight: 700 }}>
          {loading ? "Resetting…" : "Reset Password"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Users() {
  const theme = useTheme();
  const location = useLocation();
  const isDark = theme.palette.mode === "dark";
  const { user: me } = useApp();

  const [users,         setUsers]         = useState([]);
  const [total,         setTotal]         = useState(0);
  const [page,          setPage]          = useState(1);
  const [limit,         setLimit]         = useState(10);
  const [pages,         setPages]         = useState(1);
  const [loading,       setLoading]       = useState(true);
  const [addOpen,       setAddOpen]       = useState(false);
  const [editTarget,    setEditTarget]    = useState(null);
  const [resetTarget,   setResetTarget]   = useState(null);
  const [searchQ,       setSearchQ]       = useState("");
  const [roleFilter,    setRoleFilter]    = useState("All");
  const [statusFilter,  setStatusFilter]  = useState("All");

  // Read URL query params on initial load or search param change
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const r = params.get("role");
    const s = params.get("status");
    if (r) setRoleFilter(r);
    if (s) setStatusFilter(s);
  }, [location.search]);

  const cardBg = isDark ? "rgba(15,23,42,0.72)" : "rgba(255,255,255,0.88)";
  const border = isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.2)";

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (searchQ.trim()) params.set("search", searchQ.trim());
      if (roleFilter !== "All") params.set("role", roleFilter);
      if (statusFilter !== "All") params.set("status", statusFilter);

      const res = await API.get(`/users/?${params}`);
      if (res.data && Array.isArray(res.data.items)) {
        setUsers(res.data.items);
        setTotal(res.data.total ?? res.data.items.length);
        setPages(res.data.pages ?? 1);
        setPage(res.data.page ?? 1);
      } else {
        const arr = Array.isArray(res.data) ? res.data : [];
        setUsers(arr);
        setTotal(arr.length);
        setPages(1);
        setPage(1);
      }
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQ, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleEditSuccess = (userId, updated) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updated } : u));
  };

  const handleToggleActive = async (u) => {
    const newActive = u.is_active === false;
    const label = newActive ? "activate" : "deactivate";
    if (!window.confirm(`${label.charAt(0).toUpperCase() + label.slice(1)} "${u.display_name || u.username}"?`)) return;
    try {
      const { data } = await API.put(`/users/${u.id}/status`, { is_active: newActive });
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_active: data.is_active } : x));
      toast.success(`User "${u.display_name || u.username}" ${label}d.`);
    } catch (e) { toast.error(e?.response?.data?.detail || "Failed."); }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Permanently delete "${u.display_name || u.username}"? This cannot be undone.`)) return;
    try {
      await API.delete(`/users/${u.id}`);
      setUsers(prev => prev.filter(x => x.id !== u.id));
      toast.success(`User "${u.display_name || u.username}" deleted.`);
    } catch (e) { toast.error(e?.response?.data?.detail || e.message || "Delete failed."); }
  };

  // ── Stats ───────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:     users.length,
    active:    users.filter(u => u.is_active !== false).length,
    managers:  users.filter(u => u.role === "Manager" && u.is_active !== false).length,
    engineers: users.filter(u => u.role === "Engineer" && u.is_active !== false).length,
  }), [users]);

  return (
    <motion.div variants={stagger} initial="initial" animate="animate">
      {/* ── Header ── */}
      <motion.div variants={fadeUp}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", mb: 3, flexWrap: "wrap", gap: 2 }}>
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
              <Typography variant="h4" sx={{ fontWeight: 800, fontSize: "1.65rem", lineHeight: 1.2 }}>
                User Management
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "0.82rem" }}>
                {loading ? "Loading…" : `${stats.total} users · ${stats.active} active · ${stats.managers} managers · ${stats.engineers} engineers`}
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
            {me?.role === "Admin" && (
              <Button variant="contained" startIcon={<AddRoundedIcon />}
                onClick={() => setAddOpen(true)}
                component={motion.button} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                sx={{ background: "linear-gradient(135deg,#6366f1,#06b6d4)", borderRadius: "12px", fontWeight: 700,
                  boxShadow: "0 6px 16px rgba(99,102,241,0.3)" }}>
                Add User
              </Button>
            )}
          </Box>
        </Box>
      </motion.div>

      {/* ── Search + Filters ── */}
      <motion.div variants={fadeUp}>
        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap", alignItems: "center" }}>
          {/* Search */}
          <TextField
            size="small"
            placeholder="Search by name, username, or email…"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            sx={{
              flex: "1 1 280px", minWidth: 220,
              "& .MuiOutlinedInput-root": { borderRadius: "12px", background: isDark ? "rgba(255,255,255,0.05)" : "#fff" },
            }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ fontSize: 18, color: "text.secondary" }} /></InputAdornment>,
            }}
          />

          {/* Role filter */}
          <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
            {["All", ...ROLES].map(r => (
              <Chip key={r} label={r} size="small" clickable
                onClick={() => setRoleFilter(r)}
                sx={{
                  fontWeight: 700, fontSize: "0.72rem",
                  background: roleFilter === r
                    ? (ROLE_COLORS[r]?.bg || "rgba(99,102,241,0.2)")
                    : (isDark ? "rgba(148,163,184,0.08)" : "rgba(148,163,184,0.12)"),
                  color: roleFilter === r
                    ? (ROLE_COLORS[r]?.color || "#818cf8")
                    : "text.secondary",
                  border: roleFilter === r ? `1px solid ${ROLE_COLORS[r]?.color || "#818cf8"}40` : "1px solid transparent",
                  "&:hover": { opacity: 0.85 },
                }}
              />
            ))}
          </Box>

          {/* Status filter */}
          <Box sx={{ display: "flex", gap: 0.75 }}>
            {["All", "Active", "Inactive"].map(s => (
              <Chip key={s} label={s} size="small" clickable
                onClick={() => setStatusFilter(s)}
                sx={{
                  fontWeight: 700, fontSize: "0.72rem",
                  background: statusFilter === s
                    ? (s === "Active" ? "rgba(16,185,129,0.15)" : s === "Inactive" ? "rgba(239,68,68,0.15)" : "rgba(99,102,241,0.15)")
                    : (isDark ? "rgba(148,163,184,0.08)" : "rgba(148,163,184,0.12)"),
                  color: statusFilter === s
                    ? (s === "Active" ? "#34d399" : s === "Inactive" ? "#f87171" : "#818cf8")
                    : "text.secondary",
                  "&:hover": { opacity: 0.85 },
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Result count */}
        {(searchQ || roleFilter !== "All" || statusFilter !== "All") && !loading && (
          <Typography sx={{ fontSize: "0.78rem", color: "text.secondary", mb: 2 }}>
            Showing {users.length} of {total} users
          </Typography>
        )}
      </motion.div>

      {/* ── User List ── */}
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
            {users.length === 0 ? (
              <motion.div key="empty" variants={fadeUp}>
                <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
                  <PeopleRoundedIcon sx={{ fontSize: 48, opacity: 0.3, mb: 2, display: "block", mx: "auto" }} />
                  <Typography>No users match your filters.</Typography>
                </Box>
              </motion.div>
            ) : users.map((u) => {
              const displayName = u.display_name || u.username;
              const initials    = displayName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
              const color       = avatarColor(displayName);
              const isMe        = u.id === me?.id || u.username === me?.username;
              const rc          = ROLE_COLORS[u.role] || { bg: "rgba(148,163,184,0.1)", color: "#94a3b8" };
              const isActive    = u.is_active !== false;

              return (
                <motion.div key={u.id} variants={fadeUp} layout
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <Box sx={{
                    display: "flex", alignItems: "center", gap: 2, p: 2.5, mb: 1.5,
                    borderRadius: "16px", background: cardBg,
                    border: `1px solid ${isMe ? "rgba(99,102,241,0.3)" : border}`,
                    backdropFilter: "blur(20px)",
                    boxShadow: isMe ? "0 4px 16px rgba(99,102,241,0.1)" : "none",
                    opacity: isActive ? 1 : 0.65,
                    "&:hover": { borderColor: "rgba(99,102,241,0.25)", boxShadow: "0 8px 24px rgba(99,102,241,0.08)" },
                    transition: "all 0.2s",
                  }}>
                    <Avatar sx={{
                      width: 44, height: 44, fontWeight: 700, fontSize: "0.9rem",
                      background: `${color}25`, color, border: `1.5px solid ${color}45`,
                      filter: isActive ? "none" : "grayscale(80%)",
                    }}>
                      {initials}
                    </Avatar>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: "0.88rem" }}>
                          {displayName}
                        </Typography>
                        {isMe && (
                          <Chip label="You" size="small" sx={{ height: 16, fontSize: "0.58rem", fontWeight: 700,
                            background: "rgba(99,102,241,0.12)", color: "#818cf8" }} />
                        )}
                      </Box>
                      <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.75rem" }}>
                        {u.email
                          ? u.email
                          : <span style={{ color: "#f59e0b", fontStyle: "italic" }}>No email set — click Edit to add real email</span>
                        }
                        {u.phone ? ` · ${u.phone}` : ""}
                      </Typography>
                    </Box>

                    {/* Role chip */}
                    <Chip label={u.role} size="small"
                      sx={{ fontWeight: 700, fontSize: "0.7rem", height: 22, background: rc.bg, color: rc.color }} />

                    {/* Active/Inactive badge */}
                    <Chip
                      icon={isActive ? <CheckCircleRoundedIcon sx={{ fontSize: "12px !important" }} /> : <BlockRoundedIcon sx={{ fontSize: "12px !important" }} />}
                      label={isActive ? "Active" : "Inactive"}
                      size="small"
                      sx={{
                        height: 20, fontSize: "0.62rem", fontWeight: 700,
                        background: isActive ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                        color: isActive ? "#34d399" : "#f87171",
                      }}
                    />

                    {/* Admin actions */}
                    {me?.role === "Admin" && !isMe && (
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        <Tooltip title="Edit user details & role">
                          <IconButton size="small" onClick={() => setEditTarget(u)}
                            sx={{ "&:hover": { color: "#f59e0b", background: "rgba(245,158,11,0.1)" }, borderRadius: "8px" }}>
                            <EditRoundedIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={isActive ? "Deactivate user" : "Activate user"}>
                          <IconButton size="small" onClick={() => handleToggleActive(u)}
                            sx={{ "&:hover": { color: isActive ? "#f87171" : "#34d399", background: isActive ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)" }, borderRadius: "8px" }}>
                            {isActive ? <BlockRoundedIcon sx={{ fontSize: 16 }} /> : <CheckCircleRoundedIcon sx={{ fontSize: 16 }} />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reset password">
                          <IconButton size="small" onClick={() => setResetTarget(u)}
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

      {/* ── Dialogs ── */}
      <AddUserDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={fetchUsers}
        isDark={isDark}
      />
      {editTarget && (
        <EditUserDialog
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          target={editTarget}
          onSuccess={handleEditSuccess}
          isDark={isDark}
        />
      )}
      {resetTarget && (
        <ResetPasswordDialog
          open={!!resetTarget}
          onClose={() => setResetTarget(null)}
          target={resetTarget}
          isDark={isDark}
        />
      )}
    </motion.div>
  );
}
