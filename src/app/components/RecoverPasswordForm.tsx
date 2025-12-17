"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Swal from "sweetalert2";
import { requestPasswordReset } from "../services/auth";

// Icono Mail (mismo estilo que LoginForm)
const MailIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

export default function RecoverPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const isEmailValid = useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, [email]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setLoading(true);

      // Siempre muestra mensaje genérico (seguridad)
      await requestPasswordReset({ email });

      await Swal.fire({
        icon: "success",
        title: "Revisa tu correo",
        text: "Si el email está registrado, te enviamos un enlace para restablecer tu contraseña.",
        confirmButtonText: "Entendido",
      });

      setEmail("");
    } catch (err: any) {
      // Incluso en error, no conviene filtrar info sensible.
      await Swal.fire({
        icon: "error",
        title: "No se pudo enviar el correo",
        text: "Inténtalo de nuevo en unos minutos.",
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
          {/* Logo */}
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
            Recuperar contraseña
          </h2>
          <p className="text-center text-gray-500 mb-8">
            Ingresa tu correo y te enviaremos un enlace para restablecerla
          </p>

          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Correo Electrónico
              </label>

              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <MailIcon />
                </div>

                <input
                  type="email"
                  placeholder="tu@email.com"
                  className={`w-full border rounded-xl px-4 py-3.5 pl-12 text-base
                    focus:outline-none focus:ring-2 transition-all
                    ${
                      email.length === 0
                        ? "border-gray-300 focus:border-[#14B8A6] focus:ring-[#14B8A6]/20"
                        : isEmailValid
                        ? "border-teal-500 focus:border-teal-600 focus:ring-teal-500/20"
                        : "border-red-400 focus:border-red-500 focus:ring-red-400/20"
                    }
                  `}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {email.length > 0 && !isEmailValid && (
                <p className="text-red-500 text-xs mt-1 ml-1">
                  Correo inválido
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!email || !isEmailValid || loading}
              className="w-full h-13 bg-[#14B8A6] hover:bg-[#0F9B8E] text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md text-base py-3.5 mt-2"
            >
              {loading ? "Enviando..." : "Enviar enlace"}
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
