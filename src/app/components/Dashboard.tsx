'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import ClientDashboard from './ClientDashboard';
import ProviderDashboard from './ProviderDashboard';

const Dashboard = () => {
  const { user, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Verificar autenticación
    if (!user || !token) {
      router.push('/login');
    }
  }, [user, token, router]);

  // Si no hay usuario, mostrar loading
  if (!user || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Renderizar el dashboard según el rol del usuario
  if (user.role === 'client') {
    return <ClientDashboard />;
  }

  if (user.role === 'provider') {
    return <ProviderDashboard />;
  }

  // Para admin, mostrar el dashboard de cliente
  if (user.role === 'admin') {
    return <ClientDashboard />;
  }

  // Fallback para roles no reconocidos
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <p className="text-xl font-semibold text-gray-900 mb-2">Rol no reconocido</p>
        <p className="text-gray-600 mb-4">
          Rol actual: <span className="font-mono">{user.role}</span>
        </p>
        <button
          onClick={() => router.push('/login')}
          className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold"
        >
          Volver al login
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
