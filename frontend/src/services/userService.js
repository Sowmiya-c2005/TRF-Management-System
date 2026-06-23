import API from "./api";

export const login = (username, password) =>
  API.post(`/login?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`);

export const register = (username, password) =>
  API.post(`/register?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`);
