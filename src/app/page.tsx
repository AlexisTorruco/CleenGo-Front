"use client";

import Image from "next/image";
import Link from "next/link";
import { AuthProvider } from "./contexts/AuthContext";

export default function LandingPage() {
  return (
    <AuthProvider>
      {/* Hero Section */}
      <div className="min-h-screen bg-linear-to-br from-[#0A65FF] via-[#1E73FF] to-[#3D8AFF] text-white px-4 pt-32 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-sm font-medium">
                  La mejor plataforma de limpieza en Latinoamérica
                </span>
              </div>

              {/* Main Heading */}
              <div>
                <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-4">
                  Tu hogar
                  <br />
                  brillante y limpio
                </h1>
                <p className="text-xl text-white/90 leading-relaxed">
                  Conectamos a clientes con los mejores profesionales de
                  limpieza.
                  <br />
                  Rápido, confiable y al mejor precio.{" "}
                  <span className="font-semibold">¡Agenda en minutos!</span>
                </p>
              </div>

              {/* Buttons */}
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/register"
                  className="bg-white text-[#0A65FF] px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 group"
                >
                  Registrarse
                  <svg
                    className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </Link>
                <Link
                  href="/client/providers"
                  className="bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/20 transition-all border border-white/30"
                >
                  Ver proveedores
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold">10K+</div>
                  <div className="text-sm text-white/80">Usuarios</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <svg
                      className="w-8 h-8"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold">4.9</div>
                  <div className="text-sm text-white/80">Rating</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold">24/7</div>
                  <div className="text-sm text-white/80">Soporte</div>
                </div>
              </div>
            </div>

            {/* Right Column - Cards */}
            <div className="relative">
              {/* Testimonios Card */}
              <div className="bg-white text-gray-800 rounded-2xl p-6 shadow-2xl mb-6 transform hover:scale-105 transition-transform">
                <div className="flex items-start gap-4">
                  <div className="bg-[#0A65FF] rounded-xl p-3">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1 mb-2">
                      <span className="font-bold text-lg">
                        Servicio Premium
                      </span>
                    </div>
                    <div className="flex gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className="w-5 h-5 text-yellow-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-gray-600 leading-relaxed mb-3">
                      &quot;¡Excelente servicio! Mi casa quedó impecable.
                      Totalmente recomendado.&quot;
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Card */}
              <div className="bg-linear-to-br from-[#2CC9C9] to-[#1E9B9B] text-white rounded-2xl p-8 shadow-2xl transform hover:scale-105 transition-transform">
                <div className="flex items-center justify-center mb-4">
                  <svg
                    className="w-16 h-16"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-bold mb-2">85%</div>
                  <div className="text-xl font-semibold">
                    Clientes satisfechos
                  </div>
                </div>
              </div>

              {/* Verification Badge elementos visuales */}
              <div className="bg-white text-gray-800 rounded-2xl p-6 shadow-2xl mt-6 transform hover:scale-105 transition-transform">
                <div className="flex items-center gap-4">
                  <div className="bg-[#2CC9C9] rounded-xl p-3">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="font-bold text-lg">Verificado</div>
                    <div className="text-gray-500">+500 servicios</div>
                    <div className="flex gap-2 mt-2">
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                        Profesional
                      </span>
                      <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium">
                        Rápido
                      </span>
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                        Confiable
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CleenGo Section */}
      <div className="bg-gray-50 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              ¿Por qué elegir{" "}
              <span className="text-[#0c3055]">
                Cleen<span className="text-[#22C55E]">Go</span>
              </span>
              ?
            </h2>
            <p className="text-xl text-gray-600">
              Más que una plataforma, somos tu aliado en limpieza
            </p>
          </div>

          {/* Features tarjetas */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 - Rápido y Fácil */}
            <div className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="bg-linear-to-br from-[#0A65FF] to-[#3D8AFF] rounded-2xl w-16 h-16 flex items-center justify-center mb-6">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Rápido y Fácil
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Agenda tu servicio en menos de 5 minutos
              </p>
            </div>

            {/* Feature 2 - 100% Verificado */}
            <div className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="bg-linear-to-br from-[#2CC9C9] to-[#1E9B9B] rounded-2xl w-16 h-16 flex items-center justify-center mb-6">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                100% Verificado
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Todos los proveedores pasan verificación rigurosa
              </p>
            </div>

            {/* Feature 3 - Mejor Precio */}
            <div className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="bg-linear-to-br from-[#5B5FFF] to-[#3D41CC] rounded-2xl w-16 h-16 flex items-center justify-center mb-6">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Mejor Precio
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Compara y elige la mejor opción para ti
              </p>
            </div>

            {/* Feature 4 - Calidad Garantizada */}
            <div className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="bg-linear-to-br from-[#0A65FF] to-[#3D8AFF] rounded-2xl w-16 h-16 flex items-center justify-center mb-6">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Calidad Garantizada
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Satisfacción garantizada o te devolvemos tu dinero
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Steps Section */}
      <div className="bg-linear-to-br from-gray-50 to-blue-50 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              3 pasos para tu hogar limpio
            </h2>
            <p className="text-xl text-gray-600">
              Así de simple es usar CleenGo
            </p>
          </div>

          {/* Steps Grid */}
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector Lines */}
            <div
              className="hidden md:block absolute top-32 left-1/4 right-1/4 h-1 bg-linear-to-r from-[#0A65FF] to-[#2CC9C9]"
              style={{ width: "calc(50% - 2rem)", left: "calc(25% + 2rem)" }}
            ></div>
            <div
              className="hidden md:block absolute top-32 right-1/4 h-1 bg-linear-to-r from-[#0A65FF] to-[#2CC9C9]"
              style={{ width: "calc(25% - 2rem)", left: "calc(50% + 2rem)" }}
            ></div>

            {/* Step 1 - Calcula tu servicio */}
            <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 relative">
              <div className="relative mb-6">
                <div className="bg-linear-to-br from-[#0A65FF] to-[#3D8AFF] rounded-full w-24 h-24 flex items-center justify-center mx-auto">
                  <svg
                    className="w-12 h-12 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg border-2 border-[#0A65FF]">
                  <span className="text-[#0A65FF] font-bold text-lg">1</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">
                Calcula tu servicio
              </h3>
              <p className="text-gray-600 leading-relaxed text-center">
                Ingresa los detalles de tu espacio y selecciona los servicios
                que necesitas
              </p>
            </div>

            {/* Step 2 - Elige tu proveedor */}
            <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 relative">
              <div className="relative mb-6">
                <div className="bg-linear-to-br from-[#0A65FF] to-[#3D8AFF] rounded-full w-24 h-24 flex items-center justify-center mx-auto">
                  <svg
                    className="w-12 h-12 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg border-2 border-[#0A65FF]">
                  <span className="text-[#0A65FF] font-bold text-lg">2</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">
                Elige tu proveedor
              </h3>
              <p className="text-gray-600 leading-relaxed text-center">
                Revisa perfiles, calificaciones y elige al profesional ideal
                para ti
              </p>
            </div>

            {/* Step 3 - ¡Listo! Disfruta */}
            <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 relative">
              <div className="relative mb-6">
                <div className="bg-linear-to-br from-[#0A65FF] to-[#3D8AFF] rounded-full w-24 h-24 flex items-center justify-center mx-auto">
                  <svg
                    className="w-12 h-12 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                    />
                  </svg>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg border-2 border-[#0A65FF]">
                  <span className="text-[#0A65FF] font-bold text-lg">3</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">
                ¡Listo! Disfruta
              </h3>
              <p className="text-gray-600 leading-relaxed text-center">
                Relájate mientras tu espacio queda impecable y brillante
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section - Ready to Start */}
      <div className="bg-linear-to-br from-[#0A65FF] via-[#1E73FF] to-[#2CC9C9] py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Icon */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center">
              <svg
                className="w-20 h-20 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            ¿Listo para empezar?
          </h2>

          {/* Subtitle */}
          <p className="text-xl text-white/90 mb-10 leading-relaxed">
            Miles de clientes satisfechos ya confían en nosotros. ¡Únete hoy
            <br />y obtén un descuento especial!
          </p>

          {/* Buttons */}
          <div className="flex flex-wrap gap-4 justify-center mb-12">
            <Link
              href="/register"
              className="bg-white text-[#0A65FF] px-10 py-4 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl text-lg flex items-center gap-2 group"
            >
              Comenzar ahora
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
            <Link
              href="/login"
              className="bg-transparent text-white px-10 py-4 rounded-xl font-bold hover:bg-white/10 transition-all border-2 border-white text-lg"
            >
              Ver precios
            </Link>
          </div>

          {/* Features */}
          <div className="flex flex-wrap justify-center gap-8 text-white">
            <div className="flex items-center gap-2">
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="font-medium">Sin compromiso</span>
            </div>
            <div className="flex items-center gap-2">
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
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <span className="font-medium">Pago seguro</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-medium">Garantía total</span>
            </div>
            <div className="flex items-center gap-2">
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="font-medium">Soporte 24/7</span>
            </div>
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}
