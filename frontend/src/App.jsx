import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import Layout from "./components/Layout";
import { useApp } from "./context/AppContext";
import { ErrorBoundary } from "react-error-boundary";

// Lazy-loaded pages for code splitting
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const ManagerDashboard = lazy(() => import("./pages/ManagerDashboard"));
const EngineerDashboard = lazy(() => import("./pages/EngineerDashboard"));
const CreateTRF  = lazy(() => import("./pages/CreateTRF"));
const SearchTRF  = lazy(() => import("./pages/SearchTRF"));
const AllTRFs    = lazy(() => import("./pages/AllTRFs"));
const UploadFile = lazy(() => import("./pages/UploadFile"));
const FileManager= lazy(() => import("./pages/FileManager"));
const UpdateTRF  = lazy(() => import("./pages/UpdateTRF"));
const Login      = lazy(() => import("./pages/Login"));
const Analytics  = lazy(() => import("./pages/Analytics"));
const Reports    = lazy(() => import("./pages/Reports"));
const Users      = lazy(() => import("./pages/Users"));
const Settings   = lazy(() => import("./pages/Settings"));
const Profile           = lazy(() => import('./pages/Profile'));
const Notifications     = lazy(() => import('./pages/Notifications'));
const AuditLog          = lazy(() => import('./pages/AuditLog'));
const AssignTRF         = lazy(() => import('./pages/AssignTRF'));
const AssignedWorkspace = lazy(() => import('./pages/AssignedWorkspace'));

function PageLoader() {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <CircularProgress size={32} thickness={3} sx={{ color: "#6366f1" }} />
    </Box>
  );
}

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <Box sx={{ p: 4, m: 4, background: "#fee2e2", border: "1px solid #ef4444", borderRadius: "12px" }}>
      <Typography variant="h5" sx={{ color: "#b91c1c", mb: 2 }}>Something went wrong:</Typography>
      <Typography component="pre" sx={{ color: "#7f1d1d", whiteSpace: "pre-wrap", fontSize: "0.85rem" }}>
        {error.message}
      </Typography>
      <button onClick={resetErrorBoundary} style={{ marginTop: 16, padding: "8px 16px", cursor: "pointer" }}>Try again</button>
    </Box>
  );
}

import ProtectedRoute from "./components/ProtectedRoute";

function DashboardSwitch() {
  const { user } = useApp();
  if (user?.role === "Admin") return <Navigate to="/dashboard/admin" replace />;
  if (user?.role === "Manager") return <Navigate to="/dashboard/manager" replace />;
  return <Navigate to="/dashboard/engineer" replace />;
}

function AppRoutes() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/"          element={<ProtectedRoute><DashboardSwitch /></ProtectedRoute>} />
          <Route path="/dashboard/admin" element={<ProtectedRoute allowedRoles={["Admin"]}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/manager" element={<ProtectedRoute allowedRoles={["Manager"]}><ManagerDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/engineer" element={<ProtectedRoute allowedRoles={["Engineer"]}><EngineerDashboard /></ProtectedRoute>} />
          <Route path="/create"    element={<ProtectedRoute allowedRoles={["Admin", "Engineer"]}><CreateTRF /></ProtectedRoute>} />
          <Route path="/search"    element={<ProtectedRoute><SearchTRF /></ProtectedRoute>} />
          <Route path="/all"       element={<ProtectedRoute><AllTRFs /></ProtectedRoute>} />
          <Route path="/upload"    element={<ProtectedRoute allowedRoles={["Admin", "Engineer", "Manager"]}><UploadFile /></ProtectedRoute>} />
          <Route path="/files"     element={<ProtectedRoute><FileManager /></ProtectedRoute>} />
          <Route path="/update"    element={<ProtectedRoute allowedRoles={["Admin", "Engineer", "Manager"]}><UpdateTRF /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute allowedRoles={["Admin", "Manager"]}><Analytics /></ProtectedRoute>} />
          <Route path="/reports"   element={<ProtectedRoute allowedRoles={["Admin", "Engineer", "Manager"]}><Reports /></ProtectedRoute>} />
          <Route path="/users"     element={<ProtectedRoute allowedRoles={["Admin"]}><Users /></ProtectedRoute>} />
          <Route path="/settings"  element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/profile"        element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/notifications"  element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/audit"          element={<ProtectedRoute allowedRoles={["Admin"]}><AuditLog /></ProtectedRoute>} />
          <Route path="/assign"         element={<ProtectedRoute allowedRoles={["Admin"]}><AssignTRF /></ProtectedRoute>} />
          <Route path="/workspace"      element={<ProtectedRoute allowedRoles={["Admin", "Manager", "Engineer"]}><AssignedWorkspace /></ProtectedRoute>} />
          <Route path="*"               element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <Suspense fallback={<PageLoader />}>
              <Login />
            </Suspense>
          }
        />
        <Route path="/*" element={<Layout><AppRoutes /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}

