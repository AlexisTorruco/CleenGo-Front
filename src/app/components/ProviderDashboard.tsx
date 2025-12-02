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
import { Badge } from '@/app/components/ui/Badge';
import { IJob } from '../types/service.interface';
import { motion } from 'framer-motion';

const ProviderDashboard = () => {
  const { user, token } = useAuth();
  const [jobs, setJobs] = useState<IJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Estadísticas
  const totalEarnings = jobs.reduce((sum, j) => sum + j.netEarnings, 0);
  const completedJobs = jobs.filter((j) => j.status === 'completed').length;
  const upcomingJobs = jobs.filter((j) => j.status === 'scheduled').length;
  const averageRating =
    jobs.filter((j) => j.rating).reduce((sum, j) => sum + (j.rating || 0), 0) /
      jobs.filter((j) => j.rating).length || 0;

  // Estadísticas de cuenta
  const accountStats = {
    memberSince: 'Nov 2024',
    jobsCompleted: completedJobs,
    rating: averageRating.toFixed(1),
    status: 'Activo',
  };

  // Cargar trabajos del proveedor
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/jobs/my-jobs`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        setJobs(data);
      } catch (error) {
        console.error('Error al cargar trabajos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [token]);

  // Función para obtener el color del badge según el estado
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* ============================================ */}
        {/* SECCIÓN 1: INFORMACIÓN PERSONAL             */}
        {/* ============================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tarjeta de perfil */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <Card className="bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-xl">
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
                <p className="text-purple-100 text-sm mb-4">Proveedor de Servicios</p>

                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="w-full bg-white text-purple-600 py-2 px-4 rounded-lg font-semibold hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
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
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-purple-600"
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
                      Completa tu perfil profesional para atraer más clientes
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
                    <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                      <p className="text-2xl font-bold text-purple-900">
                        {accountStats.memberSince}
                      </p>
                      <p className="text-xs text-purple-700 mt-1 font-medium">Miembro desde</p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                      <p className="text-2xl font-bold text-green-900">
                        {accountStats.jobsCompleted}
                      </p>
                      <p className="text-xs text-green-700 mt-1 font-medium">
                        Trabajos completados
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
        {/* SECCIÓN 2: DASHBOARD DE TRABAJOS           */}
        {/* ============================================ */}

        {/* Header del dashboard */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Mis Trabajos 💼</h2>
          <p className="text-gray-700">Resumen de tus trabajos como proveedor</p>
        </motion.div>

        {/* Estadísticas de trabajos */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-xl border-0">
              <CardContent className="pt-6">
                <div className="text-sm font-semibold mb-1 opacity-90">Ganancias Totales</div>
                <div className="text-4xl font-bold">${totalEarnings.toLocaleString()}</div>
                <div className="text-xs mt-2 opacity-80">Netas (sin comisión)</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-xl border-0">
              <CardContent className="pt-6">
                <div className="text-sm font-semibold mb-1 opacity-90">Trabajos Completados</div>
                <div className="text-4xl font-bold">{completedJobs}</div>
                <div className="text-xs mt-2 opacity-80">Finalizados exitosamente</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl border-0">
              <CardContent className="pt-6">
                <div className="text-sm font-semibold mb-1 opacity-90">Próximos Trabajos</div>
                <div className="text-4xl font-bold">{upcomingJobs}</div>
                <div className="text-xs mt-2 opacity-80">Programados</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white shadow-xl border-0">
              <CardContent className="pt-6">
                <div className="text-sm font-semibold mb-1 opacity-90">Calificación</div>
                <div className="text-4xl font-bold">⭐ {averageRating.toFixed(1)}</div>
                <div className="text-xs mt-2 opacity-80">Promedio de clientes</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Lista de Trabajos */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
          <Card className="shadow-xl">
            <CardHeader className="border-b border-gray-200 bg-gray-50">
              <CardTitle className="text-gray-900">Historial de Trabajos</CardTitle>
              <CardDescription className="text-gray-600">
                Todos tus trabajos realizados y programados
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {jobs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">💼</div>
                  <p className="text-lg font-semibold mb-2 text-gray-900">
                    No tenés trabajos asignados aún
                  </p>
                  <p className="text-sm text-gray-600">Los clientes podrán contratarte pronto</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobs.map((job, index) => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border-2 border-gray-200 rounded-xl p-5 hover:border-purple-300 hover:shadow-lg transition-all bg-white"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        {/* Info del trabajo */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-3xl">🏢</span>
                            <div>
                              <h4 className="font-bold text-gray-900 text-lg">
                                Trabajo de Limpieza
                              </h4>
                              <p className="text-sm text-gray-600 font-medium">
                                Cliente: {job.client}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4">
                            <div className="flex items-start gap-2">
                              <span className="text-blue-600 font-semibold">📅 Fecha:</span>
                              <p className="font-semibold text-gray-900">
                                {new Date(job.date).toLocaleDateString('es-AR')}
                              </p>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-green-600 font-semibold">💰 Pago:</span>
                              <p className="font-semibold text-gray-900">
                                ${job.earnings.toLocaleString()}
                              </p>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-red-600 font-semibold">📍 Dirección:</span>
                              <p className="font-semibold text-gray-900">
                                {job.address || 'No especificada'}
                              </p>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-amber-600 font-semibold">⭐ Calificación:</span>
                              <p className="font-semibold text-gray-900">
                                {job.rating ? `${job.rating}/5` : 'Sin calificar'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Ganancias y Estado */}
                        <div className="flex md:flex-col items-center md:items-end gap-3">
                          {getStatusBadge(job.status)}
                          <div className="text-right bg-gray-50 p-3 rounded-lg">
                            <div className="text-xs text-gray-600 mb-1">Ganancia bruta</div>
                            <div className="text-lg text-gray-700 line-through">
                              ${job.earnings.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-600 mb-1 mt-2">
                              Comisión plataforma
                            </div>
                            <div className="text-sm text-red-600 font-semibold">
                              -${job.platformFee.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-600 mb-1 mt-2">Ganancia neta</div>
                            <div className="text-3xl font-bold text-purple-600">
                              ${job.netEarnings.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Reseña del cliente */}
                      {job.review && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-sm font-semibold text-gray-700 mb-2">
                            📝 Reseña del cliente:
                          </p>
                          <p className="text-sm text-gray-700 italic font-medium bg-purple-50 p-3 rounded-lg">
                            &quot;{job.review}&quot;
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
          transition={{ delay: 0.8 }}
          className="text-center pb-8"
        >
          <button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-4 px-10 rounded-xl shadow-2xl hover:shadow-3xl transition-all transform hover:scale-105">
            📋 Ver Trabajos Disponibles
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default ProviderDashboard;
