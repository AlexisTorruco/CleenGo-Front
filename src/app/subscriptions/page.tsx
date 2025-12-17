'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  Crown,
  Loader2,
  ArrowRight,
  Shield,
  Star,
  Eye,
  TrendingUp,
  Users,
  Target,
  Sparkles,
  Zap,
  Check,
} from 'lucide-react';

type Plan = {
  id: string;
  name: string;
  price: number;
  description: string;
  isActive: boolean;
};

type SubscriptionMeResponse = {
  id: string;
  paymentStatus: boolean;
  isActive: boolean;
  startDate: string;
  plan?: Plan;
};

export default function SubscriptionsPage() {
  const router = useRouter();
  const { token, user } = useAuth();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);

  const [checking, setChecking] = useState(true);
  const [mySub, setMySub] = useState<SubscriptionMeResponse | null>(null);

  const [loadingCheckout, setLoadingCheckout] = useState(false);

  const hasActiveSub = mySub?.paymentStatus === true && mySub?.isActive === true;

  // 1) Traer planes desde DB
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const backendUrl = process.env.VITE_BACKEND_URL;
        const res = await fetch(`${backendUrl}/plan`, { cache: 'no-store' });
        const data = await res.json();

        setPlans(Array.isArray(data) ? data : []);
      } catch {
        setPlans([]);
      } finally {
        setPlansLoading(false);
      }
    };

    loadPlans();
  }, []);

  // 2) Traer mi suscripción
  useEffect(() => {
    const loadMe = async () => {
      try {
        const backendUrl = process.env.VITE_BACKEND_URL;

        if (!user?.id || !token) {
          router.push('/login');
          return;
        }

        console.log('🔍 Fetching subscription for user:', user.id);

        const res = await fetch(`${backendUrl}/subscription/provider/${user.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        });

        console.log('📡 Response status:', res.status);
        console.log('📡 Response headers:', res.headers.get('content-type'));

        if (!res.ok) {
          console.error('❌ Response not ok:', res.status);
          setMySub(null);
          setChecking(false);
          return;
        }

        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('❌ Response is not JSON:', contentType);
          setMySub(null);
          setChecking(false);
          return;
        }

        const text = await res.text();
        console.log('📦 Raw response:', text);

        if (!text || text.trim() === '' || text === 'null') {
          console.log('❌ Empty or null response');
          setMySub(null);
          setChecking(false);
          return;
        }

        let data;
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          console.error('❌ JSON parse error:', parseError);
          console.error('❌ Response text was:', text);
          setMySub(null);
          setChecking(false);
          return;
        }

        console.log('📦 Subscription data:', data);

        if (!data) {
          console.log('❌ No subscription found');
          setMySub(null);
          setChecking(false);
          return;
        }

        console.log('✅ Subscription loaded:', {
          paymentStatus: data.paymentStatus,
          isActive: data.isActive,
        });

        setMySub(data);
      } catch (err) {
        console.error('❌ Error fetching subscription:', err);
        setMySub(null);
      } finally {
        setChecking(false);
      }
    };

    loadMe();
  }, [router, token, user]);

  // 3) Determinar plan actual
  const currentPlan = useMemo(() => {
    if (mySub?.plan?.id) return mySub.plan;

    const activePlans = plans.filter((p) => p?.isActive === true);
    if (activePlans.length === 0) return null;

    const sorted = [...activePlans].sort((a, b) => Number(a.price) - Number(b.price));
    return sorted[0] || null;
  }, [mySub, plans]);

  // 4) Determinar plan de upgrade
  const upgradePlan = useMemo(() => {
    const activePlans = plans.filter((p) => p?.isActive === true);
    if (activePlans.length === 0) return null;

    const candidates = currentPlan?.id
      ? activePlans.filter((p) => p.id !== currentPlan.id)
      : activePlans;

    if (candidates.length === 0) return null;

    const sorted = [...candidates].sort((a, b) => Number(b.price) - Number(a.price));
    return sorted[0] || null;
  }, [plans, currentPlan]);

  const handleCheckout = async () => {
    if (!user?.id || !token) {
      router.push('/login');
      return;
    }

    if (!upgradePlan) {
      alert('No hay un plan disponible para upgrade.');
      return;
    }

    if (hasActiveSub) {
      alert('Ya tienes una suscripción activa ✅');
      return;
    }

    try {
      setLoadingCheckout(true);
      const backendUrl = process.env.VITE_BACKEND_URL;

      const res = await fetch(`${backendUrl}/subscription/create-checkout-session`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ providerId: user.id }),
      });

      if (!res.ok) throw new Error('Error creating checkout session');

      const data = await res.json();
      if (!data?.url) throw new Error('No checkout url returned');

      window.location.href = data.url;
    } catch (err) {
      console.error('❌ Checkout error:', err);
      alert('No se pudo iniciar el pago. Intenta de nuevo.');
    } finally {
      setLoadingCheckout(false);
    }
  };

  if (plansLoading || checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-emerald-50 flex items-center justify-center pt-24">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando planes...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // 🎉 VISTA PREMIUM - Usuario ya tiene suscripción activa
  // ============================================
  if (hasActiveSub) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-emerald-50 py-12 px-4 pt-24">
        <div className="max-w-5xl mx-auto">
          {/* Background Effects */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl animate-pulse"></div>
            <div
              className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl animate-pulse"
              style={{ animationDelay: '1s' }}
            ></div>
          </div>

          {/* Header Premium */}
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
              <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 p-5 rounded-3xl shadow-2xl">
                <Crown className="w-16 h-16 text-white" />
              </div>
            </motion.div>

            <h1 className="text-6xl font-bold bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 bg-clip-text text-transparent mb-4">
              ¡Eres Usuario Premium!
            </h1>
            <p className="text-2xl text-gray-600 max-w-2xl mx-auto">
              Disfruta de todos los beneficios exclusivos de tu suscripción
            </p>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6 inline-flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-2xl shadow-xl"
            >
              <CheckCircle className="w-6 h-6" />
              <span className="text-lg font-bold">
                Suscripción Activa desde{' '}
                {new Date(mySub?.startDate || '').toLocaleDateString('es-ES')}
              </span>
            </motion.div>
          </motion.div>

          {/* Benefits Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 relative z-10"
          >
            {[
              {
                icon: Eye,
                title: 'Visualizaciones Ilimitadas',
                description: 'Tu perfil se muestra sin límites',
                gradient: 'from-blue-500 to-cyan-500',
              },
              {
                icon: Crown,
                title: 'Badge Premium',
                description: 'Destaca con tu insignia dorada',
                gradient: 'from-yellow-500 to-orange-500',
              },
              {
                icon: TrendingUp,
                title: 'Destacado en Búsquedas',
                description: 'Aparece primero en los resultados',
                gradient: 'from-purple-500 to-pink-500',
              },
              {
                icon: Target,
                title: 'Prioridad en Resultados',
                description: 'Los clientes te encuentran más rápido',
                gradient: 'from-emerald-500 to-green-500',
              },
              {
                icon: Sparkles,
                title: 'Estadísticas Avanzadas',
                description: 'Métricas detalladas de tu negocio',
                gradient: 'from-indigo-500 to-blue-500',
              },
              {
                icon: Shield,
                title: 'Soporte 24/7',
                description: 'Asistencia prioritaria cuando lo necesites',
                gradient: 'from-red-500 to-pink-500',
              },
            ].map((benefit, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
                className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 border-2 border-white/50 hover:shadow-2xl transition-all"
              >
                <div
                  className={`w-14 h-14 bg-gradient-to-r ${benefit.gradient} rounded-xl flex items-center justify-center mb-4 shadow-lg`}
                >
                  <benefit.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600 text-sm">{benefit.description}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="text-center relative z-10"
          >
            <button
              onClick={() => router.push('/provider/dashboard')}
              className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 text-white px-10 py-5 rounded-2xl text-xl font-bold hover:shadow-2xl transition-all hover:scale-105"
            >
              Ir al Dashboard
              <ArrowRight className="w-6 h-6" />
            </button>
          </motion.div>

          {/* Footer Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-12 text-center relative z-10"
          >
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg p-6 border-2 border-white/50 max-w-2xl mx-auto">
              <p className="text-gray-700 text-sm">
                <strong>Plan:</strong> {currentPlan?.name || 'Premium'} • <strong>Precio:</strong> $
                {Number(currentPlan?.price || 0).toFixed(0)}/mes • <strong>Estado:</strong>{' '}
                <span className="text-green-600 font-bold">Activo</span>
              </p>
              <p className="text-gray-500 text-xs mt-2">
                ¿Necesitas ayuda? Contacta a soporte en soporte@cleengo.com
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ============================================
  // VISTA NORMAL - Usuario sin suscripción
  // ============================================
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
        </motion.div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12 relative z-10">
          {/* PLAN ACTUAL */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl hover:shadow-3xl transition-all overflow-hidden flex flex-col border-2 border-gray-200"
          >
            <div className="bg-gradient-to-r from-gray-500 via-gray-600 to-gray-700 p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold">{currentPlan?.name || 'Gratuito'}</h3>
                    <p className="text-white/90 mt-1">
                      {currentPlan?.description || 'Plan básico'}
                    </p>
                  </div>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-6xl font-bold">
                    ${Number(currentPlan?.price || 0).toFixed(0)}
                  </span>
                  <div>
                    <div className="text-white/90 text-xl">MXN/mes</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 flex-1 flex flex-col">
              <div className="space-y-4 mb-8 flex-1">
                <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-gray-600" />
                  Tu plan actual incluye:
                </h4>

                {[
                  { text: 'Perfil básico', icon: Users },
                  { text: 'Visibilidad limitada', icon: Eye },
                  { text: 'Acceso a solicitudes', icon: Target },
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="p-1 bg-gradient-to-r from-gray-50 to-gray-100 rounded-full">
                      <Check className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <feature.icon className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-700">{feature.text}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 text-center">
                  <p className="text-sm font-semibold text-gray-700">Plan Gratuito Activo</p>
                </div>

                <button
                  onClick={() => router.push('/provider/dashboard')}
                  className="w-full text-lg py-4 rounded-xl shadow-lg transition-all font-bold flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-800 text-white"
                >
                  Ir al Dashboard
                  <ArrowRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* PLAN PREMIUM / UPGRADE */}
          {upgradePlan && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl hover:shadow-3xl transition-all overflow-hidden flex flex-col ring-4 ring-blue-500"
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
                      <h3 className="text-3xl font-bold">{upgradePlan.name}</h3>
                      <p className="text-white/90 mt-1">{upgradePlan.description}</p>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-6xl font-bold">
                      ${Number(upgradePlan.price).toFixed(0)}
                    </span>
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
                    Todo lo de {currentPlan?.name || 'Gratuito'}, más:
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
                  onClick={handleCheckout}
                  disabled={loadingCheckout}
                  className="w-full text-lg py-4 rounded-xl shadow-xl transition-all font-bold flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 hover:from-blue-600 hover:via-cyan-600 hover:to-emerald-600 text-white disabled:opacity-50"
                >
                  {loadingCheckout ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Redirigiendo a Stripe...
                    </>
                  ) : (
                    <>
                      Obtener {upgradePlan.name}
                      <ArrowRight className="w-6 h-6" />
                    </>
                  )}
                </button>

                <p className="text-center text-sm text-gray-500 mt-4">💳 Pago seguro con Stripe</p>
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
