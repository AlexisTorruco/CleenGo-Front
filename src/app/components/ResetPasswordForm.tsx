"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Swal from "sweetalert2";
import { resetPassword } from "../services/auth";

// Iconos (mismo estilo que LoginForm)
const EyeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.81 21.81 0 0 1 5.06-6.28" />
    <path d="M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 2.12-.88" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const LockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Leer token de la URL: /reset-password?token=...
  useEffect(() => {
    const t = searchParams.get("token") || "";
    setToken(t);
  }, [searchParams]);

  const passwordRules = useMemo(() => {
    return {
      length: newPassword.length >= 8,
      upper: /[A-Z]/.test(newPassword),
      lower: /[a-z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
      special: /[^A-Za-z0-9]/.test(newPassword),
    };
  }, [newPassword]);

  const allValid = Object.values(passwordRules).every(Boolean);
  const match = newPassword.length > 0 && newPassword === confirmPassword;

  const renderRule = (ok: boolean, text: string) => (
    <p
      className={`text-xs flex items-center gap-2 transition-colors ${
        ok ? "text-teal-600" : "text-gray-400"
      }`}
      key={text}
    >
      <span className={`font-medium text-sm ${ok ? "scale-110" : ""}`}>
        {ok ? "✔" : "•"}
      </span>
      {text}
    </p>
  );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!token) {
      await Swal.fire({
        icon: "error",
        title: "Enlace inválido",
        text: "El token no existe o el enlace está incompleto.",
        confirmButtonText: "Cerrar",
      });
      return;
    }

    if (!allValid) {
      await Swal.fire({
        icon: "warning",
        title: "Contraseña débil",
        text: "Asegúrate de cumplir los requisitos de seguridad.",
        confirmButtonText: "Entendido",
      });
      return;
    }

    if (!match) {
      await Swal.fire({
        icon: "warning",
        title: "No coinciden",
        text: "La confirmación no coincide con la nueva contraseña.",
        confirmButtonText: "Entendido",
      });
      return;
    }

    try {
      setLoading(true);

      await resetPassword({ token, newPassword, confirmPassword });

      await Swal.fire({
        icon: "success",
        title: "Contraseña actualizada",
        text: "Ya puedes iniciar sesión con tu nueva contraseña.",
        confirmButtonText: "Ir a login",
      });

      router.push("/login");
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        "Token inválido/expirado o no se pudo restablecer la contraseña.";

      await Swal.fire({
        icon: "error",
        title: "No se pudo restablecer",
        text: message,
        confirmButtonText: "Cerrar",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        <div className="bg-white shadow-lg rounded-2xl p-10 border border-gray-100">
          <div className="flex justify-center mb-8">
            <Image
              src="/logo-cleengo.svg"
              alt="Logo CleenGo"
              width={200}
              height={60}
              className="object-contain"
            />
          </div>

          <h2 className="text-3xl font-bold text-center mb-3 text-gray-800">
            Restablecer contraseña
          </h2>
          <p className="text-center text-gray-500 mb-8">
            Crea una nueva contraseña para tu cuenta
          </p>

          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            {/* Nueva contraseña */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Nueva contraseña
              </label>

              <div
                className={`
                  flex items-center rounded-xl px-4 py-3.5 bg-white border transition-all
                  ${
                    newPassword.length === 0
                      ? "border-gray-300 focus-within:border-[#14B8A6] focus-within:ring-2 focus-within:ring-[#14B8A6]/20"
                      : allValid
                      ? "border-teal-500 focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-500/20"
                      : "border-red-400 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-400/20"
                  }
                `}
              >
                <div className="text-gray-400 mr-3">
                  <LockIcon />
                </div>

                <input
                  type={showNew ? "text" : "password"}
                  placeholder="••••••••"
                  className="flex-1 outline-none bg-transparent text-base"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />

                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={
                    showNew ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  {showNew ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>

              {newPassword.length > 0 && (
                <div className="mt-3 p-3.5 bg-gray-50 rounded-xl space-y-1">
                  {renderRule(passwordRules.length, "Mínimo 8 caracteres")}
                  {renderRule(passwordRules.upper, "Al menos una MAYÚSCULA")}
                  {renderRule(passwordRules.lower, "Al menos una minúscula")}
                  {renderRule(passwordRules.number, "Al menos un número")}
                  {renderRule(
                    passwordRules.special,
                    "Al menos un símbolo (!@#$%...)"
                  )}
                </div>
              )}
            </div>

            {/* Confirmación */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Confirmar contraseña
              </label>

              <div
                className={`
                  flex items-center rounded-xl px-4 py-3.5 bg-white border transition-all
                  ${
                    confirmPassword.length === 0
                      ? "border-gray-300 focus-within:border-[#14B8A6] focus-within:ring-2 focus-within:ring-[#14B8A6]/20"
                      : match
                      ? "border-teal-500 focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-500/20"
                      : "border-red-400 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-400/20"
                  }
                `}
              >
                <div className="text-gray-400 mr-3">
                  <LockIcon />
                </div>

                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  className="flex-1 outline-none bg-transparent text-base"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />

                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={
                    showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>

              {confirmPassword.length > 0 && !match && (
                <p className="text-red-500 text-xs mt-1 ml-1">
                  Las contraseñas no coinciden
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!token || !allValid || !match || loading}
              className="w-full h-13 bg-[#14B8A6] hover:bg-[#0F9B8E] text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md text-base py-3.5 mt-2"
            >
              {loading ? "Guardando..." : "Restablecer contraseña"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-[#14B8A6] hover:text-[#0F9B8E] transition-colors text-sm font-medium inline-flex items-center gap-1"
            >
              ← Volver a iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
