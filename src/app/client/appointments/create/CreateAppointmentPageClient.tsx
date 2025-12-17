//src/app/client/appointments/create/CreateAppointmentPageClient.tsx
"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Swal from "sweetalert2";
import { useAuth } from "@/app/contexts/AuthContext";
import Select from "react-select";

// Opciones simuladas de servicio y horarios.
const SERVICE_OPTIONS = [
  "Limpieza profunda",
  "Limpieza de mantenimiento (Check-out Airbnb)",
  "Limpieza integral / especial",
  "Mantenimiento básico de jardín",
  "Mantenimiento integral de jardín",
  "Puesta en valor / jardinería intensiva",
];

const TIME_SLOTS = [
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
  "23:00",
];

// Ajusta a lo que realmente devuelve tu back
interface Provider {
  id: string;
  name: string;
  surname?: string;
  email?: string;
  rating?: number;
  profileImgUrl?: string | null;
  days?: string[]; // ej: ["Lunes","Martes",...]
  hours?: string[]; // ej: ["09:00-13:00","15:00-18:00"]
  about?: string;
}

function Stars({
  value = 0,
  count = 5,
  showValue = true,
  reviewsCount,
}: {
  value?: number; // 0..5
  count?: number;
  showValue?: boolean;
  reviewsCount?: number;
}) {
  const safe = Number.isFinite(value) ? Math.max(0, Math.min(count, value)) : 0;
  const filled = Math.round(safe);

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: count }).map((_, i) => {
          const active = i < filled;
          return (
            <svg
              key={i}
              className={`w-4 h-4 ${
                active ? "text-yellow-400" : "text-gray-300"
              }`}
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          );
        })}
      </div>

      {showValue && (
        <span className="text-xs font-semibold text-gray-700">
          {safe.toFixed(1)}
          {typeof reviewsCount === "number" ? (
            <span className="text-gray-400 font-normal"> ({reviewsCount})</span>
          ) : null}
        </span>
      )}
    </div>
  );
}

/** Helpers fecha/tiempo (evita bugs timezone con YYYY-MM-DD) */
function parseLocalDateYYYYMMDD(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}
function isFutureDateStrict(dateStr: string) {
  const d = parseLocalDateYYYYMMDD(dateStr);
  if (!d) return false;
  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0
  );
  return d.getTime() > todayStart.getTime();
}
function normalizeSpanishDay(day: string) {
  const lower = day.trim().toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}
function getSpanishWeekdayFromYYYYMMDD(dateStr: string) {
  const d = parseLocalDateYYYYMMDD(dateStr);
  if (!d) return null;
  const weekday = d.toLocaleDateString("es-MX", { weekday: "long" });
  return normalizeSpanishDay(weekday);
}
function timeToMinutes(time: string) {
  const [hh, mm] = time.split(":").map(Number);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  return hh * 60 + mm;
}
function isTimeInsideRanges(startTime: string, ranges: string[] = []) {
  const startMin = timeToMinutes(startTime);
  if (startMin === null) return false;

  return ranges.some((range) => {
    const [from, to] = range.split("-").map((s) => s.trim());
    const fromMin = timeToMinutes(from);
    const toMin = timeToMinutes(to);
    if (fromMin === null || toMin === null) return false;
    return startMin >= fromMin && startMin <= toMin;
  });
}

// ✅ Toast global (SweetAlert)
const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2600,
  timerProgressBar: true,
});

export default function CreateAppointmentPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token } = useAuth();

  const backendUrl = process.env.VITE_BACKEND_URL; // viene de next.config.ts env

  // query params
  const providerId = searchParams.get("providerId");
  const providerNameFromQuery = searchParams.get("providerName");
  const providerEmailFromQuery = searchParams.get("providerEmail");

  // provider real
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loadingProvider, setLoadingProvider] = useState(false);

  // form
  const [service, setService] = useState("");
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [notes, setNotes] = useState("");

  // address (por campos)
  const [street, setStreet] = useState("");
  const [extNumber, setExtNumber] = useState("");
  const [intNumber, setIntNumber] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const fullAddress = useMemo(() => {
    const parts: string[] = [];

    const streetLine = [
      street?.trim(),
      extNumber?.trim() ? `#${extNumber.trim()}` : "",
      intNumber?.trim() ? `Int ${intNumber.trim()}` : "",
    ]
      .filter(Boolean)
      .join(" ");

    if (streetLine) parts.push(streetLine);
    if (neighborhood?.trim()) parts.push(neighborhood.trim());
    if (city?.trim()) parts.push(city.trim());
    if (state?.trim()) parts.push(state.trim());
    if (postalCode?.trim()) parts.push(`CP ${postalCode.trim()}`);

    return parts.join(", ");
  }, [street, extNumber, intNumber, neighborhood, city, state, postalCode]);

  // nombre “display”
  const displayProviderName =
    provider?.name ||
    providerNameFromQuery ||
    (providerId ? `Proveedor #${providerId.slice(0, 6)}…` : "Proveedor");

  // avatar url (igual que providers)
  const providerImageUrl = useMemo(() => {
    const img = provider?.profileImgUrl;
    if (!img) return null;
    if (img.startsWith("http")) return img;
    if (!backendUrl) return img;
    return `${backendUrl}/uploads/${img}`;
  }, [provider?.profileImgUrl, backendUrl]);

  // traer provider real
  useEffect(() => {
    const run = async () => {
      if (!backendUrl || !providerId) return;

      setLoadingProvider(true);
      try {
        const res = await fetch(`${backendUrl}/provider/${providerId}`);
        if (!res.ok)
          throw new Error(`No se pudo cargar provider: ${res.status}`);
        const data: Provider = await res.json();
        setProvider(data);
      } catch (e) {
        console.error(e);
        Swal.fire({
          icon: "warning",
          title: "No pudimos cargar al proveedor",
          text: "Puedes intentar nuevamente o volver atrás. Algunos horarios/días podrían no validarse sin esta info.",
          confirmButtonColor: "#22C55E",
        });
      } finally {
        setLoadingProvider(false);
      }
    };

    run();
  }, [backendUrl, providerId]);

  const extractStartTime = (slot: string) => slot.trim();

  /** SweetAlert helpers */
  const alertWarn = (title: string, text: string) =>
    Swal.fire({ icon: "warning", title, text, confirmButtonColor: "#22C55E" });

  const alertError = (title: string, text: string) =>
    Swal.fire({ icon: "error", title, text, confirmButtonColor: "#22C55E" });

  // ✅ Validación EN VIVO: día
  useEffect(() => {
    if (!provider) return;
    if (!date) return;

    const selectedDay = getSpanishWeekdayFromYYYYMMDD(date);
    const providerDays = (provider.days ?? []).map(normalizeSpanishDay);

    if (!selectedDay || providerDays.length === 0) return;

    if (!providerDays.includes(selectedDay)) {
      toast.fire({
        icon: "warning",
        title: `Día no disponible: ${selectedDay}`,
        text: `Disponible: ${providerDays.join(", ")}`,
      });
    }
  }, [date, provider]);

  // ✅ Validación EN VIVO: horario
  useEffect(() => {
    if (!provider) return;
    if (!timeSlot) return;

    const startTime = extractStartTime(timeSlot);
    const providerHours = provider.hours ?? [];

    if (providerHours.length === 0) return;

    if (!isTimeInsideRanges(startTime, providerHours)) {
      toast.fire({
        icon: "warning",
        title: `Horario no disponible: ${startTime}`,
        text: `Disponible: ${providerHours.join(" | ")}`,
      });
    }
  }, [timeSlot, provider]);

  // ✅ Opcional: si cambias fecha y la hora ya no cuadra, resetea horario
  useEffect(() => {
    if (!provider || !date || !timeSlot) return;
    const startTime = extractStartTime(timeSlot);
    const providerHours = provider.hours ?? [];
    if (providerHours.length === 0) return;

    if (!isTimeInsideRanges(startTime, providerHours)) {
      setTimeSlot("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // 1) Auth
    if (!user || !token) {
      await Swal.fire({
        icon: "warning",
        title: "Inicia sesión",
        text: "Debes iniciar sesión para crear una cita.",
        confirmButtonColor: "#22C55E",
        confirmButtonText: "Ir a login",
      });
      router.push("/login");
      return;
    }

    // 2) Env
    if (!backendUrl) {
      await alertError(
        "Error de configuración",
        "VITE_BACKEND_URL no está definido."
      );
      return;
    }

    // 3) Required fields (alineado al back: service, date, startTime, notes, providerEmail, address)
    if (!service || !date || !timeSlot) {
      await alertWarn(
        "Completa los campos",
        "Selecciona servicio, fecha y horario para continuar."
      );
      return;
    }

    // notes: tu backend lo pide REQUIRED
    if (!notes.trim()) {
      await alertWarn(
        "Faltan detalles",
        "Agrega una nota breve (ej: instrucciones de acceso, si hay mascotas, etc.)."
      );
      return;
    }

    // address
    if (!fullAddress) {
      await alertWarn(
        "Dirección incompleta",
        "Completa al menos calle, ciudad y estado para continuar."
      );
      return;
    }

    // providerEmail requerido por tu service
    const providerEmail = provider?.email || providerEmailFromQuery;
    if (!providerEmail) {
      await alertError(
        "Falta email del proveedor",
        "Tu backend requiere providerEmail para crear la cita. Asegúrate de que /provider/:id devuelva email o que venga en query params."
      );
      return;
    }

    // 4) Fecha futura (evita bug timezone)
    if (!isFutureDateStrict(date)) {
      await alertWarn(
        "Fecha inválida",
        "La fecha de la cita debe ser posterior a hoy. Elige una fecha futura."
      );
      return;
    }

    const startTime = extractStartTime(timeSlot);

    // 5) Validaciones por provider (si lo tenemos cargado)
    if (provider) {
      // 5.1) Provider trabaja ese día
      const selectedDay = getSpanishWeekdayFromYYYYMMDD(date);
      const providerDays = (provider.days ?? []).map(normalizeSpanishDay);

      if (
        selectedDay &&
        providerDays.length > 0 &&
        !providerDays.includes(selectedDay)
      ) {
        await Swal.fire({
          icon: "warning",
          title: "El proveedor no trabaja ese día",
          html: `
            <p style="margin:0 0 8px;">Seleccionaste <b>${selectedDay}</b>, pero <b>${displayProviderName}</b> no trabaja ese día.</p>
            <p style="margin:0; font-size:13px; color:#6b7280;">Días disponibles: <b>${providerDays.join(
              ", "
            )}</b></p>
          `,
          confirmButtonColor: "#22C55E",
        });
        return;
      }

      // 5.2) Hora dentro del rango laboral
      const providerHours = provider.hours ?? [];
      if (
        providerHours.length > 0 &&
        !isTimeInsideRanges(startTime, providerHours)
      ) {
        await Swal.fire({
          icon: "warning",
          title: "Horario fuera de disponibilidad",
          html: `
            <p style="margin:0 0 8px;"><b>${displayProviderName}</b> no está disponible a las <b>${startTime}</b>.</p>
            <p style="margin:0; font-size:13px; color:#6b7280;">Horarios disponibles: <b>${providerHours.join(
              ", "
            )}</b></p>
          `,
          confirmButtonColor: "#22C55E",
        });
        return;
      }
    }

    const payload = {
      service,
      date,
      startTime,
      notes: notes.trim(),
      providerEmail,
      address: fullAddress,
    };

    // 6) Confirmación previa
    const confirm = await Swal.fire({
      icon: "question",
      title: "Confirmar cita",
      html: `
        <p style="margin-bottom:6px;">Vas a reservar con <b>${displayProviderName}</b></p>
        <p style="margin-bottom:4px;"><b>Servicio:</b> ${service}</p>
        <p style="margin-bottom:4px;"><b>Fecha:</b> ${date}</p>
        <p style="margin-bottom:4px;"><b>Inicio:</b> ${startTime}</p>
        <p style="margin-bottom:0; font-size:12px; color:#6b7280;">
          El proveedor deberá confirmar la cita para habilitar el chat.
        </p>
      `,
      showCancelButton: true,
      confirmButtonText: "Sí, reservar",
      cancelButtonText: "Aún no",
      confirmButtonColor: "#22C55E",
      cancelButtonColor: "#ef4444",
    });

    if (!confirm.isConfirmed) return;

    // 7) Loader
    Swal.fire({
      title: "Creando tu cita…",
      text: "Un momento, por favor.",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const res = await fetch(`${backendUrl}/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get("content-type") || "";
      const maybeJson = contentType.includes("application/json");
      const data = maybeJson ? await res.json().catch(() => null) : null;

      if (!res.ok) {
        Swal.close();

        const msg: string =
          (data && (data.message?.toString?.() ?? data.message)) ||
          (await res.text().catch(() => "")) ||
          "No se pudo crear la cita";

        const text = Array.isArray(data?.message)
          ? data.message.join("\n")
          : msg;

        // mapeo de errores del back a UX top
        if (text.includes("all required fields")) {
          await alertWarn(
            "Faltan datos",
            "Revisa que todos los campos estén completos."
          );
          return;
        }
        if (text.includes("appointment date must be later")) {
          await alertWarn(
            "Fecha inválida",
            "La fecha debe ser posterior a hoy."
          );
          return;
        }
        if (text.toLowerCase().includes("provider does not work on")) {
          await Swal.fire({
            icon: "warning",
            title: "Día no disponible",
            text,
            confirmButtonColor: "#22C55E",
          });
          return;
        }
        if (text.toLowerCase().includes("provider is not working at")) {
          await Swal.fire({
            icon: "warning",
            title: "Horario no disponible",
            text,
            confirmButtonColor: "#22C55E",
          });
          return;
        }
        if (text.toLowerCase().includes("already has an appointment")) {
          await Swal.fire({
            icon: "warning",
            title: "Horario ocupado",
            text: "Ese horario ya está reservado. Elige otro horario disponible.",
            confirmButtonColor: "#22C55E",
          });
          return;
        }
        if (text.toLowerCase().includes("does not offer")) {
          await Swal.fire({
            icon: "warning",
            title: "Servicio no disponible",
            text: "Este proveedor no ofrece ese servicio. Elige otro servicio o proveedor.",
            confirmButtonColor: "#22C55E",
          });
          return;
        }
        if (text.toLowerCase().includes("provider not found")) {
          await alertError(
            "Proveedor no disponible",
            "No encontramos al proveedor seleccionado."
          );
          return;
        }

        await alertError(
          "Error al crear cita",
          text || "Revisa la información e intenta de nuevo."
        );
        return;
      }

      Swal.close();

      await Swal.fire({
        icon: "success",
        title: "¡Cita creada! 🎉",
        html: `
          <p style="margin-bottom:6px;">Tu cita con <b>${displayProviderName}</b> se creó correctamente.</p>
          <p style="margin-bottom:4px;"><b>Servicio:</b> ${service}</p>
          <p style="margin-bottom:4px;"><b>Fecha:</b> ${date}</p>
          <p style="margin-bottom:4px;"><b>Inicio:</b> ${startTime}</p>
          <p style="margin-top:10px; font-size:12px; color:#6b7280;">
            Ahora el proveedor debe confirmar. Cuando confirme, podrás abrir el chat.
          </p>
        `,
        confirmButtonColor: "#22C55E",
        confirmButtonText: "Ir a Mis Citas",
      });

      router.push("/client/profile");
    } catch (err) {
      console.error(err);
      Swal.close();
      await alertError(
        "Error",
        "No se pudo crear la cita. Revisa tu conexión o intenta de nuevo."
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A65FF] via-[#1E73FF] to-[#3D8AFF] pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Crear nueva cita
          </h1>
          <p className="text-white/90 text-sm md:text-base">
            Completa los datos para reservar tu servicio con{" "}
            <span className="font-semibold">{displayProviderName}</span>.
          </p>
        </div>

        {/* Contenedor principal */}
        <div className="grid lg:grid-cols-[1.3fr_1fr] gap-6">
          {/* Columna izquierda: formulario */}
          <form
            onSubmit={handleSubmit}
            className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-6 md:p-8 space-y-6"
          >
            {/* Servicio */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800">
                Tipo de servicio
              </label>
              <select
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/50 outline-none"
              >
                <option value="">Selecciona una opción</option>
                {SERVICE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Fecha y horario */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Fecha */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">
                  Fecha
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  max={`${new Date().getFullYear() + 1}-12-31`}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/50 outline-none"
                />
              </div>

              {/* Horario */}
              <div className="space-y-2 mb-16">
                <label className="block text-sm font-semibold text-gray-800">
                  Horario preferido
                </label>
                <Select
                  options={TIME_SLOTS.map((slot) => ({
                    value: slot,
                    label: slot,
                  }))}
                  value={timeSlot ? { value: timeSlot, label: timeSlot } : null}
                  onChange={(option) => setTimeSlot(option?.value || "")}
                  placeholder="Selecciona un horario"
                  menuPlacement="bottom"
                  maxMenuHeight={180}
                  styles={{
                    menu: (provided) => ({ ...provided, zIndex: 9999 }),
                    option: (provided, state) => ({
                      ...provided,
                      color: "#111",
                      backgroundColor: state.isSelected
                        ? "#e0f2fe"
                        : state.isFocused
                        ? "#f0f9ff"
                        : "white",
                    }),
                    singleValue: (provided) => ({
                      ...provided,
                      color: "#111",
                    }),
                    placeholder: (provided) => ({
                      ...provided,
                      color: "#888",
                    }),
                    input: (provided) => ({
                      ...provided,
                      color: "#111",
                    }),
                  }}
                />
              </div>
            </div>

            {/* Dirección */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800">
                Dirección del servicio
              </label>

              <div className="grid md:grid-cols-3 gap-3">
                <input
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Calle"
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm outline-none focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/50"
                />
                <input
                  value={extNumber}
                  onChange={(e) => setExtNumber(e.target.value)}
                  placeholder="No. Ext"
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm outline-none focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/50"
                />
                <input
                  value={intNumber}
                  onChange={(e) => setIntNumber(e.target.value)}
                  placeholder="No. Int (opcional)"
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm outline-none focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/50"
                />

                <input
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Colonia"
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm outline-none focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/50"
                />
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ciudad"
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm outline-none focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/50"
                />
                <input
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Estado"
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm outline-none focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/50"
                />

                <input
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="Código postal"
                  className="md:col-span-3 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm outline-none focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/50"
                />
              </div>

              <p className="text-xs text-gray-500">
                Se enviará al backend como: <b>{fullAddress || "—"}</b>
              </p>
            </div>

            {/* Notas */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800">
                Detalles adicionales{" "}
                <span className="text-gray-500">(requerido)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Ej: Tengo mascotas, prefiero productos ecológicos…"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/50 outline-none resize-none"
              />
              <p className="text-[11px] text-gray-500">
                Tip: tu backend requiere <b>notes</b>. Con una línea basta 🙂
              </p>
            </div>

            {/* Botón */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full rounded-xl bg-[#22C55E] py-3 text-sm md:text-base font-semibold text-white shadow-lg shadow-[#22C55E]/40 hover:bg-[#16A34A] transition-colors"
              >
                Confirmar cita
              </button>
            </div>
          </form>

          {/* Columna derecha: tarjeta provider */}
          <div className="space-y-4">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-6">
              <div className="flex items-center gap-4 mb-4">
                {providerImageUrl ? (
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#22C55E]/70 shadow-md bg-gray-100">
                    <img
                      src={providerImageUrl}
                      alt={displayProviderName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-14 w-14 rounded-full bg-[#22C55E] flex items-center justify-center text-white font-bold text-xl">
                    {displayProviderName.charAt(0)}
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-1">
                    Estás reservando con
                  </p>
                  <h2 className="text-lg font-bold text-gray-900">
                    {displayProviderName}
                  </h2>

                  <div className="mt-1 flex items-center gap-2">
                    <Stars value={provider?.rating ?? 0} />
                    {loadingProvider ? (
                      <span className="text-xs text-gray-400">(cargando…)</span>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Días/horarios */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <h3 className="text-[11px] font-semibold text-gray-500 uppercase mb-1">
                    Días
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {(provider?.days ?? []).slice(0, 6).map((d, i) => (
                      <span
                        key={`day-${i}`}
                        className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[11px] font-medium"
                      >
                        {d}
                      </span>
                    ))}
                    {!provider?.days?.length && (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-[11px] font-semibold text-gray-500 uppercase mb-1">
                    Horarios
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {(provider?.hours ?? []).slice(0, 4).map((h, i) => (
                      <span
                        key={`hour-${i}`}
                        className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-[11px] font-medium"
                      >
                        {h}
                      </span>
                    ))}
                    {!provider?.hours?.length && (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Info chat */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-md p-5 text-sm text-gray-700 space-y-2">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                ¿Qué sigue para el chat?
              </h3>
              <ul className="list-disc list-inside space-y-1 text-xs md:text-sm">
                <li>Se crea la cita.</li>
                <li>El proveedor la confirma (status = confirmedProvider).</li>
                <li>Cuando esté confirmada, mostramos botón “Abrir chat”.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
