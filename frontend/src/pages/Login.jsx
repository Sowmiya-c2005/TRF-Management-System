import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@mui/material/styles";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import toast from "react-hot-toast";

import LockRoundedIcon            from "@mui/icons-material/LockRounded";
import PersonRoundedIcon          from "@mui/icons-material/PersonRounded";
import VisibilityRoundedIcon      from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon   from "@mui/icons-material/VisibilityOffRounded";
import FolderSpecialRoundedIcon   from "@mui/icons-material/FolderSpecialRounded";

import { login } from "../services/userService";
import { useApp } from "../context/AppContext";

export default function Login() {
  const theme   = useTheme();
  const isDark  = theme.palette.mode === "dark";
  const navigate = useNavigate();
  const { signIn } = useApp();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      toast.error("Please enter username and password.");
      return;
    }
    setLoading(true);
    try {
      const r = await login(username.trim(), password);
      const { message, role } = r.data;
      // Persist user in AppContext + localStorage
      signIn({ username: username.trim(), role, displayName: username.trim() });
      toast.success(`Welcome back, ${username.trim()}!`);
      navigate("/");
    } catch (e) {
      toast.error(e.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: isDark
        ? "radial-gradient(ellipse 80% 60% at 30% 20%, rgba(99,102,241,0.14) 0%, transparent 60%), #0a0f1e"
        : "radial-gradient(ellipse 80% 60% at 30% 20%, rgba(99,102,241,0.07) 0%, transparent 60%), #f1f5f9",
      p: 2,
    }}>
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0,  scale: 1 }}
        transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
        style={{ width: "100%", maxWidth: 420 }}
      >
        <Box sx={{
          p: 4, borderRadius: "24px",
          background: isDark ? "rgba(10,15,30,0.92)" : "rgba(255,255,255,0.95)",
          backdropFilter: "blur(32px)",
          border: `1px solid ${isDark ? "rgba(148,163,184,0.12)" : "rgba(148,163,184,0.28)"}`,
          boxShadow: isDark ? "0 32px 64px rgba(0,0,0,0.45)" : "0 32px 64px rgba(15,23,42,0.12)",
        }}>

          {/* Logo */}
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 4 }}>
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.12 }}
            >
              <Box sx={{
                width: 58, height: 58, borderRadius: "16px", mb: 2,
                background: "linear-gradient(135deg,#6366f1,#06b6d4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 14px 32px rgba(99,102,241,0.42)",
              }}>
                <FolderSpecialRoundedIcon sx={{ color: "#fff", fontSize: 28 }} />
              </Box>
            </motion.div>
            <Typography variant="h5" fontWeight={800} sx={{ color: theme.palette.text.primary, mb: 0.5, letterSpacing: "-0.01em" }}>
              TRF Portal
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              Sign in to your enterprise account
            </Typography>
          </Box>

          {/* Fields */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField
              label="Username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonRoundedIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
                  </InputAdornment>
                ),
                sx: { borderRadius: "12px" },
              }}
            />
            <TextField
              label="Password"
              type={showPass ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockRoundedIcon sx={{ fontSize: 18, color: theme.palette.text.secondary }} />
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

          {/* Submit */}
          <Button
            variant="contained"
            fullWidth
            disabled={loading}
            onClick={handleLogin}
            component={motion.button}
            whileHover={!loading ? { scale: 1.02 } : {}}
            whileTap={!loading  ? { scale: 0.98 } : {}}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{
              mt: 3.5, py: 1.4, borderRadius: "12px", fontSize: "0.95rem",
              background: "linear-gradient(135deg,#6366f1,#06b6d4)",
              boxShadow: "0 8px 22px rgba(99,102,241,0.35)",
              "&:hover": { boxShadow: "0 12px 30px rgba(99,102,241,0.45)" },
            }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </Button>

          <Divider sx={{ my: 2.5 }} />

          <Typography variant="caption" sx={{ display: "block", textAlign: "center", color: theme.palette.text.secondary }}>
            TRF Management System · Enterprise Edition
          </Typography>
        </Box>
      </motion.div>
    </Box>
  );
}
