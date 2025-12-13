"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Swal from "sweetalert2";
import { useAuth } from "@/app/contexts/AuthContext";

// Opciones simuladas de servicio y horarios.
const SERVICE_OPTIONS = [
  "Limpieza general",
  "Limpieza profunda",
  "Jardinería",
  "Oficina / Local comercial",
];

const TIME_SLOTS = [
  "06:00 - 09:00",
  "09:00 - 12:00",
  "12:00 - 15:00",
  "15:00 - 18:00",
];

// Ajusta a lo que realmente devuelve tu back
interface Provider {
  id: string;
  name: string;
  surname?: string;
  email?: string;
  rating?: number;
  profileImgUrl?: string | null;
  days?: string[];
  hours?: string[];
  about?: string;
}

function Stars({
  value = 0,
  count = 5,
  showValue = true,
  reviewsCount,
}: {
  value?: number; // 0..5 (puede venir null/undefined)
  count?: number; // default 5
  showValue?: boolean; // muestra "4.6"
  reviewsCount?: number; // opcional: (12)
}) {
  const safe = Number.isFinite(value) ? Math.max(0, Math.min(count, value)) : 0;
  const filled = Math.round(safe); // si prefieres mitad: lo cambiamos después

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
        // si falla, no bloqueamos UI (pero sí avisamos)
        console.error(e);
      } finally {
        setLoadingProvider(false);
      }
    };

    run();
  }, [backendUrl, providerId]);

  const extractStartTime = (slot: string) => {
    // "09:00 - 12:00" -> "09:00"
    const [from] = slot.split("-").map((s) => s.trim());
    return from;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!user || !token) {
      Swal.fire({
        icon: "warning",
        title: "Inicia sesión",
        text: "Debes iniciar sesión para crear una cita.",
        confirmButtonColor: "#22C55E",
      });
      router.push("/login");
      return;
    }

    if (!backendUrl) {
      Swal.fire({
        icon: "error",
        title: "Error de configuración",
        text: "VITE_BACKEND_URL no está definido.",
        confirmButtonColor: "#22C55E",
      });
      return;
    }

    if (!service || !date || !timeSlot) {
      Swal.fire({
        icon: "warning",
        title: "Completa los campos",
        text: "Selecciona servicio, fecha y horario para continuar.",
        confirmButtonColor: "#22C55E",
      });
      return;
    }

    // backend pide address y notes
    if (!fullAddress) {
      Swal.fire({
        icon: "warning",
        title: "Dirección incompleta",
        text: "Completa al menos calle y ciudad/estado para generar la dirección.",
        confirmButtonColor: "#22C55E",
      });
      return;
    }

    // backend actual pide providerEmail (según tu service)
    const providerEmail = provider?.email || providerEmailFromQuery;
    if (!providerEmail) {
      Swal.fire({
        icon: "error",
        title: "Falta email del proveedor",
        text:
          "Tu backend requiere providerEmail para crear la cita. " +
          "Inclúyelo en /provider o usa GET /provider/:id que lo devuelva.",
        confirmButtonColor: "#22C55E",
      });
      return;
    }

    const payload = {
      service,
      date,
      startTime: extractStartTime(timeSlot),
      notes: notes?.trim() ? notes.trim() : "Sin notas",
      providerEmail,
      address: fullAddress,
    };

    try {
      const res = await fetch(`${backendUrl}/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.error("Create appointment error:", res.status, errText);
        throw new Error("No se pudo crear la cita");
      }

      const created = await res.json();

      await Swal.fire({
        icon: "success",
        title: "Cita creada",
        html: `
          <p style="margin-bottom:6px;">Tu cita con <b>${displayProviderName}</b> se creó correctamente.</p>
          <p style="margin-bottom:4px;"><b>Servicio:</b> ${service}</p>
          <p style="margin-bottom:4px;"><b>Fecha:</b> ${date}</p>
          <p style="margin-bottom:4px;"><b>Inicio:</b> ${extractStartTime(
            timeSlot
          )}</p>
        `,
        confirmButtonColor: "#22C55E",
        confirmButtonText: "Ir a Mis Citas",
      });

      // Aquí es donde luego pondremos: “si status === confirmedProvider => botón Abrir chat”
      // Por ahora te mando a la pantalla de citas.
      router.push("/client/profile"); // o /client/appointments si creamos esa ruta
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo crear la cita. Revisa consola y backend.",
        confirmButtonColor: "#22C55E",
      });
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
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800">
                  Horario preferido
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TIME_SLOTS.map((slot) => {
                    const active = timeSlot === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setTimeSlot(slot)}
                        className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                          active
                            ? "border-[#22C55E] bg-[#22C55E]/10 text-[#15803d]"
                            : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
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
                Detalles adicionales (opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Ej: Tengo mascotas, prefiero productos ecológicos…"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/50 outline-none resize-none"
              />
            </div>

            {/* Botón */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full rounded-xl bg-[#22C55E] py-3 text-sm md:text-base font-semibold text-white shadow-lg shadow-[#22C55E]/40 hover:bg-[#16A34A] transition-colors"
              >
                Confirmar cita
              </button>
              {/* <p className="mt-2 text-[11px] text-center text-gray-500">
                Nota: el backend actual requiere <b>providerEmail</b>.
              </p> */}
            </div>
          </form>

          {/* Columna derecha: tarjeta provider */}
          <div className="space-y-4">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-6">
              <div className="flex items-center gap-4 mb-4">
                {/* Avatar */}
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
                    <Stars
                      value={provider?.rating ?? 0}
                      // reviewsCount={provider?.reviewsCount as any} // si luego lo agregas en el back
                    />
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
                <li>Se crea la cita real (listo).</li>
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
