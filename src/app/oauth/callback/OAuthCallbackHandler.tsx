"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../services/supabaseClient";
import { thirdPartyLogin } from "../../services/auth";
import { useAuth } from "../../contexts/AuthContext"; // ✅ NUEVO

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth(); // ✅ NUEVO

  const role = (searchParams.get("role") as "client" | "provider") || "client";

  useEffect(() => {
    const processOAuthLogin = async () => {
      try {
        console.log("➡️ Entró a OAuthCallbackPage (Next)");
        console.log("➡️ role =>", role);
        if (typeof window === "undefined") return;

        console.log("➡️ location.href =>", window.location.href);
        console.log("➡️ location.hash =>", window.location.hash);

        // 1. Intentar sacar access_token del hash de la URL
        let accessToken: string | null = null;

        if (window.location.hash) {
          const hash = window.location.hash.replace("#", "");
          const hashParams = new URLSearchParams(hash);
          accessToken = hashParams.get("access_token");
        }

        console.log("➡️ accessToken desde hash =>", accessToken);

        // 2. Si no hay token en el hash, usar getSession() como respaldo
        if (!accessToken) {
          const { data, error } = await supabase.auth.getSession();
          console.log("➡️ getSession() data =>", data);
          console.log("➡️ getSession() error =>", error);

          if (!error && data.session) {
            accessToken = data.session.access_token;
          }
        }

        if (!accessToken) {
          console.error(
            "⛔ No se encontró accessToken ni en hash ni en sesión"
          );
          alert("No se pudo obtener el token de Google/Supabase.");
          router.push("/login");
          return;
        }

        // 3. Obtener info básica del usuario desde Supabase
        const { data: userData, error: userError } =
          await supabase.auth.getUser(accessToken);

        if (userError || !userData?.user) {
          console.error("⛔ Error al obtener usuario de Supabase:", userError);
          alert("Error al validar usuario en Supabase.");
          router.push("/login");
          return;
        }

        const supaUser = userData.user;

        const body = {
          accessToken,
          name:
            supaUser.user_metadata?.name ||
            supaUser.user_metadata?.full_name ||
            null,
          surname: supaUser.user_metadata?.surname ?? null,
          phone: supaUser.user_metadata?.phone ?? null,
          profileImgUrl: supaUser.user_metadata?.avatar_url ?? null,
        };

        console.log("➡️ Body enviado al back =>", body);

        // 4. Llamar al back (mismo cliente http que login/register)
        const dataBack = await thirdPartyLogin(role, body);
        console.log("✅ Data back =>", dataBack);

        // ✅ Actualizar contexto de autenticación (y localStorage desde AuthContext)
        login(dataBack.user, dataBack.accessToken);

        // Limpiar hash de la URL
        window.history.replaceState({}, document.title, "/");

        // Redirección según rol
        if (role === "client") {
          router.push("/");
        } else {
          router.push("/dashboard/provider");
        }
      } catch (err) {
        console.error("⛔ Error en OAuthCallback (Next):", err);
        alert("Error inesperado en autenticación.");
        router.push("/login");
      }
    };

    processOAuthLogin();
  }, [router, role, login]); // ✅ login en deps

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-700">
      <div className="bg-white shadow-md rounded-xl p-6 text-center w-80">
        <h2 className="text-lg font-semibold mb-2">Conectando con Google…</h2>
        <p className="text-sm text-gray-500">Por favor espera unos segundos.</p>
      </div>
    </div>
  );
}
