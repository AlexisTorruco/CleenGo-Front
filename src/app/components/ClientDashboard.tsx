'use client';

import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  CheckCircle,
  DollarSign,
  Clock,
  Calendar,
  TrendingUp,
  Star,
  Edit3,
  Package,
  Loader2,
  Award,
  Zap,
} from 'lucide-react';

// ============================================
// INTERFACES
// ============================================
interface Appointment {
  id: string;
  status: 'completed' | 'scheduled' | 'in-progress' | 'cancelled';
  cost: number;
  date?: string;
  rating?: number;
  service?: { name: string };
  provider?: { name: string };
  [key: string]: unknown;
}

interface UserProfile {
  id: string;
  name: string;
  surname: string;
  email: string;
  profileImgUrl: string;
  phone?: string;
  [key: string]: unknown;
}

// ============================================
// COMPONENTE
// ============================================
export default function ClientDashboard() {
  const { user, token } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState({
    totalSpent: 0,
    completedServices: 0,
    upcomingServices: 0,
    averageRating: 0,
  });

  // ======================
  // FUNCIÓN PARA CARGAR DATOS
  // ======================
  const fetchData = async () => {
    if (!user?.id || !token) {
      console.error('User or token not available');
      return;
    }

    try {
      setLoading(true);

      // Fetch profile
      const profileRes = await fetch(`http://localhost:3000/user/profile/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profileData = await profileRes.json();
      setProfile(profileData);

      // Fetch appointments
      const appointmentsRes = await fetch(`http://localhost:3000/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const contentType = appointmentsRes.headers.get('content-type');
      let allAppointments: Appointment[] = [];

      if (contentType && contentType.includes('application/json')) {
        const data = await appointmentsRes.json();
        allAppointments = Array.isArray(data) ? data : data.appointments || [];
      }

      const userAppointments = allAppointments.filter((apt) => apt.clientId === user.id);
      setAppointments(userAppointments);

      // Calculate stats
      const completed = userAppointments.filter((a) => a.status === 'completed');
      const upcoming = userAppointments.filter((a) => a.status === 'scheduled');
      const total = completed.reduce((acc, curr) => acc + (curr.cost || 0), 0);

      const ratedServices = completed.filter((a) => a.rating);
      const avgRating =
        ratedServices.length > 0
          ? ratedServices.reduce((acc, curr) => acc + (curr.rating || 0), 0) / ratedServices.length
          : 0;

      setStats({
        totalSpent: total,
        completedServices: completed.length,
        upcomingServices: upcoming.length,
        averageRating: Math.round(avgRating * 10) / 10,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ======================
  // EFFECT PARA CARGAR AL MONTAR
  // ======================
  useEffect(() => {
    if (!user || !token) {
      router.push('/login');
      return;
    }

    fetchData();

    // Recargar datos cuando la ventana vuelve a tener foco
    const handleFocus = () => {
      fetchData();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-medium">Cargando tu dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50 pt-24 pb-12 px-4">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-400 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* ================= PROFILE HEADER ================= */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden mb-8"
        >
          {/* Blue header bar */}
          <div className="h-2 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600"></div>

          <div className="p-8">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              {/* Profile Picture */}
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full blur opacity-40"></div>
                {profile?.profileImgUrl ? (
                  <img
                    src={profile.profileImgUrl}
                    alt="Perfil"
                    className="relative w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl"
                  />
                ) : (
                  <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center border-4 border-white shadow-xl">
                    <User className="w-16 h-16 text-white" />
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 rounded-full p-2.5 shadow-lg border-3 border-white">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center lg:text-left">
                <h1 className="text-4xl font-bold text-gray-900 mb-3">
                  {profile?.name} {profile?.surname}
                </h1>

                <div className="space-y-2 mb-5">
                  <div className="flex items-center gap-2 text-gray-600 justify-center lg:justify-start">
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                      <Mail className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="font-medium">{user?.email}</span>
                  </div>
                  {profile?.phone && (
                    <div className="flex items-center gap-2 text-gray-600 justify-center lg:justify-start">
                      <div className="p-1.5 bg-cyan-100 rounded-lg">
                        <Phone className="w-4 h-4 text-cyan-600" />
                      </div>
                      <span className="font-medium">{profile.phone}</span>
                    </div>
                  )}
                </div>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push('/client/profile/edit')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  <Edit3 className="w-4 h-4" />
                  Editar Perfil
                </motion.button>
              </div>

              {/* Stats Badge */}
              <div className="lg:ml-auto">
                <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl p-8 text-white text-center shadow-xl min-w-[200px] relative overflow-hidden">
                  <div className="absolute inset-0 bg-white opacity-10"></div>
                  <Award className="w-12 h-12 mx-auto mb-3 relative" />
                  <div className="text-5xl font-bold mb-2 relative">{stats.completedServices}</div>
                  <div className="text-sm opacity-90 font-medium relative">
                    Servicios Realizados
                  </div>
                  {stats.averageRating > 0 && (
                    <div className="mt-3 flex items-center justify-center gap-1 relative">
                      <Star className="w-5 h-5 fill-yellow-300 text-yellow-300" />
                      <span className="text-lg font-bold">{stats.averageRating}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ================= STATS CARDS ================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Spent */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -4 }}
            className="group relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className="relative bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="p-4 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-md">
                  <DollarSign className="w-7 h-7 text-white" />
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <p className="text-gray-500 text-sm font-semibold mb-2">Total Gastado</p>
              <p className="text-4xl font-bold text-gray-900 mb-1">
                ${stats.totalSpent.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">En servicios completados</p>
            </div>
          </motion.div>

          {/* Completed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -4 }}
            className="group relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className="relative bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="p-4 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-md">
                  <CheckCircle className="w-7 h-7 text-white" />
                </div>
              </div>
              <p className="text-gray-500 text-sm font-semibold mb-2">Servicios Realizados</p>
              <p className="text-4xl font-bold text-gray-900 mb-1">{stats.completedServices}</p>
              <p className="text-xs text-gray-500">Limpiezas finalizadas</p>
            </div>
          </motion.div>

          {/* Upcoming */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ y: -4 }}
            className="group relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div className="relative bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="p-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-md">
                  <Clock className="w-7 h-7 text-white" />
                </div>
              </div>
              <p className="text-gray-500 text-sm font-semibold mb-2">Próximas Limpiezas</p>
              <p className="text-4xl font-bold text-gray-900 mb-1">{stats.upcomingServices}</p>
              <p className="text-xs text-gray-500">Programadas</p>
            </div>
          </motion.div>
        </div>

        {/* ================= SERVICES SECTION ================= */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden"
        >
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Calendar className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white">Mis Servicios</h2>
              </div>

              {appointments.length > 0 && (
                <span className="px-5 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-bold">
                  {appointments.length} total
                </span>
              )}
            </div>
          </div>

          <div className="p-8">
            {/* Empty State */}
            {appointments.length === 0 && (
              <div className="text-center py-16">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-blue-600 rounded-full blur opacity-20"></div>
                  <div className="relative w-24 h-24 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                    <Package className="w-12 h-12 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No tienes servicios aún</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
                  Agenda tu servicio en menos de 5 minutos. ¡Rápido y fácil!
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/client/providers')}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-bold hover:shadow-xl transition-all text-lg"
                >
                  <Zap className="w-5 h-5" />
                  Explorar Proveedores
                </motion.button>
              </div>
            )}

            {/* Services List */}
            <div className="space-y-4">
              {appointments.map((appointment, index) => (
                <motion.div
                  key={appointment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ x: 4 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative bg-gradient-to-br from-gray-50 to-white border-2 border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:border-blue-200 transition-all">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span
                            className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-sm ${
                              appointment.status === 'completed'
                                ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white'
                                : appointment.status === 'scheduled'
                                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white'
                                : appointment.status === 'in-progress'
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                                : 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                            }`}
                          >
                            {appointment.status === 'completed'
                              ? '✓ Completado'
                              : appointment.status === 'scheduled'
                              ? '📅 Programado'
                              : appointment.status === 'in-progress'
                              ? '⏳ En Progreso'
                              : '✗ Cancelado'}
                          </span>

                          {appointment.rating && (
                            <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-amber-400 px-3 py-1.5 rounded-full shadow-sm">
                              <Star className="w-4 h-4 fill-white text-white" />
                              <span className="text-xs font-bold text-white">
                                {appointment.rating}
                              </span>
                            </div>
                          )}
                        </div>

                        {appointment.service?.name && (
                          <p className="font-bold text-gray-900 mb-2 text-lg">
                            {appointment.service.name}
                          </p>
                        )}

                        {appointment.date && (
                          <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                            <Calendar className="w-4 h-4 text-blue-600" />
                            {new Date(appointment.date).toLocaleDateString('es-MX', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        )}

                        {appointment.provider?.name && (
                          <p className="text-sm text-gray-500">
                            Proveedor:{' '}
                            <span className="font-semibold">{appointment.provider.name}</span>
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right bg-gradient-to-br from-blue-50 to-cyan-50 px-6 py-4 rounded-xl">
                          <p className="text-3xl font-bold text-blue-600">
                            ${appointment.cost.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-600 font-semibold">MXN</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
