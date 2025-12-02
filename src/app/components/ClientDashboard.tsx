'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/app/components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { motion } from 'framer-motion';

// 🔹 Interfaces
interface IDashboardData {
  appointments: IAppointment[];
  stats?: {
    totalSpent?: number;
    completedServices?: number;
    upcomingServices?: number;
  };
}

interface IAppointment {
  id: string;
  date: string;
  cost: number;
  status: 'completed' | 'scheduled' | 'in-progress' | 'cancelled';
  provider: {
    name: string;
  };
  service?: {
    name: string;
    description?: string;
  };
  address?: string;
  rating?: number;
  review?: string;
}

const ClientDashboard = () => {
  const { user, token } = useAuth();
  const [dashboardData, setDashboardData] = useState<IDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Estadísticas calculadas
  const appointments = dashboardData?.appointments || [];
  const totalSpent =
    dashboardData?.stats?.totalSpent || appointments.reduce((sum, a) => sum + a.cost, 0);
  const completedServices =
    dashboardData?.stats?.completedServices ||
    appointments.filter((a) => a.status === 'completed').length;
  const upcomingServices =
    dashboardData?.stats?.upcomingServices ||
    appointments.filter((a) => a.status === 'scheduled').length;

  // Estadísticas de cuenta
  const accountStats = {
    memberSince: 'Nov 2024',
    servicesHired: appointments.length,
    rating: 4.9,
    status: 'Activo',
  };

  // Cargar datos del dashboard
  useEffect(() => {
    const fetchDashboard = async () => {
      if (!token || !user?.id) {
        setError('No hay sesión activa');
        setLoading(false);
        return;
      }

      try {
        // 🔴 CUANDO TU COMPAÑERA TERMINE EL ENDPOINT, DESCOMENTA ESTO:
        /*
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}user/dashboard/${user.id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setDashboardData(data);
        */

        // 🔹 MODO DESARROLLO: Datos mock
        console.log('⚠️ Usando datos mock - El endpoint aún no está implementado');
        console.log('👤 User ID:', user.id);
        console.log('🔑 Token disponible:', !!token);

        // Simular delay de red
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setDashboardData(MOCK_DASHBOARD_DATA);
      } catch (error) {
        console.error('Error al cargar dashboard:', error);
        setError('No se pudieron cargar los datos del dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [token, user?.id]);

  // Función para obtener el badge según el estado
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">✅ Completado</Badge>;
      case 'scheduled':
        return <Badge variant="info">📅 Programado</Badge>;
      case 'in-progress':
        return <Badge variant="warning">🔄 En Progreso</Badge>;
      case 'cancelled':
        return <Badge variant="danger">❌ Cancelado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-20">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Error</h3>
              <p className="text-gray-600">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* ============================================ */}
        {/* SECCIÓN 1: INFORMACIÓN PERSONAL             */}
        {/* ============================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tarjeta de perfil */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl">
              <CardContent className="pt-6 text-center">
                {/* Avatar */}
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
                  {user?.profileImgUrl ? (
                    <img
                      src={user.profileImgUrl}
                      alt={user.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>

                <h2 className="text-2xl font-bold mb-1">{user?.name}</h2>
                <p className="text-blue-100 text-sm mb-4">Cliente</p>

                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="w-full bg-white text-blue-600 py-2 px-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Editar Perfil
                </button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Información y estadísticas */}
          <div className="lg:col-span-2 space-y-6">
            {/* Información Personal */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-gray-900">Información Personal</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Email</p>
                      <p className="font-semibold text-gray-900">{user?.email}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-900 mb-3 font-medium">
                      Completa tu perfil para una mejor experiencia
                    </p>
                    <button className="text-sm bg-white border-2 border-amber-400 text-amber-700 px-4 py-2 rounded-lg hover:bg-amber-50 transition-colors font-semibold">
                      Completar perfil
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Estadísticas de Cuenta */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-gray-900">Estadísticas de Cuenta</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                      <p className="text-2xl font-bold text-blue-900">{accountStats.memberSince}</p>
                      <p className="text-xs text-blue-700 mt-1 font-medium">Miembro desde</p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                      <p className="text-2xl font-bold text-green-900">
                        {accountStats.servicesHired}
                      </p>
                      <p className="text-xs text-green-700 mt-1 font-medium">
                        Servicios contratados
                      </p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-200">
                      <p className="text-2xl font-bold text-amber-900 flex items-center justify-center gap-1">
                        {accountStats.rating} <span className="text-amber-500">⭐</span>
                      </p>
                      <p className="text-xs text-amber-700 mt-1 font-medium">Calificación</p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200">
                      <p className="text-2xl font-bold text-emerald-900">{accountStats.status}</p>
                      <p className="text-xs text-emerald-700 mt-1 font-medium">Estado</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* ============================================ */}
        {/* SECCIÓN 2: DASHBOARD DE SERVICIOS          */}
        {/* ============================================ */}

        {/* Header del dashboard */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Mis Servicios 🧹</h2>
          <p className="text-gray-700">Resumen de tus servicios de limpieza</p>
        </motion.div>

        {/* Estadísticas de servicios */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-xl border-0">
              <CardContent className="pt-6">
                <div className="text-sm font-semibold mb-1 opacity-90">Total Gastado</div>
                <div className="text-4xl font-bold">${totalSpent.toLocaleString()}</div>
                <div className="text-xs mt-2 opacity-80">En servicios de limpieza</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl border-0">
              <CardContent className="pt-6">
                <div className="text-sm font-semibold mb-1 opacity-90">Servicios Completados</div>
                <div className="text-4xl font-bold">{completedServices}</div>
                <div className="text-xs mt-2 opacity-80">Trabajos finalizados</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-xl border-0">
              <CardContent className="pt-6">
                <div className="text-sm font-semibold mb-1 opacity-90">Próximos Servicios</div>
                <div className="text-4xl font-bold">{upcomingServices}</div>
                <div className="text-xs mt-2 opacity-80">Programados</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Lista de Appointments */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          <Card className="shadow-xl">
            <CardHeader className="border-b border-gray-200 bg-gray-50">
              <CardTitle className="text-gray-900">Historial de Servicios</CardTitle>
              <CardDescription className="text-gray-600">
                Todos tus servicios contratados
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {appointments.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">🧹</div>
                  <p className="text-lg font-semibold mb-2 text-gray-900">No tenés servicios aún</p>
                  <p className="text-sm text-gray-600">Contratá tu primer servicio de limpieza</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments.map((appointment, index) => (
                    <motion.div
                      key={appointment.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border-2 border-gray-200 rounded-xl p-5 hover:border-emerald-300 hover:shadow-lg transition-all bg-white"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        {/* Info del servicio */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-3xl">🏠</span>
                            <div>
                              <h4 className="font-bold text-gray-900 text-lg">
                                {appointment.service?.name || 'Servicio de Limpieza'}
                              </h4>
                              <p className="text-sm text-gray-600 font-medium">
                                Proveedor: {appointment.provider.name}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-4">
                            <div className="flex items-start gap-2">
                              <span className="text-blue-600 font-semibold">📅 Fecha:</span>
                              <p className="font-semibold text-gray-900">
                                {new Date(appointment.date).toLocaleDateString('es-AR')}
                              </p>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-red-600 font-semibold">📍 Dirección:</span>
                              <p className="font-semibold text-gray-900">
                                {appointment.address || 'No especificada'}
                              </p>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-amber-600 font-semibold">⭐ Calificación:</span>
                              <p className="font-semibold text-gray-900">
                                {appointment.rating ? `${appointment.rating}/5` : 'Sin calificar'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Precio y Estado */}
                        <div className="flex md:flex-col items-center md:items-end gap-3">
                          {getStatusBadge(appointment.status)}
                          <div className="text-right">
                            <div className="text-3xl font-bold text-emerald-600">
                              ${appointment.cost.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Reseña si existe */}
                      {appointment.review && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-sm text-gray-700 italic font-medium bg-gray-50 p-3 rounded-lg">
                            &quot;{appointment.review}&quot;
                          </p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Botón de acción */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center pb-8"
        >
          <button className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-4 px-10 rounded-xl shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105">
            ➕ Contratar Nuevo Servicio
          </button>
        </motion.div>
      </div>
    </div>
  );
};

// 🔹 Datos mock para desarrollo
const MOCK_DASHBOARD_DATA: IDashboardData = {
  appointments: [
    {
      id: '1',
      date: '2024-11-25T10:00:00Z',
      cost: 5000,
      status: 'completed',
      provider: {
        name: 'María González',
      },
      service: {
        name: 'Limpieza Profunda',
        description: 'Limpieza completa del hogar',
      },
      address: 'Av. Corrientes 1234, CABA',
      rating: 5,
      review: 'Excelente servicio, muy profesional y puntual. Dejó todo impecable.',
    },
    {
      id: '2',
      date: '2024-12-05T14:00:00Z',
      cost: 7500,
      status: 'scheduled',
      provider: {
        name: 'Juan Pérez',
      },
      service: {
        name: 'Limpieza Express',
      },
      address: 'Av. Libertador 5678, CABA',
    },
    {
      id: '3',
      date: '2024-11-15T09:00:00Z',
      cost: 4500,
      status: 'completed',
      provider: {
        name: 'Ana Martínez',
      },
      service: {
        name: 'Limpieza de Oficina',
      },
      address: 'Av. Santa Fe 3456, CABA',
      rating: 4,
    },
  ],
  stats: {
    totalSpent: 17000,
    completedServices: 2,
    upcomingServices: 1,
  },
};

export default ClientDashboard;
