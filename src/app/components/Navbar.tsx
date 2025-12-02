"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/app/contexts/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  const role = user?.role;

  return (
    <nav className="w-full bg-white shadow-md fixed top-0 left-0 flex items-center justify-between px-8 py-4 z-50 border-b border-gray-100">
      {/* Logo */}
      <Link href="/client/home" className="flex items-center gap-2">
        <Image
          src="/logo-horizontal.svg"
          alt="CleenGo Logo"
          width={180}
          height={60}
          className="h-12 w-auto"
        />
      </Link>

      {/* ------------------- */}
      {/* GUEST NAVBAR       */}
      {/* ------------------- */}
      {!user && (
        <div className="flex items-center gap-8">
          <Link
            href="/inicio"
            className="text-gray-700 font-medium hover:text-teal-500 transition"
          >
            Inicio
          </Link>
          <Link
            href="/client/providers"
            className="text-gray-700 font-medium hover:text-teal-500 transition"
          >
            Proveedores
          </Link>
          <Link
            href="/suscripcion"
            className="text-gray-700 font-medium hover:text-teal-500 transition"
          >
            Suscripción
          </Link>
          <Link
            href="/blog"
            className="text-gray-700 font-medium hover:text-teal-500 transition"
          >
            Blog
          </Link>

          {/* Login button */}
          <Link
            href="/login"
            className="bg-teal-500 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-teal-600 transition shadow-sm"
          >
            Iniciar Sesión
          </Link>
        </div>
      )}

      {/* ------------------- */}
      {/* CLIENTE NAVBAR     */}
      {/* ------------------- */}
      {user && role === "client" && (
        <div className="flex items-center gap-6">
          <Link href="/client/home" className="text-gray-700 font-medium hover:text-teal-500 transition">
            Inicio
          </Link>
          <Link
            href="/client/providers"
            className="text-gray-700 font-medium hover:text-teal-500 transition"
          >
            Proveedores
          </Link>
          <Link
            href="/suscripcion"
            className="text-gray-700 font-medium hover:text-teal-500 transition"
          >
            Suscripción
          </Link>
          <Link
            href="/blog"
            className="text-gray-700 font-medium hover:text-teal-500 transition"
          >
            Blog
          </Link>

          {/* Clipboard icon - Appointments */}
          <Link
            href="/client/appointments"
            className="relative text-gray-700 hover:text-teal-500 transition"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
            <span className="absolute -top-2 -right-2 bg-teal-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              0
            </span>
          </Link>

          {/* User profile */}
          <Link
            href="/client/profile"
            className="text-gray-700 hover:text-teal-500 transition"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clipRule="evenodd"
              />
            </svg>
          </Link>

          {/* User greeting */}
          <span className="text-gray-700 font-medium">
            ¡Hola,{" "}
            <span className="text-teal-500 font-semibold">{user.name}</span>!
          </span>

          {/* Logout button */}
          <button
            onClick={logout}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition"
          >
            Cerrar Sesión
          </button>
        </div>
      )}

      {/* ------------------- */}
      {/* PROVEEDOR NAVBAR   */}
      {/* ------------------- */}
      {user && role === "provider" && (
        <div className="flex items-center gap-6">
          <Link href="/provider/dashboard" className="text-gray-700 font-medium hover:text-teal-500 transition">
            Dashboard
          </Link>
          <Link
            href="/client/providers"
            className="text-gray-700 font-medium hover:text-teal-500 transition"
          >
            Proveedores
          </Link>
          <Link
            href="/suscripcion"
            className="text-gray-700 font-medium hover:text-teal-500 transition"
          >
            Suscripción
          </Link>
          <Link
            href="/blog"
            className="text-gray-700 font-medium hover:text-teal-500 transition"
          >
            Blog
          </Link>

          {/* Clipboard icon */}
          <Link
            href="/provider/appointments"
            className="text-gray-700 hover:text-teal-500 transition"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </Link>

          {/* User profile */}
          <Link
            href="/provider/profile"
            className="text-gray-700 hover:text-teal-500 transition"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clipRule="evenodd"
              />
            </svg>
          </Link>

          {/* User greeting */}
          <span className="text-gray-700 font-medium">
            ¡Hola,{" "}
            <span className="text-teal-500 font-semibold">{user.name}</span>!
          </span>

          {/* Logout button */}
          <button
            onClick={logout}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition"
          >
            Cerrar Sesión
          </button>
        </div>
      )}
    </nav>
  );
}