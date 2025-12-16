// src/app/components/ProviderDashboard.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  Star,
  User,
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
  ShoppingCart,
  MessageCircle,
  FileText,
} from "lucide-react";

import { calculateProfileCompleteness } from "../services/providerService";

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

interface UserProfile {
  name: string;
  surname: string;
  birthDate: string;
  profileImgUrl: string;
  phone: string;
  street?: string;
  exteriorNumber?: string;
  interiorNumber?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  fullAddress?: string;
  country?: string;
  about?: string;
  days?: string[];
  hours?: string[];
  address?: string;
}

interface DashboardStats {
  totalEarned: number;
  completedServices: number;
  upcomingServices: number;
  averageRating: number;
  pendingRequests: number;
}

type TabKey = "requests" | "jobs" | "purchases";

// ✅ para contar no leídos por cita
type ChatMessageLite = {
  id: string;
  read: boolean;
  receiver?: { id: string };
};

export default function ProviderDashboard() {
  const { user, token, logout } = useAuth();
  const router = useRouter();

  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.VITE_BACKEND_URL ||
    "http://localhost:3000";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [providerAppointments, setProviderAppointments] = useState<
    Appointment[]
  >([]);
  const [clientAppointments, setClientAppointments] = useState<Appointment[]>(
    []
  );

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("jobs");

  // ✅ feature extra: completitud perfil (de tu compa)
  const [profileCompleteness, setProfileCompleteness] = useState(100);

  // ✅ unread por cita
  const [unreadByAppointment, setUnreadByAppointment] = useState<
    Record<string, number>
  >({});

  const normalizeStatus = (s: unknown) => String(s ?? "").toLowerCase();

  const statusConfig = {
    pending: {
      bg: "bg-yellow-100",
      text: "text-yellow-700",
      label: "Pendiente",
    },
    confirmedprovider: {
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
    const key = normalizeStatus(status) as keyof typeof statusConfig;
    return (
      statusConfig[key] || {
        bg: "bg-gray-100",
        text: "text-gray-700",
        label: String(status),
      }
    );
  };

  const isPending = (a: Appointment) =>
    normalizeStatus(a.status).includes("pending");
  const isConfirmed = (a: Appointment) =>
    normalizeStatus(a.status).includes("confirmedprovider") ||
    normalizeStatus(a.status).includes("confirmed");
  const isCompleted = (a: Appointment) =>
    normalizeStatus(a.status).includes("completed");

  const money = (price?: string | null) => {
    const n = Number(price ?? 0);
    return Number.isFinite(n) ? n : 0;
  };

  const translateDay = (day: string) => {
    const translations: Record<string, string> = {
      Monday: "Lunes",
      Tuesday: "Martes",
      Wednesday: "Miércoles",
      Thursday: "Jueves",
      Friday: "Viernes",
      Saturday: "Sábado",
      Sunday: "Domingo",
    };
    return translations[day] || day;
  };

  // =========================
  // FETCH DATA
  // =========================
  const fetchData = useCallback(async () => {
    if (!user?.id || !token) return;

    setLoading(true);
    setError(null);

    try {
      const backendUrl = process.env.VITE_BACKEND_URL;

      console.log('📡 Fetching provider data for:', user.id);

      // Fetch provider profile
      const profileRes = await fetch(`${backendUrl}/provider/${user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!profileRes.ok) {
        if (profileRes.status === 401) {
          logout();
          router.push("/login");
          return;
        }
        throw new Error("Error al cargar el perfil");
      }

      const profileData = await profileRes.json();
      setProfile(profileData);

      // ✅ completitud (de tu compa) sin romper lo tuyo
      try {
        const completeness = calculateProfileCompleteness(profileData);
        setProfileCompleteness(
          typeof completeness === "number" ? completeness : 100
        );
      } catch {
        setProfileCompleteness(100);
      }

      // Appointments del usuario autenticado
      const appointmentsRes = await fetch(`${backendUrl}/appointments`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!appointmentsRes.ok) {
        if (appointmentsRes.status === 401) {
          logout();
          router.push("/login");
          return;
        }
        throw new Error("Error al cargar citas");
      }

      const data: AppointmentsResponse = await appointmentsRes.json();

      const p = Array.isArray(data?.providerAppointments)
        ? data.providerAppointments
        : [];
      const c = Array.isArray(data?.clientAppointments)
        ? data.clientAppointments
        : [];

      setProviderAppointments(p);
      setClientAppointments(c);

      // Tab default inteligente (tu lógica)
      if (p.some((a) => isPending(a))) setActiveTab("requests");
      else setActiveTab("jobs");
    } catch (err) {
      console.error("❌ Error fetching provider dashboard:", err);
      setError(
        err instanceof Error ? err.message : "Error al cargar los datos"
      );
    } finally {
      setLoading(false);
    }
  }, [user?.id, token, backendUrl, logout, router]);

  useEffect(() => {
    if (!user || !token) {
      router.push("/login");
      return;
    }

    if (user.role !== "provider") {
      router.push("/dashboard");
      return;
    }

    fetchData();

    const handleFocus = () => fetchData();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [user, token, router, fetchData]);

  // =========================
  // ✅ UNREAD COUNTS POR CITA
  // =========================
  const refreshUnreadByAppointment = useCallback(async () => {
    if (!token || !user?.id) return;

    const allAppointments = [...providerAppointments, ...clientAppointments];

    // solo citas confirmadas (donde normalmente existe chat)
    const ids = allAppointments
      .filter((a) => normalizeStatus(a.status).includes("confirmed"))
      .map((a) => a.id);

    if (ids.length === 0) {
      setUnreadByAppointment({});
      return;
    }

    try {
      const results = await Promise.all(
        ids.map(async (id) => {
          const res = await fetch(`${backendUrl}/chat/messages/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          });
          if (!res.ok) return [id, 0] as const;

          const data = (await res.json()) as ChatMessageLite[];
          const count = Array.isArray(data)
            ? data.filter((m) => m.read === false && m.receiver?.id === user.id)
                .length
            : 0;

          return [id, count] as const;
        })
      );

      const next: Record<string, number> = {};
      for (const [id, count] of results) next[id] = count;

      setUnreadByAppointment(next);
    } catch (e) {
      console.warn("unread per appointment error", e);
    }
  }, [backendUrl, clientAppointments, providerAppointments, token, user?.id]);

  useEffect(() => {
    refreshUnreadByAppointment();
  }, [refreshUnreadByAppointment]);

  useEffect(() => {
    if (!token) return;
    const id = window.setInterval(() => refreshUnreadByAppointment(), 6000);
    return () => window.clearInterval(id);
  }, [refreshUnreadByAppointment, token]);

  // =========================
  // ACTIONS (PUT /appointments/status/:id)
  // =========================
  const updateAppointmentStatus = async (
    appointmentId: string,
    status: string
  ) => {
    if (!token) return;

    setProcessingId(appointmentId);
    setError(null);

    try {
      const res = await fetch(
        `${backendUrl}/appointments/status/${appointmentId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Error al actualizar la cita");
      }

      await fetchData();
      await refreshUnreadByAppointment();
    } catch (err) {
      console.error("❌ Error updating appointment:", err);
      setError(
        err instanceof Error ? err.message : "Error al actualizar la cita"
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleAccept = (id: string) =>
    updateAppointmentStatus(id, "confirmedProvider");
  const handleReject = (id: string) => updateAppointmentStatus(id, "rejected");
  const handleCancel = (id: string) => updateAppointmentStatus(id, "cancelled");
  const handleComplete = (id: string) =>
    updateAppointmentStatus(id, "completed");

  // =========================
  // STATS
  // =========================
  const stats = useMemo<DashboardStats>(() => {
    const pendingRequests = providerAppointments.filter(isPending).length;
    const completedServices = providerAppointments.filter(isCompleted).length;
    const upcomingServices = providerAppointments.filter((a) =>
      isConfirmed(a)
    ).length;

    const totalEarned = providerAppointments
      .filter(isCompleted)
      .reduce((sum, a) => sum + money(a.price), 0);

    const averageRating = 0;

    return {
      pendingRequests,
      completedServices,
      upcomingServices,
      totalEarned,
      averageRating,
    };
  }, [providerAppointments]);

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
          initial={{ opacity: 0, scale: 0.9 }}
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

  // =========================
  // LISTS FOR TABS
  // =========================
  const pendingList = providerAppointments.filter(isPending);
  const jobsList = providerAppointments.filter((a) => !isPending(a));
  const purchasesList = clientAppointments;

  // =========================
  // RENDER
  // =========================
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-emerald-50 pt-24 pb-12 px-4">
      {/* Animated Background Blobs (de tu compa, no rompe nada) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-300/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* ALERTA DE PERFIL INCOMPLETO */}
        {profileCompleteness < 100 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-xl p-6 mb-6 shadow-lg"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 text-amber-600">
                <AlertCircle className="w-8 h-8" />
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-bold text-amber-900 mb-2">
                  ⚠️ Perfil Incompleto
                </h3>

                <p className="text-amber-800 mb-4">
                  Tu perfil está{" "}
                  <strong>{profileCompleteness}% completo</strong>. Para poder
                  ser contratado y ofrecer tus servicios, completa tu
                  información.
                </p>

                <div className="mb-4">
                  <div className="flex justify-between text-sm text-amber-700 mb-2">
                    <span>Progreso del perfil</span>
                    <span className="font-semibold">
                      {profileCompleteness}%
                    </span>
                  </div>
                  <div className="w-full bg-amber-200 rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${profileCompleteness}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full"
                    />
                  </div>
                </div>

                <div className="bg-white/50 rounded-lg p-4 mb-4 space-y-2">
                  <p className="text-sm text-amber-900 font-medium mb-2">
                    🚫 Mientras tu perfil esté incompleto:
                  </p>
                  <ul className="space-y-1 text-sm text-amber-800">
                    <li className="flex items-center gap-2">
                      <span className="text-amber-500">•</span>
                      Podrías no aparecer en resultados de búsqueda
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-amber-500">•</span>
                      Los clientes pueden no contratarte
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-amber-500">•</span>
                      Tu perfil podría no verse completo públicamente
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => router.push("/provider/edit-profile")}
                  className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  Completar Perfil Ahora
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-white/50 overflow-hidden mb-8"
        >
          <div className="h-2 bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500"></div>

          <div className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 rounded-full blur opacity-40 group-hover:opacity-75 transition-opacity"></div>
                {profile?.profileImgUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.profileImgUrl}
                    alt="Foto de perfil"
                    className="relative w-32 h-32 rounded-full object-cover border-4 border-white"
                  />
                ) : (
                  <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 via-cyan-500 to-emerald-500 flex items-center justify-center border-4 border-white">
                    <User className="w-16 h-16 text-white" />
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full p-2 shadow-lg">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
              </div>

              <div className="flex-1 text-center md:text-left">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent mb-3">
                  {profile?.name} {profile?.surname}
                </h1>

                <div className="flex flex-col md:flex-row gap-3 text-gray-600">
                  <div className="flex items-center gap-2 bg-blue-50/50 px-4 py-2 rounded-lg">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">{user?.email}</span>
                  </div>

                  {profile?.phone && (
                    <div className="flex items-center gap-2 bg-cyan-50/50 px-4 py-2 rounded-lg">
                      <Phone className="w-4 h-4 text-cyan-600" />
                      <span className="font-medium">{profile.phone}</span>
                    </div>
                  )}
                </div>

                {profile?.about && (
                  <div className="mt-4">
                    <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      Acerca de mí
                    </h4>
                    <p className="text-gray-600 text-sm bg-blue-50/50 rounded-xl p-4 border border-blue-100 leading-relaxed">
                      {profile.about}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3">
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
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push("/provider/edit-profile")}
                  className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-blue-200 text-blue-700 rounded-xl hover:bg-blue-50 transition-all font-semibold"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </motion.button>
              </div>
            </div>

            {/* Availability */}
            {profile?.days && profile.days.length > 0 ? (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-gray-700">
                      Disponibilidad:
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.days.map((day) => (
                      <span
                        key={day}
                        className="px-3 py-1 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 rounded-full text-sm font-medium"
                      >
                        {translateDay(day)}
                      </span>
                    ))}
                  </div>

                  {profile.hours && profile.hours.length > 0 && (
                    <>
                      <div className="flex items-center gap-2 ml-4">
                        <Clock className="w-5 h-5 text-emerald-600" />
                        <span className="font-semibold text-gray-700">
                          Horario:
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {profile.hours.map((hour) => (
                          <span
                            key={hour}
                            className="px-3 py-1 bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 rounded-full text-sm font-medium"
                          >
                            {hour}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-3 rounded-lg">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    Aún no has configurado tu disponibilidad
                  </span>
                </div>
              </div>
            )}

            {/* Address */}
            {(profile?.street ||
              profile?.city ||
              profile?.state ||
              profile?.country) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-start gap-3 bg-purple-50/50 rounded-xl p-5 border border-purple-100">
                  <MapPin className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h4 className="font-bold text-purple-900 mb-3 text-lg">
                      Dirección
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {profile.street && (
                        <div>
                          <span className="font-semibold text-gray-700">
                            Calle:
                          </span>{" "}
                          <span className="text-gray-600">
                            {profile.street}
                          </span>
                        </div>
                      )}
                      {profile.exteriorNumber && (
                        <div>
                          <span className="font-semibold text-gray-700">
                            Número:
                          </span>{" "}
                          <span className="text-gray-600">
                            {profile.exteriorNumber}
                          </span>
                          {profile.interiorNumber && (
                            <span className="text-gray-600">
                              {" "}
                              - Depto/Piso {profile.interiorNumber}
                            </span>
                          )}
                        </div>
                      )}
                      {profile.neighborhood && (
                        <div>
                          <span className="font-semibold text-gray-700">
                            Barrio:
                          </span>{" "}
                          <span className="text-gray-600">
                            {profile.neighborhood}
                          </span>
                        </div>
                      )}
                      {profile.city && (
                        <div>
                          <span className="font-semibold text-gray-700">
                            Ciudad:
                          </span>{" "}
                          <span className="text-gray-600">{profile.city}</span>
                        </div>
                      )}
                      {profile.state && (
                        <div>
                          <span className="font-semibold text-gray-700">
                            Estado:
                          </span>{" "}
                          <span className="text-gray-600">{profile.state}</span>
                        </div>
                      )}
                      {profile.postalCode && (
                        <div>
                          <span className="font-semibold text-gray-700">
                            CP:
                          </span>{" "}
                          <span className="text-gray-600">
                            {profile.postalCode}
                          </span>
                        </div>
                      )}
                      {profile.country && (
                        <div>
                          <span className="font-semibold text-gray-700">
                            País:
                          </span>{" "}
                          <span className="text-gray-600">
                            {profile.country}
                          </span>
                        </div>
                      )}
                    </div>

                    {profile.fullAddress && (
                      <div className="mt-3 pt-3 border-t border-purple-100">
                        <span className="font-semibold text-gray-700">
                          Dirección completa:
                        </span>
                        <p className="text-gray-600 mt-1">
                          {profile.fullAddress}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Address Section */}
            {profile?.address && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-start gap-3 text-gray-600 text-sm bg-purple-50/50 rounded-xl p-4 border border-purple-100">
                  <MapPin className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-2 text-left">
                    <div>
                      <span className="font-semibold text-gray-700">Dirección: </span>
                      <span>{profile.address}</span>
                    </div>
                    {profile.city && (
                      <div>
                        <span className="font-semibold text-gray-700">Ciudad: </span>
                        <span>{profile.city}</span>
                      </div>
                    )}
                    {profile.state && (
                      <div>
                        <span className="font-semibold text-gray-700">Estado: </span>
                        <span>{profile.state}</span>
                      </div>
                    )}
                    {profile.country && (
                      <div>
                        <span className="font-semibold text-gray-700">País: </span>
                        <span>{profile.country}</span>
                      </div>
                    )}
                    {profile.postalCode && (
                      <div>
                        <span className="font-semibold text-gray-700">Código Postal: </span>
                        <span>{profile.postalCode}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Stats */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Solicitudes Pendientes"
            value={stats.pendingRequests}
            icon={<Bell className="w-6 h-6 text-white" />}
            gradient="from-yellow-500 to-amber-600"
            badge={stats.pendingRequests}
          />

          <StatCard
            title="Total Ganado"
            value={`$${stats.totalEarned.toLocaleString()}`}
            icon={<DollarSign className="w-6 h-6 text-white" />}
            gradient="from-blue-500 to-blue-600"
            rightIcon={<TrendingUp className="w-5 h-5 text-gray-400" />}
          />

          <StatCard
            title="Trabajos Completados"
            value={stats.completedServices}
            icon={<CheckCircle className="w-6 h-6 text-white" />}
            gradient="from-emerald-500 to-green-600"
          />

          <StatCard
            title="Confirmadas"
            value={stats.upcomingServices}
            icon={<Clock className="w-6 h-6 text-white" />}
            gradient="from-cyan-500 to-blue-600"
          />
        </div>

        {/* Tabs (tu implementación) */}
        <div className="relative z-10 bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-white/50 p-4 mb-8">
          <div className="grid grid-cols-3 gap-3">
            <TabButton
              active={activeTab === "requests"}
              onClick={() => setActiveTab("requests")}
              label="Solicitudes"
              icon={<Bell className="w-5 h-5" />}
              count={pendingList.length}
            />
            <TabButton
              active={activeTab === "jobs"}
              onClick={() => setActiveTab("jobs")}
              label="Mis trabajos"
              icon={<Briefcase className="w-5 h-5" />}
              count={jobsList.length}
            />
            <TabButton
              active={activeTab === "purchases"}
              onClick={() => setActiveTab("purchases")}
              label="Mis compras"
              icon={<ShoppingCart className="w-5 h-5" />}
              count={purchasesList.length}
            />
          </div>
        </div>

        {/* Content */}
        {activeTab === "jobs" && (
          <SectionCard
            title="Mis trabajos"
            subtitle="Citas donde tú eres el proveedor"
            icon={<Briefcase className="w-6 h-6 text-white" />}
            iconBg="from-blue-500 to-cyan-500"
            count={jobsList.length}
          >
            {jobsList.length === 0 ? (
              <EmptyState
                title="No tienes trabajos aún"
                subtitle="Los clientes comenzarán a contactarte pronto."
                icon={<Briefcase className="w-16 h-16 text-blue-600" />}
              />
            ) : (
              <div className="space-y-4">
                {jobsList.map((a) => {
                  const clientName = `${a.clientId?.name ?? "Cliente"} ${
                    a.clientId?.surname ?? ""
                  }`.trim();

                  const badge = getBadge(a.status);
                  const busy = processingId === a.id;
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
                              {clientName}
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
                              <span>{a.addressUrl}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          {isConfirmed(a) && (
                            <button
                              onClick={() =>
                                router.push(`/client/chat/${a.id}`)
                              }
                              className="relative bg-[#0A65FF] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 flex items-center gap-2"
                            >
                              <MessageCircle className="w-4 h-4" />
                              Chat
                              {unread > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[11px] rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center font-bold">
                                  {unread > 99 ? "99+" : unread}
                                </span>
                              )}
                            </button>
                          )}

                          {isConfirmed(a) && (
                            <button
                              onClick={() => handleComplete(a.id)}
                              disabled={busy}
                              className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                            >
                              {busy ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                              Completar
                            </button>
                          )}

                          {!isCompleted(a) && (
                            <button
                              onClick={() => handleCancel(a.id)}
                              disabled={busy}
                              className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                            >
                              {busy ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <X className="w-4 h-4" />
                              )}
                              Cancelar
                            </button>
                          )}

                          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 text-center border-2 border-blue-100 min-w-[120px]">
                            <div className="text-3xl font-bold text-blue-700">
                              ${money(a.price).toLocaleString()}
                            </div>
                            <div className="text-sm text-blue-600 font-medium">
                              MXN
                            </div>
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

        {activeTab === "requests" && (
          <SectionCard
            title="Solicitudes pendientes"
            subtitle="Citas pendientes que requieren tu respuesta"
            icon={<Bell className="w-6 h-6 text-white" />}
            iconBg="from-yellow-500 to-amber-500"
            count={pendingList.length}
          >
            {pendingList.length === 0 ? (
              <EmptyState
                title="No hay solicitudes"
                subtitle="Cuando un cliente solicite un servicio, aparecerá aquí."
                icon={<AlertCircle className="w-16 h-16 text-yellow-600" />}
              />
            ) : (
              <div className="space-y-4">
                {pendingList.map((a) => {
                  const clientName = `${a.clientId?.name ?? "Cliente"} ${
                    a.clientId?.surname ?? ""
                  }`.trim();

                  const badge = getBadge(a.status);
                  const busy = processingId === a.id;

                  return (
                    <motion.div
                      key={a.id}
                      whileHover={{ scale: 1.01 }}
                      className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-100 hover:border-yellow-200 rounded-2xl p-6 hover:shadow-xl transition-all"
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
                              {clientName}
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
                              <span>{a.addressUrl}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleAccept(a.id)}
                            disabled={busy}
                            className="bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                          >
                            {busy ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                            Aceptar
                          </button>

                          <button
                            onClick={() => handleReject(a.id)}
                            disabled={busy}
                            className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                          >
                            {busy ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                            Rechazar
                          </button>

                          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 text-center border-2 border-blue-100 min-w-[120px]">
                            <div className="text-3xl font-bold text-blue-700">
                              ${money(a.price).toLocaleString()}
                            </div>
                            <div className="text-sm text-blue-600 font-medium">
                              MXN
                            </div>
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
            subtitle="Citas donde tú apareces como cliente"
            icon={<ShoppingCart className="w-6 h-6 text-white" />}
            iconBg="from-blue-500 to-blue-600"
            count={purchasesList.length}
          >
            {purchasesList.length === 0 ? (
              <EmptyState
                title="Aún no has comprado servicios"
                subtitle="Aquí verás las citas que hayas reservado como cliente."
                icon={<ShoppingCart className="w-16 h-16 text-blue-600" />}
              />
            ) : (
              <div className="space-y-4">
                {purchasesList.map((a) => {
                  const providerName = `${a.providerId?.name ?? "Proveedor"} ${
                    a.providerId?.surname ?? ""
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
                              <span>{a.addressUrl}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          {normalizeStatus(a.status).includes("confirmed") && (
                            <button
                              onClick={() =>
                                router.push(`/client/chat/${a.id}`)
                              }
                              className="relative bg-[#0A65FF] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 flex items-center gap-2"
                            >
                              <MessageCircle className="w-4 h-4" />
                              Chat
                              {unread > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[11px] rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center font-bold">
                                  {unread > 99 ? "99+" : unread}
                                </span>
                              )}
                            </button>
                          )}

                          {!normalizeStatus(a.status).includes("completed") && (
                            <button
                              onClick={() => handleCancel(a.id)}
                              className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 flex items-center gap-2"
                            >
                              <X className="w-4 h-4" />
                              Cancelar
                            </button>
                          )}

                          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 text-center border-2 border-blue-100 min-w-[120px]">
                            <div className="text-3xl font-bold text-blue-700">
                              ${money(a.price).toLocaleString()}
                            </div>
                            <div className="text-sm text-blue-600 font-medium">
                              MXN
                            </div>
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
      </div>
    </div>
  );
}

// ============================================
// UI HELPERS
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
        <div className="absolute inset-0 bg-gradient-to-r from-blue-200 to-cyan-200 rounded-full blur-xl opacity-50"></div>
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
  rightIcon,
  badge,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  gradient: string;
  rightIcon?: React.ReactNode;
  badge?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-2xl transition-all p-6 border-2 border-white/50 relative overflow-hidden group"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-white/10 to-white/0"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div
            className={`p-3 bg-gradient-to-br ${gradient} rounded-xl shadow-lg`}
          >
            {icon}
          </div>
          {rightIcon ?? null}
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
