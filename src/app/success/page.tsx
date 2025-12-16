'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function SuccessRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Preservar todos los query parameters (session_id, etc)
    const searchParams = window.location.search;
    console.log('🔄 Redirecting from /success to /subscriptions/success');
    console.log('📋 Query params:', searchParams);

    // Redirigir a la página correcta con los parámetros
    router.push('/subscriptions/success' + searchParams);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-emerald-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Redirigiendo...</p>
      </div>
    </div>
  );
}
