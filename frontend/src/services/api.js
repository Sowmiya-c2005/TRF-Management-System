import axios from "axios";

// Determine the base API URL dynamically based on environment
let rawBaseUrl = import.meta.env.VITE_API_URL;
if (!rawBaseUrl) {
  // If no environment variable is provided, check if we are in production on Render/same host
  rawBaseUrl = window.location.origin.includes("localhost") || window.location.origin.includes("127.0.0.1")
    ? "http://127.0.0.1:8000/api"
    : "/api";
} else {
  // Ensure the base URL ends with /api if it doesn't already
  if (!rawBaseUrl.endsWith("/api") && !rawBaseUrl.endsWith("/api/")) {
    // Remove trailing slash if present before appending
    const normalized = rawBaseUrl.endsWith("/") ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
    rawBaseUrl = `${normalized}/api`;
  }
}

export const BASE_API_URL = rawBaseUrl;

const API = axios.create({
  baseURL: BASE_API_URL,
  timeout: 15000,
});

// ── Request interceptor: attach auth token if present ──────────────────────
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: surface error messages cleanly ───────────────────
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.message ||
      "An unexpected error occurred";
    return Promise.reject(new Error(message));
  }
);

export default API;
