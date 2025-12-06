"use client";

import { FormEvent, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Swal from "sweetalert2";

// Opciones simuladas de servicio y horarios.
// 👉 Más adelante puedes conectarlas al backend o a lo que venga en el provider.
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

export default function CreateAppointmentPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Viene desde el botón "Agendar Cita"
  const providerId = searchParams.get("providerId");
  const providerNameFromQuery = searchParams.get("providerName");

  // Más adelante puedes traer los datos reales del backend usando providerId.
  const displayProviderName =
    providerNameFromQuery ||
    (providerId ? `Proveedor #${providerId.slice(0, 6)}…` : "Proveedor");

  const [service, setService] = useState("");
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!service || !date || !timeSlot) {
      Swal.fire({
        icon: "warning",
        title: "Completa los campos",
        text: "Selecciona servicio, fecha y horario para continuar.",
        confirmButtonColor: "#22C55E",
      });
      return;
    }

    // 👉 Aquí más adelante harás el POST real al backend.
    //    También aquí se podría disparar un correo con nodemailer
    //    o crear el primer mensaje del chat proveedor-cliente.
    await Swal.fire({
      icon: "success",
      title: "Reserva simulada",
      html: `
        <p style="margin-bottom: 4px;">Tu cita con <b>${displayProviderName}</b> ha sido simulada correctamente.</p>
        <p style="margin-bottom: 4px;"><b>Servicio:</b> ${service}</p>
        <p style="margin-bottom: 4px;"><b>Fecha:</b> ${date}</p>
        <p style="margin-bottom: 4px;"><b>Horario:</b> ${timeSlot}</p>
      `,
      confirmButtonColor: "#22C55E",
      confirmButtonText: "Volver a proveedores",
    });

    router.push("/client/providers");
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
            {/* Pasos */}
            <div className="flex items-center justify-between text-xs md:text-sm text-gray-500 mb-2">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#22C55E]/10 text-[#16A34A] text-xs font-bold">
                  1
                </span>
                <span>Detalles del servicio</span>
              </div>
              <span className="hidden sm:inline">Simulación de reserva</span>
            </div>

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
              <p className="text-xs text-gray-500">
                Más adelante podemos llenar esto con los servicios reales del
                proveedor desde el backend.
              </p>
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
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/50 outline-none placeholder:text-gray-400"
                />
                <p className="text-xs text-gray-500">
                  Rango permitido: desde hoy hasta diciembre{" "}
                  {new Date().getFullYear() + 1}.
                </p>
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
                <p className="text-xs text-gray-500">
                  Más adelante podemos reemplazar estos horarios por los que
                  envíe el backend.
                </p>
              </div>
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
                placeholder="Ejemplo: Tengo mascotas, prefiero productos ecológicos, etc."
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/50 outline-none resize-none placeholder:text-gray-400"
              />
            </div>

            {/* Botón principal */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full rounded-xl bg-[#22C55E] py-3 text-sm md:text-base font-semibold text-white shadow-lg shadow-[#22C55E]/40 hover:bg-[#16A34A] transition-colors"
              >
                Confirmar cita simulada
              </button>
              <p className="mt-2 text-[11px] text-center text-gray-500">
                Esta pantalla es solo una simulación. Después conectaremos este
                flujo con el backend de CleenGo.
              </p>
            </div>
          </form>

          {/* Columna derecha: resumen del proveedor */}
          <div className="space-y-4">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-6">
              <div className="flex items-center gap-4 mb-4">
                {/* Avatar del proveedor (simulado) */}
                <div className="relative h-14 w-14 rounded-full bg-[#22C55E] flex items-center justify-center text-white font-bold text-xl">
                  {displayProviderName.charAt(0)}
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase mb-1">
                    Estás reservando con
                  </p>
                  <h2 className="text-lg font-bold text-gray-900">
                    {displayProviderName}
                  </h2>
                  <p className="text-xs text-gray-500">
                    Más adelante podemos mostrar aquí la info real del
                    proveedor (foto, rating, servicios, etc.)
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Servicio</span>
                  <span className="font-medium text-gray-900">
                    {service || "Sin seleccionar"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Fecha</span>
                  <span className="font-medium text-gray-900">
                    {date || "Sin seleccionar"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Horario</span>
                  <span className="font-medium text-gray-900">
                    {timeSlot || "Sin seleccionar"}
                  </span>
                </div>
              </div>
            </div>

            {/* Tarjeta informativa */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-md p-5 text-sm text-gray-700 space-y-2">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                ¿Qué sigue después?
              </h3>
              <ul className="list-disc list-inside space-y-1 text-xs md:text-sm">
                <li>
                  Más adelante, esta pantalla enviará la información al backend
                  para crear la cita real.
                </li>
                <li>
                  Aquí podríamos iniciar el hilo de chat cliente-proveedor
                  (por ejemplo con Crono/Chronos, websockets, etc.).
                </li>
                <li>
                  También es buen lugar para disparar un correo de confirmación
                  usando nodemailer.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
