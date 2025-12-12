'use client';

import Image from 'next/image';
import { useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { registerClient } from '../services/auth';
import OAuthLoginButton from './OAuthLoginButton';
import Swal from 'sweetalert2';
import Link from 'next/link';

interface FormState {
  name: string;
  surname: string;
  email: string;
  password: string;
  confirmPassword: string;
  birthDate: string;
}

interface ErrorState {
  name: string;
  surname: string;
  email: string;
  password: string;
  confirmPassword: string;
  birthDate: string;
}

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

export default function RegisterFormClient() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    name: '',
    surname: '',
    email: '',
    password: '',
    confirmPassword: '',
    birthDate: '',
  });

  const [errors, setErrors] = useState<ErrorState>({
    name: '',
    surname: '',
    email: '',
    password: '',
    confirmPassword: '',
    birthDate: '',
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // VALIDACIONES
  const validateField = (field: keyof ErrorState, value: string, currentForm: FormState) => {
    let msg = '';

    switch (field) {
      case 'name':
      case 'surname':
        if (!value.trim()) msg = 'Campo obligatorio';
        else if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/.test(value)) msg = 'Solo letras y espacios';
        break;

      case 'email':
        if (!value.trim()) msg = 'El correo es obligatorio';
        else if (!/^\S+@\S+\.\S+$/.test(value)) msg = 'Correo inválido';
        break;

      case 'password': {
        const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!value.trim()) msg = 'La contraseña es obligatoria';
        else if (!strongRegex.test(value)) msg = 'Debe tener mayús, minús y número (mín 8)';
        else if (currentForm.confirmPassword && value !== currentForm.confirmPassword)
          msg = 'Las contraseñas no coinciden';
        break;
      }

      case 'confirmPassword':
        if (!value.trim()) msg = 'Confirma tu contraseña';
        else if (value !== currentForm.password) msg = 'Las contraseñas no coinciden';
        break;

      case 'birthDate': {
        if (!value.trim()) {
          msg = 'Fecha obligatoria';
        } else {
          const birthDate = new Date(value);
          const today = new Date();
          if (isNaN(birthDate.getTime())) msg = 'Fecha inválida';
          else if (birthDate.getFullYear() < 1900 || birthDate > today)
            msg = 'Año fuera de rango (1900–hoy)';
          else {
            const age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            const d = today.getDate() - birthDate.getDate();
            const realAge = m > 0 || (m === 0 && d >= 0) ? age : age - 1;
            if (realAge < 18) msg = 'Debes ser mayor de edad (≥18 años)';
          }
        }
        break;
      }
    }

    setErrors((prev) => ({ ...prev, [field]: msg }));
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updated = { ...form, [name]: value };
    setForm(updated);
    validateField(name as keyof ErrorState, value, updated);
  };

  const allValid = () => {
    const filled =
      form.name &&
      form.surname &&
      form.email &&
      form.password &&
      form.confirmPassword &&
      form.birthDate;

    const noErrors = Object.values(errors).every((e) => e === '');

    return !!(filled && noErrors);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!allValid()) {
      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Revisa los campos marcados en rojo.',
      });
      return;
    }

    setLoading(true);

    try {
      await registerClient(form);

      Swal.fire({
        icon: 'success',
        title: 'Registro exitoso',
        text: 'Cliente registrado correctamente.',
      }).then(() => {
        router.push('/login');
      });

      setForm({
        name: '',
        surname: '',
        email: '',
        password: '',
        confirmPassword: '',
        birthDate: '',
      });
      setErrors({
        name: '',
        surname: '',
        email: '',
        password: '',
        confirmPassword: '',
        birthDate: '',
      });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error?.response?.data?.message || 'Ocurrió un error',
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

          <h2 className="text-3xl font-bold text-center text-gray-800 mb-3">Registro Cliente</h2>
          <p className="text-center text-gray-500 mb-8">
            Crea tu cuenta para acceder a servicios de limpieza
          </p>

          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            {/* Nombre y Apellido en grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nombre</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Juan"
                  className={`w-full border rounded-xl px-4 py-3 text-base transition-all
                    ${errors.name ? 'border-red-400' : 'border-gray-300 focus:border-[#14B8A6]'}
                    focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20`}
                />
                {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Apellido</label>
                <input
                  name="surname"
                  value={form.surname}
                  onChange={handleChange}
                  placeholder="Pérez"
                  className={`w-full border rounded-xl px-4 py-3 text-base transition-all
                    ${errors.surname ? 'border-red-400' : 'border-gray-300 focus:border-[#14B8A6]'}
                    focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20`}
                />
                {errors.surname && <p className="text-red-500 text-xs">{errors.surname}</p>}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Correo electrónico</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="correo@ejemplo.com"
                className={`w-full border rounded-xl px-4 py-3 text-base transition-all
                  ${errors.email ? 'border-red-400' : 'border-gray-300 focus:border-[#14B8A6]'}
                  focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20`}
              />
              {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
            </div>

            {/* Contraseñas en grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Contraseña</label>
                <div
                  className={`flex items-center border rounded-xl px-4 py-3 transition-all
                  ${
                    errors.password
                      ? 'border-red-400'
                      : 'border-gray-300 focus-within:border-[#14B8A6]'
                  }
                  focus-within:ring-2 focus-within:ring-[#14B8A6]/20`}
                >
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    className="flex-1 outline-none text-base"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="ml-2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Confirmar contraseña</label>
                <div
                  className={`flex items-center border rounded-xl px-4 py-3 transition-all
                  ${
                    errors.confirmPassword
                      ? 'border-red-400'
                      : 'border-gray-300 focus-within:border-[#14B8A6]'
                  }
                  focus-within:ring-2 focus-within:ring-[#14B8A6]/20`}
                >
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={handleChange}
                    className="flex-1 outline-none text-base"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="ml-2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Fecha de nacimiento */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Fecha de nacimiento</label>
              <input
                name="birthDate"
                type="date"
                value={form.birthDate}
                onChange={handleChange}
                className={`w-full border rounded-xl px-4 py-3 text-base transition-all
                  ${errors.birthDate ? 'border-red-400' : 'border-gray-300 focus:border-[#14B8A6]'}
                  focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20`}
              />
              {errors.birthDate && <p className="text-red-500 text-xs">{errors.birthDate}</p>}
            </div>

            {/* Botón Submit */}
            <button
              disabled={!allValid() || loading}
              className="w-full h-13 bg-[#14B8A6] hover:bg-[#0F9B8E] text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base py-3.5 mt-2"
            >
              {loading ? 'Registrando...' : 'Crear cuenta'}
            </button>

            <div className="mt-4">
              <OAuthLoginButton role="client" />
            </div>

            <div className="mt-6 flex flex-col items-center gap-3">
              <Link
                href="/register"
                className="text-[#14B8A6] hover:text-[#0F9B8E] transition-colors text-sm font-medium"
              >
                ← Volver a selección de rol
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
          </form>
        </div>
      </div>
    </div>
  );
}
