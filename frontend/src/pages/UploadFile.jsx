/**
 * UploadFile.jsx — Premium Upload Documents page
 * ─────────────────────────────────────────────
 * • TRF autocomplete (live from DB via getAllTRFs)
 * • Folder tab selector with colour coding
 * • File type validation + size check
 * • Per-file progress bars + status badges
 * • Batch upload with overall progress ring
 * • Dark-glass premium aesthetic
 */
import { useState, useCallback, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@mui/material/styles";
import toast from "react-hot-toast";

import Box        from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button     from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import Chip       from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Tooltip    from "@mui/material/Tooltip";
import CircularProgress from "@mui/material/CircularProgress";
import Autocomplete from "@mui/material/Autocomplete";
import TextField    from "@mui/material/TextField";

import CloudUploadRoundedIcon    from "@mui/icons-material/CloudUploadRounded";
import CheckCircleRoundedIcon    from "@mui/icons-material/CheckCircleRounded";
import DeleteRoundedIcon         from "@mui/icons-material/DeleteRounded";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";
import FolderRoundedIcon         from "@mui/icons-material/FolderRounded";
import PictureAsPdfRoundedIcon   from "@mui/icons-material/PictureAsPdfRounded";
import ImageRoundedIcon          from "@mui/icons-material/ImageRounded";
import TableChartRoundedIcon     from "@mui/icons-material/TableChartRounded";
import ArticleRoundedIcon        from "@mui/icons-material/ArticleRounded";
import ErrorRoundedIcon          from "@mui/icons-material/ErrorRounded";
import UploadFileRoundedIcon     from "@mui/icons-material/UploadFileRounded";
import ArrowForwardRoundedIcon   from "@mui/icons-material/ArrowForwardRounded";
import SearchRoundedIcon         from "@mui/icons-material/SearchRounded";

import { uploadFile } from "../services/fileService";
import { getAllTRFs }  from "../services/trfService";
import { useApp }      from "../context/AppContext";
import { usePermission } from "../hooks/usePermission";

/* ── Constants ─────────────────────────────────────────────── */
const FOLDERS = [
  { name:"Documents",        color:"#6366f1", bg:"rgba(99,102,241,0.14)"  },
  { name:"Drawings",         color:"#06b6d4", bg:"rgba(6,182,212,0.14)"   },
  { name:"Reports",          color:"#10b981", bg:"rgba(16,185,129,0.14)"  },
  { name:"Approvals",        color:"#f59e0b", bg:"rgba(245,158,11,0.14)"  },
  { name:"Final Submission", color:"#a855f7", bg:"rgba(168,85,247,0.14)"  },
];

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png","image/jpeg","image/jpg","image/webp","image/svg+xml",
  "text/plain",
  "application/zip","application/x-zip-compressed",
];
const MAX_MB = 50;

/* ── Helpers ────────────────────────────────────────────────── */
function fmtBytes(b) {
  if (b < 1024)        return `${b} B`;
  if (b < 1048576)     return `${(b/1024).toFixed(1)} KB`;
  return `${(b/1048576).toFixed(1)} MB`;
}

function FileIcon({ name, sz=22 }) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (["pdf"].includes(ext))                    return <PictureAsPdfRoundedIcon sx={{ fontSize:sz, color:"#ef4444" }}/>;
  if (["doc","docx"].includes(ext))             return <ArticleRoundedIcon      sx={{ fontSize:sz, color:"#3b82f6" }}/>;
  if (["xls","xlsx","csv"].includes(ext))       return <TableChartRoundedIcon   sx={{ fontSize:sz, color:"#10b981" }}/>;
  if (["png","jpg","jpeg","webp","svg"].includes(ext)) return <ImageRoundedIcon  sx={{ fontSize:sz, color:"#f59e0b" }}/>;
  return <InsertDriveFileRoundedIcon sx={{ fontSize:sz, color:"#94a3b8" }}/>;
}

function StatusBadge({ status }) {
  if (status === "done")     return <CheckCircleRoundedIcon sx={{ fontSize:18, color:"#10b981" }}/>;
  if (status === "error")    return <ErrorRoundedIcon       sx={{ fontSize:18, color:"#ef4444" }}/>;
  if (status === "uploading") return <CircularProgress size={16} sx={{ color:"#6366f1" }}/>;
  return null;
}

/* ── Circular overall progress ─────────────────────────────── */
function RingProgress({ value, total, done }) {
  const r  = 34;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <Box sx={{ position:"relative", width:90, height:90, flexShrink:0 }}>
      <svg width={90} height={90} style={{ transform:"rotate(-90deg)" }}>
        <circle cx={45} cy={45} r={r} fill="none" stroke="rgba(99,102,241,0.15)" strokeWidth={6}/>
        <circle cx={45} cy={45} r={r} fill="none"
          stroke="url(#ringGrad)" strokeWidth={6}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition:"stroke-dashoffset 0.4s ease" }}/>
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366f1"/>
            <stop offset="100%" stopColor="#06b6d4"/>
          </linearGradient>
        </defs>
      </svg>
      <Box sx={{
        position:"absolute", inset:0, display:"flex",
        flexDirection:"column", alignItems:"center", justifyContent:"center",
      }}>
        <Typography sx={{ fontSize:"1.1rem", fontWeight:900, color:"#f1f5f9", lineHeight:1 }}>
          {value}%
        </Typography>
        <Typography sx={{ fontSize:"0.6rem", color:"#64748b", mt:.2 }}>
          {done}/{total}
        </Typography>
      </Box>
    </Box>
  );
}

/* ═══ MAIN ══════════════════════════════════════════════════ */
export default function UploadFile() {
  const theme   = useTheme();
  const isDark  = theme.palette.mode === "dark";
  const [params]= useSearchParams();
  const { addActivity, addNotification, user } = useApp();
  const { can } = usePermission();

  /* TRF list from DB */
  const [trfList,    setTrfList]    = useState([]);
  const [trfLoading, setTrfLoading] = useState(true);
  const [trfNumber,  setTrfNumber]  = useState(params.get("trf") || "");

  /* Folder selection */
  const [folderIdx,  setFolderIdx]  = useState(0);
  const folder = FOLDERS[folderIdx];

  /* Files */
  const [files,    setFiles]    = useState([]);
  const [progress, setProgress] = useState({});
  const [statuses, setStatuses] = useState({});
  const [uploading,setUploading]= useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

  /* Load TRF list from DB for autocomplete */
  useEffect(() => {
    getAllTRFs()
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : [];
        const nums = [...new Set(list.map(t => t.trf_number).filter(Boolean))].sort();
        setTrfList(nums);
      })
      .catch(() => setTrfList([]))
      .finally(() => setTrfLoading(false));
  }, []);

  /* File validation */
  const validateFile = (f) => {
    if (f.size > MAX_MB * 1024 * 1024) return `File too large (max ${MAX_MB} MB)`;
    if (!ACCEPTED_TYPES.includes(f.type) && f.type !== "") return "File type not accepted";
    return null;
  };

  const addFiles = useCallback((incoming) => {
    const arr = Array.from(incoming);
    const errors = [];
    const valid  = arr.filter(f => {
      const err = validateFile(f);
      if (err) { errors.push(`${f.name}: ${err}`); return false; }
      return true;
    });
    errors.forEach(e => toast.error(e));
    setFiles(prev => {
      const names = new Set(prev.map(f => f.name));
      return [...prev, ...valid.filter(f => !names.has(f.name))];
    });
  }, []);

  const removeFile = (name) => {
    setFiles(prev => prev.filter(f => f.name !== name));
    setProgress(prev => { const n={...prev}; delete n[name]; return n; });
    setStatuses(prev => { const n={...prev}; delete n[name]; return n; });
  };

  const clearAll = () => { setFiles([]); setProgress({}); setStatuses({}); };

  const onDrop = e => {
    e.preventDefault(); setDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const handleUpload = async () => {
    if (!trfNumber.trim()) { toast.error("Select or enter a TRF number first"); return; }
    if (!files.length)     { toast.error("Add at least one file");              return; }
    setUploading(true);

    let doneCount = 0;
    for (const file of files) {
      if (statuses[file.name] === "done") { doneCount++; continue; }
      setStatuses(prev => ({ ...prev, [file.name]: "uploading" }));
      try {
        await uploadFile(trfNumber.trim(), folder.name, file, pct =>
          setProgress(prev => ({ ...prev, [file.name]: pct }))
        );
        setStatuses(prev => ({ ...prev, [file.name]: "done" }));
        setProgress(prev => ({ ...prev, [file.name]: 100 }));
        doneCount++;
      } catch(e) {
        setStatuses(prev => ({ ...prev, [file.name]: "error" }));
        toast.error(`${file.name}: ${e?.response?.data?.detail || e.message || "Upload failed"}`);
      }
    }

    const label = user?.displayName || user?.username || "Admin";
    addActivity(`${doneCount} file(s) uploaded to ${folder.name} [${trfNumber.trim()}]`, label);
    addNotification({
      title: "Upload complete",
      body: `${doneCount} file(s) → ${folder.name} / ${trfNumber.trim()}`,
      color: "#10b981", type: "file",
    });
    toast.success(`${doneCount} file(s) uploaded successfully!`);
    setUploading(false);
  };

  /* Computed */
  const allDone = files.length > 0 && files.every(f => statuses[f.name] === "done");
  const totalPct = files.length === 0 ? 0
    : Math.round(files.reduce((acc,f) => acc + (progress[f.name]||0), 0) / files.length);
  const doneFiles = files.filter(f => statuses[f.name] === "done").length;

  /* Theme tokens */
  const glass   = isDark ? "rgba(15,23,42,0.80)"   : "rgba(255,255,255,0.90)";
  const glassHi = isDark ? "rgba(20,30,60,0.90)"   : "rgba(248,250,255,0.95)";
  const bdr     = isDark ? "rgba(148,163,184,0.10)" : "rgba(148,163,184,0.20)";
  const txt     = isDark ? "#f1f5f9" : "#0f172a";
  const sub     = isDark ? "#64748b" : "#94a3b8";

  /* Permission guard */
  if (!can("upload_file")) {
    return (
      <Box sx={{ maxWidth:480, mx:"auto", mt:8, textAlign:"center", px:3 }}>
        <Box sx={{
          width:80, height:80, borderRadius:"24px", mx:"auto", mb:3,
          background:"rgba(239,68,68,0.10)", border:"1px solid rgba(239,68,68,0.25)",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <CloudUploadRoundedIcon sx={{ fontSize:36, color:"#ef4444" }}/>
        </Box>
        <Typography variant="h6" fontWeight={800} sx={{ color:txt, mb:1 }}>Upload Not Permitted</Typography>
        <Typography sx={{ color:sub, fontSize:"0.88rem" }}>
          Your role does not have upload access. Contact an Admin or Engineer.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth:720, mx:"auto" }}>

      {/* ── Header ── */}
      <motion.div initial={{ opacity:0, y:-14 }} animate={{ opacity:1, y:0 }}>
        <Box sx={{ display:"flex", alignItems:"center", gap:2, mb:4 }}>
          <Box sx={{
            width:48, height:48, borderRadius:"15px",
            background:"linear-gradient(135deg,#10b981,#06b6d4)",
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:"0 8px 24px rgba(16,185,129,0.35)",
          }}>
            <UploadFileRoundedIcon sx={{ color:"#fff", fontSize:24 }}/>
          </Box>
          <Box>
            <Typography sx={{ fontWeight:900, fontSize:"1.75rem", color:txt, lineHeight:1.15, fontFamily:"'Outfit','Inter',sans-serif" }}>
              Upload Documents
            </Typography>
            <Typography sx={{ color:sub, fontSize:"0.82rem", mt:.2 }}>
              Attach files to any TRF project folder · PDF, Word, Excel, Images accepted
            </Typography>
          </Box>
        </Box>
      </motion.div>

      {/* ── Step 1: TRF Selection ── */}
      <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.07 }}>
        <Box sx={{
          p:3, borderRadius:"20px", background:glass,
          border:`1px solid ${bdr}`, backdropFilter:"blur(24px)",
          mb:2.5, boxShadow: isDark ? "0 4px 24px rgba(0,0,0,0.40)" : "0 4px 24px rgba(0,0,0,0.06)",
        }}>
          <Box sx={{ display:"flex", alignItems:"center", gap:1, mb:2 }}>
            <Box sx={{
              width:22, height:22, borderRadius:"6px",
              background:"rgba(99,102,241,0.20)", border:"1px solid rgba(99,102,241,0.35)",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <Typography sx={{ fontSize:"0.65rem", fontWeight:900, color:"#818cf8" }}>1</Typography>
            </Box>
            <Typography sx={{ fontWeight:700, fontSize:"0.88rem", color:txt }}>Select TRF Number</Typography>
          </Box>

          <Autocomplete
            freeSolo
            options={trfList}
            value={trfNumber}
            onInputChange={(_, val) => setTrfNumber(val)}
            loading={trfLoading}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Search or enter TRF number (e.g. TRF-2026-101)"
                size="small"
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <Box sx={{ mr:.5, display:"flex", alignItems:"center" }}>
                      <SearchRoundedIcon sx={{ fontSize:18, color:sub }}/>
                    </Box>
                  ),
                  endAdornment: trfLoading
                    ? <CircularProgress size={14} sx={{ color:"#6366f1" }}/>
                    : params.InputProps.endAdornment,
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius:"12px",
                    background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
                    fontSize:"0.88rem",
                    "& fieldset": { borderColor: trfNumber ? "#6366f1" : bdr },
                    "&:hover fieldset": { borderColor:"rgba(99,102,241,0.50)" },
                    "&.Mui-focused fieldset": { borderColor:"#6366f1" },
                  },
                  "& .MuiInputBase-input": { color: txt },
                }}
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props} sx={{ fontSize:"0.85rem", gap:1.5 }}>
                <FolderRoundedIcon sx={{ fontSize:16, color:"#6366f1", flexShrink:0 }}/>
                {option}
              </Box>
            )}
          />

          {trfNumber && (
            <Box sx={{ mt:1.5, display:"flex", alignItems:"center", gap:1 }}>
              <CheckCircleRoundedIcon sx={{ fontSize:14, color:"#10b981" }}/>
              <Typography sx={{ fontSize:"0.75rem", color:"#34d399", fontWeight:700 }}>
                TRF: {trfNumber}
              </Typography>
            </Box>
          )}
        </Box>
      </motion.div>

      {/* ── Step 2: Folder Tabs ── */}
      <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.13 }}>
        <Box sx={{
          p:3, borderRadius:"20px", background:glass,
          border:`1px solid ${bdr}`, backdropFilter:"blur(24px)",
          mb:2.5, boxShadow: isDark ? "0 4px 24px rgba(0,0,0,0.40)" : "0 4px 24px rgba(0,0,0,0.06)",
        }}>
          <Box sx={{ display:"flex", alignItems:"center", gap:1, mb:2.5 }}>
            <Box sx={{
              width:22, height:22, borderRadius:"6px",
              background:"rgba(6,182,212,0.20)", border:"1px solid rgba(6,182,212,0.35)",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <Typography sx={{ fontSize:"0.65rem", fontWeight:900, color:"#22d3ee" }}>2</Typography>
            </Box>
            <Typography sx={{ fontWeight:700, fontSize:"0.88rem", color:txt }}>Select Destination Folder</Typography>
          </Box>

          <Box sx={{ display:"flex", gap:1, flexWrap:"wrap" }}>
            {FOLDERS.map((f, i) => {
              const active = i === folderIdx;
              return (
                <motion.div key={f.name} whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }}>
                  <Box
                    onClick={() => setFolderIdx(i)}
                    sx={{
                      display:"flex", alignItems:"center", gap:.8,
                      px:2, py:1, borderRadius:"12px", cursor:"pointer",
                      background: active ? f.bg : (isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"),
                      border:`1.5px solid ${active ? f.color+"66" : bdr}`,
                      transition:"all 0.20s",
                      boxShadow: active ? `0 0 18px ${f.color}22` : "none",
                    }}
                  >
                    <FolderRoundedIcon sx={{ fontSize:16, color: active ? f.color : sub }}/>
                    <Typography sx={{
                      fontSize:"0.78rem", fontWeight: active ? 800 : 600,
                      color: active ? f.color : sub,
                      whiteSpace:"nowrap",
                    }}>
                      {f.name}
                    </Typography>
                  </Box>
                </motion.div>
              );
            })}
          </Box>

          {/* Selected folder label */}
          <Box sx={{
            mt:2, p:1.5, borderRadius:"10px",
            background: folder.bg, border:`1px solid ${folder.color}33`,
            display:"flex", alignItems:"center", gap:1,
          }}>
            <FolderRoundedIcon sx={{ fontSize:16, color:folder.color }}/>
            <Typography sx={{ fontSize:"0.78rem", fontWeight:700, color:folder.color }}>
              Uploading to: <strong>{folder.name}</strong>
            </Typography>
          </Box>
        </Box>
      </motion.div>

      {/* ── Step 3: Drop Zone ── */}
      <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.19 }}>
        <Box sx={{
          p:"0 0 2.5px", borderRadius:"20px", mb:2.5,
        }}>
          <Box
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={()=> setDragging(false)}
            onDrop={onDrop}
            onClick={()=> fileRef.current?.click()}
            sx={{
              p:"40px 32px", borderRadius:"20px", textAlign:"center", cursor:"pointer",
              background: dragging
                ? (isDark ? "rgba(99,102,241,0.14)" : "rgba(99,102,241,0.07)")
                : glass,
              border:`2px dashed ${dragging ? "#6366f1" : (isDark ? "rgba(148,163,184,0.14)" : "rgba(148,163,184,0.28)")}`,
              backdropFilter:"blur(24px)",
              transition:"all 0.25s",
              boxShadow: dragging ? "0 0 0 4px rgba(99,102,241,0.15)" : (isDark ? "0 4px 24px rgba(0,0,0,0.40)" : "0 4px 24px rgba(0,0,0,0.06)"),
            }}
          >
            <input ref={fileRef} type="file" multiple hidden
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.webp,.svg,.txt,.zip"
              onChange={e => addFiles(e.target.files)}/>
            <motion.div animate={dragging ? { scale:1.12, y:-4 } : { scale:1, y:0 }} transition={{ duration:0.25 }}>
              <Box sx={{
                width:72, height:72, borderRadius:"20px", mx:"auto", mb:2,
                background: dragging
                  ? "linear-gradient(135deg,#6366f1,#06b6d4)"
                  : (isDark ? "rgba(99,102,241,0.10)" : "rgba(99,102,241,0.08)"),
                border:`1px solid ${dragging ? "transparent" : "rgba(99,102,241,0.22)"}`,
                display:"flex", alignItems:"center", justifyContent:"center",
                transition:"all 0.25s",
                boxShadow: dragging ? "0 12px 36px rgba(99,102,241,0.45)" : "none",
              }}>
                <CloudUploadRoundedIcon sx={{ fontSize:34, color: dragging ? "#fff" : "#6366f1" }}/>
              </Box>
            </motion.div>
            <Typography sx={{ fontWeight:800, fontSize:"1.05rem", color: dragging ? "#818cf8" : txt, mb:.7 }}>
              {dragging ? "Release to add files" : "Drag & drop files here"}
            </Typography>
            <Typography sx={{ fontSize:"0.82rem", color:sub, mb:1.5 }}>
              or click to browse your computer
            </Typography>
            <Box sx={{ display:"flex", gap:1, justifyContent:"center", flexWrap:"wrap" }}>
              {["PDF","Word","Excel","Images","ZIP"].map(t => (
                <Chip key={t} label={t} size="small" sx={{
                  fontSize:"0.68rem", fontWeight:700, height:22,
                  background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                  color:sub, border:`1px solid ${bdr}`,
                }}/>
              ))}
            </Box>
            <Typography sx={{ fontSize:"0.72rem", color:sub, mt:1 }}>
              Max {MAX_MB} MB per file
            </Typography>
          </Box>
        </Box>
      </motion.div>

      {/* ── File Queue ── */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity:0, y:14 }}
            animate={{ opacity:1, y:0 }}
            exit={{ opacity:0, y:10 }}
          >
            <Box sx={{
              p:3, borderRadius:"20px", background:glassHi,
              border:`1px solid ${bdr}`, backdropFilter:"blur(24px)",
              mb:2.5, boxShadow: isDark ? "0 4px 24px rgba(0,0,0,0.45)" : "0 4px 24px rgba(0,0,0,0.06)",
            }}>
              {/* Queue header */}
              <Box sx={{ display:"flex", alignItems:"center", justifyContent:"space-between", mb:2 }}>
                <Box sx={{ display:"flex", alignItems:"center", gap:1.5 }}>
                  {uploading ? (
                    <RingProgress value={totalPct} total={files.length} done={doneFiles}/>
                  ) : (
                    <Box sx={{
                      width:40, height:40, borderRadius:"12px",
                      background:"rgba(99,102,241,0.14)", border:"1px solid rgba(99,102,241,0.28)",
                      display:"flex", alignItems:"center", justifyContent:"center",
                    }}>
                      <InsertDriveFileRoundedIcon sx={{ fontSize:20, color:"#818cf8" }}/>
                    </Box>
                  )}
                  <Box>
                    <Typography sx={{ fontWeight:800, fontSize:"0.92rem", color:txt }}>
                      {files.length} file{files.length !== 1 ? "s" : ""} queued
                    </Typography>
                    <Typography sx={{ fontSize:"0.73rem", color:sub }}>
                      {fmtBytes(files.reduce((a,f)=>a+f.size,0))} total
                      {uploading && ` · ${totalPct}% uploaded`}
                    </Typography>
                  </Box>
                </Box>
                {!uploading && (
                  <Tooltip title="Clear all">
                    <IconButton size="small" onClick={clearAll} sx={{ color:sub }}>
                      <DeleteRoundedIcon fontSize="small"/>
                    </IconButton>
                  </Tooltip>
                )}
              </Box>

              {/* Overall progress bar */}
              {uploading && (
                <LinearProgress variant="determinate" value={totalPct} sx={{
                  mb:2.5, borderRadius:4, height:5,
                  background: isDark ? "rgba(148,163,184,0.10)" : "rgba(148,163,184,0.15)",
                  "& .MuiLinearProgress-bar": {
                    background:"linear-gradient(90deg,#6366f1,#06b6d4)", borderRadius:4,
                  },
                }}/>
              )}

              {/* File rows */}
              <Box sx={{ display:"flex", flexDirection:"column", gap:1 }}>
                {files.map((file, i) => {
                  const st  = statuses[file.name];
                  const pct = progress[file.name] || 0;
                  return (
                    <motion.div key={file.name}
                      initial={{ opacity:0, x:-14 }}
                      animate={{ opacity:1, x:0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <Box sx={{
                        display:"flex", alignItems:"center", gap:1.5, p:"12px 14px",
                        borderRadius:"12px",
                        border:`1px solid ${
                          st==="done"  ? "rgba(16,185,129,0.30)"  :
                          st==="error" ? "rgba(239,68,68,0.30)"   : bdr
                        }`,
                        background:
                          st==="done"  ? (isDark?"rgba(16,185,129,0.06)":"rgba(16,185,129,0.04)") :
                          st==="error" ? (isDark?"rgba(239,68,68,0.06)" :"rgba(239,68,68,0.04)")  :
                          "transparent",
                        transition:"all 0.25s",
                      }}>
                        <FileIcon name={file.name}/>
                        <Box sx={{ flex:1, minWidth:0 }}>
                          <Typography sx={{
                            fontSize:"0.82rem", fontWeight:600, color:txt,
                            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                          }}>
                            {file.name}
                          </Typography>
                          <Box sx={{ display:"flex", alignItems:"center", gap:1.5, mt:.3 }}>
                            <Typography sx={{ fontSize:"0.70rem", color:sub }}>
                              {fmtBytes(file.size)}
                            </Typography>
                            {st === "uploading" && (
                              <Box sx={{ flex:1, display:"flex", alignItems:"center", gap:1 }}>
                                <LinearProgress variant="determinate" value={pct} sx={{
                                  flex:1, height:3, borderRadius:2,
                                  background:isDark?"rgba(148,163,184,0.10)":"rgba(148,163,184,0.18)",
                                  "& .MuiLinearProgress-bar":{
                                    background:"linear-gradient(90deg,#6366f1,#06b6d4)", borderRadius:2,
                                  },
                                }}/>
                                <Typography sx={{ fontSize:"0.68rem", color:"#818cf8", fontWeight:700, flexShrink:0 }}>
                                  {pct}%
                                </Typography>
                              </Box>
                            )}
                            {st === "done" && (
                              <Typography sx={{ fontSize:"0.70rem", color:"#34d399", fontWeight:700 }}>Uploaded ✓</Typography>
                            )}
                            {st === "error" && (
                              <Typography sx={{ fontSize:"0.70rem", color:"#f87171", fontWeight:700 }}>Failed ✗</Typography>
                            )}
                          </Box>
                        </Box>
                        <Box sx={{ display:"flex", alignItems:"center", gap:.5 }}>
                          <StatusBadge status={st}/>
                          {!st && (
                            <Tooltip title="Remove">
                              <IconButton size="small" onClick={() => removeFile(file.name)}
                                sx={{ color:sub, "&:hover":{ color:"#ef4444" } }}>
                                <DeleteRoundedIcon sx={{ fontSize:16 }}/>
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

            {/* ── Upload Button / Success ── */}
            {allDone ? (
              <motion.div initial={{ opacity:0, scale:.95 }} animate={{ opacity:1, scale:1 }}>
                <Box sx={{
                  p:3, borderRadius:"20px",
                  background:"rgba(16,185,129,0.08)",
                  border:"1px solid rgba(16,185,129,0.28)",
                  textAlign:"center",
                  boxShadow:"0 0 40px rgba(16,185,129,0.12)",
                }}>
                  <CheckCircleRoundedIcon sx={{ fontSize:44, color:"#10b981", mb:1 }}/>
                  <Typography sx={{ fontWeight:800, color:"#34d399", fontSize:"1rem", mb:.5 }}>
                    All files uploaded successfully!
                  </Typography>
                  <Typography sx={{ fontSize:"0.80rem", color:"#64748b" }}>
                    {files.length} file{files.length!==1?"s":""} saved to <strong>{folder.name}</strong> / {trfNumber}
                  </Typography>
                  <Button size="small" variant="outlined"
                    onClick={clearAll}
                    sx={{
                      mt:2, borderRadius:"10px", textTransform:"none",
                      borderColor:"rgba(16,185,129,0.40)", color:"#34d399",
                      "&:hover":{ background:"rgba(16,185,129,0.08)", borderColor:"#10b981" },
                    }}>
                    Upload more files
                  </Button>
                </Box>
              </motion.div>
            ) : (
              <motion.div whileHover={{ scale:1.015 }} whileTap={{ scale:0.985 }}>
                <Button
                  fullWidth variant="contained"
                  onClick={handleUpload}
                  disabled={uploading}
                  startIcon={uploading
                    ? <CircularProgress size={18} color="inherit"/>
                    : <CloudUploadRoundedIcon/>}
                  endIcon={!uploading && <ArrowForwardRoundedIcon/>}
                  sx={{
                    py:1.6, borderRadius:"15px", fontWeight:800, fontSize:"0.96rem",
                    textTransform:"none", letterSpacing:.3,
                    background:"linear-gradient(135deg,#10b981,#06b6d4)",
                    boxShadow:"0 8px 28px rgba(16,185,129,0.40)",
                    "&:hover":{ boxShadow:"0 12px 36px rgba(16,185,129,0.55)" },
                    "&.Mui-disabled":{ background:"rgba(148,163,184,0.20)", color:"#475569" },
                  }}
                >
                  {uploading
                    ? `Uploading… ${totalPct}%`
                    : `Upload ${files.length} File${files.length!==1?"s":""} to ${folder.name}`}
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}
