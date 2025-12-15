// CleenGo-Front/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    VITE_BACKEND_URL: process.env.VITE_BACKEND_URL,
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
  },
};

export default nextConfig;
