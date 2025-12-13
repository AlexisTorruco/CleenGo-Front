// src/app/components/ProviderDashboard.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  Star,
  User as UserIcon,
  Mail,
  Phone,
  TrendingUp,
  AlertCircle,
  Loader2,
  Briefcase,
  MapPin,
  Edit,
  Award,
  Check,
  X,
  Bell,
  MessageCircle,
  ShoppingCart,
} from "lucide-react";

// ============================================
// TIPOS (alineados a tu JSON real)
// ============================================
type Role = "client" | "provider" | "admin" | string;

interface UserLite {
  id: string;
  name: string;
  surname?: string | null;
  email: string;
  profileImgUrl?: string | null;
  phone?: string | null;
  role?: Role;
  rating?: number | null;
  isActive?: boolean;
  days?: string[];
  hours?: string[];
  about?: string | null;

  // opcionales (no los usamos, pero vienen en tu JSON)
  street?: string | null;
  exteriorNumber?: string | null;
  interiorNumber?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  fullAddress?: string | null;
  latitude?: string | null;
  longitude?: string | null;
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
  price?: string | null; // "500.00"
  addressUrl?: string | null;
  date: string; // "2025-12-12"
  startHour: string; // "10:00"
  endHour?: string | null; // puede venir null
  status: AppointmentStatus;
  isActive: boolean;
}

interface AppointmentsResponse {
  providerAppointments: Appointment[];
  clientAppointments: Appointment[];
}

interface DashboardStats {
  totalEarned: number;
  completedServices: number;
  upcomingServices: number;
  averageRating: number;
  pendingRequests: number;
}

type TabKey = "requests" | "jobs" | "purchases";

// ============================================
// HELPERS
// ============================================
function safeMoneyFromPrice(price?: string | null) {
  const n = Number(price ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function isConfirmedForChat(status: AppointmentStatus) {
  return String(status).toLowerCase() === "confirmedprovider";
}

function statusBadge(status: AppointmentStatus) {
  const s = String(status).toLowerCase();

  if (s === "pending")
    return { label: "Pendiente", className: "bg-yellow-100 text-yellow-800" };

  if (s === "confirmedprovider" || s === "confirmedclient")
    return { label: "Confirmada", className: "bg-blue-100 text-blue-700" };

  if (s === "completed")
    return {
      label: "Completada",
      className: "bg-emerald-100 text-emerald-700",
    };

  if (s === "cancelled")
    return { label: "Cancelada", className: "bg-red-100 text-red-700" };

  if (s === "rejected")
    return { label: "Rechazada", className: "bg-pink-100 text-pink-700" };

  return { label: status, className: "bg-gray-100 text-gray-700" };
}

// ============================================
// COMPONENTE
// ============================================
export default function ProviderDashboard() {
  const { user, token, logout } = useAuth();
  const router = useRouter();

  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

  const [activeTab, setActiveTab] = useState<TabKey>("requests");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // “profile” lo armamos de forma segura:
  // 1) si existe endpoint de provider profile, lo usamos (opcional)
  // 2) fallback a info del user auth
  const [profile, setProfile] = useState<UserLite | null>(null);

  // Datos reales del back
  const [providerAppointments, setProviderAppointments] = useState<
    Appointment[]
  >([]);
  const [clientAppointments, setClientAppointments] = useState<Appointment[]>(
    []
  );
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.id || !token) return;

    setLoading(true);
    setError(null);

    try {
      // 1) Traer citas (este es el core)
      const apRes = await fetch(`${backendUrl}/appointments`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!apRes.ok) {
        if (apRes.status === 401) {
          logout();
          router.push("/login");
          return;
        }
        throw new Error(`Error al cargar citas (${apRes.status})`);
      }

      const apData = (await apRes.json()) as AppointmentsResponse;

      const prov = Array.isArray(apData?.providerAppointments)
        ? apData.providerAppointments
        : [];
      const cli = Array.isArray(apData?.clientAppointments)
        ? apData.clientAppointments
        : [];

      setProviderAppointments(prov);
      setClientAppointments(cli);

      // 2) Perfil: intentamos endpoint /provider/:id (si existe en tu back)
      //    Si falla, usamos fallback a info de auth + lo que venga en prov[0].providerId
      let computedProfile: UserLite | null = null;

      try {
        const profileRes = await fetch(`${backendUrl}/provider/${user.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        if (profileRes.ok) {
          const p = await profileRes.json();
          // Algunos back devuelven el provider entity directo, otros envuelven.
          computedProfile = p?.provider ?? p ?? null;
        }
      } catch {
        // ignore (fallback abajo)
      }

      if (!computedProfile) {
        // fallback: usa auth user + mezcla days/hours/about si vienen en citas
        const fromAppointmentsProvider = prov?.[0]?.providerId ?? null;
        computedProfile = {
          ...(fromAppointmentsProvider ?? {}),
          ...(user as any),
          // preferimos datos “ricos” si llegaron desde providerId del appointment
          days: fromAppointmentsProvider?.days ?? (user as any)?.days,
          hours: fromAppointmentsProvider?.hours ?? (user as any)?.hours,
          about: fromAppointmentsProvider?.about ?? (user as any)?.about,
        };
      }

      setProfile(computedProfile);

      // Tab por defecto inteligente:
      // si hay solicitudes pending, abre Solicitudes; si no, Mis trabajos
      const hasPending = prov.some(
        (a) => String(a.status).toLowerCase() === "pending"
      );
      setActiveTab(hasPending ? "requests" : "jobs");
    } catch (err) {
      console.error("❌ Error fetching provider dashboard:", err);
      setError(
        err instanceof Error ? err.message : "Error al cargar el dashboard"
      );
    } finally {
      setLoading(false);
    }
  }, [backendUrl, logout, router, token, user?.id]);

  const handleAppointmentAction = async (
    appointmentId: string,
    action: "accept" | "reject"
  ) => {
    if (!token) return;

    setProcessingId(appointmentId);
    setError(null);

    try {
      // Back real: PUT /appointments/status/:id
      // status aceptados: CONFIRMEDPROVIDER | COMPLETED | CANCELLED | REJECTED
      const newStatus = action === "accept" ? "confirmedProvider" : "cancelled";

      const response = await fetch(
        `${backendUrl}/appointments/status/${appointmentId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        const msg = await response.text().catch(() => "");
        throw new Error(
          `Error al actualizar status (${response.status}) ${
            msg ? `- ${msg}` : ""
          }`
        );
      }

      await fetchData();
    } catch (err) {
      console.error("❌ Error updating appointment:", err);
      setError(
        err instanceof Error ? err.message : "Error al actualizar la solicitud"
      );
    } finally {
      setProcessingId(null);
    }
  };

  // Auth gate
  useEffect(() => {
    if (!user || !token) {
      router.push("/login");
      return;
    }
    if (String(user.role).toLowerCase() !== "provider") {
      router.push("/dashboard");
      return;
    }
    fetchData();

    const handleFocus = () => fetchData();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchData, router, token, user]);

  // Derivados
  const requests = useMemo(
    () =>
      providerAppointments.filter(
        (a) => String(a.status).toLowerCase() === "pending"
      ),
    [providerAppointments]
  );

  const jobs = useMemo(
    () =>
      providerAppointments.filter(
        (a) => String(a.status).toLowerCase() !== "pending"
      ),
    [providerAppointments]
  );

  const stats: DashboardStats = useMemo(() => {
    const pendingRequests = requests.length;

    const completedServices = providerAppointments.filter(
      (a) => String(a.status).toLowerCase() === "completed"
    ).length;

    // “upcoming” simple para tu modelo actual:
    // - confirmado por proveedor (ya puede existir chat y trabajo programado)
    // - confirmado por cliente (si lo usas)
    const upcomingServices = providerAppointments.filter((a) => {
      const s = String(a.status).toLowerCase();
      return s === "confirmedprovider" || s === "confirmedclient";
    }).length;

    const totalEarned = providerAppointments
      .filter((a) => String(a.status).toLowerCase() === "completed")
      .reduce((sum, a) => sum + safeMoneyFromPrice(a.price), 0);

    const averageRating =
      typeof profile?.rating === "number" && profile.rating > 0
        ? profile.rating
        : 0;

    return {
      pendingRequests,
      completedServices,
      upcomingServices,
      totalEarned,
      averageRating: Math.round(averageRating * 10) / 10,
    };
  }, [profile?.rating, providerAppointments, requests.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando tu dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center"
        >
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchData}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all"
          >
            Reintentar
          </button>
        </motion.div>
      </div>
    );
  }

  const displayName = `${profile?.name ?? user?.name ?? ""} ${
    profile?.surname ?? (user as any)?.surname ?? ""
  }`.trim();
  const email = user?.email ?? profile?.email ?? "";
  const phone = profile?.phone ?? (user as any)?.phone ?? null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-emerald-50 pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-white/50 overflow-hidden mb-8"
        >
          <div className="h-2 bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500" />

          <div className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Avatar */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 rounded-full blur opacity-40 group-hover:opacity-75 transition-opacity" />
                {profile?.profileImgUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.profileImgUrl}
                    alt="Foto de perfil"
                    className="relative w-24 h-24 rounded-full object-cover border-4 border-white"
                  />
                ) : (
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 via-cyan-500 to-emerald-500 flex items-center justify-center border-4 border-white">
                    <UserIcon className="w-12 h-12 text-white" />
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full p-2 shadow-lg">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent mb-3">
                  {displayName || "Proveedor"}
                </h1>

                <div className="flex flex-col md:flex-row gap-4 text-gray-600 mb-4">
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <span>{email}</span>
                  </div>

                  {phone ? (
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      <Phone className="w-4 h-4 text-cyan-600" />
                      <span>{phone}</span>
                    </div>
                  ) : null}
                </div>

                {profile?.about ? (
                  <p className="text-gray-600 text-sm bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                    {profile.about}
                  </p>
                ) : null}

                {/* Disponibilidad */}
                {profile?.days?.length || profile?.hours?.length ? (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex flex-wrap gap-4 items-start">
                      {profile?.days?.length ? (
                        <>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            <span className="font-semibold text-gray-700">
                              Días:
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {profile.days.map((d) => (
                              <span
                                key={d}
                                className="px-3 py-1 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 rounded-full text-sm font-medium"
                              >
                                {d}
                              </span>
                            ))}
                          </div>
                        </>
                      ) : null}

                      {profile?.hours?.length ? (
                        <>
                          <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-emerald-600" />
                            <span className="font-semibold text-gray-700">
                              Horario:
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {profile.hours.map((h) => (
                              <span
                                key={h}
                                className="px-3 py-1 bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 rounded-full text-sm font-medium"
                              >
                                {h}
                              </span>
                            ))}
                          </div>
                        </>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Rating + Edit */}
              <div className="flex flex-col gap-3 w-full md:w-auto">
                <div className="bg-gradient-to-br from-blue-500 via-cyan-500 to-emerald-500 rounded-2xl p-6 text-white text-center shadow-xl">
                  <Award className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-3xl font-bold">
                    {stats.averageRating > 0
                      ? stats.averageRating.toFixed(1)
                      : "N/A"}
                  </div>
                  <div className="text-sm opacity-90 flex items-center justify-center gap-1">
                    <Star className="w-4 h-4 fill-white" />
                    Rating
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push("/provider/edit-profile")}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-white border-2 border-blue-200 text-blue-700 rounded-xl hover:bg-blue-50 transition-all font-semibold"
                >
                  <Edit className="w-4 h-4" />
                  Editar perfil
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <StatCard
            title="Solicitudes Pendientes"
            value={stats.pendingRequests}
            icon={<Bell className="w-6 h-6 text-white" />}
            pill={
              stats.pendingRequests > 0 ? String(stats.pendingRequests) : null
            }
            gradient="from-yellow-500 to-amber-600"
            accent="from-yellow-500/10 to-amber-500/10"
          />
          <StatCard
            title="Total Ganado"
            value={`$${stats.totalEarned.toLocaleString()}`}
            icon={<DollarSign className="w-6 h-6 text-white" />}
            rightIcon={<TrendingUp className="w-5 h-5 text-gray-400" />}
            gradient="from-blue-500 to-blue-600"
            accent="from-blue-500/10 to-cyan-500/10"
          />
          <StatCard
            title="Trabajos Completados"
            value={stats.completedServices}
            icon={<CheckCircle className="w-6 h-6 text-white" />}
            gradient="from-emerald-500 to-green-600"
            accent="from-emerald-500/10 to-green-500/10"
          />
          <StatCard
            title="Confirmadas"
            value={stats.upcomingServices}
            icon={<Clock className="w-6 h-6 text-white" />}
            gradient="from-cyan-500 to-blue-600"
            accent="from-cyan-500/10 to-blue-500/10"
          />
        </div>

        {/* Tabs */}
        <div className="relative z-10 bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 shadow-lg p-2 mb-6 flex flex-col sm:flex-row gap-2">
          <TabButton
            active={activeTab === "requests"}
            onClick={() => setActiveTab("requests")}
            label="Solicitudes"
            icon={<Bell className="w-4 h-4" />}
            badge={requests.length}
          />
          <TabButton
            active={activeTab === "jobs"}
            onClick={() => setActiveTab("jobs")}
            label="Mis trabajos"
            icon={<Briefcase className="w-4 h-4" />}
            badge={jobs.length}
          />
          <TabButton
            active={activeTab === "purchases"}
            onClick={() => setActiveTab("purchases")}
            label="Mis compras"
            icon={<ShoppingCart className="w-4 h-4" />}
            badge={clientAppointments.length}
          />
        </div>

        {/* Content */}
        {activeTab === "requests" && (
          <SectionCard
            title="Solicitudes Pendientes"
            subtitle="Acepta o rechaza nuevas solicitudes de clientes"
            icon={<Bell className="w-6 h-6 text-white" />}
            iconBg="from-yellow-500 to-amber-500"
            counter={
              requests.length
                ? `${requests.length} nueva${requests.length !== 1 ? "s" : ""}`
                : null
            }
          >
            {requests.length === 0 ? (
              <EmptyState
                icon={<Bell className="w-16 h-16 text-yellow-600" />}
                title="No tienes solicitudes pendientes"
                text="Cuando un cliente agende contigo, aparecerá aquí."
              />
            ) : (
              <div className="space-y-4">
                {requests.map((a) => {
                  const client = a.clientId;
                  const clientName = `${client?.name ?? "Cliente"} ${
                    client?.surname ?? ""
                  }`.trim();
                  const price = safeMoneyFromPrice(a.price);
                  return (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, x: -14 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-2xl p-6 hover:shadow-xl transition-all"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-yellow-200 text-yellow-800 shadow-sm">
                              Nueva solicitud
                            </span>
                            <div className="text-sm font-semibold text-gray-700">
                              {clientName}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-gray-700 mb-2">
                            <Calendar className="w-4 h-4 text-blue-600" />
                            <span className="font-medium">
                              {a.date} · {a.startHour}
                              {a.endHour ? ` - ${a.endHour}` : ""}
                            </span>
                          </div>

                          {a.addressUrl ? (
                            <div className="flex items-center gap-2 text-gray-600 text-sm mb-2">
                              <MapPin className="w-4 h-4 text-emerald-600" />
                              <span>{a.addressUrl}</span>
                            </div>
                          ) : null}

                          {a.notes ? (
                            <div className="mt-2 text-sm text-gray-600 bg-white/50 rounded-lg p-3 border border-yellow-100">
                              <strong>Notas:</strong> {a.notes}
                            </div>
                          ) : null}
                        </div>

                        <div className="flex flex-col gap-3">
                          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 text-center border-2 border-blue-100">
                            <div className="text-3xl font-bold text-blue-700">
                              ${price.toLocaleString()}
                            </div>
                            <div className="text-sm text-blue-600 font-medium">
                              MXN (si aplica)
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <motion.button
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() =>
                                handleAppointmentAction(a.id, "accept")
                              }
                              disabled={processingId === a.id}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50"
                            >
                              {processingId === a.id ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <>
                                  <Check className="w-5 h-5" />
                                  Aceptar
                                </>
                              )}
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() =>
                                handleAppointmentAction(a.id, "reject")
                              }
                              disabled={processingId === a.id}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50"
                            >
                              {processingId === a.id ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <>
                                  <X className="w-5 h-5" />
                                  Rechazar
                                </>
                              )}
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        )}

        {activeTab === "jobs" && (
          <SectionCard
            title="Mis trabajos"
            subtitle="Citas donde tú eres el proveedor"
            icon={<Briefcase className="w-6 h-6 text-white" />}
            iconBg="from-blue-500 to-cyan-500"
            counter={jobs.length ? `${jobs.length} total` : null}
          >
            {jobs.length === 0 ? (
              <EmptyState
                icon={<Briefcase className="w-16 h-16 text-blue-600" />}
                title="No tienes trabajos confirmados aún"
                text="Cuando aceptes una solicitud, aparecerá aquí."
              />
            ) : (
              <div className="space-y-4">
                {jobs.map((a) => {
                  const client = a.clientId;
                  const clientName = `${client?.name ?? "Cliente"} ${
                    client?.surname ?? ""
                  }`.trim();
                  const badge = statusBadge(a.status);
                  const price = safeMoneyFromPrice(a.price);

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
                              className={`px-4 py-1.5 rounded-full text-sm font-bold ${badge.className} shadow-sm`}
                            >
                              {badge.label}
                            </span>
                            <div className="text-sm font-semibold text-gray-700">
                              {clientName}
                            </div>

                            {isConfirmedForChat(a.status) && (
                              <button
                                onClick={() =>
                                  router.push(
                                    `/provider/chat?appointmentId=${a.id}&clientId=${client?.id}`
                                  )
                                }
                                className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:opacity-90"
                              >
                                <MessageCircle className="w-4 h-4" />
                                Chat
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-gray-700 mb-2">
                            <Calendar className="w-4 h-4 text-blue-600" />
                            <span className="font-medium">
                              {a.date} · {a.startHour}
                              {a.endHour ? ` - ${a.endHour}` : ""}
                            </span>
                          </div>

                          {a.addressUrl ? (
                            <div className="flex items-center gap-2 text-gray-600 text-sm">
                              <MapPin className="w-4 h-4 text-emerald-600" />
                              <span>{a.addressUrl}</span>
                            </div>
                          ) : null}

                          {a.notes ? (
                            <div className="mt-4 text-gray-700 italic bg-gray-50 rounded-xl p-4 border border-gray-100">
                              “{a.notes}”
                            </div>
                          ) : null}
                        </div>

                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 text-center border-2 border-blue-100">
                          <div className="text-3xl font-bold text-blue-700">
                            ${price.toLocaleString()}
                          </div>
                          <div className="text-sm text-blue-600 font-medium">
                            MXN
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        )}

        {activeTab === "purchases" && (
          <SectionCard
            title="Mis compras"
            subtitle="Citas donde tú actúas como cliente"
            icon={<ShoppingCart className="w-6 h-6 text-white" />}
            iconBg="from-emerald-500 to-green-600"
            counter={
              clientAppointments.length
                ? `${clientAppointments.length} total`
                : null
            }
          >
            {clientAppointments.length === 0 ? (
              <EmptyState
                icon={<ShoppingCart className="w-16 h-16 text-emerald-600" />}
                title="Aún no has agendado citas como cliente"
                text="Si tú también contratas servicios, se verán aquí."
              />
            ) : (
              <div className="space-y-4">
                {clientAppointments.map((a) => {
                  const provider = a.providerId;
                  const providerName = `${provider?.name ?? "Proveedor"} ${
                    provider?.surname ?? ""
                  }`.trim();
                  const badge = statusBadge(a.status);

                  return (
                    <motion.div
                      key={a.id}
                      whileHover={{ scale: 1.01 }}
                      className="bg-gradient-to-br from-white to-[#F6FBFF] border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4"
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
                          {a.date} · {a.startHour}
                          {a.endHour ? ` - ${a.endHour}` : ""}
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

                        {isConfirmedForChat(a.status) && (
                          <button
                            onClick={() =>
                              router.push(
                                `/provider/chat?appointmentId=${a.id}&providerId=${provider?.id}`
                              )
                            }
                            className="bg-[#0A65FF] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90"
                          >
                            Abrir chat
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        )}
      </div>
    </div>
  );
}

// ============================================
// UI COMPONENTS
// ============================================
function StatCard(props: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  rightIcon?: React.ReactNode;
  pill?: string | null;
  gradient: string; // tailwind "from-x to-y"
  accent: string; // tailwind "from-x/10 to-y/10"
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-2xl transition-all p-6 border-2 border-white/50 relative overflow-hidden group"
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${props.accent} opacity-0 group-hover:opacity-100 transition-opacity`}
      />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div
            className={`p-3 bg-gradient-to-br ${props.gradient} rounded-xl shadow-lg`}
          >
            {props.icon}
          </div>

          <div className="flex items-center gap-2">
            {props.pill ? (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {props.pill}
              </span>
            ) : null}
            {props.rightIcon ?? null}
          </div>
        </div>

        <h3 className="text-gray-600 text-sm mb-1 font-semibold">
          {props.title}
        </h3>
        <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          {props.value}
        </p>
      </div>
    </motion.div>
  );
}

function TabButton(props: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}) {
  return (
    <button
      onClick={props.onClick}
      className={[
        "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all",
        props.active
          ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg"
          : "bg-white/70 text-gray-700 hover:bg-white",
      ].join(" ")}
    >
      {props.icon}
      <span>{props.label}</span>
      {typeof props.badge === "number" && props.badge > 0 ? (
        <span
          className={[
            "ml-1 text-xs font-extrabold px-2 py-0.5 rounded-full",
            props.active
              ? "bg-white/20 text-white"
              : "bg-gray-100 text-gray-700",
          ].join(" ")}
        >
          {props.badge}
        </span>
      ) : null}
    </button>
  );
}

function SectionCard(props: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg: string; // "from-x to-y"
  counter?: string | null;
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
            <div className={`p-3 bg-gradient-to-r ${props.iconBg} rounded-xl`}>
              {props.icon}
            </div>
            <span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent">
              {props.title}
            </span>
          </h2>
          {props.subtitle ? (
            <p className="text-gray-600 mt-2">{props.subtitle}</p>
          ) : null}
        </div>

        {props.counter ? (
          <span className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 px-5 py-2 rounded-full text-sm font-bold shadow-md">
            {props.counter}
          </span>
        ) : null}
      </div>

      {props.children}
    </motion.div>
  );
}

function EmptyState(props: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="text-center py-16">
      <div className="relative inline-block mb-6">{props.icon}</div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">{props.title}</h3>
      <p className="text-gray-600 text-lg">{props.text}</p>
    </div>
  );
}
