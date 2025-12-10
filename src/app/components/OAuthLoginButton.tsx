// src/app/components/ui/OAuthLoginButton.tsx

"use client";

import { supabase } from "../../app/services/supabaseClient";

interface OAuthLoginButtonProps {
  role: "client" | "provider";
}

export default function OAuthLoginButton({ role }: OAuthLoginButtonProps) {
  const googleLogo = "https://www.svgrepo.com/show/475656/google-color.svg";

  const handleGoogleLogin = async () => {
    // 👉 1) guardar el rol que eligió el usuario
    if (typeof window !== "undefined") {
      window.localStorage.setItem("oauthRole", role);
    }

    // 👉 2) construir el redirect como ya lo tenías
    const redirectURL = `${window.location.origin}/oauth/callback?role=${role}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectURL,
      },
    });

    if (error) alert("Error al iniciar con Google");
  };

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      className="w-full border px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-100 transition"
    >
      <img src={googleLogo} className="w-5 h-5" />
      Continuar con Google
    </button>
  );
}
