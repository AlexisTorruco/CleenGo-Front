'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

// Iconos SVG
const UsersIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-8 w-8"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const BriefcaseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-8 w-8"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

export default function RegisterRolePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="bg-white shadow-lg rounded-2xl p-10 border border-gray-100">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Image
              src="/logo-cleengo.svg"
              alt="CleenGo Logo"
              width={220}
              height={60}
              className="object-contain"
            />
          </div>

          <h1 className="text-3xl font-bold text-center text-gray-800 mb-3">
            ¿Cómo deseas registrarte?
          </h1>
          <p className="text-center text-gray-500 mb-10">
            Selecciona el tipo de cuenta que deseas crear
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Botón Cliente */}
            <button
              onClick={() => router.push('/register/client')}
              className="group relative overflow-hidden bg-gradient-to-br from-[#14B8A6] to-[#0D9488] hover:from-[#0F9B8E] hover:to-[#0A7C73] text-white p-8 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="relative z-10 flex flex-col items-center gap-4">
                <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm">
                  <UsersIcon />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Soy Cliente</h2>
                  <p className="text-white/90 text-sm">Busco servicios de limpieza profesional</p>
                </div>
              </div>

              {/* Efecto hover */}
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            </button>

            {/* Botón Proveedor */}
            <button
              onClick={() => router.push('/register/provider')}
              className="group relative overflow-hidden bg-gradient-to-br from-[#3B82F6] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] text-white p-8 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="relative z-10 flex flex-col items-center gap-4">
                <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm">
                  <BriefcaseIcon />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Soy Proveedor</h2>
                  <p className="text-white/90 text-sm">Ofrezco servicios de limpieza profesional</p>
                </div>
              </div>

              {/* Efecto hover */}
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            </button>
          </div>

          {/* Links de navegación */}
          <div className="mt-8 flex flex-col items-center gap-4">
            <Link
              href="/login"
              className="text-[#14B8A6] hover:text-[#0F9B8E] transition-colors text-sm font-medium"
            >
              ← Volver al inicio de sesión
            </Link>

            <p className="text-sm text-gray-600">
              ¿Ya tienes cuenta?{' '}
              <Link
                href="/login"
                className="text-[#14B8A6] font-semibold hover:text-[#0F9B8E] transition-colors"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
