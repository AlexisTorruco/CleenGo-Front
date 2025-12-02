"use client";

import { useState, FormEvent, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { login } from "../services/auth";
import OAuthLoginButton from "./OAuthLoginButton";
import { useAuth } from "../contexts/AuthContext";
import Swal from "sweetalert2";

// Iconos SVG para ver / ocultar contraseña (como en registro)
const EyeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4"
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
    className="h-4 w-4"
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

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const { login: loginContext } = useAuth();

  // 🔵 VALIDACIÓN DINÁMICA DEL EMAIL
  const isEmailValid = useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, [email]);

  // 🔵 VALIDACIONES DINÁMICAS PASSWORD
  const passwordRules = useMemo(() => {
    return {
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    };
  }, [password]);

  const allValid = Object.values(passwordRules).every(Boolean);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError("");

    try {
      const res = await login({ email, password });
      loginContext(res.user, res.accessToken);

      await Swal.fire({
        icon: "success",
        title: "Inicio de sesión exitoso",
        text: res?.message || "Bienvenido/a a CleenGo",
        confirmButtonText: "Continuar",
      });

      router.push("/");
    } catch (err: any) {
      const message = err?.response?.data?.message || "Credenciales no válidas";

      setLoginError(message);

      await Swal.fire({
        icon: "error",
        title: "Error al iniciar sesión",
        text: message,
        confirmButtonText: "Cerrar",
      });
    }
  };

  // Reglas con estilo más neutro (gris) y pequeño
  const renderRule = (ok: boolean, text: string) => (
    <p
      className={`text-xs flex items-center gap-2 ${
        ok ? "text-green-600" : "text-gray-500"
      }`}
      key={text}
    >
      <span className="font-medium text-sm">{ok ? "✔" : "•"}</span>
      {text}
    </p>
  );

  return (
    <div className="bg-white shadow-md rounded-xl p-8 w-full max-w-sm">
      <div className="flex justify-center mb-4">
        <Image
          src="/logo-cleengo.svg"
          alt="Logo"
          width={250}
          height={250}
          className="object-contain"
        />
      </div>

      <h2 className="text-2xl font-semibold text-center mb-6">
        Iniciar Sesión
      </h2>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        {/* EMAIL */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Correo electrónico
          </label>
          <input
            type="email"
            placeholder="ejemplo@correo.com"
            className={`w-full border rounded-lg px-3 py-2
              focus:outline-none focus:ring-2
              ${
                email.length === 0
                  ? "border-gray-300"
                  : isEmailValid
                  ? "border-green-500 focus:ring-green-400"
                  : "border-red-500 focus:ring-red-400"
              }
            `}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {email.length > 0 && !isEmailValid && (
            <p className="text-red-500 text-xs mt-1">Correo inválido</p>
          )}
        </div>

        {/* PASSWORD */}
        <div>
          <label className="block text-sm font-medium mb-1">Contraseña</label>

          <div
            className={`
              flex items-center rounded-lg px-3 py-2 bg-white border
              ${
                password.length === 0
                  ? "border-gray-300"
                  : allValid
                  ? "border-green-500"
                  : "border-red-500"
              }
            `}
          >
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="flex-1 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="ml-2 text-gray-600 hover:text-black"
              aria-label={
                showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>

          {/* 🔥 VALIDACIONES EN TIEMPO REAL – estilo gris/pro */}
          {password.length > 0 && (
            <div className="mt-2 space-y-0.5">
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

        {/* ERROR DEL LOGIN */}
        {loginError && (
          <p className="text-red-500 text-center text-sm mt-1">{loginError}</p>
        )}

        <button
          type="submit"
          disabled={!isEmailValid || !allValid || !email || !password}
          className="bg-[#0A65FF] text-white font-medium py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50"
        >
          Iniciar Sesión
        </button>
      </form>

      <div className="mt-4">
        <OAuthLoginButton role="client" />
      </div>

      <p className="text-sm text-center mt-4">
        ¿No tienes cuenta?{" "}
        <Link
          href="/register"
          className="text-[#0A65FF] font-medium hover:underline"
        >
          Regístrate aquí
        </Link>
      </p>
    </div>
  );
}
