"use client";

import Image from "next/image";
import { useForm } from "react-hook-form";
import { registerProvider } from "@/app/services/auth";
import { useState } from "react";
import Swal from "sweetalert2";
import OAuthLoginButton from "./OAuthLoginButton"; // ⬅️ NUEVO

interface ProviderFormData {
  name: string;
  surname: string;
  email: string;
  password: string;
  confirmPassword: string;
  birthDate: string;
  profileImgUrl?: string;
  phone: string; // solo número local
  days: string[];
  hours: string[];
  about: string;
}

// ===== Países (igual que cliente) =====
interface Country {
  code: string;
  abbr: string;
  flagSrc: string;
}

const COUNTRIES: Country[] = [
  { code: "+52", abbr: "MX", flagSrc: "/flags/mx.svg" },
  { code: "+54", abbr: "AR", flagSrc: "/flags/ar.svg" },
  { code: "+51", abbr: "PE", flagSrc: "/flags/pe.svg" },
  { code: "+57", abbr: "CO", flagSrc: "/flags/co.svg" },
  { code: "+56", abbr: "CL", flagSrc: "/flags/cl.svg" },
];

// Iconos ver/ocultar contraseña (como cliente)
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

export default function RegisterProviderForm() {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<ProviderFormData>({
    mode: "onChange",
  });

  const [loading, setLoading] = useState(false);
  const [showPasswordInfo, setShowPasswordInfo] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [isCountryOpen, setIsCountryOpen] = useState(false);

  const password = watch("password") || "";
  const confirmPassword = watch("confirmPassword") || "";
  const phoneValue = watch("phone") || "";

  // ===== VALIDAR EDAD Y RANGO DE FECHA =====
  const validateBirthDate = (value: string) => {
    if (!value) return "La fecha de nacimiento es obligatoria";

    const birthDate = new Date(value);
    const today = new Date();

    if (isNaN(birthDate.getTime())) return "Fecha inválida";

    const year = birthDate.getFullYear();
    if (year < 1900) return "El año debe ser mayor o igual a 1900";
    if (birthDate > today) return "La fecha no puede ser futura";

    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    const d = today.getDate() - birthDate.getDate();
    const realAge = m > 0 || (m === 0 && d >= 0) ? age : age - 1;

    if (realAge < 18) return "Debes ser mayor de edad (≥18 años)";

    return true;
  };

  const onSubmit = async (data: ProviderFormData) => {
    setLoading(true);

    const fullPhone = `${selectedCountry.code}${data.phone}`;

    const bodyToSend: ProviderFormData = {
      ...data,
      phone: fullPhone,
      profileImgUrl:
        data.profileImgUrl && data.profileImgUrl.trim() !== ""
          ? data.profileImgUrl
          : undefined,
    };

    try {
      const response = await registerProvider(bodyToSend);

      await Swal.fire({
        icon: "success",
        title: "Proveedor registrado",
        text: response?.message || "Proveedor registrado exitosamente",
        confirmButtonText: "Aceptar",
      });

      reset();
    } catch (err: any) {
      const message = err?.response?.data?.message || "Error inesperado";

      await Swal.fire({
        icon: "error",
        title: "Error al registrar",
        text: message,
        confirmButtonText: "Cerrar",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white text-gray-900 shadow-lg rounded-xl p-8 w-full max-w-md flex flex-col items-center">
      <div className="relative w-[400px] h-[200px] mx-auto mb-2">
        <Image
          src="/logo-cleengo.svg"
          alt="CleenGo Logo"
          fill
          className="object-contain"
        />
      </div>

      <h2 className="text-2xl font-semibold text-center mb-6">
        Registro Proveedor
      </h2>

      <form
        className="flex flex-col gap-4 w-full"
        onSubmit={handleSubmit(onSubmit)}
      >
        {/* NOMBRE */}
        <div className="flex flex-col">
          <label>Nombre</label>
          <input
            className="border rounded-lg bg-white text-gray-900 px-3 py-2"
            {...register("name", {
              required: "El nombre es obligatorio",
              pattern: {
                value: /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/,
                message: "Solo letras y espacios",
              },
            })}
          />
          {errors.name && (
            <span className="text-red-500 text-sm">{errors.name.message}</span>
          )}
        </div>

        {/* APELLIDO */}
        <div className="flex flex-col">
          <label>Apellido</label>
          <input
            className="border rounded-lg bg-white text-gray-900 px-3 py-2"
            {...register("surname", {
              required: "El apellido es obligatorio",
              pattern: {
                value: /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/,
                message: "Solo letras y espacios",
              },
            })}
          />
          {errors.surname && (
            <span className="text-red-500 text-sm">
              {errors.surname.message}
            </span>
          )}
        </div>

        {/* EMAIL */}
        <div className="flex flex-col">
          <label>Correo</label>
          <input
            type="email"
            className="border rounded-lg bg-white text-gray-900 px-3 py-2"
            {...register("email", {
              required: "El correo es obligatorio",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Correo inválido",
              },
            })}
          />
          {errors.email && (
            <span className="text-red-500 text-sm">{errors.email.message}</span>
          )}
        </div>

        {/* PASSWORD */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <label>Contraseña</label>

            <div className="relative">
              <button
                type="button"
                className="w-5 h-5 flex items-center justify-center rounded-full border border-gray-400 text-[11px] text-gray-600 hover:bg-gray-100 transition"
                onClick={() => setShowPasswordInfo((prev) => !prev)}
                aria-label="Requisitos de contraseña"
              >
                ?
              </button>

              {showPasswordInfo && (
                <div className="absolute right-0 mt-2 w-64 bg-[#1f2937] text-white text-xs rounded-lg shadow-xl p-3 z-20">
                  <p className="font-semibold mb-1">Requisitos:</p>
                  <ul className="space-y-0.5 text-[11px]">
                    <li>- Mínimo 8 caracteres</li>
                    <li>- Al menos una mayúscula</li>
                    <li>- Al menos una minúscula</li>
                    <li>- Al menos un número</li>
                    <li>- Al menos un símbolo (!@#$?)</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center border rounded-lg px-3 py-2 bg-white">
            <input
              type={showPassword ? "text" : "password"}
              className="flex-1 outline-none text-gray-900"
              {...register("password", {
                required: "La contraseña es obligatoria",
                validate: {
                  minLength: (v) =>
                    v.length >= 8 || "Debe tener mínimo 8 caracteres",
                  hasUpper: (v) =>
                    /[A-Z]/.test(v) || "Debe incluir una mayúscula",
                  hasLower: (v) =>
                    /[a-z]/.test(v) || "Debe incluir una minúscula",
                  hasNumber: (v) => /\d/.test(v) || "Debe incluir un número",
                  hasSymbol: (v) =>
                    /[^A-Za-z0-9]/.test(v) || "Debe incluir un símbolo",
                },
              })}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="ml-2 text-gray-600 hover:text-black"
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>

          {errors.password && (
            <span className="text-red-500 text-xs mt-1">
              {errors.password.message}
            </span>
          )}
        </div>

        {/* CONFIRM PASSWORD */}
        <div className="flex flex-col">
          <label className="mb-1">Confirmar contraseña</label>

          <div className="flex items-center border rounded-lg px-3 py-2 bg-white">
            <input
              type={showConfirmPassword ? "text" : "password"}
              className="flex-1 outline-none text-gray-900"
              {...register("confirmPassword", {
                required: "Debes confirmar la contraseña",
                validate: (value) =>
                  value === password || "Las contraseñas no coinciden",
              })}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              className="ml-2 text-gray-600 hover:text-black"
            >
              {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>

          {confirmPassword &&
            !errors.confirmPassword &&
            confirmPassword === password && (
              <span className="text-xs mt-1 text-green-600">
                Las contraseñas coinciden
              </span>
            )}

          {errors.confirmPassword && (
            <span className="text-red-500 text-xs mt-1">
              {errors.confirmPassword.message}
            </span>
          )}
        </div>

        {/* FECHA DE NACIMIENTO */}
        <div className="flex flex-col">
          <label>Fecha de nacimiento</label>
          <input
            type="date"
            className="border rounded-lg bg-white text-gray-900 px-3 py-2"
            {...register("birthDate", {
              validate: validateBirthDate,
            })}
          />
          {errors.birthDate && (
            <span className="text-red-500 text-sm">
              {errors.birthDate.message}
            </span>
          )}
        </div>

        {/* IMG PERFIL (OPCIONAL) */}
        <div className="flex flex-col">
          <label>Imagen de perfil (URL) (opcional)</label>
          <input
            className="border rounded-lg bg-white text-gray-900 px-3 py-2"
            {...register("profileImgUrl", {
              pattern: {
                value: /^https?:\/\/.+/,
                message: "Debes ingresar una URL válida",
              },
            })}
            placeholder="Ej: https://miimagen.com/foto.jpg"
          />
          {errors.profileImgUrl && (
            <span className="text-red-500 text-sm">
              {errors.profileImgUrl.message}
            </span>
          )}
        </div>

        {/* TELÉFONO CON PAÍS */}
        <div className="flex flex-col">
          <label>Teléfono</label>

          <div className="flex gap-2 items-center">
            {/* Dropdown país */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsCountryOpen((prev) => !prev)}
                className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-white min-w-[130px]"
              >
                <Image
                  src={selectedCountry.flagSrc}
                  alt={selectedCountry.abbr}
                  width={20}
                  height={14}
                  className="rounded-sm object-cover"
                />
                <span className="text-sm">
                  {selectedCountry.code} {selectedCountry.abbr}
                </span>
                <span className="ml-auto text-xs">▼</span>
              </button>

              {isCountryOpen && (
                <div className="absolute z-20 mt-1 w-full bg-white border rounded-lg shadow-md">
                  {COUNTRIES.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => {
                        setSelectedCountry(c);
                        setIsCountryOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 hover:bg-gray-100 text-left"
                    >
                      <Image
                        src={c.flagSrc}
                        alt={c.abbr}
                        width={20}
                        height={14}
                        className="rounded-sm object-cover"
                      />
                      <span className="text-sm">
                        {c.code} {c.abbr}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Número local */}
            <input
              className="border rounded-lg bg-white text-gray-900 px-3 py-2 flex-1"
              placeholder="1234567890"
              maxLength={15}
              {...register("phone", {
                required: "El teléfono es obligatorio",
                validate: (value) => {
                  if (!value.trim()) return "El teléfono es obligatorio";
                  if (!/^\d+$/.test(value)) return "Solo números";
                  const fullPhone = `${selectedCountry.code}${value}`;
                  if (fullPhone.length < 10)
                    return "Debe tener mínimo 10 caracteres (incl. lada)";
                  if (fullPhone.length > 15)
                    return "Máximo 15 caracteres (incl. lada)";
                  return true;
                },
              })}
            />
          </div>

          {errors.phone && (
            <span className="text-red-500 text-sm mt-1">
              {errors.phone.message}
            </span>
          )}
        </div>

        {/* DAYS */}
        <div className="flex flex-col">
          <label>Días disponibles</label>

          <div className="grid grid-cols-2 gap-2 mt-1">
            {[
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday",
            ].map((day) => (
              <label key={day} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  value={day}
                  {...register("days", {
                    required: "Debes seleccionar al menos un día",
                  })}
                />
                {day}
              </label>
            ))}
          </div>

          {errors.days && (
            <span className="text-red-500 text-sm">{errors.days.message}</span>
          )}
        </div>

        {/* HOURS */}
        <div className="flex flex-col">
          <label>Horarios disponibles</label>

          <div className="grid grid-cols-2 gap-2 mt-1">
            {[
              "06:00-09:00",
              "09:00-12:00",
              "12:00-15:00",
              "15:00-18:00",
              "18:00-21:00",
            ].map((hour) => (
              <label key={hour} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  value={hour}
                  {...register("hours", {
                    required: "Debes seleccionar al menos un horario",
                  })}
                />
                {hour}
              </label>
            ))}
          </div>

          {errors.hours && (
            <span className="text-red-500 text-sm">{errors.hours.message}</span>
          )}
        </div>

        {/* ABOUT */}
        <div className="flex flex-col">
          <label>Sobre ti</label>
          <textarea
            rows={3}
            className="border rounded-lg bg-white text-gray-900 px-3 py-2"
            {...register("about", {
              required: "Este campo es obligatorio",
              minLength: {
                value: 20,
                message: "Debe tener al menos 20 caracteres",
              },
              maxLength: {
                value: 250,
                message: "Máximo 250 caracteres",
              },
            })}
          ></textarea>
          {errors.about && (
            <span className="text-red-500 text-sm">{errors.about.message}</span>
          )}
        </div>

        {/* BOTÓN SUBMIT */}
        <button
          disabled={loading || !isValid || isSubmitting}
          className="bg-blue-600 text-white py-2 rounded-lg hover:opacity-90 disabled:opacity-70"
        >
          {loading || isSubmitting
            ? "Registrando..."
            : "Registrarme como Proveedor"}
        </button>

        {/* 🔵 LOGIN CON GOOGLE COMO PROVEEDOR */}
        <div className="mt-4">
          <OAuthLoginButton role="provider" />
        </div>
      </form>
    </div>
  );
}
