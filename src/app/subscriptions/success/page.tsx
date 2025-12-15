'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Sparkles, Crown, Loader2 } from 'lucide-react';

export default function SubscriptionSuccessPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/provider/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-cyan-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full"
      >
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-white/50 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-cyan-500 p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="relative z-10"
            >
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                <CheckCircle className="w-16 h-16 text-emerald-500" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">¡Suscripción Exitosa!</h1>
              <p className="text-white/90 text-lg">Tu plan Premium ha sido activado</p>
            </motion.div>
          </div>

          <div className="p-8 md:p-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Crown className="w-6 h-6 text-emerald-600" />
                  Ahora tienes acceso a:
                </h2>

                <div className="grid gap-4">
                  {[
                    { icon: Sparkles, text: 'Visualizaciones ilimitadas' },
                    { icon: Crown, text: 'Badge Premium en tu perfil' },
                    { icon: ArrowRight, text: 'Prioridad en búsquedas' },
                    { icon: CheckCircle, text: 'Soporte prioritario 24/7' },
                  ].map((benefit, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + idx * 0.1 }}
                      className="flex items-center gap-4 bg-emerald-50 p-4 rounded-xl border-2 border-emerald-100"
                    >
                      <div className="p-2 bg-emerald-500 rounded-lg">
                        <benefit.icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-gray-900 font-medium">{benefit.text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  <span className="text-blue-900 font-semibold">
                    Redirigiendo a tu dashboard en {countdown}s...
                  </span>
                </div>
                <p className="text-blue-700 text-sm">
                  Tu perfil ahora mostrará el badge Premium y tendrás acceso a todas las funciones.
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/provider/dashboard')}
                className="w-full bg-gradient-to-r from-emerald-500 via-green-500 to-cyan-500 text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                Ir al Dashboard Ahora
                <ArrowRight className="w-6 h-6" />
              </motion.button>
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 text-center"
        >
          <p className="text-gray-600">
            Recibirás un email de confirmación con los detalles de tu suscripción.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
