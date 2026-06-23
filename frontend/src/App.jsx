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
const Profile    = lazy(() => import("./pages/Profile"));

function PageLoader() {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <CircularProgress size={32} thickness={3} sx={{ color: "#6366f1" }} />
    </Box>
  );
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/"          element={<Dashboard />} />
        <Route path="/create"    element={<CreateTRF />} />
        <Route path="/search"    element={<SearchTRF />} />
        <Route path="/all"       element={<AllTRFs />} />
        <Route path="/upload"    element={<UploadFile />} />
        <Route path="/files"     element={<FileManager />} />
        <Route path="/update"    element={<UpdateTRF />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/reports"   element={<Reports />} />
        <Route path="/users"     element={<Users />} />
        <Route path="/settings"  element={<Settings />} />
        <Route path="/profile"   element={<Profile />} />
        <Route path="*"          element={<Navigate to="/" replace />} />
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
