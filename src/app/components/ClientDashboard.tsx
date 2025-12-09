'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Star,
  User,
  Mail,
  Phone,
  MapPin,
  Edit,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Package,
  TrendingUp,
  Award,
  Image as ImageIcon,
} from 'lucide-react';

// ============================================
// INTERFACES
// ============================================
interface UserProfile {
  id: string;
  name: string;
  surname: string;
  email: string;
  birthDate: string;
  profileImgUrl: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  role: string;
  isActive: boolean;
  estimatedAppointments: Appointment[];
  myAppointments: Appointment[];
}

interface Appointment {
  id: string;
  date: string;
  cost: number;
  status: 'completed' | 'scheduled' | 'in-progress' | 'cancelled' | 'pending';
  clientId?: string;
  providerId?: string;
  serviceId?: string;
  address?: string;
  notes?: string;
  rating?: number;
  review?: string;
}

interface DashboardStats {
  totalAppointments: number;
  completedAppointments: number;
  upcomingAppointments: number;
  pendingAppointments: number;
}

// ============================================
// COMPONENTE
// ============================================
export default function ClientDashboard() {
  const { user, token, logout } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [stats, setStats] = useState<DashboardStats>({
    totalAppointments: 0,
    completedAppointments: 0,
    upcomingAppointments: 0,
    pendingAppointments: 0,
  });

  const fetchData = useCallback(async () => {
    if (!user?.id || !token) return;

    setLoading(true);
    setError(null);

    try {
      const backendUrl = 'http://localhost:3000';

      console.log('📡 Fetching client data for:', user.id);

      // Fetch user profile
      const profileRes = await fetch(`${backendUrl}/user/profile/${user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!profileRes.ok) {
        if (profileRes.status === 401) {
          logout();
          router.push('/login');
          return;
        }
        throw new Error('Error al cargar el perfil');
      }

      const profileData = await profileRes.json();
      console.log('👤 Profile data loaded:', profileData);
      setProfile(profileData);

      // Fetch appointments
      const appointmentsRes = await fetch(`${backendUrl}/appointments`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (appointmentsRes.ok) {
        const contentType = appointmentsRes.headers.get('content-type');
        let allAppointments: Appointment[] = [];

        if (contentType && contentType.includes('application/json')) {
          const data = await appointmentsRes.json();
          allAppointments = Array.isArray(data) ? data : data.appointments || [];
        }

        // Filter for this client
        const clientAppointments = allAppointments.filter((apt) => apt.clientId === user.id);
        console.log('📅 Client appointments:', clientAppointments.length);

        setAppointments(clientAppointments);

        // Calculate stats
        const completed = clientAppointments.filter((apt) => apt.status === 'completed').length;
        const upcoming = clientAppointments.filter(
          (apt) => apt.status === 'scheduled' || apt.status === 'in-progress'
        ).length;
        const pending = clientAppointments.filter((apt) => apt.status === 'pending').length;

        setStats({
          totalAppointments: clientAppointments.length,
          completedAppointments: completed,
          upcomingAppointments: upcoming,
          pendingAppointments: pending,
        });

        console.log('📊 Stats calculated:', {
          total: clientAppointments.length,
          completed,
          upcoming,
          pending,
        });
      }
    } catch (err) {
      console.error('❌ Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, [user, token, logout, router]);

  useEffect(() => {
    console.log('🔍 ClientDashboard - Checking auth...');
    console.log('👤 User:', user);
    console.log('🔑 Token:', token ? 'Exists ✅' : 'Missing ❌');

    if (!user || !token) {
      console.log('❌ No user or token, redirecting to login');
      router.push('/login');
      return;
    }

    if (user.role !== 'client') {
      console.log('❌ Not a client, redirecting to dashboard');
      router.push('/dashboard');
      return;
    }

    console.log('✅ Auth OK, fetching data...');
    fetchData();

    // Reload on window focus
    const handleFocus = () => {
      console.log('👁️ Window focused - Reloading data...');
      fetchData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, token, router, fetchData]);

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

  const statusConfig = {
    completed: {
      bg: 'bg-emerald-100',
      text: 'text-emerald-700',
      label: 'Completado',
      icon: CheckCircle,
    },
    scheduled: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Programado', icon: Calendar },
    'in-progress': { bg: 'bg-cyan-100', text: 'text-cyan-700', label: 'En Progreso', icon: Clock },
    cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelado', icon: XCircle },
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pendiente', icon: Clock },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-emerald-50 pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Animated Background Blobs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: '1s' }}
          ></div>
          <div
            className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-300/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: '2s' }}
          ></div>
        </div>

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-white/50 overflow-hidden mb-8"
        >
          {/* Top gradient bar */}
          <div className="h-2 bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500"></div>

          <div className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Profile Image */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 rounded-full blur opacity-40 group-hover:opacity-75 transition-opacity"></div>
                {profile?.profileImgUrl ? (
                  <img
                    src={profile.profileImgUrl}
                    alt="Foto de perfil"
                    className="relative w-24 h-24 rounded-full object-cover border-4 border-white"
                  />
                ) : (
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 via-cyan-500 to-emerald-500 flex items-center justify-center border-4 border-white">
                    <User className="w-12 h-12 text-white" />
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full p-2 shadow-lg">
                  <Award className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent mb-3">
                  {profile?.name} {profile?.surname}
                </h1>
                <div className="flex flex-col md:flex-row gap-4 text-gray-600 mb-4">
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <span>{profile?.email}</span>
                  </div>
                  {profile?.phone && (
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      <Phone className="w-4 h-4 text-cyan-600" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                </div>

                {/* Address */}
                {profile?.address && (
                  <div className="flex items-center justify-center md:justify-start gap-2 text-gray-600 text-sm bg-blue-50/50 rounded-xl p-3 border border-blue-100">
                    <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>
                      {profile.address}
                      {profile.city && `, ${profile.city}`}
                      {profile.state && `, ${profile.state}`}
                      {profile.postalCode && ` ${profile.postalCode}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Edit Button */}
              <div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/client/edit-profile')}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
                >
                  <Edit className="w-5 h-5" />
                  Editar Perfil
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Total Appointments */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -4 }}
            className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-2xl transition-all p-6 border-2 border-white/50 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg">
                  <Package className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-gray-600 text-sm mb-1 font-semibold">Total de Citas</h3>
              <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                {stats.totalAppointments}
              </p>
            </div>
          </motion.div>

          {/* Pending */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -4 }}
            className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-2xl transition-all p-6 border-2 border-white/50 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl shadow-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-gray-600 text-sm mb-1 font-semibold">Pendientes</h3>
              <p className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">
                {stats.pendingAppointments}
              </p>
            </div>
          </motion.div>

          {/* Upcoming */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ y: -4 }}
            className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-2xl transition-all p-6 border-2 border-white/50 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-gray-600 text-sm mb-1 font-semibold">Próximas</h3>
              <p className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                {stats.upcomingAppointments}
              </p>
            </div>
          </motion.div>

          {/* Completed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ y: -4 }}
            className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-2xl transition-all p-6 border-2 border-white/50 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-gray-600 text-sm mb-1 font-semibold">Completadas</h3>
              <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                {stats.completedAppointments}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Appointments Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="relative z-10 bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-white/50 p-8"
        >
          {/* Section Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent">
                Mis Citas
              </span>
            </h2>
            {appointments.length > 0 && (
              <span className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 px-5 py-2 rounded-full text-sm font-bold shadow-md">
                {appointments.length} total
              </span>
            )}
          </div>

          {appointments.length === 0 ? (
            <div className="text-center py-16">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-200 to-cyan-200 rounded-full blur-xl opacity-50"></div>
                <div className="relative p-6 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full">
                  <Calendar className="w-16 h-16 text-blue-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No tienes citas aún</h3>
              <p className="text-gray-600 text-lg mb-6">Agenda tu primera cita con un proveedor</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/client/providers')}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
              >
                Ver Proveedores
              </motion.button>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment) => {
                const config = statusConfig[appointment.status];
                const StatusIcon = config.icon;

                return (
                  <motion.div
                    key={appointment.id}
                    whileHover={{ scale: 1.01 }}
                    className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-100 hover:border-blue-200 rounded-2xl p-6 hover:shadow-xl transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span
                            className={`px-4 py-1.5 rounded-full text-sm font-bold ${config.bg} ${config.text} shadow-sm flex items-center gap-2`}
                          >
                            <StatusIcon className="w-4 h-4" />
                            {config.label}
                          </span>
                          {appointment.rating && (
                            <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full">
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              <span className="font-bold text-yellow-700">
                                {appointment.rating}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-gray-700 mb-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">
                            {new Date(appointment.date).toLocaleDateString('es-MX', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {appointment.address && (
                          <div className="flex items-center gap-2 text-gray-600 text-sm">
                            <MapPin className="w-4 h-4 text-emerald-600" />
                            <span>{appointment.address}</span>
                          </div>
                        )}

                        {appointment.notes && (
                          <div className="mt-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                            <strong>Notas:</strong> {appointment.notes}
                          </div>
                        )}
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 text-center border-2 border-blue-100">
                        <div className="text-3xl font-bold text-blue-700">
                          ${appointment.cost.toLocaleString()}
                        </div>
                        <div className="text-sm text-blue-600 font-medium">MXN</div>
                      </div>
                    </div>

                    {appointment.review && (
                      <div className="mt-4 pt-4 border-t-2 border-gray-100">
                        <p className="text-gray-700 italic bg-gray-50 rounded-xl p-4">
                          &quot;{appointment.review}&quot;
                        </p>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
