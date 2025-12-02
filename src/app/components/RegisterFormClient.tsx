"use client";

import Image from "next/image";
import { useState, ChangeEvent, FormEvent } from "react";
import { registerClient } from "../services/auth";
import OAuthLoginButton from "./OAuthLoginButton";
import Swal from "sweetalert2";

interface FormState {
  name: string;
  surname: string;
  email: string;
  password: string;
  confirmPassword: string;
  birthDate: string;
  profileImgUrl: string;
  phone: string; // solo número local
}

interface ErrorState {
  name: string;
  surname: string;
  email: string;
  password: string;
  confirmPassword: string;
  birthDate: string;
  phone: string;
}

interface Country {
  code: string; // +52
  abbr: string; // MX
  flagSrc: string; // /flags/mx.svg
}

// Lista de países (puedes agregar más)
const COUNTRIES: Country[] = [
  { code: "+52", abbr: "MX", flagSrc: "/flags/mx.svg" },
  { code: "+54", abbr: "AR", flagSrc: "/flags/ar.svg" },
  { code: "+51", abbr: "PE", flagSrc: "/flags/pe.svg" },
  { code: "+57", abbr: "CO", flagSrc: "/flags/co.svg" },
  { code: "+56", abbr: "CL", flagSrc: "/flags/cl.svg" },
];

// Iconos SVG para ver / ocultar contraseña
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

export default function RegisterFormClient() {
  const [form, setForm] = useState<FormState>({
    name: "",
    surname: "",
    email: "",
    password: "",
    confirmPassword: "",
    birthDate: "",
    profileImgUrl: "",
    phone: "",
  });

  const [errors, setErrors] = useState<ErrorState>({
    name: "",
    surname: "",
    email: "",
    password: "",
    confirmPassword: "",
    birthDate: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);

  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [isCountryOpen, setIsCountryOpen] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // -------------------------------
  // VALIDACIONES EN TIEMPO REAL
  // -------------------------------
  const validateField = (
    field: keyof ErrorState,
    value: string,
    currentForm: FormState
  ) => {
    let msg = "";

    switch (field) {
      case "name":
      case "surname":
        if (!value.trim()) msg = "Campo obligatorio";
        else if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/.test(value))
          msg = "Solo letras y espacios";
        break;

      case "email":
        if (!value.trim()) msg = "El correo es obligatorio";
        else if (!/^\S+@\S+\.\S+$/.test(value)) msg = "Correo inválido";
        break;

      case "password": {
        const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!value.trim()) msg = "La contraseña es obligatoria";
        else if (!strongRegex.test(value))
          msg = "Debe tener mayús, minús y número (mín 8)";
        else if (
          currentForm.confirmPassword &&
          value !== currentForm.confirmPassword
        )
          msg = "Las contraseñas no coinciden";
        break;
      }

      case "confirmPassword":
        if (!value.trim()) msg = "Confirma tu contraseña";
        else if (value !== currentForm.password)
          msg = "Las contraseñas no coinciden";
        break;

      case "phone": {
        if (!value.trim()) msg = "El teléfono es obligatorio";
        else if (!/^\d+$/.test(value)) msg = "Solo números";
        else {
          const fullPhone = `${selectedCountry.code}${value}`;
          if (fullPhone.length < 10)
            msg = "Debe tener mínimo 10 caracteres (incl. lada)";
          else if (fullPhone.length > 15)
            msg = "Máximo 15 caracteres (incl. lada)";
        }
        break;
      }

      case "birthDate": {
        if (!value.trim()) {
          msg = "Fecha obligatoria";
        } else {
          const birthDate = new Date(value);
          const today = new Date();
          if (isNaN(birthDate.getTime())) msg = "Fecha inválida";
          else if (birthDate.getFullYear() < 1900 || birthDate > today)
            msg = "Año fuera de rango (1900–hoy)";
          else {
            const age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            const d = today.getDate() - birthDate.getDate();
            const realAge = m > 0 || (m === 0 && d >= 0) ? age : age - 1;
            if (realAge < 18) msg = "Debes ser mayor de edad (≥18 años)";
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
      form.birthDate &&
      form.phone;

    const noErrors = Object.values(errors).every((e) => e === "");

    return !!(filled && noErrors);
  };

  // -------------------------------
  // SUBMIT
  // -------------------------------
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!allValid()) {
      Swal.fire({
        icon: "warning",
        title: "Formulario incompleto",
        text: "Revisa los campos marcados en rojo.",
      });
      return;
    }

    setLoading(true);

    const fullPhone = `${selectedCountry.code}${form.phone}`;

    const bodyToSend = {
      ...form,
      phone: fullPhone,
      profileImgUrl:
        form.profileImgUrl.trim() === "" ? undefined : form.profileImgUrl,
    };

    try {
      await registerClient(bodyToSend);

      Swal.fire({
        icon: "success",
        title: "Registro exitoso",
        text: "Cliente registrado correctamente.",
      });

      setForm({
        name: "",
        surname: "",
        email: "",
        password: "",
        confirmPassword: "",
        birthDate: "",
        profileImgUrl: "",
        phone: "",
      });
      setErrors({
        name: "",
        surname: "",
        email: "",
        password: "",
        confirmPassword: "",
        birthDate: "",
        phone: "",
      });
      setSelectedCountry(COUNTRIES[0]);
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err?.response?.data?.message || "Ocurrió un error",
      });
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------
  // UI
  // -------------------------------
  return (
    <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md">
      {/* LOGO */}
      <div className="flex justify-center mb-0">
        <Image
          src="/logo-vertical-sin-fondo.png"
          alt="CleenGo Logo"
          width={150}
          height={150}
          className="object-contain"
        />
      </div>

      <h2 className="text-2xl font-semibold text-center mb-6">
        Registro Cliente
      </h2>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        {/* NOMBRE */}
        <div className="flex flex-col">
          <label>Nombre</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Ej: Juan"
            className="border px-3 py-2 rounded-lg"
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
        </div>

        {/* APELLIDO */}
        <div className="flex flex-col">
          <label>Apellido</label>
          <input
            name="surname"
            value={form.surname}
            onChange={handleChange}
            placeholder="Ej: Pérez"
            className="border px-3 py-2 rounded-lg"
          />
          {errors.surname && (
            <p className="text-red-500 text-sm">{errors.surname}</p>
          )}
        </div>

        {/* EMAIL */}
        <div className="flex flex-col">
          <label>Correo</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Ej: correo@gmail.com"
            className="border px-3 py-2 rounded-lg"
          />
          {errors.email && (
            <p className="text-red-500 text-sm">{errors.email}</p>
          )}
        </div>

        {/* PASSWORD */}
        <div className="flex flex-col">
          <label>Contraseña</label>
          <div className="flex items-center border rounded-lg px-3 py-2">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={handleChange}
              className="flex-1 outline-none"
              placeholder="********"
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
            <p className="text-red-500 text-sm">{errors.password}</p>
          )}
        </div>

        {/* CONFIRM PASSWORD */}
        <div className="flex flex-col">
          <label>Confirmar contraseña</label>
          <div className="flex items-center border rounded-lg px-3 py-2">
            <input
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={form.confirmPassword}
              onChange={handleChange}
              className="flex-1 outline-none"
              placeholder="********"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              className="ml-2 text-gray-600 hover:text-black"
            >
              {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-red-500 text-sm">{errors.confirmPassword}</p>
          )}
        </div>

        {/* FECHA DE NACIMIENTO */}
        <div className="flex flex-col">
          <label>Fecha de nacimiento</label>
          <input
            name="birthDate"
            type="date"
            value={form.birthDate}
            onChange={handleChange}
            className="border px-3 py-2 rounded-lg"
          />
          {errors.birthDate && (
            <p className="text-red-500 text-sm">{errors.birthDate}</p>
          )}
        </div>

        {/* IMG PERFIL */}
        <div className="flex flex-col">
          <label>Imagen de perfil (URL)</label>
          <input
            name="profileImgUrl"
            value={form.profileImgUrl}
            onChange={handleChange}
            placeholder="Ej: https://miimagen.com/foto.jpg"
            className="border px-3 py-2 rounded-lg"
          />
        </div>

        {/* TELÉFONO CON BANDERA SVG + CÓDIGO */}
        <div className="flex flex-col">
          <label>Teléfono</label>

          <div className="flex gap-2 items-center">
            {/* Dropdown custom con bandera + código + MX */}
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
                        if (form.phone) {
                          validateField("phone", form.phone, form);
                        }
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
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="1234567890"
              className="border px-3 py-2 rounded-lg flex-1"
              maxLength={15}
            />
          </div>

          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
          )}
        </div>

        {/* BOTÓN */}
        <button
          disabled={!allValid() || loading}
          className="bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Registrando..." : "Registrarme"}
        </button>

        <div className="mt-4">
          <OAuthLoginButton role="client" />
        </div>
      </form>
    </div>
  );
}