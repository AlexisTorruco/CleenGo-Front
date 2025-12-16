// src/app/components/ClientDashboard.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { motion } from "framer-motion";
import { useAuth } from "@/app/contexts/AuthContext";
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  User as UserIcon,
  MapPin,
  MessageCircle,
  Bell,
  Briefcase,
} from "lucide-react";

// ============================================
// TIPOS (alineados a tu JSON REAL)
// ============================================
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
  | "rejected"
  | string;

interface Appointment {
  id: string;
  clientId: UserLite;
  providerId: UserLite;
  notes?: string | null;
  price?: string | null;
  addressUrl?: string | null;
  date: string;
  startHour: string;
  endHour: string;
  status: AppointmentStatus;
  isActive: boolean;
}

interface AppointmentsResponse {
  providerAppointments: Appointment[];
  clientAppointments: Appointment[];
}

// unread summary desde backend
type UnreadSummaryItem = {
  appointmentId: string;
  otherUser?: {
    id: string;
    name: string;
    surname?: string;
  };
  count: number;
};

type ClientTabKey = "pending" | "confirmed" | "completed";

export default function ClientDashboard() {
  const router = useRouter();
  const { user, token } = useAuth();

  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.VITE_BACKEND_URL;

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeTab, setActiveTab] = useState<ClientTabKey>("pending");

  // unread map: appointmentId -> count
  const [unreadByAppointment, setUnreadByAppointment] = useState<
    Record<string, number>
  >({});

  const normalizeStatus = (s: any) => String(s ?? "").toLowerCase();

  const statusConfig = {
    pending: {
      bg: "bg-yellow-100",
      text: "text-yellow-700",
      label: "Pendiente",
    },
    confirmed: {
      bg: "bg-blue-100",
      text: "text-blue-700",
      label: "Confirmada",
    },
    completed: {
      bg: "bg-emerald-100",
      text: "text-emerald-700",
      label: "Completada",
    },
    cancelled: { bg: "bg-red-100", text: "text-red-700", label: "Cancelada" },
    rejected: { bg: "bg-gray-200", text: "text-gray-700", label: "Rechazada" },
  } as const;

  const getBadge = (status: AppointmentStatus) => {
    const s = normalizeStatus(status);

    if (s.includes("confirmed")) return statusConfig.confirmed;
    if (s.includes("pending")) return statusConfig.pending;
    if (s.includes("completed")) return statusConfig.completed;
    if (s.includes("cancel")) return statusConfig.cancelled;
    if (s.includes("reject")) return statusConfig.rejected;

    return { bg: "bg-gray-100", text: "text-gray-700", label: String(status) };
  };

  const isPending = (a: Appointment) =>
    normalizeStatus(a.status).includes("pending");
  const isConfirmed = (a: Appointment) =>
    normalizeStatus(a.status).includes("confirmed");
  const isCompleted = (a: Appointment) =>
    normalizeStatus(a.status).includes("completed");

  useEffect(() => setMounted(true), []);

  // =========================
  // FETCH CITAS
  // =========================
  const fetchAppointments = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);

      const res = await fetch(`${backendUrl}/appointments`, {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (!res.ok) throw new Error(`Error al obtener citas: ${res.status}`);

      const data: AppointmentsResponse | any = await res.json();
      const list: Appointment[] = data?.clientAppointments ?? [];

      setAppointments(list);

      // Tab default inteligente:
      if (list.some((a) => isPending(a))) setActiveTab("pending");
      else if (list.some((a) => isConfirmed(a))) setActiveTab("confirmed");
      else setActiveTab("completed");
    } catch (e) {
      console.error(e);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar tus citas",
        confirmButtonColor: "#22C55E",
      });
    } finally {
      setLoading(false);
    }
  }, [backendUrl, token]);

  // =========================
  // FETCH UNREAD SUMMARY
  // =========================
  const fetchUnreadSummary = useCallback(async () => {
    if (!backendUrl || !token || !user?.id) return;

    const res = await fetch(`${backendUrl}/chat/unread-summary`, {
      headers: {
        Authorization: `Bearer ${token}`,
        accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) return;

    const data: UnreadSummaryItem[] = await res.json();

    const map: Record<string, number> = {};
    data.forEach((d) => {
      map[d.appointmentId] = d.count;
    });

    setUnreadByAppointment(map);
  }, [backendUrl, token, user?.id]);

  useEffect(() => {
    if (!mounted) return;

    if (!user || !token) {
      router.push("/login");
      return;
    }

    fetchAppointments();
    fetchUnreadSummary();

    const onFocus = () => {
      fetchAppointments();
      fetchUnreadSummary();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [mounted, user, token, router, fetchAppointments, fetchUnreadSummary]);

  // Polling suave para badge (por si el otro manda mensajes y tú estás en dashboard)
  useEffect(() => {
    if (!token || !user?.id) return;
    const id = window.setInterval(() => fetchUnreadSummary(), 6000);
    return () => window.clearInterval(id);
  }, [fetchUnreadSummary, token, user?.id]);

  // =========================
  // LISTAS PARA TABS
  // =========================
  const pendingList = useMemo(
    () => appointments.filter(isPending),
    [appointments]
  );
  const confirmedList = useMemo(
    () => appointments.filter(isConfirmed),
    [appointments]
  );
  const completedList = useMemo(
    () => appointments.filter(isCompleted),
    [appointments]
  );

  const tabList = useMemo(() => {
    if (activeTab === "pending") return pendingList;
    if (activeTab === "confirmed") return confirmedList;
    return completedList;
  }, [activeTab, pendingList, confirmedList, completedList]);

  // =========================
  // STATS
  // =========================
  const stats = useMemo(() => {
    const total = appointments.length;
    const pending = pendingList.length;

    const completed = completedList.length;

    // Próximas = confirmadas y date >= hoy
    const today = new Date();
    const todayStart = new Date(today.toDateString());
    const upcoming = confirmedList.filter((a) => {
      const d = new Date(a.date + "T00:00:00");
      return d >= todayStart;
    }).length;

    return { total, pending, upcoming, completed };
  }, [
    appointments.length,
    pendingList.length,
    confirmedList,
    completedList.length,
  ]);

  // =========================
  // GUARDS
  // =========================
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
  // RENDER
  // =========================
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-emerald-50 pt-24 pb-12 px-4">
      {/* Blobs fondo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-300/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Header perfil (estilo pro) */}
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-white/50 overflow-hidden mb-8"
        >
          <div className="h-2 bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500" />

          <div className="p-8 flex flex-col md:flex-row items-center gap-6">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 rounded-full blur opacity-40 group-hover:opacity-75 transition-opacity" />
              {user.profileImgUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.profileImgUrl}
                  alt="Foto de perfil"
                  className="relative w-28 h-28 rounded-full object-cover border-4 border-white"
                />
              ) : (
                <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 via-cyan-500 to-emerald-500 flex items-center justify-center border-4 border-white">
                  <span className="text-3xl font-extrabold text-white">
                    {user.name?.charAt(0)?.toUpperCase() ?? "U"}
                  </span>
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full p-2 shadow-lg">
                <UserIcon className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                {user.name} {user.surname ?? ""}
              </h1>
              <p className="text-gray-600 font-medium">{user.email}</p>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/client/profile/edit")}
              className="px-5 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Editar Perfil
            </motion.button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total de Citas"
            value={stats.total}
            icon={<Calendar className="w-6 h-6 text-white" />}
            gradient="from-blue-500 to-blue-600"
          />
          <StatCard
            title="Pendientes"
            value={stats.pending}
            icon={<Bell className="w-6 h-6 text-white" />}
            gradient="from-yellow-500 to-amber-600"
            badge={stats.pending}
          />
          <StatCard
            title="Próximas"
            value={stats.upcoming}
            icon={<Clock className="w-6 h-6 text-white" />}
            gradient="from-cyan-500 to-blue-600"
          />
          <StatCard
            title="Completadas"
            value={stats.completed}
            icon={<CheckCircle className="w-6 h-6 text-white" />}
            gradient="from-emerald-500 to-green-600"
          />
        </div>

        {/* Tabs */}
        <div className="relative z-10 bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-white/50 p-4 mb-8">
          <div className="grid grid-cols-3 gap-3">
            <TabButton
              active={activeTab === "pending"}
              onClick={() => setActiveTab("pending")}
              label="Pendientes"
              icon={<Bell className="w-5 h-5" />}
              count={pendingList.length}
            />
            <TabButton
              active={activeTab === "confirmed"}
              onClick={() => setActiveTab("confirmed")}
              label="Confirmadas"
              icon={<Briefcase className="w-5 h-5" />}
              count={confirmedList.length}
            />
            <TabButton
              active={activeTab === "completed"}
              onClick={() => setActiveTab("completed")}
              label="Completadas"
              icon={<CheckCircle className="w-5 h-5" />}
              count={completedList.length}
            />
          </div>
        </div>

        {/* Content */}
        <SectionCard
          title={
            activeTab === "pending"
              ? "Citas pendientes"
              : activeTab === "confirmed"
              ? "Citas confirmadas"
              : "Citas completadas"
          }
          subtitle={
            activeTab === "pending"
              ? "Citas en espera de confirmación"
              : activeTab === "confirmed"
              ? "Citas listas (con chat disponible)"
              : "Historial de servicios finalizados"
          }
          icon={
            activeTab === "pending" ? (
              <Bell className="w-6 h-6 text-white" />
            ) : activeTab === "confirmed" ? (
              <Briefcase className="w-6 h-6 text-white" />
            ) : (
              <CheckCircle className="w-6 h-6 text-white" />
            )
          }
          iconBg={
            activeTab === "pending"
              ? "from-yellow-500 to-amber-500"
              : activeTab === "confirmed"
              ? "from-blue-500 to-cyan-500"
              : "from-emerald-500 to-green-600"
          }
          count={tabList.length}
        >
          {loading ? (
            <div className="py-12 text-center text-gray-600">Cargando...</div>
          ) : tabList.length === 0 ? (
            <EmptyState
              title="No hay citas aquí"
              subtitle="Cuando existan citas en este estado, aparecerán aquí."
              icon={<AlertCircle className="w-16 h-16 text-blue-600" />}
            />
          ) : (
            <div className="space-y-4">
              {tabList.map((a) => {
                const provider = a.providerId;
                const providerName = `${provider?.name ?? "Proveedor"} ${
                  provider?.surname ?? ""
                }`.trim();

                const badge = getBadge(a.status);
                const unread = unreadByAppointment[a.id] ?? 0;

                return (
                  <motion.div
                    key={a.id}
                    whileHover={{ scale: 1.01 }}
                    className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-100 hover:border-blue-200 rounded-2xl p-6 hover:shadow-xl transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span
                            className={`px-4 py-1.5 rounded-full text-sm font-bold ${badge.bg} ${badge.text} shadow-sm`}
                          >
                            {badge.label}
                          </span>
                          <div className="font-bold text-gray-900">
                            {providerName}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-gray-700 mb-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">
                            {a.date} · {a.startHour} - {a.endHour}
                          </span>
                        </div>

                        {a.addressUrl && (
                          <div className="flex items-center gap-2 text-gray-600 text-sm">
                            <MapPin className="w-4 h-4 text-emerald-600" />
                            <span className="line-clamp-1">{a.addressUrl}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        {isConfirmed(a) && (
                          <button
                            onClick={() => router.push(`/client/chat/${a.id}`)}
                            className="relative bg-[#0A65FF] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 flex items-center gap-2"
                          >
                            <MessageCircle className="w-4 h-4" />
                            Abrir chat
                            {unread > 0 && (
                              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[11px] rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center font-bold">
                                {unread > 99 ? "99+" : unread}
                              </span>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

// ============================================
// UI HELPERS (mismo estilo que provider)
// ============================================
function TabButton({
  active,
  onClick,
  label,
  icon,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-3 px-4 py-3 rounded-2xl font-semibold transition-all border ${
        active
          ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-transparent shadow-lg"
          : "bg-white/70 text-gray-700 border-white/60 hover:bg-white"
      }`}
    >
      <span className={`${active ? "text-white" : "text-gray-600"}`}>
        {icon}
      </span>
      <span className="hidden sm:inline">{label}</span>
      <span
        className={`text-xs font-bold px-2 py-1 rounded-full ${
          active ? "bg-white/20 text-white" : "bg-blue-50 text-blue-700"
        }`}
      >
        {count ?? 0}
      </span>
    </button>
  );
}

function SectionCard({
  title,
  subtitle,
  icon,
  iconBg,
  count,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative z-10 bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-white/50 p-8"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <div className={`p-3 bg-gradient-to-r ${iconBg} rounded-xl`}>
              {icon}
            </div>
            <span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent">
              {title}
            </span>
          </h2>
          <p className="text-gray-600 mt-2">{subtitle}</p>
        </div>

        <span className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 px-5 py-2 rounded-full text-sm font-bold shadow-md">
          {count} total
        </span>
      </div>

      {children}
    </motion.div>
  );
}

function EmptyState({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="text-center py-16">
      <div className="relative inline-block mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-200 to-cyan-200 rounded-full blur-xl opacity-50" />
        <div className="relative p-6 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full">
          {icon}
        </div>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-lg">{subtitle}</p>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  gradient,
  badge,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  gradient: string;
  badge?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-2xl transition-all p-6 border-2 border-white/50 relative overflow-hidden group"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-white/10 to-white/0" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div
            className={`p-3 bg-gradient-to-br ${gradient} rounded-xl shadow-lg`}
          >
            {icon}
          </div>
          {typeof badge === "number" && badge > 0 ? (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {badge}
            </span>
          ) : null}
        </div>

        <h3 className="text-gray-600 text-sm mb-1 font-semibold">{title}</h3>
        <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
          {value}
        </p>
      </div>
    </motion.div>
  );
}
