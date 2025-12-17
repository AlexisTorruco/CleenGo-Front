'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Crown,
  Check,
  ArrowRight,
  Shield,
  Star,
  Eye,
  TrendingUp,
  Users,
  Target,
  Sparkles,
  Zap,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';

// ============================================
// INTERFACES
// ============================================
interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  isActive: boolean;
}

interface Subscription {
  id: string;
  providerId: string;
  planId: string;
  startDate: string;
  endDate: string;
  status?: 'active' | 'cancelled' | 'expired';
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// COMPONENTE
// ============================================
export default function SubscriptionPage() {
  const { user, token } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [userSubscription, setUserSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    if (!user || !token) {
      router.push('/login');
      return;
    }

    fetchData();
  }, [user, token, router]);

  const fetchData = async () => {
    if (!user?.id || !token) return;

    setLoading(true);
    try {
      const backendUrl = process.env.VITE_BACKEND_URL;

      // Fetch plans
      const plansResponse = await fetch(`${backendUrl}/plan`, {
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (plansResponse.ok) {
        const plansData = await plansResponse.json();
        console.log('📋 Plans loaded:', plansData);
        setPlans(plansData);
      }

      // Fetch user subscriptions
      const subsResponse = await fetch(`${backendUrl}/subscription`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (subsResponse.ok) {
        const subsData = await subsResponse.json();
        console.log('📋 All subscriptions:', subsData);

        // Find active subscription
        const userSub = Array.isArray(subsData)
          ? subsData.find(
              (sub: Subscription) =>
                sub.providerId === user.id && (sub.status === 'active' || sub.isActive === true)
            )
          : null;

        if (userSub) {
          console.log('✅ User active subscription:', userSub);
          setUserSubscription(userSub);
        } else {
          console.log('ℹ️ No active subscription found');
        }
      }
    } catch (err) {
      console.error('❌ Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string, planName: string, planPrice: number) => {
    if (!user || !token) {
      router.push('/login');
      return;
    }

    // Check if user already has active subscription
    if (userSubscription) {
      setError('Ya tienes una suscripción activa. Cancélala primero para cambiar de plan.');
      setTimeout(() => setError(null), 4000);
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const backendUrl = 'http://localhost:3000';

      console.log('💳 Creating Stripe checkout session...');
      console.log('🔍 User data:', {
        userId: user.id,
        planId,
        token: token ? 'exists' : 'missing',
      });

      const checkoutData = {
        providerId: user.id,
        planId: planId,
      };

      console.log('📤 Sending to backend:', JSON.stringify(checkoutData, null, 2));

      const response = await fetch(`${backendUrl}/subscription/create-checkout-session`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkoutData),
      });

      console.log('📥 Response status:', response.status, response.statusText);
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

      // Intentar parsear la respuesta como JSON primero
      let responseData;
      const contentType = response.headers.get('content-type');

      console.log('📋 Content-Type:', contentType);

      try {
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json();
          console.log('✅ Parsed as JSON:', responseData);
        } else {
          responseData = await response.text();
          console.log('✅ Parsed as TEXT:', responseData);
        }
      } catch (parseError) {
        console.error('❌ Error parsing response:', parseError);
        throw new Error('Error al procesar la respuesta del servidor');
      }

      console.log('📦 Response data (final):', responseData);

      if (!response.ok) {
        console.log('❌ Response is NOT OK');
        console.log('❌ Status:', response.status);
        console.log('❌ Status Text:', response.statusText);
        console.log('❌ Data:', responseData);
        console.log('❌ Type of data:', typeof responseData);

        console.error('❌ Backend error details:', {
          status: response.status,
          statusText: response.statusText,
          data: responseData,
          headers: Object.fromEntries(response.headers.entries()),
        });

        // Intentar extraer mensaje de error específico
        let errorMessage = 'Error al crear la sesión de pago con Stripe';

        console.log('🔍 Extracting error message from:', responseData);

        if (typeof responseData === 'object' && responseData !== null) {
          console.log('📝 Is object, checking message field...');
          const backendMessage = responseData.message || responseData.error;

          // Si es un error genérico del backend, dar más contexto
          if (backendMessage === 'Internal server error') {
            errorMessage =
              'Error en el servidor. Por favor contacta al administrador. Detalles: Verifica que Stripe esté configurado correctamente y que el plan exista.';
            console.error('🚨 Backend error genérico. Posibles causas:', {
              causa1: 'Stripe API keys no configuradas en el backend',
              causa2: 'Plan ID no existe en la base de datos',
              causa3: 'Provider ID no existe o es inválido',
              causa4: 'Error de conexión con Stripe',
              providerId: checkoutData.providerId,
              planId: checkoutData.planId,
            });
          } else {
            errorMessage = backendMessage || JSON.stringify(responseData);
          }
          console.log('📝 Extracted message:', errorMessage);
        } else if (typeof responseData === 'string') {
          console.log('📝 Is string, trying to parse...');
          try {
            const parsed = JSON.parse(responseData);
            errorMessage = parsed.message || parsed.error || errorMessage;
            console.log('📝 Parsed and extracted:', errorMessage);
          } catch {
            errorMessage = responseData;
            console.log('📝 Could not parse, using as is:', errorMessage);
          }
        }

        console.log('🚨 Final error message:', errorMessage);
        throw new Error(errorMessage);
      }

      // Verificar que tenemos la URL
      const { url } = typeof responseData === 'object' ? responseData : { url: null };

      if (!url) {
        console.error('❌ No URL in response:', responseData);
        throw new Error('No se recibió URL de checkout de Stripe');
      }

      console.log('✅ Stripe Checkout URL received:', url);
      console.log('🔄 Redirecting to Stripe...');

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (err) {
      console.log('❌ CATCH BLOCK REACHED');
      console.log('❌ Error type:', typeof err);
      console.log('❌ Error:', err);
      console.log('❌ Error message:', err instanceof Error ? err.message : 'Not an Error object');
      console.log('❌ Error stack:', err instanceof Error ? err.stack : 'No stack');

      console.error('❌ Error completo:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        stringified: JSON.stringify(err, Object.getOwnPropertyNames(err)),
      });

      setError(err instanceof Error ? err.message : 'Error inesperado al procesar la suscripción');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!userSubscription || !token) return;

    const confirmed = confirm('¿Estás seguro de que quieres cancelar tu suscripción?');
    if (!confirmed) return;

    setProcessing(true);
    setError(null);

    try {
      const backendUrl = 'http://localhost:3000';

      const response = await fetch(`${backendUrl}/subscription/${userSubscription.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'cancelled',
        }),
      });

      if (!response.ok) {
        throw new Error('Error al cancelar la suscripción');
      }

      console.log('✅ Subscription cancelled');
      setUserSubscription(null);
      showSuccessMessage('Suscripción cancelada exitosamente');

      // Reload data
      await fetchData();
    } catch (err) {
      console.error('❌ Error cancelling subscription:', err);
      setError(err instanceof Error ? err.message : 'Error al cancelar la suscripción');
    } finally {
      setProcessing(false);
    }
  };

  const showSuccessMessage = (message: string) => {
    const successMsg = document.createElement('div');
    successMsg.className =
      'fixed top-4 right-4 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2';
    successMsg.innerHTML = `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg> <span>${message}</span>`;
    document.body.appendChild(successMsg);
    setTimeout(() => successMsg.remove(), 4000);
  };

  // Solo mostrar plan Premium
  const premiumPlan = plans.find((p) => p.price > 0 || p.name.toLowerCase().includes('premium'));

  const hasActiveSubscription = !!(
    userSubscription &&
    (userSubscription.status === 'active' || userSubscription.isActive === true)
  );

  const activePlan = hasActiveSubscription
    ? plans.find((p) => p.id === userSubscription?.planId)
    : null;

  const daysRemaining = userSubscription?.endDate
    ? Math.max(
        0,
        Math.ceil(
          (new Date(userSubscription.endDate).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-emerald-50 flex items-center justify-center pt-24">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando planes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-emerald-50 py-12 px-4 pt-24">
      <div className="max-w-7xl mx-auto">
        {/* Background Effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: '1s' }}
          ></div>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 bg-red-50 border-2 border-red-200 rounded-2xl p-4 mb-6 flex items-center gap-3 max-w-2xl mx-auto"
          >
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span className="text-red-700">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-5 h-5 text-red-600" />
            </button>
          </motion.div>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 relative z-10"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="inline-flex mb-6"
          >
            <div className="bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 p-4 rounded-2xl shadow-lg">
              <Crown className="w-12 h-12 text-white" />
            </div>
          </motion.div>

          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent mb-4">
            Planes de Suscripción
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Elige el plan que mejor se adapte a tus necesidades como proveedor
          </p>

          {hasActiveSubscription && activePlan && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6"
            >
              <div className="inline-flex flex-col gap-2 items-center">
                <span className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 text-base rounded-full shadow-lg">
                  ✓ Plan {activePlan.name} Activo - {daysRemaining} días restantes
                </span>
                <button
                  onClick={handleCancelSubscription}
                  disabled={processing}
                  className="text-sm text-red-600 hover:text-red-700 underline disabled:opacity-50"
                >
                  Cancelar suscripción
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Plans Grid */}
        <div className="max-w-2xl mx-auto mb-12 relative z-10">
          {/* SOLO PREMIUM PLAN */}
          {premiumPlan && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className={`bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl hover:shadow-3xl transition-all overflow-hidden flex flex-col ${
                hasActiveSubscription && userSubscription?.planId === premiumPlan.id
                  ? 'ring-4 ring-green-500'
                  : 'ring-4 ring-blue-500'
              }`}
            >
              <div className="absolute top-4 right-4 z-20">
                <span className="inline-block bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                  ⭐ MÁS POPULAR
                </span>
              </div>

              <div className="bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                      <Crown className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold">{premiumPlan.name}</h3>
                      <p className="text-white/90 mt-1">{premiumPlan.description}</p>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-6xl font-bold">${premiumPlan.price}</span>
                    <div>
                      <div className="text-white/90 text-xl">MXN/mes</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 flex-1 flex flex-col">
                <div className="space-y-4 mb-8 flex-1">
                  <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-blue-600" />
                    Todo lo de Gratuito, más:
                  </h4>

                  {[
                    { text: 'Visualizaciones ilimitadas', icon: Eye },
                    { text: 'Badge Premium', icon: Crown },
                    { text: 'Destacado en búsquedas', icon: TrendingUp },
                    { text: 'Prioridad en resultados', icon: Target },
                    { text: 'Estadísticas avanzadas', icon: Sparkles },
                    { text: 'Mayor alcance', icon: Users },
                    { text: 'Soporte 24/7', icon: Shield },
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="p-1 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-full">
                        <Check className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 flex items-center gap-2">
                        <feature.icon className="w-4 h-4 text-blue-600" />
                        <span className="text-gray-700">{feature.text}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() =>
                    handleSubscribe(premiumPlan.id, premiumPlan.name, premiumPlan.price)
                  }
                  disabled={
                    processing ||
                    (hasActiveSubscription && userSubscription?.planId === premiumPlan.id)
                  }
                  className={`w-full text-lg py-4 rounded-xl shadow-xl transition-all font-bold flex items-center justify-center gap-2 ${
                    hasActiveSubscription && userSubscription?.planId === premiumPlan.id
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : 'bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 hover:from-blue-600 hover:via-cyan-600 hover:to-emerald-600 text-white'
                  } disabled:opacity-50`}
                >
                  {processing ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : hasActiveSubscription && userSubscription?.planId === premiumPlan.id ? (
                    <>
                      <Shield className="w-6 h-6" />
                      Plan Activo
                    </>
                  ) : (
                    <>
                      Obtener Premium
                      <ArrowRight className="w-6 h-6" />
                    </>
                  )}
                </button>

                {!(hasActiveSubscription && userSubscription?.planId === premiumPlan.id) && (
                  <p className="text-center text-sm text-gray-500 mt-4">
                    💳 Pago seguro con Stripe
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Additional Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid md:grid-cols-3 gap-6 relative z-10"
        >
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 text-center border-2 border-white/50">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Pago Seguro</h3>
            <p className="text-gray-600">Procesado con Stripe</p>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 text-center border-2 border-white/50">
            <div className="w-16 h-16 bg-gradient-to-r from-emerald-100 to-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Activación Inmediata</h3>
            <p className="text-gray-600">Acceso instantáneo</p>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 text-center border-2 border-white/50">
            <div className="w-16 h-16 bg-gradient-to-r from-cyan-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-cyan-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Sin Compromisos</h3>
            <p className="text-gray-600">Cancela cuando quieras</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
