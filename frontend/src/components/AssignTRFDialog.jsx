import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@mui/material/styles";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, Button, TextField, Chip,
  FormControl, InputLabel, Select, MenuItem,
  Avatar, AvatarGroup, IconButton, Divider,
  CircularProgress, Alert
} from "@mui/material";
import { useApp } from "../context/AppContext";
import API from "../services/api";
import toast from "react-hot-toast";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import EngineeringRoundedIcon from "@mui/icons-material/EngineeringRounded";
import SupervisorAccountRoundedIcon from "@mui/icons-material/SupervisorAccountRounded";

export default function AssignTRFDialog({ open, onClose, trf, onSuccess }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { user } = useApp();

  const [managers, setManagers] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [selectedManager, setSelectedManager] = useState("");
  const [selectedEngineers, setSelectedEngineers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(false);

  // Fetch users when dialog opens
  useEffect(() => {
    if (open) {
      fetchUsers();
      // Pre-fill if TRF already has assignments
      if (trf?.assigned_manager_id) {
        setSelectedManager(trf.assigned_manager_id);
      }
    }
  }, [open, trf]);

  const fetchUsers = async () => {
    setFetchingUsers(true);
    try {
      const [managersRes, engineersRes] = await Promise.all([
        API.get('/users/', { params: { role: 'Manager' } }),
        API.get('/users/', { params: { role: 'Engineer' } }),
      ]);
      setManagers(Array.isArray(managersRes.data) ? managersRes.data : []);
      setEngineers(Array.isArray(engineersRes.data) ? engineersRes.data : []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setFetchingUsers(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedManager && selectedEngineers.length === 0) {
      toast.error('Please select at least a manager or engineer');
      return;
    }

    setLoading(true);
    try {
      await API.post('/assignments/assign', {
        trf_id: trf.id,
        manager_id: selectedManager || null,
        engineer_ids: selectedEngineers,
      });
      toast.success('TRF assigned successfully');
      onSuccess?.();
      onClose();
      setSelectedManager("");
      setSelectedEngineers([]);
    } catch (error) {
      console.error('Assignment error:', error);
      toast.error(error?.response?.data?.detail || 'Failed to assign TRF');
    } finally {
      setLoading(false);
    }
  };

  const toggleEngineer = (engineerId) => {
    setSelectedEngineers(prev =>
      prev.includes(engineerId)
        ? prev.filter(id => id !== engineerId)
        : [...prev, engineerId]
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "20px",
          background: isDark ? "rgba(10,15,30,0.97)" : "rgba(255,255,255,0.98)",
          backdropFilter: "blur(30px)",
          border: `1px solid ${isDark ? "rgba(148,163,184,0.1)" : "rgba(148,163,184,0.2)"}`,
          boxShadow: isDark
            ? "0 32px 64px rgba(0,0,0,0.5)"
            : "0 32px 64px rgba(15,23,42,0.18)",
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="h6" fontWeight={700}>
            Assign TRF {trf?.trf_number}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseRoundedIcon />
          </IconButton>
        </Box>
        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, mt: 0.5, display: "block" }}>
          {trf?.project_name}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {fetchingUsers ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Manager Selection */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                <SupervisorAccountRoundedIcon sx={{ fontSize: 18, color: "#6366f1" }} />
                Assign Manager
              </Typography>
              <FormControl fullWidth size="small">
                <InputLabel>Select Manager</InputLabel>
                <Select
                  value={selectedManager}
                  label="Select Manager"
                  onChange={(e) => setSelectedManager(e.target.value)}
                >
                  <MenuItem value="">No Manager</MenuItem>
                  {managers.map((manager) => (
                    <MenuItem key={manager.id} value={manager.id}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar sx={{ width: 28, height: 28, fontSize: 12, background: "#6366f1" }}>
                          {manager.username?.[0]?.toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {manager.display_name || manager.username}
                          </Typography>
                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                            {manager.email}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Divider />

            {/* Engineer Selection */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                <EngineeringRoundedIcon sx={{ fontSize: 18, color: "#06b6d4" }} />
                Assign Engineers
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {engineers.map((engineer) => {
                  const isSelected = selectedEngineers.includes(engineer.id);
                  return (
                    <Chip
                      key={engineer.id}
                      avatar={
                        <Avatar sx={{ width: 24, height: 24, fontSize: 10, background: isSelected ? "#06b6d4" : "#94a3b8" }}>
                          {engineer.username?.[0]?.toUpperCase()}
                        </Avatar>
                      }
                      label={engineer.display_name || engineer.username}
                      onClick={() => toggleEngineer(engineer.id)}
                      onDelete={() => toggleEngineer(engineer.id)}
                      deleteIcon={isSelected ? <PersonRoundedIcon sx={{ fontSize: 14 }} /> : null}
                      sx={{
                        background: isSelected
                          ? "rgba(6,182,212,0.15)"
                          : isDark
                          ? "rgba(148,163,184,0.08)"
                          : "rgba(148,163,184,0.12)",
                        border: `1px solid ${isSelected ? "#06b6d4" : isDark ? "rgba(148,163,184,0.2)" : "rgba(148,163,184,0.3)"}`,
                        color: isSelected ? "#06b6d4" : theme.palette.text.primary,
                        "&:hover": {
                          background: isSelected
                            ? "rgba(6,182,212,0.25)"
                            : isDark
                            ? "rgba(148,163,184,0.15)"
                            : "rgba(148,163,184,0.2)",
                        },
                      }}
                    />
                  );
                })}
              </Box>
              {selectedEngineers.length === 0 && (
                <Typography variant="caption" sx={{ color: theme.palette.text.disabled, mt: 1, display: "block" }}>
                  No engineers selected
                </Typography>
              )}
            </Box>

            {/* Current Assignments Display */}
            {trf?.assigned_manager_id && (
              <Alert severity="info" sx={{ mt: 1 }}>
                <Typography variant="caption">
                  Currently assigned to Manager ID: {trf.assigned_manager_id}
                </Typography>
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleAssign}
          variant="contained"
          disabled={loading}
          sx={{
            background: "linear-gradient(135deg,#6366f1,#06b6d4)",
            "&:hover": {
              background: "linear-gradient(135deg,#4f46e5,#0891b2)",
            },
          }}
        >
          {loading ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "Assign TRF"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
