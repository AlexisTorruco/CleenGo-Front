// src/app/services/http.ts
import axios from "axios";

function normalizeBaseURL(url?: string) {
  const base = (url || "http://localhost:3000").trim();
  // quita slash final para evitar // en endpoints
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

export const http = axios.create({
  baseURL: normalizeBaseURL(process.env.VITE_BACKEND_URL),
  withCredentials: true,
});
