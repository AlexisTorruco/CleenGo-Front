"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { useAuth } from "@/app/contexts/AuthContext";

// ==== Tipos basados en tu JSON real ====
type Role = "client" | "provider" | "admin";

interface UserLite {
  id: string;
  name: string;
  surname?: string;
  email: string;
  profileImgUrl?: string | null;
  phone?: string | null;
  role?: Role;
}

type AppointmentStatus =
  | "pending"
  | "confirmedProvider"
  | "confirmedClient"
  | "completed"
  | "cancelled"
  | string;

interface Appointment {
  id: string;
  clientId: UserLite;
  providerId: UserLite;
  notes?: string | null;
  price?: string | null;
  addressUrl?: string | null;
  date: string; // "2025-12-12"
  startHour: string; // "10:00"
  endHour: string; // "11:00"
  status: AppointmentStatus;
  isActive: boolean;
}

interface AppointmentsResponse {
  providerAppointments: Appointment[];
  clientAppointments: Appointment[];
}

export default function ClientProfileDashboard() {
  const router = useRouter();
  const { user, token } = useAuth();

  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [mounted, setMounted] = useState(false);

  // ✅ Siempre primero hooks, luego retornos condicionales en el render
  useEffect(() => {
    setMounted(true);
  }, []);

  // =========================
  // FETCH CITAS (endpoint real)
  // =========================
  useEffect(() => {
    if (!mounted) return;
    if (!user) return;

    if (!backendUrl) {
      console.error("❌ NEXT_PUBLIC_BACKEND_URL no está definido");
      Swal.fire({
        icon: "error",
        title: "Error de configuración",
        text: "NEXT_PUBLIC_BACKEND_URL no está definido en el frontend.",
        confirmButtonColor: "#22C55E",
      });
      return;
    }

    const controller = new AbortController();

    const run = async () => {
      setLoading(true);
      try {
        // ✅ YA que arreglaste bearerAuth, usa el endpoint que depende del usuario autenticado
        const url = `${backendUrl}/appointments`;

        const res = await fetch(url, {
          method: "GET",
          headers: {
            accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`Error al obtener citas: ${res.status}`);
        }

        const data: AppointmentsResponse | any = await res.json();

        // ✅ Tu backend devuelve { providerAppointments, clientAppointments }
        const list: Appointment[] = data?.clientAppointments ?? [];

        setAppointments(list);
      } catch (err: any) {
        if (err?.name === "AbortError") return;

        console.error("❌ Excepción al cargar citas:", err);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudieron cargar tus citas",
          confirmButtonColor: "#22C55E",
        });
      } finally {
        setLoading(false);
      }
    };

    run();

    return () => controller.abort();
  }, [mounted, user, token, backendUrl]);

  // =========================
  // CONTADORES
  // =========================
  const stats = useMemo(() => {
    const total = appointments.length;

    const pending = appointments.filter((a) =>
      String(a.status).toLowerCase().includes("pending")
    ).length;

    const confirmed = appointments.filter((a) =>
      String(a.status).toLowerCase().includes("confirmed")
    ).length;

    const completed = appointments.filter((a) =>
      String(a.status).toLowerCase().includes("completed")
    ).length;

    // Próximas: confirmadas y fecha >= hoy
    const today = new Date();
    const todayStart = new Date(today.toDateString()); // 00:00 local
    const upcoming = appointments.filter((a) => {
      const d = new Date(a.date + "T00:00:00");
      const isConfirmed = String(a.status).toLowerCase().includes("confirmed");
      return isConfirmed && d >= todayStart;
    }).length;

    return { total, pending, upcoming, confirmed, completed };
  }, [appointments]);

  // ✅ Render guard (ya después de hooks)
  if (!mounted) return null;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-700">
        <div className="bg-white shadow-md rounded-xl p-6 text-center w-[360px]">
          <h2 className="text-lg font-semibold mb-2">Sesión requerida</h2>
          <p className="text-sm text-gray-500 mb-4">
            Inicia sesión para ver tu dashboard.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="w-full bg-[#22C55E] text-white px-4 py-2 rounded-lg font-semibold"
          >
            Ir a login
          </button>
        </div>
      </div>
    );
  }

  // =========================
  // UI
  // =========================
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EAF3FF] via-[#ECFFFB] to-[#EAF3FF] pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header perfil */}
        <div className="bg-white/95 rounded-2xl shadow-xl p-6 flex flex-col sm:flex-row items-center gap-4">
          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-[#0A65FF]/20 bg-gray-100 shrink-0">
            {user.profileImgUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.profileImgUrl}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-white bg-[#0A65FF]">
                {user.name?.charAt(0)?.toUpperCase() ?? "U"}
              </div>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-3xl font-extrabold text-[#0A65FF]">
              {user.name} {user.surname ?? ""}
            </h1>
            <p className="text-gray-600 text-sm">{user.email}</p>
            {(user as any).phone ? (
              <p className="text-gray-600 text-sm">{(user as any).phone}</p>
            ) : null}
          </div>

          <button
            onClick={() => router.push("/client/profile/edit")}
            className="bg-[#0A65FF] text-white px-5 py-2.5 rounded-xl font-semibold hover:opacity-90"
          >
            Editar Perfil
          </button>
        </div>

        {/* Stats (NO duplicados) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-6">
          <StatCard title="Total de Citas" value={stats.total} tone="blue" />
          <StatCard title="Pendientes" value={stats.pending} tone="amber" />
          <StatCard title="Próximas" value={stats.upcoming} tone="cyan" />
          <StatCard title="Completadas" value={stats.completed} tone="green" />
        </div>

        {/* Mis citas */}
        <div className="bg-white/95 rounded-2xl shadow-xl mt-6 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#0A65FF] flex items-center justify-center text-white font-bold">
              📅
            </div>
            <h2 className="text-3xl font-extrabold text-[#0A65FF]">
              Mis Citas
            </h2>
          </div>

          {loading && (
            <div className="py-10 text-center text-gray-600">
              Cargando citas...
            </div>
          )}

          {!loading && appointments.length === 0 && (
            <div className="py-12 text-center">
              <div className="text-6xl mb-3">🗓️</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                No tienes citas aún
              </h3>
              <p className="text-gray-600 mb-5">
                Agenda tu primera cita con un proveedor
              </p>
              <button
                onClick={() => router.push("/client/providers")}
                className="bg-[#0A65FF] text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90"
              >
                Ver Proveedores
              </button>
            </div>
          )}

          {!loading && appointments.length > 0 && (
            <div className="space-y-4">
              {appointments.map((a) => {
                const provider = a.providerId;
                const providerName = `${provider?.name ?? "Proveedor"} ${
                  provider?.surname ?? ""
                }`.trim();

                const badge = statusBadge(a.status);

                return (
                  <div
                    key={a.id}
                    className="rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-[#F6FBFF] p-4 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4"
                  >
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 shrink-0">
                      {provider?.profileImgUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={provider.profileImgUrl}
                          alt={providerName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#22C55E] text-white font-bold">
                          {providerName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="font-bold text-gray-900">
                        {providerName}
                      </div>
                      <div className="text-sm text-gray-600">
                        {a.date} · {a.startHour} - {a.endHour}
                      </div>
                      {a.addressUrl ? (
                        <div className="text-sm text-gray-500 line-clamp-1">
                          {a.addressUrl}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.className}`}
                      >
                        {badge.label}
                      </span>

                      {String(a.status).toLowerCase().includes("confirmed") && (
                        <button
                          onClick={() =>
                            router.push(
                              `/client/chat?appointmentId=${a.id}&providerId=${provider?.id}`
                            )
                          }
                          className="bg-[#0A65FF] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90"
                        >
                          Abrir chat
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  tone,
}: {
  title: string;
  value: number;
  tone: "blue" | "amber" | "cyan" | "green";
}) {
  const toneMap: Record<typeof tone, string> = {
    blue: "bg-white border-[#0A65FF]/20 text-[#0A65FF]",
    amber: "bg-[#FFF7E6] border-[#F59E0B]/20 text-[#B45309]",
    cyan: "bg-[#ECFEFF] border-[#06B6D4]/20 text-[#0E7490]",
    green: "bg-[#ECFDF5] border-[#22C55E]/20 text-[#166534]",
  };

  return (
    <div
      className={`rounded-2xl shadow-lg border p-5 ${toneMap[tone]} flex flex-col gap-2`}
    >
      <div className="text-sm font-semibold text-gray-600">{title}</div>
      <div className="text-4xl font-extrabold">{value}</div>
    </div>
  );
}

function statusBadge(status: string) {
  const s = String(status).toLowerCase();

  if (s.includes("confirmed"))
    return { label: "Confirmada", className: "bg-blue-50 text-blue-700" };

  if (s.includes("pending"))
    return { label: "Pendiente", className: "bg-yellow-50 text-yellow-800" };

  if (s.includes("completed"))
    return { label: "Completada", className: "bg-green-50 text-green-700" };

  if (s.includes("cancel"))
    return { label: "Cancelada", className: "bg-red-50 text-red-700" };

  return { label: status, className: "bg-gray-100 text-gray-700" };
}
