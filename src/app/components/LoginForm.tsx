'use client';

import { useState, FormEvent, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { login } from '../services/auth';
import OAuthLoginButton from './OAuthLoginButton';
import { useAuth } from '../contexts/AuthContext';
import Swal from 'sweetalert2';

// Iconos SVG
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

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const { login: loginContext, user } = useAuth();

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

  useEffect(() => {
    if (user) {
      router.replace('/client/home'); // o '/'
    }
  }, [user, router]);

  const allValid = Object.values(passwordRules).every(Boolean);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError('');

    try {
      const res = await login({ email, password });
      loginContext(res.user, res.accessToken);
      document.cookie = `token=${res.accessToken}; path=/`;

      Swal.fire({
        icon: 'success',
        title: 'Inicio de sesión exitoso',
        text: res?.message || 'Bienvenido/a a CleenGo',
        confirmButtonText: 'Continuar',
      }).then(() => {
        router.push('/');
      });
      
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const message = error?.response?.data?.message || 'Credenciales no válidas';

      setLoginError(message);

      await Swal.fire({
        icon: 'error',
        title: 'Error al iniciar sesión',
        text: message,
        confirmButtonText: 'Cerrar',
      });
    }
  };

  // Reglas con estilo mejorado
  const renderRule = (ok: boolean, text: string) => (
    <p
      className={`text-xs flex items-center gap-2 transition-colors ${ok ? 'text-teal-600' : 'text-gray-400'
        }`}
      key={text}
    >
      <span className={`font-medium text-sm ${ok ? 'scale-110' : ''}`}>{ok ? '✔' : '•'}</span>
      {text}
    </p>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        <div className="bg-white shadow-lg rounded-2xl p-10 border border-gray-100">
          {/* Logo CleenGo */}
          <div className="flex justify-center mb-8">
            <Image
              src="/logo-cleengo.svg"
              alt="Logo CleenGo"
              width={200}
              height={60}
              className="object-contain"
            />
          </div>

          <h2 className="text-3xl font-bold text-center mb-3 text-gray-800">Iniciar Sesión</h2>
          <p className="text-center text-gray-500 mb-8">Ingresa a tu cuenta de Cleen Go</p>

          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            {/* EMAIL */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <MailIcon />
                </div>
                <input
                  type="email"
                  placeholder="tu@email.com"
                  className={`w-full border rounded-xl px-4 py-3.5 pl-12 text-base
                    focus:outline-none focus:ring-2 transition-all
                    ${email.length === 0
                      ? 'border-gray-300 focus:border-[#14B8A6] focus:ring-[#14B8A6]/20'
                      : isEmailValid
                        ? 'border-teal-500 focus:border-teal-600 focus:ring-teal-500/20'
                        : 'border-red-400 focus:border-red-500 focus:ring-red-400/20'
                    }
                  `}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {email.length > 0 && !isEmailValid && (
                <p className="text-red-500 text-xs mt-1 ml-1">Correo inválido</p>
              )}
            </div>

            {/* PASSWORD */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Contraseña</label>

              <div
                className={`
                  flex items-center rounded-xl px-4 py-3.5 bg-white border transition-all
                  ${password.length === 0
                    ? 'border-gray-300 focus-within:border-[#14B8A6] focus-within:ring-2 focus-within:ring-[#14B8A6]/20'
                    : allValid
                      ? 'border-teal-500 focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-500/20'
                      : 'border-red-400 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-400/20'
                  }
                `}
              >
                <div className="text-gray-400 mr-3">
                  <LockIcon />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="flex-1 outline-none bg-transparent text-base"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>

              {/* 🔥 VALIDACIONES EN TIEMPO REAL */}
              {password.length > 0 && (
                <div className="mt-3 p-3.5 bg-gray-50 rounded-xl space-y-1">
                  {renderRule(passwordRules.length, 'Mínimo 8 caracteres')}
                  {renderRule(passwordRules.upper, 'Al menos una MAYÚSCULA')}
                  {renderRule(passwordRules.lower, 'Al menos una minúscula')}
                  {renderRule(passwordRules.number, 'Al menos un número')}
                  {renderRule(passwordRules.special, 'Al menos un símbolo (!@#$%...)')}
                </div>
              )}
            </div>

            {/* ERROR DEL LOGIN */}
            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={!isEmailValid || !allValid || !email || !password}
              className="w-full h-13 bg-[#14B8A6] hover:bg-[#0F9B8E] text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md text-base py-3.5 mt-2"
            >
              Iniciar Sesión
            </button>
          </form>

          <div className="mt-6">
            <OAuthLoginButton role="client" />
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-[#14B8A6] hover:text-[#0F9B8E] transition-colors text-sm font-medium inline-flex items-center gap-1"
            >
              ← Volver al inicio
            </Link>
          </div>

          <p className="text-sm text-center mt-6 text-gray-600">
            ¿No tienes cuenta?{' '}
            <Link
              href="/register"
              className="text-[#14B8A6] font-semibold hover:text-[#0F9B8E] transition-colors"
            >
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
