'use client';

import { Suspense } from 'react';
import ProviderDashboard from '@/app/components/ProviderDashboard';
import { Loader2 } from 'lucide-react';

export default function ProviderDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-emerald-50 flex items-center justify-center pt-24">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Cargando dashboard...</p>
          </div>
        </div>
      }
    >
      <ProviderDashboard />
    </Suspense>
  );
}
