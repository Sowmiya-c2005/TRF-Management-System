/**
 * userService.js
 * ──────────────────────────────────────────────────────────────────────────
 * Handles authentication via the new /users/login endpoint which returns
 * a JWT token. Falls back to the legacy /login endpoint if the new one fails
 * (for compatibility with environments that haven't run migrations).
 */
import API from "./api";

/**
 * Login — tries /users/login (JSON body, returns JWT) first.
 * Falls back to legacy /login?username=&password= if the new endpoint fails.
 */
export const login = async (username, password) => {
  try {
    // Try new endpoint first (returns { token, role, username, ... })
    const res = await API.post("/users/login", { username, password });
    return res;
  } catch (err) {
    // If new endpoint fails (404 or validation error), try legacy
    if (err?.response?.status === 404 || err?.response?.status === 422) {
      return API.post(
        `/login?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
      );
    }
    throw err;
  }
};

/**
 * Register — tries /users/register first, falls back to legacy /register.
 */
export const register = async (username, password) => {
  try {
    return await API.post("/users/register", { username, password });
  } catch (err) {
    if (err?.response?.status === 404 || err?.response?.status === 422) {
      return API.post(
        `/register?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
      );
    }
    throw err;
  }
};

/**
 * Get current user profile (requires token in localStorage).
 */
export const getMe = () => API.get("/users/me");
