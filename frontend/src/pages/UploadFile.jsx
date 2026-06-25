import { useState, useCallback, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@mui/material/styles";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import LinearProgress from "@mui/material/LinearProgress";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import CircularProgress from "@mui/material/CircularProgress";
import toast from "react-hot-toast";

import CloudUploadRoundedIcon   from "@mui/icons-material/CloudUploadRounded";
import CheckCircleRoundedIcon   from "@mui/icons-material/CheckCircleRounded";
import DeleteRoundedIcon        from "@mui/icons-material/DeleteRounded";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";
import FolderRoundedIcon        from "@mui/icons-material/FolderRounded";
import ArrowForwardRoundedIcon  from "@mui/icons-material/ArrowForwardRounded";
import TagRoundedIcon           from "@mui/icons-material/TagRounded";

import { uploadFile } from "../services/fileService";
import { useApp }     from "../context/AppContext";

const FOLDERS = ["Documents", "Reports", "Drawings", "Approvals", "Final Submission"];

const FOLDER_COLORS = {
  Documents:         { color: "#6366f1", bg: "rgba(99,102,241,0.12)" },
  Reports:           { color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  Drawings:          { color: "#06b6d4", bg: "rgba(6,182,212,0.12)" },
  Approvals:         { color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  "Final Submission":{ color: "#a855f7", bg: "rgba(168,85,247,0.12)" },
};

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function getFileIcon(name) {
  const ext = name.split(".").pop()?.toLowerCase();
  const colors = { pdf: "#ef4444", doc: "#3b82f6", docx: "#3b82f6", xls: "#10b981", xlsx: "#10b981", png: "#f59e0b", jpg: "#f59e0b", jpeg: "#f59e0b" };
  return colors[ext] || "#94a3b8";
}

export default function UploadFile() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [params] = useSearchParams();
  const { addActivity, addNotification, user } = useApp();

  const [trfNumber, setTrfNumber] = useState(params.get("trf") || "");
  const [folder,    setFolder]    = useState(FOLDERS[0]);
  const [files,     setFiles]     = useState([]);
  const [progress,  setProgress]  = useState({});
  const [statuses,  setStatuses]  = useState({});
  const [uploading, setUploading] = useState(false);
  const [dragging,  setDragging]  = useState(false);
  const fileInput = useRef(null);

  const cardBg = isDark ? "rgba(15,23,42,0.72)" : "rgba(255,255,255,0.88)";
  const border  = isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.2)";

  const addFiles = useCallback((incoming) => {
    const arr = Array.from(incoming);
    setFiles(prev => {
      const names = new Set(prev.map(f => f.name));
      return [...prev, ...arr.filter(f => !names.has(f.name))];
    });
  }, []);

  const onDrop = (e) => {
    e.preventDefault(); setDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const removeFile = (name) => {
    setFiles(prev => prev.filter(f => f.name !== name));
    setProgress(prev => { const n = { ...prev }; delete n[name]; return n; });
    setStatuses(prev => { const n = { ...prev }; delete n[name]; return n; });
  };

  const handleUploadAll = async () => {
    if (!trfNumber.trim()) { toast.error("Enter a TRF number first"); return; }
    if (!files.length) { toast.error("Select at least one file"); return; }
    setUploading(true);

    for (const file of files) {
      if (statuses[file.name] === "done") continue;
      setStatuses(prev => ({ ...prev, [file.name]: "uploading" }));
      try {
        await uploadFile(trfNumber.trim(), folder, file, (pct) => {
          setProgress(prev => ({ ...prev, [file.name]: pct }));
        });
        setStatuses(prev => ({ ...prev, [file.name]: "done" }));
        setProgress(prev => ({ ...prev, [file.name]: 100 }));
      } catch (e) {
        setStatuses(prev => ({ ...prev, [file.name]: "error" }));
        toast.error(`${file.name}: ${e.message || "Upload failed"}`);
      }
    }

    const doneCount = files.filter(f => statuses[f.name] === "done").length + 1;
    addActivity(`${doneCount} file(s) uploaded to ${folder}`, user?.username || "Admin");
    addNotification({ title: "Upload complete", body: `${doneCount} file(s) uploaded to ${folder}`, color: "#10b981", type: "file" });
    toast.success("Upload complete!");
    setUploading(false);
  };

  const allDone = files.length > 0 && files.every(f => statuses[f.name] === "done");
  const totalProgress = files.length === 0 ? 0 : Math.round(files.reduce((acc, f) => acc + (progress[f.name] || 0), 0) / files.length);

  return (
    <Box sx={{ maxWidth: 680, mx: "auto" }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
          <Box sx={{
            width: 44, height: 44, borderRadius: "13px",
            background: "linear-gradient(135deg,#10b981,#06b6d4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 20px rgba(16,185,129,0.35)",
          }}>
            <CloudUploadRoundedIcon sx={{ color: "#fff", fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, fontSize: "1.65rem", color: theme.palette.text.primary, lineHeight: 1.2 }}>
              Upload Files
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: "0.82rem" }}>
              Upload documents to any TRF folder
            </Typography>
          </Box>
        </Box>
      </motion.div>

      {/* Config row */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <Box sx={{
          p: 3, borderRadius: "18px", background: cardBg,
          border: `1px solid ${border}`, backdropFilter: "blur(20px)", mb: 2.5,
          display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center",
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: "1 1 200px" }}>
            <TagRoundedIcon sx={{ fontSize: 18, color: theme.palette.text.secondary, flexShrink: 0 }} />
            <input
              value={trfNumber}
              onChange={e => setTrfNumber(e.target.value)}
              placeholder="TRF Number (e.g. TRF-2026-101)"
              style={{
                flex: 1, border: "none", outline: "none",
                background: "transparent", color: theme.palette.text.primary,
                fontSize: "0.88rem", fontFamily: "inherit",
              }}
            />
          </Box>
          <Box sx={{ width: 1, height: 36, background: border, display: { xs: "none", sm: "block" } }} />
          <FormControl size="small" sx={{ flex: "1 1 180px", minWidth: 160 }}>
            <InputLabel>Folder</InputLabel>
            <Select
              value={folder}
              label="Folder"
              onChange={e => setFolder(e.target.value)}
              sx={{ borderRadius: "10px" }}
              renderValue={(val) => (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <FolderRoundedIcon sx={{ fontSize: 16, color: FOLDER_COLORS[val]?.color }} />
                  {val}
                </Box>
              )}
            >
              {FOLDERS.map(f => (
                <MenuItem key={f} value={f}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <FolderRoundedIcon sx={{ fontSize: 16, color: FOLDER_COLORS[f]?.color }} />
                    {f}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </motion.div>

      {/* Drop zone */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
        <Box
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInput.current?.click()}
          sx={{
            p: 5, borderRadius: "20px", textAlign: "center", cursor: "pointer",
            background: dragging
              ? (isDark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.06)")
              : cardBg,
            border: `2px dashed ${dragging ? "#6366f1" : (isDark ? "rgba(148,163,184,0.15)" : "rgba(148,163,184,0.3)")}`,
            backdropFilter: "blur(20px)", mb: 2.5,
            transition: "all 0.25s",
            boxShadow: dragging ? "0 0 0 4px rgba(99,102,241,0.15)" : "none",
          }}
        >
          <input ref={fileInput} type="file" multiple hidden onChange={e => addFiles(e.target.files)} />
          <motion.div animate={dragging ? { scale: 1.1 } : { scale: 1 }} transition={{ duration: 0.25 }}>
            <Box sx={{
              width: 64, height: 64, borderRadius: "18px", mx: "auto", mb: 2,
              background: dragging ? "linear-gradient(135deg,#6366f1,#06b6d4)" : (isDark ? "rgba(148,163,184,0.08)" : "rgba(99,102,241,0.07)"),
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.25s",
            }}>
              <CloudUploadRoundedIcon sx={{ fontSize: 32, color: dragging ? "#fff" : theme.palette.text.secondary }} />
            </Box>
          </motion.div>
          <Typography sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 0.5 }}>
            {dragging ? "Release to add files" : "Drag & drop files here"}
          </Typography>
          <Typography sx={{ fontSize: "0.82rem", color: theme.palette.text.secondary }}>
            or click to browse — PDF, Word, Excel, images accepted
          </Typography>
        </Box>
      </motion.div>

      {/* File list */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Box sx={{ p: 3, borderRadius: "18px", background: cardBg, border: `1px solid ${border}`, backdropFilter: "blur(20px)", mb: 2.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: theme.palette.text.primary }}>
                  {files.length} file{files.length !== 1 ? "s" : ""} queued
                </Typography>
                {uploading && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CircularProgress size={14} sx={{ color: "#6366f1" }} />
                    <Typography sx={{ fontSize: "0.78rem", color: "#6366f1", fontWeight: 700 }}>{totalProgress}%</Typography>
                  </Box>
                )}
              </Box>

              {uploading && (
                <LinearProgress variant="determinate" value={totalProgress} sx={{ mb: 2, borderRadius: 4, height: 6, background: isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.15)", "& .MuiLinearProgress-bar": { background: "linear-gradient(90deg,#6366f1,#06b6d4)", borderRadius: 4 } }} />
              )}

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {files.map((file, i) => {
                  const st = statuses[file.name];
                  const pct = progress[file.name] || 0;
                  return (
                    <motion.div key={file.name} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                      <Box sx={{
                        display: "flex", alignItems: "center", gap: 1.5, p: 1.5,
                        borderRadius: "12px", border: `1px solid ${border}`,
                        background: st === "done" ? (isDark ? "rgba(16,185,129,0.06)" : "rgba(16,185,129,0.04)") : "transparent",
                      }}>
                        <InsertDriveFileRoundedIcon sx={{ fontSize: 22, color: getFileIcon(file.name), flexShrink: 0 }} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: theme.palette.text.primary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {file.name}
                          </Typography>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography sx={{ fontSize: "0.72rem", color: theme.palette.text.disabled }}>
                              {formatBytes(file.size)}
                            </Typography>
                            {st === "uploading" && <LinearProgress variant="determinate" value={pct} sx={{ flex: 1, height: 3, borderRadius: 2 }} />}
                          </Box>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          {st === "done" && <CheckCircleRoundedIcon sx={{ fontSize: 18, color: "#10b981" }} />}
                          {st === "error" && <Chip label="Error" size="small" color="error" sx={{ fontSize: "0.65rem", height: 18 }} />}
                          {!st && (
                            <Tooltip title="Remove">
                              <IconButton size="small" onClick={() => removeFile(file.name)}>
                                <DeleteRoundedIcon sx={{ fontSize: 15 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </Box>
                    </motion.div>
                  );
                })}
              </Box>
            </Box>

            {/* Upload button */}
            {allDone ? (
              <Box sx={{ p: 3, borderRadius: "18px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", textAlign: "center" }}>
                <CheckCircleRoundedIcon sx={{ fontSize: 36, color: "#10b981", mb: 1 }} />
                <Typography sx={{ fontWeight: 700, color: "#10b981" }}>All files uploaded successfully!</Typography>
              </Box>
            ) : (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  fullWidth variant="contained"
                  onClick={handleUploadAll}
                  disabled={uploading}
                  startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <CloudUploadRoundedIcon />}
                  endIcon={!uploading && <ArrowForwardRoundedIcon />}
                  sx={{
                    py: 1.4, borderRadius: "14px", fontWeight: 700, fontSize: "0.95rem",
                    background: "linear-gradient(135deg,#10b981,#06b6d4)",
                    boxShadow: "0 8px 24px rgba(16,185,129,0.35)",
                  }}
                >
                  {uploading ? `Uploading… ${totalProgress}%` : `Upload ${files.length} File${files.length !== 1 ? "s" : ""}`}
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}
