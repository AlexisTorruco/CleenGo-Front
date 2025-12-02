"use client";

import Link from "next/link";
import { AuthProvider } from "../../contexts/AuthContext";
import Navbar from "../../components/Navbar";

export default function ClientHomePage() {
    return (
        <AuthProvider>
            <Navbar />

            {/* Hero Section - Fondo azul con gradiente */}
            <div className="min-h-screen bg-gradient-to-br from-[#0A65FF] via-[#1E73FF] to-[#3D8AFF] text-white flex items-center justify-center px-4">
                <div className="max-w-4xl mx-auto text-center text-white">

                    {/* Logo Card */}
                    <div className="bg-white/20 backdrop-blur-lg rounded-3xl p-8 mb-8 border border-white/30 inline-block shadow-2xl transform hover:scale-105 transition-transform">
                        <div className="flex items-center gap-4">
                            {/* SVG Icon - Carita feliz */}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="80" height="80">
                                <defs>
                                    <linearGradient id="bloopGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#8EDAF2" />
                                        <stop offset="100%" stopColor="#66C3E6" />
                                    </linearGradient>
                                </defs>

                                {/* Círculo principal (cara) */}
                                <circle cx="80" cy="80" r="70" fill="url(#bloopGradient)" stroke="#0c3055" strokeWidth="4" />

                                {/* Ojo izquierdo */}
                                <circle cx="60" cy="70" r="8" fill="#0c3055" />

                                {/* Ojo derecho */}
                                <circle cx="100" cy="70" r="8" fill="#0c3055" />

                                {/* Sonrisa */}
                                <path d="M 50 90 Q 80 110 110 90" fill="none" stroke="#0c3055" strokeWidth="6" strokeLinecap="round" />
                            </svg>

                            <div className="text-left">
                                <h1 className="text-4xl font-bold">
                                    <span className="text-[#0c3055]">Cleen</span>
                                    <span className="text-[#22C55E]">Go</span>
                                </h1>
                                <p className="text-white/80 text-sm">Limpieza Profesional</p>
                            </div>
                        </div>
                    </div>

                    {/* Main Heading */}
                    <h2 className="text-5xl lg:text-6xl font-bold mb-6">
                        ¡Bienvenido a<br />
                        <span className="text-[#0c3055]">Cleen</span>
                        <span className="text-[#22C55E]">Go</span>!
                    </h2>

                    {/* Description */}
                    <p className="text-xl lg:text-2xl text-white/90 mb-12 leading-relaxed max-w-3xl mx-auto">
                        La plataforma que conecta a quienes necesitan servicios de limpieza
                        profesional con los mejores proveedores. <span className="font-semibold">Rápido, confiable y
                            transparente.</span>
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-wrap gap-4 justify-center">
                        <Link
                            href="/client/providers"  // 👈 hice esto para que redirija a los proveedores mockeados
                            className="bg-white text-[#4A90E2] px-10 py-4 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl text-lg flex items-center gap-2 group"
                        >
                            Contratar Servicio
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>

                    </div>
                </div>
            </div>

            {/* Sección ¿Cómo funciona? */}
            <div className="bg-gray-50 py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    {/* Section Header */}
                    <div className="text-center mb-16">
                        <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                            ¿Cómo funciona?
                        </h2>
                        <p className="text-xl text-gray-600">
                            Proceso simple en 3 pasos
                        </p>
                    </div>

                    {/* Cards Grid */}
                    <div className="grid lg:grid-cols-2 gap-8">
                        {/* Card Para Clientes */}
                        <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                            {/* Badge */}
                            <div className="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-full mb-6">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                </svg>
                                <span className="font-semibold">Para Clientes</span>
                            </div>

                            {/* Steps */}
                            <div className="space-y-6">
                                {/* Step 1 */}
                                <div className="flex items-start gap-4">
                                    <div className="bg-blue-500 text-white rounded-2xl w-14 h-14 flex items-center justify-center flex-shrink-0">
                                        <span className="text-xl font-bold">01</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">Calcula el costo</h3>
                                        <p className="text-gray-600">Usa nuestra calculadora inteligente</p>
                                    </div>
                                </div>

                                {/* Step 2 */}
                                <div className="flex items-start gap-4">
                                    <div className="bg-blue-500 text-white rounded-2xl w-14 h-14 flex items-center justify-center flex-shrink-0">
                                        <span className="text-xl font-bold">02</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">Elige tu proveedor</h3>
                                        <p className="text-gray-600">Revisa perfiles y calificaciones</p>
                                    </div>
                                </div>

                                {/* Step 3 */}
                                <div className="flex items-start gap-4">
                                    <div className="bg-blue-500 text-white rounded-2xl w-14 h-14 flex items-center justify-center flex-shrink-0">
                                        <span className="text-xl font-bold">03</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">Disfruta del servicio</h3>
                                        <p className="text-gray-600">Tu espacio limpio y reluciente</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card Para Proveedores */}
                        <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                            {/* Badge */}
                            <div className="inline-flex items-center gap-2 bg-cyan-500 text-white px-4 py-2 rounded-full mb-6">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                                    <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                                </svg>
                                <span className="font-semibold">Para Proveedores</span>
                            </div>

                            {/* Steps */}
                            <div className="space-y-6">
                                {/* Step 1 */}
                                <div className="flex items-start gap-4">
                                    <div className="bg-cyan-500 text-white rounded-2xl w-14 h-14 flex items-center justify-center flex-shrink-0">
                                        <span className="text-xl font-bold">01</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">Crea tu perfil</h3>
                                        <p className="text-gray-600">Muestra tu experiencia y servicios</p>
                                    </div>
                                </div>

                                {/* Step 2 */}
                                <div className="flex items-start gap-4">
                                    <div className="bg-cyan-500 text-white rounded-2xl w-14 h-14 flex items-center justify-center flex-shrink-0">
                                        <span className="text-xl font-bold">02</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">Recibe solicitudes</h3>
                                        <p className="text-gray-600">Los clientes te contactan directamente</p>
                                    </div>
                                </div>

                                {/* Step 3 */}
                                <div className="flex items-start gap-4">
                                    <div className="bg-cyan-500 text-white rounded-2xl w-14 h-14 flex items-center justify-center flex-shrink-0">
                                        <span className="text-xl font-bold">03</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">Genera ingresos</h3>
                                        <p className="text-gray-600">Trabaja según tu disponibilidad</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthProvider>
    );
}