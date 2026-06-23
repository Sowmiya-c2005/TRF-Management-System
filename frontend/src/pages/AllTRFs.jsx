import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import InputBase from "@mui/material/InputBase";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { DataGrid } from "@mui/x-data-grid";
import toast from "react-hot-toast";

import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";

import { getAllTRFs, deleteTRF } from "../services/trfService";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function EmptyState() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const navigate = useNavigate();
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 10 }}>
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200 }}>
        <Box sx={{
          width: 80, height: 80, borderRadius: "20px", mb: 3,
          background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(6,182,212,0.1))",
          border: "1px solid rgba(99,102,241,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <FolderRoundedIcon sx={{ fontSize: 40, color: "#6366f1", opacity: 0.7 }} />
        </Box>
      </motion.div>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>No TRFs yet</Typography>
      <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 3, textAlign: "center" }}>
        Create your first TRF to get started with document tracking.
      </Typography>
      <Button
        variant="contained" startIcon={<AddRoundedIcon />}
        onClick={() => navigate("/create")}
        sx={{ background: "linear-gradient(135deg, #6366f1, #06b6d4)", borderRadius: "10px" }}
      >
        Create First TRF
      </Button>
    </Box>
  );
}

export default function AllTRFs() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const navigate = useNavigate();
  const { addActivity, addNotification, user } = useApp();
  const [trfs, setTrfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All"); // "All" | "Active"

  const cardBg = isDark ? "rgba(15,23,42,0.7)" : "rgba(255,255,255,0.85)";
  const border = isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.2)";

  const fetchTRFs = async () => {
    setLoading(true);
    try {
      const r = await getAllTRFs();
      setTrfs(r.data);
    } catch { toast.error("Failed to load TRFs"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTRFs(); }, []);

  const handleDelete = async (trfNumber) => {
    toast((t) => (
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Typography variant="body2">Delete <b>{trfNumber}</b>?</Typography>
        <Button size="small" color="error" variant="contained" sx={{ borderRadius: "8px", minWidth: 0, px: 1.5 }}
          onClick={async () => {
            toast.dismiss(t.id);
            try {
              await deleteTRF(trfNumber);
              toast.success("TRF deleted");
              addActivity(`TRF ${trfNumber} deleted`, user?.username || "Admin");
              fetchTRFs();
            }
            catch { toast.error("Delete failed"); }
          }}>Delete</Button>
        <Button size="small" sx={{ borderRadius: "8px", minWidth: 0 }} onClick={() => toast.dismiss(t.id)}>Cancel</Button>
      </Box>
    ), { duration: 8000 });
  };

  const filtered = trfs.filter(
    (t) =>
      (t.trf_number?.toLowerCase().includes(search.toLowerCase()) ||
       t.project_name?.toLowerCase().includes(search.toLowerCase()))
  );

  const columns = [
    {
      field: "trf_number", headerName: "TRF Number", flex: 1, minWidth: 160,
      renderCell: (p) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#06b6d4)", flexShrink: 0 }} />
          <Typography variant="body2" fontWeight={600} sx={{ fontSize: "0.82rem" }}>{p.value}</Typography>
        </Box>
      ),
    },
    {
      field: "project_name", headerName: "Project Name", flex: 2, minWidth: 200,
      renderCell: (p) => <Typography variant="body2" sx={{ fontSize: "0.82rem" }}>{p.value}</Typography>,
    },
    {
      field: "created_at", headerName: "Created At", flex: 1.2, minWidth: 180,
      renderCell: (p) => (
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: "0.8rem" }}>
          {p.value ? new Date(p.value).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—"}
        </Typography>
      ),
    },
    {
      field: "status", headerName: "Status", width: 120,
      renderCell: () => (
        <Chip label="Active" size="small"
          sx={{ fontSize: "0.68rem", fontWeight: 700, height: 22, background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}
        />
      ),
    },
    {
      field: "actions", headerName: "", width: 80, sortable: false,
      renderCell: (p) => (
        <Tooltip title="Delete TRF">
          <IconButton size="small" onClick={() => handleDelete(p.row.trf_number)}
            sx={{ color: theme.palette.error.main, opacity: 0.7, "&:hover": { opacity: 1, background: "rgba(239,68,68,0.1)" } }}>
            <DeleteRoundedIcon sx={{ fontSize: 17 }} />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <motion.div variants={fadeUp} initial="initial" animate="animate">
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3.5 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, fontSize: "1.6rem", color: theme.palette.text.primary }}>All TRFs</Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
            {trfs.length} total records
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchTRFs} size="small"
              sx={{ background: isDark ? "rgba(148,163,184,0.08)" : "rgba(100,116,139,0.08)", borderRadius: "10px" }}>
              <RefreshRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Button variant="contained" startIcon={<AddRoundedIcon />}
            onClick={() => navigate("/create")}
            sx={{ background: "linear-gradient(135deg,#6366f1,#06b6d4)", borderRadius: "10px", boxShadow: "0 6px 16px rgba(99,102,241,0.3)" }}>
            New TRF
          </Button>
        </Box>
      </Box>

      {/* Table Card */}
      <Box sx={{ borderRadius: "18px", background: cardBg, backdropFilter: "blur(20px)", border: `1px solid ${border}`, overflow: "hidden" }}>
        {/* Toolbar */}
        <Box sx={{ p: 2, borderBottom: `1px solid ${border}`, display: "flex", gap: 2, alignItems: "center" }}>
          <Box sx={{
            display: "flex", alignItems: "center", gap: 1,
            px: 1.5, py: 0.75, borderRadius: "10px", flex: 1, maxWidth: 320,
            background: isDark ? "rgba(148,163,184,0.07)" : "rgba(100,116,139,0.07)",
            border: `1px solid ${isDark ? "rgba(148,163,184,0.12)" : "rgba(148,163,184,0.25)"}`,
          }}>
            <SearchRoundedIcon sx={{ color: theme.palette.text.secondary, fontSize: 17 }} />
            <InputBase
              placeholder="Search TRFs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ fontSize: "0.82rem", color: theme.palette.text.primary, flex: 1,
                "& input::placeholder": { color: theme.palette.text.secondary } }}
            />
          </Box>
          <Chip
            icon={<FilterListRoundedIcon sx={{ fontSize: "14px !important" }} />}
            label={statusFilter === "All" ? "Filter" : `Status: ${statusFilter}`}
            variant={statusFilter === "All" ? "outlined" : "filled"}
            color={statusFilter === "All" ? "default" : "primary"}
            size="small"
            onClick={() => setStatusFilter((s) => s === "All" ? "Active" : "All")}
            sx={{ fontWeight: 600, fontSize: "0.75rem", cursor: "pointer" }}
          />
        </Box>

        {filtered.length === 0 && !loading ? (
          <EmptyState />
        ) : (
          <DataGrid
            rows={filtered}
            columns={columns}
            loading={loading}
            pageSizeOptions={[10, 25, 50]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            disableRowSelectionOnClick
            sx={{
              border: "none",
              "& .MuiDataGrid-columnHeaders": {
                background: isDark ? "rgba(148,163,184,0.04)" : "rgba(100,116,139,0.04)",
                borderBottom: `1px solid ${border}`,
              },
              "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 700, fontSize: "0.78rem", color: theme.palette.text.secondary },
              "& .MuiDataGrid-cell": { borderBottom: `1px solid ${border}`, py: 1 },
              "& .MuiDataGrid-row:hover": { background: isDark ? "rgba(148,163,184,0.04)" : "rgba(100,116,139,0.03)" },
              "& .MuiDataGrid-footerContainer": { borderTop: `1px solid ${border}` },
              "& .MuiTablePagination-root": { color: theme.palette.text.secondary, fontSize: "0.78rem" },
            }}
          />
        )}
      </Box>
    </motion.div>
  );
}
