import { useState } from "react";
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
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Chip from "@mui/material/Chip";
import InputBase from "@mui/material/InputBase";
import CircularProgress from "@mui/material/CircularProgress";
import toast from "react-hot-toast";

import FolderOpenRoundedIcon from "@mui/icons-material/FolderOpenRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";

import { listFiles, deleteFile, getDownloadURL } from "../services/fileService";

const FOLDERS = ["Documents", "Reports", "Drawings", "Approvals", "Final Submission"];

function getFileIcon(name) {
  const ext = name?.split(".").pop()?.toLowerCase();
  if (["pdf"].includes(ext)) return <PictureAsPdfRoundedIcon sx={{ color: "#ef4444" }} />;
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return <ImageRoundedIcon sx={{ color: "#10b981" }} />;
  if (["doc", "docx", "txt"].includes(ext)) return <DescriptionRoundedIcon sx={{ color: "#3b82f6" }} />;
  return <InsertDriveFileRoundedIcon sx={{ color: "#6366f1" }} />;
}

function EmptyFolder() {
  const theme = useTheme();
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 8 }}>
      <FolderOpenRoundedIcon sx={{ fontSize: 56, color: theme.palette.text.disabled, mb: 2 }} />
      <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>Folder is empty</Typography>
      <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>Upload files to this folder to see them here.</Typography>
    </Box>
  );
}

export default function FileManager() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [trfNumber, setTrfNumber] = useState("");
  const [folderName, setFolderName] = useState("Documents");
  const [files, setFiles] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const cardBg = isDark ? "rgba(15,23,42,0.7)" : "rgba(255,255,255,0.85)";
  const border = isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.2)";

  const handleGetFiles = async () => {
    if (!trfNumber.trim()) { toast.error("Enter TRF Number"); return; }
    setLoading(true);
    try {
      const r = await listFiles(trfNumber.trim(), folderName);
      setFiles(r.data.files || []);
      setLoaded(true);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const handleDelete = async (fileName) => {
    try {
      await deleteFile(trfNumber.trim(), folderName, fileName);
      toast.success(`"${fileName}" deleted`);
      setFiles((prev) => prev.filter((f) => f !== fileName));
    } catch (e) { toast.error(e.message); }
  };

  const filtered = files.filter((f) => f.toLowerCase().includes(search.toLowerCase()));

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, fontSize: "1.6rem", color: theme.palette.text.primary }}>File Manager</Typography>
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>Browse, download, and manage files inside TRF folders.</Typography>
      </Box>

      {/* Controls */}
      <Box sx={{ p: 3, borderRadius: "18px", background: cardBg, border: `1px solid ${border}`, backdropFilter: "blur(20px)", mb: 2.5 }}>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <TextField label="TRF Number" placeholder="TRF-2026-101" value={trfNumber}
            onChange={(e) => setTrfNumber(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGetFiles()}
            sx={{ flex: 1, minWidth: 180 }} InputProps={{ sx: { borderRadius: "10px" } }} />
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Folder</InputLabel>
            <Select value={folderName} label="Folder" onChange={(e) => setFolderName(e.target.value)} sx={{ borderRadius: "10px" }}>
              {FOLDERS.map((f) => <MenuItem key={f} value={f}>{f}</MenuItem>)}
            </Select>
          </FormControl>
          <Button variant="contained" onClick={handleGetFiles} disabled={loading}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <FolderOpenRoundedIcon />}
            sx={{ px: 3, borderRadius: "12px", background: "linear-gradient(135deg,#6366f1,#06b6d4)", alignSelf: "center" }}>
            Browse
          </Button>
        </Box>
      </Box>

      {/* File list */}
      <AnimatePresence>
        {loaded && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Box sx={{ borderRadius: "18px", background: cardBg, border: `1px solid ${border}`, backdropFilter: "blur(20px)", overflow: "hidden" }}>
              {/* Toolbar */}
              <Box sx={{ p: 2, borderBottom: `1px solid ${border}`, display: "flex", gap: 2, alignItems: "center" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <FolderOpenRoundedIcon sx={{ color: theme.palette.primary.main, fontSize: 18 }} />
                  <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: "0.85rem" }}>
                    {trfNumber} / {folderName}
                  </Typography>
                  <Chip label={`${filtered.length} files`} size="small" sx={{ height: 20, fontSize: "0.65rem", fontWeight: 700 }} />
                </Box>
                <Box sx={{ flex: 1 }} />
                {/* Search */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, px: 1.5, py: 0.75, borderRadius: "10px",
                  background: isDark ? "rgba(148,163,184,0.07)" : "rgba(100,116,139,0.07)",
                  border: `1px solid ${isDark ? "rgba(148,163,184,0.12)" : "rgba(148,163,184,0.25)"}` }}>
                  <SearchRoundedIcon sx={{ color: theme.palette.text.secondary, fontSize: 16 }} />
                  <InputBase placeholder="Search files..." value={search} onChange={(e) => setSearch(e.target.value)}
                    sx={{ fontSize: "0.8rem", color: theme.palette.text.primary, width: 160,
                      "& input::placeholder": { color: theme.palette.text.secondary } }} />
                </Box>
                <Tooltip title="Refresh">
                  <IconButton size="small" onClick={handleGetFiles}
                    sx={{ background: isDark ? "rgba(148,163,184,0.08)" : "rgba(100,116,139,0.08)", borderRadius: "8px" }}>
                    <RefreshRoundedIcon sx={{ fontSize: 17 }} />
                  </IconButton>
                </Tooltip>
              </Box>

              {filtered.length === 0 ? <EmptyFolder /> : (
                <Box sx={{ p: 1.5, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 1 }}>
                  {filtered.map((file, i) => (
                    <motion.div key={file}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <Box sx={{
                        display: "flex", alignItems: "center", gap: 1.5, p: 1.5, borderRadius: "12px",
                        border: `1px solid ${border}`,
                        background: isDark ? "rgba(148,163,184,0.03)" : "rgba(100,116,139,0.03)",
                        "&:hover": { borderColor: theme.palette.primary.main, background: "rgba(99,102,241,0.04)" },
                        transition: "all 0.2s",
                        cursor: "default",
                      }}>
                        <Box sx={{ "& svg": { fontSize: 22 } }}>{getFileIcon(file)}</Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="caption" fontWeight={600} sx={{
                            display: "block", fontSize: "0.78rem",
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>
                            {file}
                          </Typography>
                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontSize: "0.68rem" }}>
                            {file.split(".").pop()?.toUpperCase()}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", gap: 0.25 }}>
                          <Tooltip title="Download">
                            <IconButton size="small" onClick={() => window.open(getDownloadURL(trfNumber, folderName, file))}
                              sx={{ color: theme.palette.primary.main, "&:hover": { background: "rgba(99,102,241,0.1)" } }}>
                              <DownloadRoundedIcon sx={{ fontSize: 15 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => handleDelete(file)}
                              sx={{ color: theme.palette.error.main, opacity: 0.7, "&:hover": { opacity: 1, background: "rgba(239,68,68,0.1)" } }}>
                              <DeleteRoundedIcon sx={{ fontSize: 15 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </motion.div>
                  ))}
                </Box>
              )}
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
