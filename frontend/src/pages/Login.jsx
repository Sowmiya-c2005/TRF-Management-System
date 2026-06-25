import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@mui/material/styles";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import Chip from "@mui/material/Chip";
import toast from "react-hot-toast";

import LockRoundedIcon          from "@mui/icons-material/LockRounded";
import PersonRoundedIcon        from "@mui/icons-material/PersonRounded";
import VisibilityRoundedIcon    from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import FolderSpecialRoundedIcon from "@mui/icons-material/FolderSpecialRounded";
import CheckCircleRoundedIcon   from "@mui/icons-material/CheckCircleRounded";
import ArrowForwardRoundedIcon  from "@mui/icons-material/ArrowForwardRounded";
import ShieldRoundedIcon        from "@mui/icons-material/ShieldRounded";
import BoltRoundedIcon          from "@mui/icons-material/BoltRounded";
import GroupsRoundedIcon        from "@mui/icons-material/GroupsRounded";

import { login } from "../services/userService";
import { useApp } from "../context/AppContext";

// Animated floating orb
function FloatOrb({ style }) {
  return (
    <motion.div
      animate={{ y: [0, -20, 0], opacity: [0.4, 0.7, 0.4] }}
      transition={{ duration: 4 + Math.random() * 3, repeat: Infinity, ease: "easeInOut" }}
      style={{
        position: "absolute", borderRadius: "50%",
        background: "linear-gradient(135deg,rgba(99,102,241,0.35),rgba(6,182,212,0.25))",
        filter: "blur(40px)", pointerEvents: "none", ...style,
      }}
    />
  );
}

const FEATURES = [
  { icon: <BoltRoundedIcon sx={{ fontSize: 18 }} />, title: "Lightning Fast", desc: "Sub-second TRF creation and file management" },
  { icon: <ShieldRoundedIcon sx={{ fontSize: 18 }} />, title: "Enterprise Security", desc: "Role-based access control and audit logging" },
  { icon: <GroupsRoundedIcon sx={{ fontSize: 18 }} />, title: "Team Collaboration", desc: "Multi-user workflows with real-time updates" },
];

export default function Login() {
  const theme    = useTheme();
  const isDark   = theme.palette.mode === "dark";
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useApp();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const from = location.state?.from?.pathname || "/";

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      toast.error("Please enter username and password.");
      return;
    }
    setLoading(true);
    try {
      const r = await login(username.trim(), password);
      const { role, token } = r.data;
      signIn({ username: username.trim(), role, displayName: username.trim(), token });
      toast.success(`Welcome back, ${username.trim()}! 🎉`);
      navigate(from, { replace: true });
    } catch (e) {
      toast.error(e.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: "100vh", display: "flex",
      background: isDark ? "#060b18" : "#f1f5f9",
      overflow: "hidden",
    }}>
      {/* ── Left: Branding panel ── */}
      <Box sx={{
        display: { xs: "none", lg: "flex" },
        width: "52%", flexDirection: "column",
        justifyContent: "center", position: "relative", overflow: "hidden",
        background: isDark
          ? "linear-gradient(135deg,#0a0f1e 0%,#0d1635 50%,#0a0f1e 100%)"
          : "linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#0c4a6e 100%)",
        p: 8,
      }}>
        {/* Orbs */}
        <FloatOrb style={{ width: 350, height: 350, top: -80, right: -80 }} />
        <FloatOrb style={{ width: 250, height: 250, bottom: 40, left: -60 }} />
        <FloatOrb style={{ width: 180, height: 180, top: "45%", left: "55%" }} />

        {/* Grid lines */}
        <Box sx={{
          position: "absolute", inset: 0,
          backgroundImage: `linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }} />

        <Box sx={{ position: "relative", zIndex: 1 }}>
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 6 }}>
              <Box sx={{
                width: 48, height: 48, borderRadius: "14px",
                background: "linear-gradient(135deg,#6366f1,#06b6d4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 8px 28px rgba(99,102,241,0.5)",
              }}>
                <FolderSpecialRoundedIcon sx={{ color: "#fff", fontSize: 26 }} />
              </Box>
              <Box>
                <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1.1rem", lineHeight: 1.2, fontFamily: "'Outfit','Inter',sans-serif" }}>
                  TRF Portal
                </Typography>
                <Chip label="Enterprise Edition" size="small" sx={{
                  fontSize: "0.58rem", height: 18, fontWeight: 700, mt: 0.3,
                  background: "rgba(99,102,241,0.25)", color: "#a5b4fc",
                  border: "1px solid rgba(99,102,241,0.35)",
                }} />
              </Box>
            </Box>
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.55 }}
          >
            <Typography sx={{
              color: "#fff", fontWeight: 800, fontSize: "2.6rem", lineHeight: 1.18,
              letterSpacing: "-0.02em", mb: 2, fontFamily: "'Outfit','Inter',sans-serif",
            }}>
              Manage your TRFs{" "}
              <Box component="span" sx={{
                background: "linear-gradient(90deg,#818cf8,#22d3ee)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                effortlessly
              </Box>
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "1rem", lineHeight: 1.65, maxWidth: 420 }}>
              A complete enterprise platform for Technical Request Form management, file organization, and team collaboration.
            </Typography>
          </motion.div>

          {/* Feature list */}
          <Box sx={{ mt: 5, display: "flex", flexDirection: "column", gap: 2 }}>
            {FEATURES.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.45 }}
              >
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                  <Box sx={{
                    width: 36, height: 36, borderRadius: "10px", flexShrink: 0,
                    background: "rgba(99,102,241,0.18)",
                    border: "1px solid rgba(99,102,241,0.28)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#818cf8",
                  }}>
                    {feat.icon}
                  </Box>
                  <Box>
                    <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.88rem", lineHeight: 1.3 }}>
                      {feat.title}
                    </Typography>
                    <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.78rem", lineHeight: 1.5 }}>
                      {feat.desc}
                    </Typography>
                  </Box>
                </Box>
              </motion.div>
            ))}
          </Box>

          {/* Stat row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65, duration: 0.5 }}
          >
            <Box sx={{ display: "flex", gap: 4, mt: 6 }}>
              {[["10k+", "TRFs Managed"], ["99.9%", "Uptime SLA"], ["256-bit", "Encryption"]].map(([val, lbl]) => (
                <Box key={lbl}>
                  <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1.3rem" }}>{val}</Typography>
                  <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.72rem" }}>{lbl}</Typography>
                </Box>
              ))}
            </Box>
          </motion.div>
        </Box>
      </Box>

      {/* ── Right: Login form ── */}
      <Box sx={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        px: { xs: 3, sm: 6 }, py: 4, position: "relative",
      }}>
        {/* Background radial */}
        <Box sx={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: isDark
            ? "radial-gradient(ellipse 70% 50% at 60% 30%, rgba(99,102,241,0.07) 0%, transparent 70%)"
            : "radial-gradient(ellipse 70% 50% at 60% 30%, rgba(99,102,241,0.05) 0%, transparent 70%)",
        }} />

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }}
        >
          {/* Mobile logo */}
          <Box sx={{ display: { xs: "flex", lg: "none" }, alignItems: "center", gap: 1.5, mb: 5 }}>
            <Box sx={{
              width: 40, height: 40, borderRadius: "12px",
              background: "linear-gradient(135deg,#6366f1,#06b6d4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 8px 20px rgba(99,102,241,0.4)",
            }}>
              <FolderSpecialRoundedIcon sx={{ color: "#fff", fontSize: 22 }} />
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: theme.palette.text.primary }}>
              TRF Portal
            </Typography>
          </Box>

          {/* Card */}
          <Box sx={{
            p: { xs: 3.5, sm: 4.5 }, borderRadius: "24px",
            background: isDark ? "rgba(10,15,30,0.90)" : "rgba(255,255,255,0.96)",
            backdropFilter: "blur(40px)",
            border: `1px solid ${isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.22)"}`,
            boxShadow: isDark
              ? "0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.05)"
              : "0 40px 80px rgba(15,23,42,0.1), 0 0 0 1px rgba(99,102,241,0.04)",
          }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{
                fontWeight: 800, color: theme.palette.text.primary,
                letterSpacing: "-0.015em", mb: 0.75,
                fontFamily: "'Outfit','Inter',sans-serif",
              }}>
                Sign in
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: "0.88rem" }}>
                Enter your credentials to access your workspace
              </Typography>
            </Box>

            {/* Fields */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Box>
                <Typography sx={{
                  fontSize: "0.78rem", fontWeight: 600, mb: 0.75,
                  color: focusedField === "user" ? theme.palette.primary.main : theme.palette.text.secondary,
                  transition: "color 0.2s",
                }}>
                  Username
                </Typography>
                <TextField
                  fullWidth
                  autoComplete="username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocusedField("user")}
                  onBlur={() => setFocusedField(null)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonRoundedIcon sx={{ fontSize: 18, color: focusedField === "user" ? theme.palette.primary.main : theme.palette.text.secondary, transition: "color 0.2s" }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: "12px" },
                  }}
                />
              </Box>

              <Box>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.75 }}>
                  <Typography sx={{
                    fontSize: "0.78rem", fontWeight: 600,
                    color: focusedField === "pass" ? theme.palette.primary.main : theme.palette.text.secondary,
                    transition: "color 0.2s",
                  }}>
                    Password
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("pass")}
                  onBlur={() => setFocusedField(null)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockRoundedIcon sx={{ fontSize: 18, color: focusedField === "pass" ? theme.palette.primary.main : theme.palette.text.secondary, transition: "color 0.2s" }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setShowPass((v) => !v)} edge="end">
                          {showPass
                            ? <VisibilityOffRoundedIcon sx={{ fontSize: 17 }} />
                            : <VisibilityRoundedIcon   sx={{ fontSize: 17 }} />
                          }
                        </IconButton>
                      </InputAdornment>
                    ),
                    sx: { borderRadius: "12px" },
                  }}
                />
              </Box>
            </Box>

            {/* Sign in button */}
            <motion.div whileHover={!loading ? { scale: 1.015 } : {}} whileTap={!loading ? { scale: 0.985 } : {}} style={{ marginTop: 28 }}>
              <Button
                variant="contained"
                fullWidth
                disabled={loading}
                onClick={handleLogin}
                endIcon={!loading && <ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />}
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
                sx={{
                  py: 1.5, borderRadius: "12px", fontSize: "0.95rem", fontWeight: 700,
                  background: "linear-gradient(135deg,#6366f1,#06b6d4)",
                  boxShadow: "0 8px 24px rgba(99,102,241,0.38)",
                  letterSpacing: "0.01em",
                  "&:hover": { boxShadow: "0 14px 34px rgba(99,102,241,0.52)" },
                  "&:disabled": { opacity: 0.65 },
                }}
              >
                {loading ? "Signing in…" : "Sign In"}
              </Button>
            </motion.div>

            {/* Trust row */}
            <Box sx={{ mt: 3.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
              {[
                { icon: <ShieldRoundedIcon sx={{ fontSize: 13 }} />, label: "Secure" },
                { icon: <CheckCircleRoundedIcon sx={{ fontSize: 13 }} />, label: "Encrypted" },
                { icon: <LockRoundedIcon sx={{ fontSize: 13 }} />, label: "Private" },
              ].map((t) => (
                <Box key={t.label} sx={{ display: "flex", alignItems: "center", gap: 0.5, color: theme.palette.text.disabled }}>
                  {t.icon}
                  <Typography sx={{ fontSize: "0.7rem" }}>{t.label}</Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Footer */}
          <Typography sx={{
            mt: 3, textAlign: "center", fontSize: "0.72rem",
            color: theme.palette.text.disabled,
          }}>
            TRF Management System © {new Date().getFullYear()} · Enterprise Edition
          </Typography>
        </motion.div>
      </Box>
    </Box>
  );
}
