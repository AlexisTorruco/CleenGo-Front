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
interface Subscription {
  id: string;
  userId: string;
  planType: 'free' | 'premium';
  startDate: string;
  endDate: string;
  status: 'active' | 'cancelled' | 'expired';
  amount: number;
}

// ============================================
// COMPONENTE
// ============================================
export default function SubscriptionPage() {
  const { user, token, logout } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    if (!user || !token) {
      router.push('/login');
      return;
    }

    fetchSubscription();
  }, [user, token, router]);

  const fetchSubscription = async () => {
    if (!user?.id || !token) return;

    setLoading(true);
    try {
      const backendUrl = 'http://localhost:3000';
      const response = await fetch(`${backendUrl}/suscription/${user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan: 'free' | 'premium') => {
    if (!user || !token) {
      router.push('/login');
      return;
    }

    if (subscription && subscription.status === 'active') {
      setError('Ya tienes una suscripción activa');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const backendUrl = 'http://localhost:3000';

      // Create subscription
      const response = await fetch(`${backendUrl}/suscription`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          planType: plan,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al crear la suscripción');
      }

      const data = await response.json();
      setSubscription(data);

      // Show success message
      const successMsg = document.createElement('div');
      successMsg.className =
        'fixed top-4 right-4 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2';
      successMsg.innerHTML = `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg> <span>¡Suscripción ${
        plan === 'premium' ? 'Premium' : 'Gratuita'
      } activada!</span>`;
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 3000);

      if (plan === 'premium') {
        // Redirect to checkout or payment page if needed
        // router.push('/checkout');
      }
    } catch (err) {
      console.error('Error subscribing:', err);
      setError(err instanceof Error ? err.message : 'Error al suscribirse');
    } finally {
      setProcessing(false);
    }
  };

  const hasActiveSubscription = subscription?.status === 'active';
  const isPremium = hasActiveSubscription && subscription?.planType === 'premium';

  const daysRemaining = subscription?.endDate
    ? Math.max(
        0,
        Math.ceil(
          (new Date(subscription.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
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
        {/* Animated Background Blobs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: '1s' }}
          ></div>
          <div
            className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-300/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: '2s' }}
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

          {hasActiveSubscription && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6"
            >
              <span className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 text-base rounded-full shadow-lg">
                ✓ Plan {isPremium ? 'Premium' : 'Gratuito'} Activo - {daysRemaining} días restantes
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* Plans Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12 max-w-6xl mx-auto relative z-10">
          {/* FREE PLAN */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl hover:shadow-2xl transition-all border-2 border-white/50 overflow-hidden flex flex-col"
          >
            {/* Free Header */}
            <div className="bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800 p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <Eye className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-white">Plan Gratuito</h3>
                    <p className="text-white/90 mt-1">Para comenzar en la plataforma</p>
                  </div>
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="text-6xl font-bold text-white">$0</span>
                  <div>
                    <div className="text-white/90 text-xl">MXN/mes</div>
                    <div className="text-white/70 text-sm">Sin costo</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Free Features */}
            <div className="p-8 flex-1 flex flex-col">
              <div className="space-y-4 mb-8 flex-1">
                <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-gray-600" />
                  Características Incluidas
                </h4>

                {[
                  { text: 'Perfil básico de proveedor', included: true },
                  { text: 'Hasta 5 visualizaciones por mes', included: true },
                  { text: 'Aparece en búsquedas estándar', included: true },
                  { text: 'Contacto básico con clientes', included: true },
                  { text: 'Soporte por email (48hrs)', included: true },
                  { text: 'Badge "Premium"', included: false },
                  { text: 'Prioridad en resultados', included: false },
                  { text: 'Estadísticas avanzadas', included: false },
                ].map((feature, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + idx * 0.05 }}
                    className="flex items-start gap-3"
                  >
                    <div
                      className={`p-1 rounded-full mt-0.5 ${
                        feature.included
                          ? 'bg-gradient-to-r from-gray-100 to-gray-200'
                          : 'bg-gray-100'
                      }`}
                    >
                      {feature.included ? (
                        <Check className="w-5 h-5 text-gray-600" />
                      ) : (
                        <div className="w-5 h-5 flex items-center justify-center">
                          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        </div>
                      )}
                    </div>
                    <span
                      className={`flex-1 ${
                        feature.included ? 'text-gray-700' : 'text-gray-400 line-through'
                      }`}
                    >
                      {feature.text}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600 mb-1">5</div>
                  <div className="text-xs text-gray-500">Visualiz./mes</div>
                </div>
                <div className="text-center border-x border-gray-200">
                  <div className="text-2xl font-bold text-gray-600 mb-1">Básico</div>
                  <div className="text-xs text-gray-500">Alcance</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600 mb-1">48h</div>
                  <div className="text-xs text-gray-500">Soporte</div>
                </div>
              </div>

              {/* CTA Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSubscribe('free')}
                disabled={processing || (hasActiveSubscription && !isPremium)}
                className="w-full text-lg py-4 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl shadow-lg transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    Comenzar Gratis
                    <ArrowRight className="w-6 h-6" />
                  </>
                )}
              </motion.button>

              <p className="text-center text-sm text-gray-500 mt-4">
                Sin tarjeta de crédito requerida
              </p>
            </div>
          </motion.div>

          {/* PREMIUM PLAN */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className={`bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl hover:shadow-3xl transition-all overflow-hidden flex flex-col ${
              isPremium ? 'ring-4 ring-green-500' : 'ring-4 ring-blue-500'
            }`}
          >
            {/* Popular Badge */}
            <div className="absolute top-4 right-4 z-20">
              <span className="inline-block bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                ⭐ MÁS POPULAR
              </span>
            </div>

            {/* Premium Header */}
            <div className="bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                      <Crown className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-white">Plan Premium</h3>
                      <p className="text-white/90 mt-1">Máximo alcance y visibilidad</p>
                    </div>
                  </div>
                  {isPremium && (
                    <span className="inline-block bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-bold">
                      Activa
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="text-6xl font-bold text-white">$299</span>
                  <div>
                    <div className="text-white/90 text-xl">MXN/mes</div>
                    <div className="text-white/70 text-sm">IVA incluido</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Premium Features */}
            <div className="p-8 flex-1 flex flex-col">
              <div className="space-y-4 mb-8 flex-1">
                <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-blue-600" />
                  Todo lo de Gratuito, más:
                </h4>

                {[
                  { text: 'Visualizaciones ilimitadas', icon: Eye },
                  { text: 'Badge "Premium" en tu perfil', icon: Crown },
                  { text: 'Aparece destacado en búsquedas', icon: TrendingUp },
                  { text: 'Prioridad en resultados', icon: Target },
                  { text: 'Estadísticas avanzadas en tiempo real', icon: Sparkles },
                  { text: 'Mayor alcance de clientes potenciales', icon: Users },
                  { text: 'Soporte prioritario 24/7', icon: Shield },
                  { text: 'Analytics de rendimiento', icon: TrendingUp },
                ].map((feature, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + idx * 0.05 }}
                    className="flex items-start gap-3"
                  >
                    <div className="p-1 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-full mt-0.5">
                      <Check className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <feature.icon className="w-4 h-4 text-blue-600" />
                      <span className="text-gray-700">{feature.text}</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">∞</div>
                  <div className="text-xs text-gray-600">Visualiz./mes</div>
                </div>
                <div className="text-center border-x border-gray-200">
                  <div className="text-2xl font-bold text-emerald-600 mb-1">Premium</div>
                  <div className="text-xs text-gray-600">Alcance</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-600 mb-1">24/7</div>
                  <div className="text-xs text-gray-600">Soporte</div>
                </div>
              </div>

              {/* CTA Button */}
              <motion.button
                whileHover={{ scale: isPremium ? 1 : 1.02 }}
                whileTap={{ scale: isPremium ? 1 : 0.98 }}
                onClick={() => handleSubscribe('premium')}
                disabled={processing || isPremium}
                className={`w-full text-lg py-4 rounded-xl shadow-xl transition-all font-bold flex items-center justify-center gap-2 ${
                  isPremium
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 hover:from-blue-600 hover:via-cyan-600 hover:to-emerald-600 text-white'
                } disabled:opacity-50`}
              >
                {processing ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : isPremium ? (
                  <>
                    <Shield className="w-6 h-6" />
                    Plan Activo
                  </>
                ) : (
                  <>
                    Comenzar Premium
                    <ArrowRight className="w-6 h-6" />
                  </>
                )}
              </motion.button>

              {!isPremium && (
                <p className="text-center text-sm text-gray-500 mt-4">
                  Garantía de devolución de 30 días
                </p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Additional Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid md:grid-cols-3 gap-6 mb-12 relative z-10"
        >
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-xl transition-all p-6 text-center border-2 border-white/50">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Pago Seguro</h3>
            <p className="text-gray-600">Procesamiento con encriptación SSL de nivel bancario</p>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-xl transition-all p-6 text-center border-2 border-white/50">
            <div className="w-16 h-16 bg-gradient-to-r from-emerald-100 to-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Activación Inmediata</h3>
            <p className="text-gray-600">Accede a todos los beneficios al instante</p>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-xl transition-all p-6 text-center border-2 border-white/50">
            <div className="w-16 h-16 bg-gradient-to-r from-cyan-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-cyan-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Cambia de Plan</h3>
            <p className="text-gray-600">Actualiza o cancela cuando quieras</p>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center relative z-10"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4">¿Tienes preguntas?</h2>
          <p className="text-gray-600 mb-6">
            Estamos aquí para ayudarte. Contacta nuestro equipo de soporte.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => alert('Contacto: soporte@cleengo.com | Tel: 55-1234-5678')}
              className="px-8 py-3 border-2 border-blue-500 text-blue-600 rounded-xl hover:bg-blue-50 transition-all font-semibold"
            >
              Contactar Soporte
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
