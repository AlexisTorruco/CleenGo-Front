"use client";

import { useEffect } from "react";

export default function OAuthHashRedirect() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash;

    // Si no viene access_token en el hash, no hacemos nada
    if (!hash || !hash.includes("access_token=")) return;

    // Recuperar el rol guardado antes de ir a Google
    const storedRole = window.localStorage.getItem("oauthRole");
    const role = storedRole === "provider" ? "provider" : "client";

    // Limpiamos para no reutilizarlo después
    window.localStorage.removeItem("oauthRole");

    // Mandamos al callback con el mismo hash que trajo Supabase
    const callbackUrl = `${window.location.origin}/oauth/callback?role=${role}${hash}`;

    // Usamos location.href para conservar el hash
    window.location.href = callbackUrl;
  }, []);

  // No renderiza nada
  return null;
}
