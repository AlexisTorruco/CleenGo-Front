'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
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
} from 'lucide-react';

// ============================================
// INTERFACES - Todo en un solo archivo
// ============================================
interface UserProfile {
  name: string;
  surname: string;
  birthDate: string;
  profileImgUrl: string;
  phone: string;
}

interface Appointment {
  id: string;
  date: string;
  cost: number;
  status: 'completed' | 'scheduled' | 'in-progress' | 'cancelled';
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
  const [stats, setStats] = useState<DashboardStats>({
    completedServices: 0,
    upcomingServices: 0,
    totalEarned: 0,
    averageRating: 0,
  });

  const fetchDashboardData = useCallback(async () => {
    if (!user || !token) return;

    setLoading(true);
    setError(null);

    try {
      // In Next.js client components, env variables are embedded at build time
      const backendUrl = 'http://localhost:3000'; // Hardcoded for now

      console.log('🔍 Backend URL:', backendUrl); // Debug

      // Fetch user profile
      const profileResponse = await fetch(`${backendUrl}/user/profile/${user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!profileResponse.ok) {
        if (profileResponse.status === 401) {
          logout();
          router.push('/login');
          return;
        }
        throw new Error('Error al cargar el perfil');
      }

      const profileData: UserProfile = await profileResponse.json();
      setProfile(profileData);

      // Fetch all appointments
      const appointmentsResponse = await fetch(`${backendUrl}/appointments`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!appointmentsResponse.ok) {
        throw new Error('Error al cargar los trabajos');
      }

      // Check if response is JSON
      const contentType = appointmentsResponse.headers.get('content-type');
      let allAppointments: Appointment[] = [];

      if (contentType && contentType.includes('application/json')) {
        const data = await appointmentsResponse.json();
        // Handle if data is an array or if it has an 'appointments' property
        allAppointments = Array.isArray(data) ? data : data.appointments || [];
      } else {
        // Backend returned text (probably empty or "This action returns...")
        console.log('Backend no tiene appointments aún');
        allAppointments = [];
      }

      // Filter appointments for this provider
      const providerAppointments = allAppointments.filter((apt) => apt.providerId === user.id);

      setAppointments(providerAppointments);

      // Calculate stats
      const completed = providerAppointments.filter((apt) => apt.status === 'completed').length;
      const upcoming = providerAppointments.filter((apt) => apt.status === 'scheduled').length;
      const totalEarned = providerAppointments
        .filter((apt) => apt.status === 'completed')
        .reduce((sum, apt) => sum + (apt.cost || 0), 0);

      // Calculate average rating
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
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, [user, token, logout, router]);

  useEffect(() => {
    if (!user || !token) {
      router.push('/login');
      return;
    }

    if (user.role !== 'provider') {
      router.push('/dashboard');
      return;
    }

    fetchDashboardData();
  }, [user, token, router, fetchDashboardData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando tu dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl p-8 mb-8"
        >
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Profile Image */}
            <div className="relative">
              {profile?.profileImgUrl ? (
                <Image
                  src={profile.profileImgUrl}
                  alt="Foto de perfil"
                  width={96}
                  height={96}
                  className="rounded-full object-cover border-4 border-purple-500"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center border-4 border-purple-500">
                  <User className="w-12 h-12 text-white" />
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 bg-pink-500 rounded-full p-2">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {profile?.name} {profile?.surname}
              </h1>
              <div className="flex flex-col md:flex-row gap-4 text-gray-600">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{user?.email}</span>
                </div>
                {profile?.phone && (
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{profile.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Rating Badge */}
            <div className="bg-linear-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white text-center">
              <Star className="w-8 h-8 mx-auto mb-2 fill-white" />
              <div className="text-2xl font-bold">
                {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'N/A'}
              </div>
              <div className="text-sm opacity-90">Calificación Promedio</div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-gray-400" />
            </div>
            <h3 className="text-gray-600 text-sm mb-1">Total Ganado</h3>
            <p className="text-3xl font-bold text-gray-900">
              ${stats.totalEarned?.toLocaleString() || 0}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-pink-100 rounded-xl">
                <CheckCircle className="w-6 h-6 text-pink-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm mb-1">Trabajos Completados</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.completedServices}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-100 rounded-xl">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm mb-1">Próximos Trabajos</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.upcomingServices}</p>
          </motion.div>
        </div>

        {/* Appointments Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-3xl shadow-xl p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-purple-600" />
              Mis Trabajos
            </h2>
            {appointments.length > 0 && (
              <span className="bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold">
                {appointments.length} total
              </span>
            )}
          </div>

          {appointments.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No tienes trabajos aún</h3>
              <p className="text-gray-600 mb-6">Los clientes comenzarán a contactarte pronto</p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <motion.div
                  key={appointment.id}
                  whileHover={{ scale: 1.01 }}
                  className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            appointment.status === 'completed'
                              ? 'bg-pink-100 text-pink-700'
                              : appointment.status === 'scheduled'
                              ? 'bg-purple-100 text-purple-700'
                              : appointment.status === 'in-progress'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {appointment.status === 'completed'
                            ? 'Completado'
                            : appointment.status === 'scheduled'
                            ? 'Programado'
                            : appointment.status === 'in-progress'
                            ? 'En Progreso'
                            : 'Cancelado'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <Calendar className="w-4 h-4" />
                        <span>
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
                        <p className="text-sm text-gray-500">{appointment.address}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      {appointment.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                          <span className="font-semibold">{appointment.rating}</span>
                        </div>
                      )}
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          ${appointment.cost.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">MXN</div>
                      </div>
                    </div>
                  </div>

                  {appointment.review && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm text-gray-600 italic">
                        &quot;{appointment.review}&quot;
                      </p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
