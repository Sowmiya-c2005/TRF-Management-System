import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import LinearProgress from "@mui/material/LinearProgress";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import toast from "react-hot-toast";

import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

import { uploadFile } from "../services/fileService";

const FOLDERS = ["Documents", "Reports", "Drawings", "Approvals", "Final Submission"];

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadFile() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [trfNumber, setTrfNumber] = useState("");
  const [folderName, setFolderName] = useState("Documents");
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const cardBg = isDark ? "rgba(15,23,42,0.7)" : "rgba(255,255,255,0.85)";
  const border = isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.2)";

  const onDrop = useCallback((accepted) => {
    setFiles((prev) => [...prev, ...accepted]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const removeFile = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleUpload = async () => {
    if (!trfNumber.trim()) { toast.error("Enter TRF Number"); return; }
    if (files.length === 0) { toast.error("Select at least one file"); return; }
    setUploading(true);
    let done = 0;
    const errors = [];
    for (const file of files) {
      try {
        await uploadFile(trfNumber.trim(), folderName, file);
        done++;
        setProgress(Math.round((done / files.length) * 100));
      } catch (e) {
        errors.push(file.name);
      }
    }
    setUploading(false);
    if (errors.length === 0) {
      toast.success(`${done} file(s) uploaded successfully!`);
      setFiles([]);
      setProgress(0);
    } else {
      toast.error(`${errors.length} file(s) failed: ${errors.join(", ")}`);
    }
  };

  return (
    <Box sx={{ maxWidth: 700, mx: "auto" }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, fontSize: "1.6rem", color: theme.palette.text.primary }}>Upload Files</Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
            Drag & drop or browse files to upload into a TRF folder.
          </Typography>
        </Box>
      </motion.div>

      {/* Fields */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Box sx={{ p: 3, borderRadius: "18px", background: cardBg, border: `1px solid ${border}`, backdropFilter: "blur(20px)", mb: 2.5 }}>
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              label="TRF Number" placeholder="TRF-2026-101"
              value={trfNumber} onChange={(e) => setTrfNumber(e.target.value)}
              sx={{ flex: 1 }} InputProps={{ sx: { borderRadius: "10px" } }}
            />
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Folder</InputLabel>
              <Select value={folderName} label="Folder" onChange={(e) => setFolderName(e.target.value)}
                sx={{ borderRadius: "10px" }}>
                {FOLDERS.map((f) => <MenuItem key={f} value={f}>{f}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
        </Box>
      </motion.div>

      {/* Dropzone */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
        <Box
          {...getRootProps()}
          sx={{
            p: 5, borderRadius: "18px", border: `2px dashed`,
            borderColor: isDragActive ? theme.palette.primary.main : isDark ? "rgba(148,163,184,0.2)" : "rgba(148,163,184,0.35)",
            background: isDragActive
              ? "rgba(99,102,241,0.06)"
              : isDark ? "rgba(15,23,42,0.4)" : "rgba(255,255,255,0.6)",
            backdropFilter: "blur(20px)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            cursor: "pointer", mb: 2.5,
            transition: "all 0.2s ease",
            "&:hover": { borderColor: theme.palette.primary.main, background: "rgba(99,102,241,0.04)" },
          }}
        >
          <input {...getInputProps()} />
          <motion.div animate={isDragActive ? { scale: 1.1 } : { scale: 1 }} transition={{ type: "spring" }}>
            <Box sx={{
              width: 60, height: 60, borderRadius: "14px", mb: 2,
              background: isDragActive ? "linear-gradient(135deg,#6366f1,#06b6d4)" : isDark ? "rgba(148,163,184,0.1)" : "rgba(100,116,139,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.2s",
            }}>
              <CloudUploadRoundedIcon sx={{ fontSize: 28, color: isDragActive ? "#fff" : theme.palette.text.secondary }} />
            </Box>
          </motion.div>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.5 }}>
            {isDragActive ? "Drop files here" : "Drag & drop files here"}
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1.5 }}>
            or click to browse from your computer
          </Typography>
          <Chip label="Any file type accepted" size="small" variant="outlined" sx={{ fontSize: "0.72rem" }} />
        </Box>
      </motion.div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Box sx={{ p: 2.5, borderRadius: "18px", background: cardBg, border: `1px solid ${border}`, backdropFilter: "blur(20px)", mb: 2.5 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, fontSize: "0.88rem" }}>
                {files.length} file(s) selected
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {files.map((file, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                    <Box sx={{
                      display: "flex", alignItems: "center", gap: 1.5, p: 1.2, borderRadius: "10px",
                      background: isDark ? "rgba(148,163,184,0.05)" : "rgba(100,116,139,0.05)",
                      border: `1px solid ${isDark ? "rgba(148,163,184,0.08)" : "rgba(148,163,184,0.15)"}`,
                    }}>
                      <InsertDriveFileRoundedIcon sx={{ fontSize: 20, color: theme.palette.primary.main }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="caption" fontWeight={600} sx={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {file.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: "0.68rem" }}>
                          {formatBytes(file.size)}
                        </Typography>
                      </Box>
                      <IconButton size="small" onClick={() => removeFile(i)}
                        sx={{ color: theme.palette.text.secondary, "&:hover": { color: theme.palette.error.main } }}>
                        <CloseRoundedIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                  </motion.div>
                ))}
              </Box>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Progress */}
      <AnimatePresence>
        {uploading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Typography variant="caption" fontWeight={600}>Uploading...</Typography>
                <Typography variant="caption" fontWeight={700} sx={{ color: theme.palette.primary.main }}>{progress}%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={progress}
                sx={{ height: 6, borderRadius: 10, "& .MuiLinearProgress-bar": { background: "linear-gradient(90deg,#6366f1,#06b6d4)", borderRadius: 10 } }}
              />
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      <Button variant="contained" fullWidth disabled={uploading || files.length === 0}
        onClick={handleUpload}
        startIcon={uploading ? null : <CloudUploadRoundedIcon />}
        component={motion.button}
        whileHover={!uploading ? { scale: 1.01 } : {}}
        whileTap={!uploading ? { scale: 0.99 } : {}}
        sx={{
          py: 1.4, borderRadius: "12px", fontSize: "0.9rem",
          background: "linear-gradient(135deg,#6366f1,#06b6d4)",
          boxShadow: "0 8px 20px rgba(99,102,241,0.3)",
        }}
      >
        {uploading ? "Uploading..." : `Upload ${files.length > 0 ? files.length + " File(s)" : ""}`}
      </Button>
    </Box>
  );
}
