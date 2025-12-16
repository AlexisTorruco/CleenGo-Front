"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useAuth } from "@/app/contexts/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const role = user?.role;

  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Marcamos cuando el componente ya se montó en el cliente
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Valores "seguros" para SSR + cliente
  const effectiveUser = isMounted ? user : null;
  const effectiveRole = isMounted ? role : undefined;

  // Cerrar menú cuando se hace click en algún link
  const handleMenuItemClick = () => {
    setIsOpen(false);
  };

  // Logout que también cierra el menú
  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  return (
    <nav className="w-full bg-white shadow-md fixed top-0 left-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2"
          onClick={handleMenuItemClick}
        >
          <Image
            src="/logo-horizontal.svg"
            alt="CleenGo Logo"
            width={180}
            height={60}
            className="h-12 w-auto"
            priority
          />
        </Link>

        {/* Hamburger button - Mobile */}
        <div className="lg:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-700 hover:text-teal-500 focus:outline-none"
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
                d={
                  isOpen
                    ? "M6 18L18 6M6 6l12 12"
                    : "M4 6h16M4 12h16M4 18h16"
                }
              />
            </svg>
          </button>
        </div>

        {/* Menu */}
        <div
          className={`lg:flex lg:items-center lg:gap-6 ${
            isOpen
              ? "flex flex-col w-full mt-4 space-y-4 bg-white p-4 rounded-lg shadow-lg absolute top-16 left-0 lg:static lg:shadow-none lg:p-0"
              : "hidden lg:flex"
          }`}
        >
          {/* ------------------- */}
          {/* GUEST NAVBAR       */}
          {/* ------------------- */}
          {!effectiveUser ? (
            <div className="flex flex-col lg:flex-row lg:items-center lg:gap-6 gap-3 w-full">
              <Link
                href="/client/home"
                onClick={handleMenuItemClick}
                className="text-gray-700 font-medium hover:text-teal-500 transition"
              >
                Inicio
              </Link>
              <Link
                href="/client/providers"
                onClick={handleMenuItemClick}
                className="text-gray-700 font-medium hover:text-teal-500 transition"
              >
                Proveedores
              </Link>
              <Link
                href="/subscriptions"
                onClick={handleMenuItemClick}
                className="text-gray-700 font-medium hover:text-teal-500 transition"
              >
                Suscripción
              </Link>
              <Link
                href="/blog"
                onClick={handleMenuItemClick}
                className="text-gray-700 font-medium hover:text-teal-500 transition"
              >
                Blog
              </Link>
              <Link
                href="/login"
                onClick={handleMenuItemClick}
                className="bg-teal-500 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-teal-600 transition shadow-sm text-center"
              >
                Iniciar Sesión
              </Link>
            </div>
          ) : null}

          {/* ------------------- */}
          {/* CLIENT NAVBAR       */}
          {/* ------------------- */}
          {effectiveUser && effectiveRole === "client" && (
            <div className="flex flex-col lg:flex-row lg:items-center lg:gap-6 gap-3 w-full">
              <Link
                href="/client/home"
                onClick={handleMenuItemClick}
                className="text-gray-700 font-medium hover:text-teal-500 transition text-center"
              >
                Inicio
              </Link>
              <Link
                href="/client/providers"
                onClick={handleMenuItemClick}
                className="text-gray-700 font-medium hover:text-teal-500 transition text-center"
              >
                Proveedores
              </Link>

              <Link
                href="/blog"
                onClick={handleMenuItemClick}
                className="text-gray-700 font-medium hover:text-teal-500 transition text-center"
              >
                Blog
              </Link>
              <Link
                href="/client/appointments"
                onClick={handleMenuItemClick}
                className="relative text-gray-700 hover:text-teal-500 transition text-center"
              >
                <svg
                  className="w-6 h-6 mx-auto"
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
              <Link
                href="/client/profile"
                onClick={handleMenuItemClick}
                className="text-gray-700 hover:text-teal-500 transition text-center"
              >
                <svg
                  className="w-6 h-6 mx-auto"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
              <span className="text-gray-700 font-medium text-center">
                ¡Hola,{" "}
                <span className="text-teal-500 font-semibold">
                  {user?.name}
                </span>
                !
              </span>
              <button
                onClick={handleLogout}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition"
              >
                Cerrar Sesión
              </button>
            </div>
          )}

          {/* ------------------- */}
          {/* PROVIDER NAVBAR     */}
          {/* ------------------- */}
          {effectiveUser && effectiveRole === "provider" && (
            <div className="flex flex-col lg:flex-row lg:items-center lg:gap-6 gap-3 w-full">
              <Link
                href="/client/home"
                onClick={handleMenuItemClick}
                className="text-gray-700 font-medium hover:text-teal-500 transition text-center"
              >
                Inicio
              </Link>
              <Link
                href="/client/providers"
                onClick={handleMenuItemClick}
                className="text-gray-700 font-medium hover:text-teal-500 transition text-center"
              >
                Proveedores
              </Link>
              <Link
                href="/subscriptions"
                onClick={handleMenuItemClick}
                className="text-gray-700 font-medium hover:text-teal-500 transition text-center"
              >
                Suscripción
              </Link>
              <Link
                href="/blog"
                onClick={handleMenuItemClick}
                className="text-gray-700 font-medium hover:text-teal-500 transition text-center"
              >
                Blog
              </Link>
              <Link
                href="/provider/appointments"
                onClick={handleMenuItemClick}
                className="text-gray-700 hover:text-teal-500 transition text-center"
              >
                <svg
                  className="w-6 h-6 mx-auto"
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
              <Link
                href="/provider/profile"
                onClick={handleMenuItemClick}
                className="text-gray-700 hover:text-teal-500 transition text-center"
              >
                <svg
                  className="w-6 h-6 mx-auto"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
              <span className="text-gray-700 font-medium text-center">
                ¡Hola,{" "}
                <span className="text-teal-500 font-semibold">
                  {user?.name}
                </span>
                !
              </span>
              <button
                onClick={handleLogout}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition"
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
