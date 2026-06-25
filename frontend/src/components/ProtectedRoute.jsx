import { Navigate, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import { motion } from "framer-motion";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated } = useApp();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login page, but save the current location they were trying to go to
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // User is logged in but doesn't have permission
    return (
      <Box sx={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        height: "70vh", textAlign: "center", p: 3
      }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <Box sx={{
            width: 80, height: 80, borderRadius: "20px", mb: 3, mx: "auto",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <ShieldRoundedIcon sx={{ fontSize: 40, color: "#ef4444" }} />
          </Box>
        </motion.div>
        <Typography variant="h5" fontWeight={800} sx={{ mb: 1 }}>Access Denied</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 3, maxWidth: 400 }}>
          You do not have the required permissions to view this page. This page requires a role of {allowedRoles.join(" or ")}.
        </Typography>
        <Button variant="outlined" onClick={() => window.history.back()} sx={{ borderRadius: "10px" }}>
          Go Back
        </Button>
      </Box>
    );
  }

  return children;
}
