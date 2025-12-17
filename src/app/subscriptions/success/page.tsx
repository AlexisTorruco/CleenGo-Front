'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2, XCircle, ArrowRight } from 'lucide-react';

function SubscriptionSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuth();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando tu suscripción...');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      setStatus('error');
      setMessage('No se encontró la sesión de pago. Por favor contacta a soporte.');
      return;
    }

    verifySubscription(sessionId);
  }, [searchParams, token]);

  const verifySubscription = async (sessionId: string) => {
    try {
      const backendUrl = process.env.VITE_BACKEND_URL;

      // Verificar el estado de la sesión de Stripe
      const response = await fetch(
        `${backendUrl}/subscription/verify-session?session_id=${sessionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Subscription verified:', data);

        setStatus('success');
        setMessage('¡Tu suscripción se ha activado exitosamente!');

        // Redirigir al dashboard después de 3 segundos
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      } else {
        throw new Error('Error al verificar la suscripción');
      }
    } catch (error) {
      console.error('❌ Error verifying subscription:', error);
      setStatus('error');
      setMessage(
        'Hubo un problema al verificar tu suscripción. Por favor recarga la página o contacta a soporte.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-emerald-50 flex items-center justify-center px-4 pt-24">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-md w-full text-center"
      >
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Procesando tu pago...</h1>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.6 }}
          >
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Pago Exitoso!</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Redirigiendo al dashboard...</span>
            </div>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.6 }}
          >
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error de Verificación</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => router.push('/subscriptions')}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all flex items-center justify-center gap-2"
            >
              Volver a Suscripciones
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-emerald-50 flex items-center justify-center px-4 pt-24">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Cargando...</h1>
            <p className="text-gray-600">Preparando la verificación de tu suscripción</p>
          </div>
        </div>
      }
    >
      <SubscriptionSuccessContent />
    </Suspense>
  );
}
