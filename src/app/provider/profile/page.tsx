'use client';

import { Suspense } from 'react';
import ProviderDashboard from '@/app/components/ProviderDashboard';

export default function ProviderProfilePage() {
  return (
    <Suspense fallback={<div>Cargando perfil...</div>}>
      <ProviderDashboard />
    </Suspense>
  );
}
