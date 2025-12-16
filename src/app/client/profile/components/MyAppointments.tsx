"use client";

import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import {
  getMyAppointments,
  AppointmentItem,
} from "@/app/services/appointments";

function statusLabel(status: string) {
  switch (status) {
    case "confirmedProvider":
      return "Confirmada";
    case "pending":
      return "Pendiente";
    case "completed":
      return "Completada";
    case "cancelled":
      return "Cancelada";
    case "rejected":
      return "Rechazada";
    default:
      return status;
  }
}

export default function MyAppointments() {
  const router = useRouter();
  const { token, user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);

  const counts = useMemo(() => {
    const total = appointments.length;
    const pending = appointments.filter((a) => a.status === "pending").length;
    const next = appointments.filter(
      (a) => a.status === "confirmedProvider"
    ).length;
    const completed = appointments.filter(
      (a) => a.status === "completed"
    ).length;
    return { total, pending, next, completed };
  }, [appointments]);

  useEffect(() => {
    if (!token) return;

    (async () => {
      setLoading(true);
      try {
        const data = await getMyAppointments(token);

        // si eres client, usa clientAppointments
        const list =
          user?.role === "provider"
            ? data.providerAppointments
            : data.clientAppointments;

        setAppointments(list ?? []);
      } catch (err) {
        console.error(err);
        Swal.fire({
          icon: "error",
          title: "No se pudieron cargar tus citas",
          text: "Revisa tu sesión o el backend.",
          confirmButtonColor: "#22C55E",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [token, user?.role]);

  const openChat = (appointmentId: string) => {
    // ruta sugerida (la creamos después)
    router.push(`/client/chat/${appointmentId}`);
  };

  if (!token) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-md">
        <p className="text-gray-700">Inicia sesión para ver tus citas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* contadores (si quieres reusarlos en tus cards de arriba) */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-md">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-2xl font-bold">{counts.total}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-md">
          <p className="text-xs text-gray-500">Pendientes</p>
          <p className="text-2xl font-bold">{counts.pending}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-md">
          <p className="text-xs text-gray-500">Confirmadas</p>
          <p className="text-2xl font-bold">{counts.next}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-md">
          <p className="text-xs text-gray-500">Completadas</p>
          <p className="text-2xl font-bold">{counts.completed}</p>
        </div>
      </div>

      {/* lista */}
      <div className="bg-white rounded-2xl p-6 shadow-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Mis Citas</h2>

        {loading && <p className="text-gray-600">Cargando...</p>}

        {!loading && appointments.length === 0 && (
          <div className="text-center py-10 text-gray-600">
            No tienes citas aún.
          </div>
        )}

        {!loading && appointments.length > 0 && (
          <div className="space-y-4">
            {appointments.map((a) => {
              const provider = a.providerId;
              const canChat = a.status === "confirmedProvider";

              return (
                <div
                  key={a.id}
                  className="border border-gray-100 rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    {/* avatar */}
                    {provider?.profileImgUrl ? (
                      <img
                        src={provider.profileImgUrl}
                        alt={provider.name}
                        className="w-14 h-14 rounded-full object-cover border"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-[#22C55E] text-white flex items-center justify-center font-bold">
                        {provider?.name?.charAt(0) ?? "?"}
                      </div>
                    )}

                    {/* info */}
                    <div>
                      <p className="font-semibold text-gray-900">
                        {provider?.name} {provider?.surname ?? ""}
                      </p>
                      <p className="text-sm text-gray-600">
                        {a.date} · {a.startHour} - {a.endHour}
                      </p>
                      <p className="text-xs text-gray-500">
                        {a.addressUrl ?? "Sin dirección"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                      {statusLabel(a.status)}
                    </span>

                    <button
                      disabled={!canChat}
                      onClick={() => openChat(a.id)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                        canChat
                          ? "bg-[#0A65FF] text-white hover:bg-[#0556d8]"
                          : "bg-gray-200 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      Abrir chat
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
