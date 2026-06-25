import { motion, AnimatePresence } from "framer-motion";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import { useTheme } from "@mui/material/styles";

import WarningRoundedIcon from "@mui/icons-material/WarningRounded";
import DeleteRoundedIcon  from "@mui/icons-material/DeleteRounded";
import CloseRoundedIcon   from "@mui/icons-material/CloseRounded";

/**
 * Premium confirmation dialog
 *
 * Props:
 *   open      — boolean
 *   onClose   — () => void
 *   onConfirm — () => void
 *   title     — string
 *   message   — string
 *   confirmLabel — string (default "Delete")
 *   loading   — boolean
 *   severity  — "error" | "warning" (default "error")
 */
export default function ConfirmDialog({
  open, onClose, onConfirm,
  title = "Confirm Action",
  message = "This action cannot be undone.",
  confirmLabel = "Delete",
  loading = false,
  severity = "error",
}) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";
  const color  = severity === "error" ? "#ef4444" : "#f59e0b";

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        component: motion.div,
        initial: { opacity: 0, scale: 0.88, y: 20 },
        animate: { opacity: 1, scale: 1,    y: 0 },
        exit:    { opacity: 0, scale: 0.92, y: 10 },
        transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] },
      }}
    >
      <DialogContent sx={{ p: 3.5 }}>
        {/* Close button */}
        <IconButton
          size="small"
          onClick={onClose}
          disabled={loading}
          sx={{
            position: "absolute", top: 14, right: 14,
            color: theme.palette.text.secondary,
            "&:hover": { background: "rgba(148,163,184,0.1)" },
          }}
        >
          <CloseRoundedIcon sx={{ fontSize: 18 }} />
        </IconButton>

        {/* Icon */}
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3 }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
          >
            <Box sx={{
              width: 60, height: 60, borderRadius: "16px", mb: 2,
              background: `${color}15`,
              border: `1px solid ${color}35`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {severity === "error"
                ? <DeleteRoundedIcon sx={{ fontSize: 28, color }} />
                : <WarningRoundedIcon sx={{ fontSize: 28, color }} />
              }
            </Box>
          </motion.div>

          <Typography variant="h6" fontWeight={700} sx={{ mb: 0.75, textAlign: "center" }}>
            {title}
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, textAlign: "center", lineHeight: 1.6 }}>
            {message}
          </Typography>
        </Box>

        {/* Actions */}
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button
            fullWidth variant="outlined"
            onClick={onClose}
            disabled={loading}
            sx={{ borderRadius: "10px", py: 1.1, borderWidth: "1.5px" }}
          >
            Cancel
          </Button>
          <Button
            fullWidth variant="contained"
            onClick={onConfirm}
            disabled={loading}
            sx={{
              borderRadius: "10px", py: 1.1,
              background: color,
              boxShadow: `0 6px 18px ${color}45`,
              "&:hover": { background: color, filter: "brightness(1.08)", boxShadow: `0 10px 24px ${color}55` },
            }}
          >
            {loading ? "Processing…" : confirmLabel}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
