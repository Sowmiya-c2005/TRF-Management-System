import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@mui/material/styles";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import Skeleton from "@mui/material/Skeleton";
import toast from "react-hot-toast";

import FolderOpenRoundedIcon      from "@mui/icons-material/FolderOpenRounded";
import FolderRoundedIcon          from "@mui/icons-material/FolderRounded";
import GridViewRoundedIcon        from "@mui/icons-material/GridViewRounded";
import FormatListBulletedRoundedIcon from "@mui/icons-material/FormatListBulletedRounded";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";
import DeleteRoundedIcon          from "@mui/icons-material/DeleteRounded";
import FileDownloadRoundedIcon    from "@mui/icons-material/FileDownloadRounded";
import SearchRoundedIcon          from "@mui/icons-material/SearchRounded";
import TagRoundedIcon             from "@mui/icons-material/TagRounded";
import CloseRoundedIcon           from "@mui/icons-material/CloseRounded";

import { listFiles, deleteFile, downloadFile } from "../services/fileService";
import { useApp } from "../context/AppContext";

const FOLDERS = [
  { name: "Documents",         color: "#6366f1" },
  { name: "Reports",           color: "#10b981" },
  { name: "Drawings",          color: "#06b6d4" },
  { name: "Approvals",         color: "#f59e0b" },
  { name: "Final Submission",  color: "#a855f7" },
];

function getExtColor(name) {
  const ext = name.split(".").pop()?.toLowerCase();
  const m = { pdf: "#ef4444", doc: "#3b82f6", docx: "#3b82f6", xls: "#10b981", xlsx: "#10b981", png: "#f59e0b", jpg: "#f59e0b", jpeg: "#f59e0b", ppt: "#f97316", pptx: "#f97316" };
  return m[ext] || "#94a3b8";
}
function getExt(name) { return name.split(".").pop()?.toUpperCase() || "FILE"; }

export default function FileManager() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [params] = useSearchParams();
  const { addActivity, user } = useApp();

  const [trfInput,    setTrfInput]    = useState(params.get("trf") || "");
  const [trfNumber,   setTrfNumber]   = useState(params.get("trf") || "");
  const [activeFolder,setActiveFolder]= useState(FOLDERS[0].name);
  const [files,       setFiles]       = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [viewMode,    setViewMode]    = useState("grid"); // grid | list
  const [selected,    setSelected]    = useState(null);
  const [search,      setSearch]      = useState("");

  const cardBg = isDark ? "rgba(15,23,42,0.72)" : "rgba(255,255,255,0.88)";
  const border  = isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.2)";

  const loadFiles = useCallback(async (trf, folder) => {
    if (!trf?.trim()) return;
    setLoading(true); setFiles([]); setSelected(null);
    try {
      const res = await listFiles(trf.trim(), folder);
      // Backend returns { trf_number, folder_name, files: [...] }
      // Each file is either a string (legacy) or an object { id, filename, size_bytes, ... }
      const raw = res.data?.files ?? (Array.isArray(res.data) ? res.data : []);
      // Keep rich objects — normalise legacy strings to minimal objects
      const normalised = raw.map((f) =>
        typeof f === "string"
          ? { filename: f, size_bytes: null, uploaded_at: null, uploaded_by: null, version_count: null }
          : f
      );
      setFiles(normalised);
    } catch (e) {
      toast.error(e.message || "Failed to load files");
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (trfNumber) loadFiles(trfNumber, activeFolder);
  }, [trfNumber, activeFolder, loadFiles]);

  // Real-time sync — reload when another user uploads/deletes files
  useEffect(() => {
    const handler = () => {
      if (trfNumber) loadFiles(trfNumber, activeFolder);
    };
    window.addEventListener("trf_update_event", handler);
    return () => window.removeEventListener("trf_update_event", handler);
  }, [trfNumber, activeFolder, loadFiles]);

  const handleBrowse = () => {
    if (!trfInput.trim()) { toast.error("Enter a TRF number"); return; }
    setTrfNumber(trfInput.trim());
  };

  const handleDelete = async (fileObj) => {
    const fname = typeof fileObj === "string" ? fileObj : fileObj.filename;
    try {
      await deleteFile(trfNumber, activeFolder, fname);
      setFiles(prev => prev.filter(f => (f.filename || f) !== fname));
      if (selected?.filename === fname || selected === fname) setSelected(null);
      addActivity(`Deleted ${fname} from ${activeFolder}`, user?.username || "Admin");
      toast.success(`${fname} deleted`);
    } catch (e) {
      toast.error(e.message || "Delete failed");
    }
  };

  const handleDownload = async (fileObj) => {
    const fname = typeof fileObj === "string" ? fileObj : fileObj.filename;
    try {
      await downloadFile(trfNumber, activeFolder, fname);
    } catch (e) {
      toast.error(e.message || "Download failed");
    }
  };

  const filtered = search.trim()
    ? files.filter(f => (f.filename || f).toLowerCase().includes(search.toLowerCase()))
    : files;

  // Helper to get filename string from a file object or string
  const fname = (f) => (typeof f === "string" ? f : f.filename || "");
  const fsize = (f) => {
    if (typeof f === "string" || !f.size_bytes) return null;
    const b = f.size_bytes;
    if (b < 1024) return `${b} B`;
    if (b < 1048576) return `${(b/1024).toFixed(1)} KB`;
    return `${(b/1048576).toFixed(1)} MB`;
  };
  const fdate = (f) => {
    if (typeof f === "string" || !f.uploaded_at) return null;
    return new Date(f.uploaded_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  const activeFolderColor = FOLDERS.find(f => f.name === activeFolder)?.color || "#6366f1";

  return (
    <Box>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
          <Box sx={{
            width: 44, height: 44, borderRadius: "13px",
            background: "linear-gradient(135deg,#06b6d4,#6366f1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 20px rgba(6,182,212,0.35)",
          }}>
            <FolderOpenRoundedIcon sx={{ color: "#fff", fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, fontSize: "1.65rem", color: theme.palette.text.primary, lineHeight: 1.2 }}>
              File Manager
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: "0.82rem" }}>
              Browse and manage TRF files
            </Typography>
          </Box>
        </Box>
      </motion.div>

      {/* TRF Input */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <Box sx={{
          p: 2.5, borderRadius: "18px", background: cardBg,
          border: `1px solid ${border}`, backdropFilter: "blur(20px)",
          mb: 2.5, display: "flex", gap: 1.5, alignItems: "center",
        }}>
          <TagRoundedIcon sx={{ color: theme.palette.text.secondary, fontSize: 18, flexShrink: 0 }} />
          <input
            value={trfInput}
            onChange={e => setTrfInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleBrowse()}
            placeholder="Enter TRF number to browse…"
            style={{
              flex: 1, border: "none", outline: "none",
              background: "transparent", color: theme.palette.text.primary,
              fontSize: "0.9rem", fontFamily: "inherit",
            }}
          />
          {trfNumber && (
            <Chip label={trfNumber} size="small" sx={{ fontSize: "0.72rem", background: "rgba(99,102,241,0.12)", color: "#818cf8" }} />
          )}
          <Button
            variant="contained" size="small"
            onClick={handleBrowse}
            sx={{
              borderRadius: "10px", height: 36, minWidth: 90, fontWeight: 700,
              background: "linear-gradient(135deg,#6366f1,#06b6d4)",
              boxShadow: "none",
            }}
          >
            Browse
          </Button>
        </Box>
      </motion.div>

      {trfNumber && (
        <Box sx={{ display: "flex", gap: 2.5 }}>
          {/* Left: Folder sidebar */}
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 }}>
            <Box sx={{
              width: 200, flexShrink: 0, p: 1.5,
              borderRadius: "18px", background: cardBg,
              border: `1px solid ${border}`, backdropFilter: "blur(20px)",
            }}>
              <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: theme.palette.text.disabled, letterSpacing: "0.1em", textTransform: "uppercase", px: 1, mb: 1 }}>
                Folders
              </Typography>
              {FOLDERS.map((f, i) => {
                const isActive = activeFolder === f.name;
                return (
                  <motion.div key={f.name} whileHover={{ x: 3 }} whileTap={{ scale: 0.97 }}>
                    <Box
                      onClick={() => setActiveFolder(f.name)}
                      sx={{
                        display: "flex", alignItems: "center", gap: 1.5, px: 1.5, py: 1,
                        borderRadius: "10px", cursor: "pointer", mb: 0.5,
                        background: isActive ? `${f.color}16` : "transparent",
                        border: `1px solid ${isActive ? `${f.color}35` : "transparent"}`,
                        transition: "all 0.15s",
                      }}
                    >
                      <FolderRoundedIcon sx={{ fontSize: 18, color: f.color }} />
                      <Typography sx={{
                        fontSize: "0.8rem", fontWeight: isActive ? 700 : 500,
                        color: isActive ? f.color : theme.palette.text.secondary,
                        transition: "color 0.15s",
                      }}>
                        {f.name}
                      </Typography>
                    </Box>
                  </motion.div>
                );
              })}
            </Box>
          </motion.div>

          {/* Right: File content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
              {/* Toolbar */}
              <Box sx={{
                p: 2, borderRadius: "16px", background: cardBg,
                border: `1px solid ${border}`, backdropFilter: "blur(20px)", mb: 2,
                display: "flex", alignItems: "center", gap: 1.5,
              }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flex: 1 }}>
                  <FolderRoundedIcon sx={{ fontSize: 16, color: activeFolderColor }} />
                  <Typography sx={{ fontWeight: 700, fontSize: "0.88rem", color: activeFolderColor }}>
                    {activeFolder}
                  </Typography>
                  {!loading && (
                    <Chip label={`${filtered.length} files`} size="small" sx={{ ml: 1, fontSize: "0.68rem", height: 18 }} />
                  )}
                </Box>
                <TextField
                  size="small" placeholder="Search files…" value={search}
                  onChange={e => setSearch(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><SearchRoundedIcon sx={{ fontSize: 15 }} /></InputAdornment>,
                    sx: { borderRadius: "8px", fontSize: "0.8rem" },
                  }}
                  sx={{ width: 180 }}
                />
                <Box sx={{ display: "flex", gap: 0.5 }}>
                  {[{ mode: "grid", Icon: GridViewRoundedIcon }, { mode: "list", Icon: FormatListBulletedRoundedIcon }].map(({ mode, Icon }) => (
                    <Tooltip key={mode} title={mode === "grid" ? "Grid View" : "List View"}>
                      <IconButton
                        size="small" onClick={() => setViewMode(mode)}
                        sx={{
                          borderRadius: "8px",
                          background: viewMode === mode ? "rgba(99,102,241,0.12)" : "transparent",
                          color: viewMode === mode ? "#818cf8" : theme.palette.text.secondary,
                        }}
                      >
                        <Icon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  ))}
                </Box>
              </Box>

              {/* Loading */}
              {loading && <LinearProgress sx={{ borderRadius: 4, mb: 2, "& .MuiLinearProgress-bar": { background: "linear-gradient(90deg,#6366f1,#06b6d4)" } }} />}

              {/* Empty state */}
              {!loading && filtered.length === 0 && (
                <Box sx={{
                  py: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                  borderRadius: "18px", background: cardBg, border: `1px solid ${border}`,
                }}>
                  <Box sx={{
                    width: 64, height: 64, borderRadius: "18px",
                    background: isDark ? "rgba(148,163,184,0.06)" : "rgba(148,163,184,0.08)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <FolderOpenRoundedIcon sx={{ fontSize: 30, color: theme.palette.text.disabled }} />
                  </Box>
                  <Typography sx={{ color: theme.palette.text.secondary, fontWeight: 600 }}>
                    {search ? "No matching files" : "This folder is empty"}
                  </Typography>
                  <Typography sx={{ fontSize: "0.8rem", color: theme.palette.text.disabled }}>
                    {search ? "Try a different search term." : "Upload files to see them here."}
                  </Typography>
                </Box>
              )}

              {/* Grid view */}
              {!loading && filtered.length > 0 && viewMode === "grid" && (
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 1.5 }}>
                  {filtered.map((f, i) => {
                    const n = fname(f);
                    return (
                    <motion.div key={n} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}>
                      <Box
                        onClick={() => setSelected(fname(selected) === n ? null : f)}
                        sx={{
                          p: 2.5, borderRadius: "16px", cursor: "pointer", textAlign: "center",
                          background: fname(selected) === n ? `${activeFolderColor}14` : cardBg,
                          border: `1px solid ${fname(selected) === n ? `${activeFolderColor}40` : border}`,
                          backdropFilter: "blur(20px)", transition: "all 0.18s",
                          "&:hover": { transform: "translateY(-2px)", boxShadow: isDark ? "0 8px 24px rgba(0,0,0,0.3)" : "0 8px 24px rgba(15,23,42,0.1)" },
                        }}
                      >
                        <InsertDriveFileRoundedIcon sx={{ fontSize: 36, color: getExtColor(n), mb: 1 }} />
                        <Chip label={getExt(n)} size="small" sx={{ fontSize: "0.6rem", height: 16, mb: 0.75, background: `${getExtColor(n)}18`, color: getExtColor(n) }} />
                        <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: theme.palette.text.primary, wordBreak: "break-all", lineHeight: 1.3 }}>
                          {n.length > 24 ? n.slice(0, 21) + "…" : n}
                        </Typography>
                        {fsize(f) && (
                          <Typography sx={{ fontSize: "0.64rem", color: theme.palette.text.disabled, mt: 0.25 }}>{fsize(f)}</Typography>
                        )}
                        <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5, mt: 1 }}>
                          <Tooltip title="Download">
                            <IconButton size="small" onClick={e => { e.stopPropagation(); handleDownload(f); }}
                              sx={{ "&:hover": { color: "#06b6d4" } }}>
                              <FileDownloadRoundedIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={e => { e.stopPropagation(); handleDelete(f); }}
                              sx={{ "&:hover": { color: "#ef4444" } }}>
                              <DeleteRoundedIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </motion.div>
                    );
                  })}
                </Box>
              )}

              {/* List view */}
              {!loading && filtered.length > 0 && viewMode === "list" && (
                <Box sx={{ borderRadius: "18px", background: cardBg, border: `1px solid ${border}`, overflow: "hidden" }}>
                  {filtered.map((f, i) => {
                    const n = fname(f);
                    return (
                    <motion.div key={n} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.035 }}>
                      <Box sx={{
                        display: "flex", alignItems: "center", gap: 1.5,
                        px: 2.5, py: 1.75, cursor: "pointer",
                        borderBottom: i < filtered.length - 1 ? `1px solid ${border}` : "none",
                        background: fname(selected) === n ? `${activeFolderColor}08` : "transparent",
                        transition: "background 0.15s",
                        "&:hover": { background: isDark ? "rgba(148,163,184,0.04)" : "rgba(99,102,241,0.02)" },
                      }} onClick={() => setSelected(fname(selected) === n ? null : f)}>
                        <InsertDriveFileRoundedIcon sx={{ fontSize: 20, color: getExtColor(n), flexShrink: 0 }} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontSize: "0.85rem", fontWeight: 500, color: theme.palette.text.primary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {n}
                          </Typography>
                          {(fsize(f) || fdate(f)) && (
                            <Typography sx={{ fontSize: "0.7rem", color: theme.palette.text.disabled }}>
                              {[fsize(f), fdate(f)].filter(Boolean).join(" · ")}
                            </Typography>
                          )}
                        </Box>
                        <Chip label={getExt(n)} size="small" sx={{ fontSize: "0.65rem", height: 18, background: `${getExtColor(n)}18`, color: getExtColor(n) }} />
                        {typeof f === "object" && f.version_count > 1 && (
                          <Chip label={`v${f.version_count}`} size="small" sx={{ fontSize: "0.62rem", height: 18, background: "rgba(99,102,241,0.1)", color: "#818cf8" }} />
                        )}
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <Tooltip title="Download">
                            <IconButton size="small" onClick={e => { e.stopPropagation(); handleDownload(f); }}
                              sx={{ "&:hover": { color: "#06b6d4", background: "rgba(6,182,212,0.1)" }, borderRadius: "8px" }}>
                              <FileDownloadRoundedIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={e => { e.stopPropagation(); handleDelete(f); }}
                              sx={{ "&:hover": { color: "#ef4444", background: "rgba(239,68,68,0.1)" }, borderRadius: "8px" }}>
                              <DeleteRoundedIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </motion.div>
                    );
                  })}
                </Box>
              )}
            </motion.div>

            {/* File detail panel */}
            <AnimatePresence>
              {selected && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.28 }} style={{ marginTop: 16 }}>
                  <Box sx={{ p: 3, borderRadius: "18px", background: cardBg, border: `1px solid ${activeFolderColor}35`, backdropFilter: "blur(20px)" }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: theme.palette.text.primary }}>File Details</Typography>
                      <IconButton size="small" onClick={() => setSelected(null)}><CloseRoundedIcon sx={{ fontSize: 16 }} /></IconButton>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 2 }}>
                      <InsertDriveFileRoundedIcon sx={{ fontSize: 40, color: getExtColor(fname(selected)), flexShrink: 0 }} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: theme.palette.text.primary, wordBreak: "break-all" }}>
                          {fname(selected)}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1, mt: 0.5, flexWrap: "wrap" }}>
                          <Chip label={getExt(fname(selected))} size="small" sx={{ fontSize: "0.68rem", height: 18, background: `${getExtColor(fname(selected))}18`, color: getExtColor(fname(selected)) }} />
                          <Chip label={activeFolder} size="small" sx={{ fontSize: "0.68rem", height: 18, background: `${activeFolderColor}14`, color: activeFolderColor }} />
                          <Chip label={trfNumber} size="small" sx={{ fontSize: "0.68rem", height: 18 }} />
                          {fsize(selected) && <Chip label={fsize(selected)} size="small" sx={{ fontSize: "0.68rem", height: 18 }} />}
                          {fdate(selected) && <Chip label={fdate(selected)} size="small" sx={{ fontSize: "0.68rem", height: 18 }} />}
                          {typeof selected === "object" && selected.uploaded_by && (
                            <Chip label={`by ${selected.uploaded_by}`} size="small" sx={{ fontSize: "0.68rem", height: 18 }} />
                          )}
                          {typeof selected === "object" && selected.version_count > 1 && (
                            <Chip label={`${selected.version_count} versions`} size="small" sx={{ fontSize: "0.68rem", height: 18, background: "rgba(99,102,241,0.1)", color: "#818cf8" }} />
                          )}
                        </Box>
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1.5 }}>
                      <Button variant="contained" size="small" startIcon={<FileDownloadRoundedIcon />}
                        onClick={() => handleDownload(selected)}
                        sx={{ borderRadius: "10px", flex: 1, background: "linear-gradient(135deg,#6366f1,#06b6d4)", boxShadow: "none" }}>
                        Download
                      </Button>
                      <Button variant="outlined" size="small" startIcon={<DeleteRoundedIcon />}
                        onClick={() => handleDelete(selected)}
                        sx={{ borderRadius: "10px", color: "#ef4444", borderColor: "rgba(239,68,68,0.4)", "&:hover": { background: "rgba(239,68,68,0.06)" } }}>
                        Delete
                      </Button>
                    </Box>
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>
          </Box>
        </Box>
      )}
    </Box>
  );
}
