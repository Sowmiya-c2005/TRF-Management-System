import API from "./api";

export const login = (username, password) =>
  API.post("/users/login", { username, password });

export const register = (username, password) =>
  API.post("/users/register", { username, password });

export const getMe = () =>
  API.get("/users/me");

