'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2, XCircle, ArrowRight, Clock, AlertTriangle } from 'lucide-react';

// ============================================
// INTERFACES
// ============================================
interface Subscription {
  id: string;
  providerId: string;
  planId: string;
  paymentStatus: boolean;
  isActive: boolean;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

function SubscriptionSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, user } = useAuth();

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'timeout'>('loading');
  const [message, setMessage] = useState('Verificando tu suscripción...');
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 30;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      console.warn(
        '⚠️ No session_id found - backend needs to add ?session_id={CHECKOUT_SESSION_ID}'
      );
    } else {
      console.log('✅ Session ID received:', sessionId);
    }

    if (!user?.id || !token) {
      console.log('❌ No user or token, redirecting to login...');
      router.push('/login');
      return;
    }

    // Verificar inmediatamente
    checkSubscription();

    // Polling cada 3 segundos
    intervalRef.current = setInterval(() => {
      checkSubscription();
    }, 3000);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [searchParams, token, user, router]);

  const checkSubscription = async () => {
    if (!user?.id || !token) return;

    try {
      const backendUrl = process.env.VITE_BACKEND_URL;

      setAttempts((prev) => {
        const newAttempts = prev + 1;
        console.log(`🔍 Attempt ${newAttempts}/${maxAttempts}: Checking subscriptions...`);
        return newAttempts;
      });

      // Obtener todas las suscripciones
      const response = await fetch(`${backendUrl}/subscription`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.log('🔒 Unauthorized, redirecting to login...');
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          router.push('/login');
          return;
        }

        // Si es otro error y aún no agotamos intentos, continuar
        if (attempts < maxAttempts) {
          console.log(`⚠️ Error response (${response.status}), will retry...`);
          return;
        }

        // Si ya agotamos intentos, mostrar error
        throw new Error('No se pudo verificar la suscripción');
      }

      const subscriptions: Subscription[] = await response.json();
      console.log('📋 Subscriptions received:', subscriptions);

      // Buscar suscripción activa
      const activeSub = Array.isArray(subscriptions)
        ? subscriptions.find(
            (sub: Subscription) =>
              sub.providerId === user.id && (sub.paymentStatus === true || sub.isActive === true)
          )
        : null;

      if (activeSub) {
        console.log('✅ Active subscription found!', activeSub);

        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }

        setStatus('success');
        setMessage('¡Tu suscripción se ha activado exitosamente!');

        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else if (attempts >= maxAttempts) {
        console.log('⏱️ Max attempts reached without finding subscription');

        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }

        setStatus('timeout');
        setMessage(
          'Tu pago fue procesado pero la activación está tardando más de lo esperado. Por favor espera unos minutos y recarga la página.'
        );
      } else {
        console.log(`ℹ️ No active subscription yet, continuing...`);
      }
    } catch (error) {
      console.error('❌ Error in checkSubscription:', error);

      // Solo mostrar error si agotamos todos los intentos
      if (attempts >= maxAttempts) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        setStatus('error');
        setMessage(
          'No pudimos verificar tu suscripción después de varios intentos. Por favor contacta a soporte.'
        );
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-emerald-50 flex items-center justify-center px-4 pt-24">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-md w-full text-center"
      >
        {!searchParams.get('session_id') && status === 'loading' && (
          <div className="mb-4 p-3 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
            <div className="flex items-center gap-2 text-yellow-700 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Esperando confirmación del pago...</span>
            </div>
          </div>
        )}

        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Procesando tu pago...</h1>
            <p className="text-gray-600 mb-4">{message}</p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>
                Intento {attempts} de {maxAttempts}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-4">Esto puede tardar hasta 1-2 minutos</p>
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

        {status === 'timeout' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.6 }}
          >
            <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Activación Pendiente</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all"
              >
                Recargar página
              </button>
              <button
                onClick={() => router.push('/subscriptions')}
                className="w-full bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all flex items-center justify-center gap-2"
              >
                Volver a Suscripciones
                <ArrowRight className="w-5 h-5" />
              </button>
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
