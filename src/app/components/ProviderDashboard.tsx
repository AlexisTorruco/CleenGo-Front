'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
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
} from 'lucide-react';

// ============================================
// INTERFACES
// ============================================
interface UserProfile {
  name: string;
  surname: string;
  birthDate: string;
  profileImgUrl: string;
  phone: string;
  about?: string;
  days?: string[];
  hours?: string[];
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
  totalEarned: number;
  completedServices: number;
  upcomingServices: number;
  averageRating: number;
  pendingRequests: number;
}

// ============================================
// COMPONENTE
// ============================================
export default function ProviderDashboard() {
  const { user, token, logout } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pendingAppointments, setPendingAppointments] = useState<Appointment[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [stats, setStats] = useState<DashboardStats>({
    completedServices: 0,
    upcomingServices: 0,
    totalEarned: 0,
    averageRating: 0,
    pendingRequests: 0,
  });

  const fetchData = useCallback(async () => {
    if (!user?.id || !token) return;

    setLoading(true);
    setError(null);

    try {
      const backendUrl = 'http://localhost:3000';

      console.log('📡 Fetching provider data for:', user.id);

      // Fetch provider profile
      const profileRes = await fetch(`${backendUrl}/provider/${user.id}`, {
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

        // Filter for this provider
        const providerAppointments = allAppointments.filter((apt) => apt.providerId === user.id);
        console.log('📅 Provider appointments:', providerAppointments.length);

        // Separate pending from others
        const pending = providerAppointments.filter((apt) => apt.status === 'pending');
        const nonPending = providerAppointments.filter((apt) => apt.status !== 'pending');

        setPendingAppointments(pending);
        setAppointments(nonPending);

        // Calculate stats
        const completed = providerAppointments.filter((apt) => apt.status === 'completed').length;
        const upcoming = providerAppointments.filter(
          (apt) => apt.status === 'scheduled' || apt.status === 'in-progress'
        ).length;
        const totalEarned = providerAppointments
          .filter((apt) => apt.status === 'completed')
          .reduce((sum, apt) => sum + (apt.cost || 0), 0);

        const ratedAppointments = providerAppointments.filter(
          (apt) => apt.rating && apt.status === 'completed'
        );
        const averageRating =
          ratedAppointments.length > 0
            ? ratedAppointments.reduce((sum, apt) => sum + (apt.rating || 0), 0) /
              ratedAppointments.length
            : 0;

        setStats({
          completedServices: completed,
          upcomingServices: upcoming,
          totalEarned,
          averageRating: Math.round(averageRating * 10) / 10,
          pendingRequests: pending.length,
        });

        console.log('📊 Stats calculated:', {
          completed,
          upcoming,
          pending: pending.length,
          totalEarned,
          averageRating,
        });
      }
    } catch (err) {
      console.error('❌ Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, [user, token, logout, router]);

  const handleAppointmentAction = async (appointmentId: string, action: 'accept' | 'reject') => {
    if (!token) return;

    setProcessingId(appointmentId);
    setError(null);

    try {
      const backendUrl = 'http://localhost:3000';
      const newStatus = action === 'accept' ? 'scheduled' : 'cancelled';

      const response = await fetch(`${backendUrl}/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar la solicitud');
      }

      console.log(`✅ Appointment ${action}ed:`, appointmentId);

      // Reload data
      await fetchData();

      // Show success message
      const successMsg = document.createElement('div');
      successMsg.className =
        'fixed top-4 right-4 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2';
      successMsg.innerHTML = `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg> <span>Solicitud ${
        action === 'accept' ? 'aceptada' : 'rechazada'
      }</span>`;
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 3000);
    } catch (err) {
      console.error('Error updating appointment:', err);
      setError(err instanceof Error ? err.message : 'Error al actualizar la solicitud');
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    console.log('🔍 ProviderDashboard - Checking auth...');
    console.log('👤 User:', user);
    console.log('🔑 Token:', token ? 'Exists ✅' : 'Missing ❌');

    if (!user || !token) {
      console.log('❌ No user or token, redirecting to login');
      router.push('/login');
      return;
    }

    if (user.role !== 'provider') {
      console.log('❌ Not a provider, redirecting to dashboard');
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
    completed: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Completado' },
    scheduled: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Programado' },
    'in-progress': { bg: 'bg-cyan-100', text: 'text-cyan-700', label: 'En Progreso' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelado' },
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pendiente' },
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
              {/* Profile Image with glow */}
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
                  <Briefcase className="w-5 h-5 text-white" />
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
                    <span>{user?.email}</span>
                  </div>
                  {profile?.phone && (
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      <Phone className="w-4 h-4 text-cyan-600" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                </div>

                {/* About */}
                {profile?.about && (
                  <p className="text-gray-600 text-sm bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                    {profile.about}
                  </p>
                )}
              </div>

              {/* Rating Badge & Edit Button */}
              <div className="flex flex-col gap-3">
                <div className="bg-gradient-to-br from-blue-500 via-cyan-500 to-emerald-500 rounded-2xl p-6 text-white text-center shadow-xl">
                  <Award className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-3xl font-bold">
                    {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'N/A'}
                  </div>
                  <div className="text-sm opacity-90 flex items-center justify-center gap-1">
                    <Star className="w-4 h-4 fill-white" />
                    Rating
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/provider/edit-profile')}
                  className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-blue-200 text-blue-700 rounded-xl hover:bg-blue-50 transition-all font-semibold"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </motion.button>
              </div>

              {/* Address Section */}
              {profile?.address && (
                <div className="flex items-start gap-3 text-gray-600 text-sm bg-purple-50/50 rounded-xl p-4 border border-purple-100 mt-4">
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
              )}
            </div>

            {/* Availability */}
            {profile?.days && profile.days.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-gray-700">Disponibilidad:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.days.map((day) => (
                      <span
                        key={day}
                        className="px-3 py-1 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 rounded-full text-sm font-medium"
                      >
                        {day}
                      </span>
                    ))}
                  </div>
                  {profile.hours && profile.hours.length > 0 && (
                    <>
                      <div className="flex items-center gap-2 ml-4">
                        <Clock className="w-5 h-5 text-emerald-600" />
                        <span className="font-semibold text-gray-700">Horario:</span>
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
            )}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Pending Requests */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -4 }}
            className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-2xl transition-all p-6 border-2 border-white/50 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl shadow-lg">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                {stats.pendingRequests > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {stats.pendingRequests}
                  </span>
                )}
              </div>
              <h3 className="text-gray-600 text-sm mb-1 font-semibold">Solicitudes Pendientes</h3>
              <p className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">
                {stats.pendingRequests}
              </p>
            </div>
          </motion.div>

          {/* Total Earned */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -4 }}
            className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-2xl transition-all p-6 border-2 border-white/50 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-gray-400" />
              </div>
              <h3 className="text-gray-600 text-sm mb-1 font-semibold">Total Ganado</h3>
              <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                ${stats.totalEarned?.toLocaleString() || 0}
              </p>
            </div>
          </motion.div>

          {/* Completed Services */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
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
              <h3 className="text-gray-600 text-sm mb-1 font-semibold">Trabajos Completados</h3>
              <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                {stats.completedServices}
              </p>
            </div>
          </motion.div>

          {/* Upcoming Services */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ y: -4 }}
            className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-2xl transition-all p-6 border-2 border-white/50 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-gray-600 text-sm mb-1 font-semibold">Próximos Trabajos</h3>
              <p className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                {stats.upcomingServices}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Pending Requests Section */}
        {pendingAppointments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="relative z-10 bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-white/50 p-8 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-xl">
                  <Bell className="w-6 h-6 text-white animate-pulse" />
                </div>
                <span className="bg-gradient-to-r from-yellow-600 via-amber-600 to-orange-600 bg-clip-text text-transparent">
                  Solicitudes Pendientes
                </span>
              </h2>
              <span className="bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 px-5 py-2 rounded-full text-sm font-bold shadow-md">
                {pendingAppointments.length} nueva{pendingAppointments.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-4">
              {pendingAppointments.map((appointment) => (
                <motion.div
                  key={appointment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-2xl p-6 hover:shadow-xl transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-yellow-200 text-yellow-800 shadow-sm">
                          Nueva solicitud
                        </span>
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
                        <div className="flex items-center gap-2 text-gray-600 text-sm mb-2">
                          <MapPin className="w-4 h-4 text-emerald-600" />
                          <span>{appointment.address}</span>
                        </div>
                      )}

                      {appointment.notes && (
                        <div className="mt-2 text-sm text-gray-600 bg-white/50 rounded-lg p-3 border border-yellow-100">
                          <strong>Notas:</strong> {appointment.notes}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 text-center border-2 border-blue-100">
                        <div className="text-3xl font-bold text-blue-700">
                          ${appointment.cost.toLocaleString()}
                        </div>
                        <div className="text-sm text-blue-600 font-medium">MXN</div>
                      </div>

                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleAppointmentAction(appointment.id, 'accept')}
                          disabled={processingId === appointment.id}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50"
                        >
                          {processingId === appointment.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              <Check className="w-5 h-5" />
                              Aceptar
                            </>
                          )}
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleAppointmentAction(appointment.id, 'reject')}
                          disabled={processingId === appointment.id}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50"
                        >
                          {processingId === appointment.id ? (
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
              ))}
            </div>
          </motion.div>
        )}

        {/* Appointments Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="relative z-10 bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-white/50 p-8"
        >
          {/* Section Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent">
                Mis Trabajos
              </span>
            </h2>
            {appointments.length > 0 && (
              <span className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 px-5 py-2 rounded-full text-sm font-bold shadow-md">
                {appointments.length} total
              </span>
            )}
          </div>

          {appointments.length === 0 && pendingAppointments.length === 0 ? (
            <div className="text-center py-16">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-200 to-cyan-200 rounded-full blur-xl opacity-50"></div>
                <div className="relative p-6 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full">
                  <Briefcase className="w-16 h-16 text-blue-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No tienes trabajos aún</h3>
              <p className="text-gray-600 text-lg">Los clientes comenzarán a contactarte pronto</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">
                No tienes trabajos confirmados. Revisa las solicitudes pendientes arriba.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment) => {
                const config = statusConfig[appointment.status];
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
                            className={`px-4 py-1.5 rounded-full text-sm font-bold ${config.bg} ${config.text} shadow-sm`}
                          >
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
