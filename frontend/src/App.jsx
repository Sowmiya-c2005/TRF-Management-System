import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Layout from "./components/Layout";

// Lazy-loaded pages for code splitting
const Dashboard  = lazy(() => import("./pages/Dashboard"));
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
const Profile        = lazy(() => import('./pages/Profile'));
const Notifications  = lazy(() => import('./pages/Notifications'));
const AuditLog       = lazy(() => import('./pages/AuditLog'));

function PageLoader() {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <CircularProgress size={32} thickness={3} sx={{ color: "#6366f1" }} />
    </Box>
  );
}

import ProtectedRoute from "./components/ProtectedRoute";

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/"          element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/create"    element={<ProtectedRoute allowedRoles={["Admin", "Engineer"]}><CreateTRF /></ProtectedRoute>} />
        <Route path="/search"    element={<ProtectedRoute><SearchTRF /></ProtectedRoute>} />
        <Route path="/all"       element={<ProtectedRoute><AllTRFs /></ProtectedRoute>} />
        <Route path="/upload"    element={<ProtectedRoute allowedRoles={["Admin", "Engineer"]}><UploadFile /></ProtectedRoute>} />
        <Route path="/files"     element={<ProtectedRoute><FileManager /></ProtectedRoute>} />
        <Route path="/update"    element={<ProtectedRoute allowedRoles={["Admin", "Engineer"]}><UpdateTRF /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute allowedRoles={["Admin", "Manager"]}><Analytics /></ProtectedRoute>} />
        <Route path="/reports"   element={<ProtectedRoute allowedRoles={["Admin", "Engineer", "Manager"]}><Reports /></ProtectedRoute>} />
        <Route path="/users"     element={<ProtectedRoute allowedRoles={["Admin"]}><Users /></ProtectedRoute>} />
        <Route path="/settings"  element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/profile"        element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/notifications"  element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/audit"          element={<ProtectedRoute allowedRoles={["Admin"]}><AuditLog /></ProtectedRoute>} />
        <Route path="*"               element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login — full page, no app shell */}
        <Route
          path="/login"
          element={
            <Suspense fallback={<PageLoader />}>
              <Login />
            </Suspense>
          }
        />
        {/* All other routes — wrapped in Layout */}
        <Route path="/*" element={<Layout><AppRoutes /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}

