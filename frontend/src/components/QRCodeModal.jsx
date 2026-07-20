/**
 * QRCodeModal
 * ──────────────────────────────────────────────────────────────────────────
 * Shows a QR code for any TRF.
 * The QR image is fetched from  GET /qr/{trf_number}  (returns PNG).
 *
 * Props:
 *   open       — boolean
 *   onClose    — () => void
 *   trfNumber  — string
 *   projectName — string (optional label)
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import toast from "react-hot-toast";

import CloseRoundedIcon        from "@mui/icons-material/CloseRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import QrCode2RoundedIcon      from "@mui/icons-material/QrCode2Rounded";
import ContentCopyRoundedIcon  from "@mui/icons-material/ContentCopyRounded";
import OpenInNewRoundedIcon    from "@mui/icons-material/OpenInNewRounded";

import { BASE_API_URL as BASE } from "../services/api";
const APP_URL = import.meta.env.VITE_APP_URL || "http://localhost:5173";

export default function QRCodeModal({ open, onClose, trfNumber, projectName }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError,  setImgError]  = useState(false);

  if (!open || !trfNumber) return null;

  const qrSrc      = `${BASE}/qr/${encodeURIComponent(trfNumber)}`;
  const qrDownload = `${BASE}/qr/${encodeURIComponent(trfNumber)}/download`;
  const trfUrl     = `${APP_URL}/all?trf=${encodeURIComponent(trfNumber)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(trfUrl).then(() => toast.success("Link copied!"));
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = qrDownload;
    a.download = `QR_${trfNumber}.png`;
    a.click();
    toast.success("QR code downloaded");
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: "fixed", inset: 0, zIndex: 1400, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1,   y: 0  }}
            exit={{    opacity: 0, scale: 0.92, y: 10 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position: "fixed", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 1401, width: "min(380px, 92vw)",
            }}
          >
            <Box sx={{
              p: 3.5, borderRadius: "24px",
              background: isDark ? "rgba(10,15,30,0.97)" : "rgba(255,255,255,0.98)",
              backdropFilter: "blur(30px)",
              border: `1px solid ${isDark ? "rgba(148,163,184,0.12)" : "rgba(148,163,184,0.25)"}`,
              boxShadow: isDark
                ? "0 40px 80px rgba(0,0,0,0.55)"
                : "0 40px 80px rgba(15,23,42,0.18)",
            }}>
              {/* Header */}
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box sx={{
                    width: 36, height: 36, borderRadius: "10px",
                    background: "linear-gradient(135deg,#6366f1,#06b6d4)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <QrCode2RoundedIcon sx={{ color: "#fff", fontSize: 20 }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: theme.palette.text.primary }}>
                      TRF QR Code
                    </Typography>
                    {projectName && (
                      <Typography sx={{ fontSize: "0.72rem", color: theme.palette.text.secondary }}>
                        {projectName}
                      </Typography>
                    )}
                  </Box>
                </Box>
                <IconButton size="small" onClick={onClose}>
                  <CloseRoundedIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>

              {/* QR Image */}
              <Box sx={{
                display: "flex", alignItems: "center", justifyContent: "center",
                p: 2.5, borderRadius: "16px", mb: 2.5,
                background: isDark ? "rgba(255,255,255,0.96)" : "#fff",
                border: `1px solid ${isDark ? "rgba(148,163,184,0.15)" : "rgba(148,163,184,0.2)"}`,
                minHeight: 220,
                position: "relative",
              }}>
                {!imgLoaded && !imgError && (
                  <Box sx={{ position: "absolute", display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                    <CircularProgress size={28} sx={{ color: "#6366f1" }} />
                    <Typography sx={{ fontSize: "0.72rem", color: "#475569" }}>Generating QR…</Typography>
                  </Box>
                )}
                {imgError && (
                  <Box sx={{ textAlign: "center" }}>
                    <QrCode2RoundedIcon sx={{ fontSize: 48, color: "#94a3b8", mb: 1 }} />
                    <Typography sx={{ fontSize: "0.78rem", color: "#94a3b8" }}>Failed to load QR code</Typography>
                  </Box>
                )}
                <Box
                  component="img"
                  src={qrSrc}
                  alt={`QR code for ${trfNumber}`}
                  onLoad={() => setImgLoaded(true)}
                  onError={() => setImgError(true)}
                  sx={{
                    width: 180, height: 180,
                    display: imgLoaded && !imgError ? "block" : "none",
                    borderRadius: "8px",
                  }}
                />
              </Box>

              {/* TRF chip */}
              <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                <Chip
                  label={trfNumber}
                  sx={{ fontWeight: 700, fontSize: "0.82rem", background: "rgba(99,102,241,0.12)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.22)" }}
                />
              </Box>

              {/* URL with copy */}
              <Box sx={{
                display: "flex", alignItems: "center", gap: 1,
                p: 1.25, borderRadius: "10px", mb: 2.5,
                background: isDark ? "rgba(148,163,184,0.07)" : "rgba(99,102,241,0.05)",
                border: `1px solid ${isDark ? "rgba(148,163,184,0.1)" : "rgba(99,102,241,0.15)"}`,
              }}>
                <Typography sx={{ flex: 1, fontSize: "0.72rem", color: theme.palette.text.secondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {trfUrl}
                </Typography>
                <Tooltip title="Copy link">
                  <IconButton size="small" onClick={handleCopy} sx={{ flexShrink: 0 }}>
                    <ContentCopyRoundedIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Open in browser">
                  <IconButton size="small" onClick={() => window.open(trfUrl, "_blank")} sx={{ flexShrink: 0 }}>
                    <OpenInNewRoundedIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              </Box>

              {/* Actions */}
              <Box sx={{ display: "flex", gap: 1.5 }}>
                <Button
                  fullWidth variant="contained"
                  startIcon={<FileDownloadRoundedIcon />}
                  onClick={handleDownload}
                  sx={{ borderRadius: "12px", background: "linear-gradient(135deg,#6366f1,#06b6d4)", boxShadow: "0 6px 16px rgba(99,102,241,0.3)" }}
                >
                  Download PNG
                </Button>
                <Button variant="outlined" onClick={onClose} sx={{ borderRadius: "12px", minWidth: 80 }}>
                  Close
                </Button>
              </Box>
            </Box>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
