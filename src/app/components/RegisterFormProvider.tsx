'use client';
//importaciones maestras
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { registerProvider } from '@/app/services/auth';
import { useState } from 'react';
import Swal from 'sweetalert2';
import OAuthLoginButton from './OAuthLoginButton';
import Link from 'next/link';

interface ProviderFormData {
  name: string;
  surname: string;
  email: string;
  password: string;
  confirmPassword: string;
  birthDate: string;
}

// Iconos
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

export default function RegisterProviderForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<ProviderFormData>({
    mode: 'onChange',
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const password = watch('password') || '';
  const confirmPassword = watch('confirmPassword') || '';

  const validateBirthDate = (value: string) => {
    if (!value) return 'La fecha de nacimiento es obligatoria';

    const birthDate = new Date(value);
    const today = new Date();

    if (isNaN(birthDate.getTime())) return 'Fecha inválida';

    const year = birthDate.getFullYear();
    if (year < 1900) return 'El año debe ser mayor o igual a 1900';
    if (birthDate > today) return 'La fecha no puede ser futura';

    const age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    const d = today.getDate() - birthDate.getDate();
    const realAge = m > 0 || (m === 0 && d >= 0) ? age : age - 1;

    if (realAge < 18) return 'Debes ser mayor de edad (≥18 años)';

    return true;
  };

  const onSubmit = async (data: ProviderFormData) => {
    setLoading(true);

    try {
      const response = await registerProvider(data);

      await Swal.fire({
        icon: 'success',
        title: 'Proveedor registrado',
        text: response?.message || 'Proveedor registrado exitosamente',
        confirmButtonText: 'Aceptar',
      });

      reset();
      router.push('/login');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const message = error?.response?.data?.message || 'Error inesperado';

      await Swal.fire({
        icon: 'error',
        title: 'Error al registrar',
        text: message,
        confirmButtonText: 'Cerrar',
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
          <div className="flex justify-center mb-6">
            <Image
              src="/logo-cleengo.svg"
              alt="CleenGo Logo"
              width={200}
              height={60}
              className="object-contain"
            />
          </div>

          <h2 className="text-3xl font-bold text-center text-gray-800 mb-3">Registro Proveedor</h2>
          <p className="text-center text-gray-500 mb-8">
            Crea tu cuenta para ofrecer servicios de limpieza
          </p>

          <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
            {/* Nombre y Apellido */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nombre</label>
                <input
                  className={`w-full border rounded-xl px-4 py-3 text-base transition-all
                    ${errors.name ? 'border-red-400' : 'border-gray-300 focus:border-[#3B82F6]'}
                    focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20`}
                  placeholder="María"
                  {...register('name', {
                    required: 'El nombre es obligatorio',
                    pattern: {
                      value: /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/,
                      message: 'Solo letras y espacios',
                    },
                  })}
                />
                {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Apellido</label>
                <input
                  className={`w-full border rounded-xl px-4 py-3 text-base transition-all
                    ${errors.surname ? 'border-red-400' : 'border-gray-300 focus:border-[#3B82F6]'}
                    focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20`}
                  placeholder="González"
                  {...register('surname', {
                    required: 'El apellido es obligatorio',
                    pattern: {
                      value: /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/,
                      message: 'Solo letras y espacios',
                    },
                  })}
                />
                {errors.surname && (
                  <span className="text-red-500 text-xs">{errors.surname.message}</span>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Correo electrónico</label>
              <input
                type="email"
                className={`w-full border rounded-xl px-4 py-3 text-base transition-all
                  ${errors.email ? 'border-red-400' : 'border-gray-300 focus:border-[#3B82F6]'}
                  focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20`}
                placeholder="correo@ejemplo.com"
                {...register('email', {
                  required: 'El correo es obligatorio',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Correo inválido',
                  },
                })}
              />
              {errors.email && <span className="text-red-500 text-xs">{errors.email.message}</span>}
            </div>

            {/* Contraseñas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Contraseña</label>
                <div
                  className={`flex items-center border rounded-xl px-4 py-3 transition-all
                  ${
                    errors.password
                      ? 'border-red-400'
                      : 'border-gray-300 focus-within:border-[#3B82F6]'
                  }
                  focus-within:ring-2 focus-within:ring-[#3B82F6]/20`}
                >
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="flex-1 outline-none text-base"
                    placeholder="••••••••"
                    {...register('password', {
                      required: 'La contraseña es obligatoria',
                      validate: {
                        minLength: (v) => v.length >= 8 || 'Mínimo 8 caracteres',
                        hasUpper: (v) => /[A-Z]/.test(v) || 'Una mayúscula',
                        hasLower: (v) => /[a-z]/.test(v) || 'Una minúscula',
                        hasNumber: (v) => /\d/.test(v) || 'Un número',
                        hasSymbol: (v) => /[^A-Za-z0-9]/.test(v) || 'Un símbolo',
                      },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="ml-2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {errors.password && (
                  <span className="text-red-500 text-xs">{errors.password.message}</span>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Confirmar contraseña</label>
                <div
                  className={`flex items-center border rounded-xl px-4 py-3 transition-all
                  ${
                    errors.confirmPassword
                      ? 'border-red-400'
                      : 'border-gray-300 focus-within:border-[#3B82F6]'
                  }
                  focus-within:ring-2 focus-within:ring-[#3B82F6]/20`}
                >
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="flex-1 outline-none text-base"
                    placeholder="••••••••"
                    {...register('confirmPassword', {
                      required: 'Confirma la contraseña',
                      validate: (value) => value === password || 'No coinciden',
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="ml-2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {confirmPassword && !errors.confirmPassword && confirmPassword === password && (
                  <span className="text-xs text-green-600">✔ Coinciden</span>
                )}
                {errors.confirmPassword && (
                  <span className="text-red-500 text-xs">{errors.confirmPassword.message}</span>
                )}
              </div>
            </div>

            {/* Fecha de nacimiento */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Fecha de nacimiento</label>
              <input
                type="date"
                className={`w-full border rounded-xl px-4 py-3 text-base transition-all
                  ${errors.birthDate ? 'border-red-400' : 'border-gray-300 focus:border-[#3B82F6]'}
                  focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20`}
                {...register('birthDate', {
                  validate: validateBirthDate,
                })}
              />
              {errors.birthDate && (
                <span className="text-red-500 text-xs">{errors.birthDate.message}</span>
              )}
            </div>

            {/* Botón Submit */}
            <button
              disabled={loading || !isValid || isSubmitting}
              className="w-full h-13 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base py-3.5 mt-2"
            >
              {loading || isSubmitting ? 'Registrando...' : 'Crear cuenta'}
            </button>

            <div className="mt-4">
              <OAuthLoginButton role="provider" />
            </div>

            <div className="mt-6 flex flex-col items-center gap-3">
              <Link
                href="/register"
                className="text-[#3B82F6] hover:text-[#2563EB] transition-colors text-sm font-medium"
              >
                ← Volver a selección de rol
              </Link>
              <p className="text-sm text-gray-600">
                ¿Ya tienes cuenta?{' '}
                <Link
                  href="/login"
                  className="text-[#3B82F6] font-semibold hover:text-[#2563EB] transition-colors"
                >
                  Inicia sesión aquí
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
