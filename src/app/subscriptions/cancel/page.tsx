'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { XCircle, ArrowLeft, HelpCircle, MessageCircle } from 'lucide-react';

export default function SubscriptionCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full"
      >
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-white/50 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="relative z-10"
            >
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                <XCircle className="w-16 h-16 text-orange-500" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">Pago Cancelado</h1>
              <p className="text-white/90 text-lg">No se ha procesado ningún cargo</p>
            </motion.div>
          </div>

          <div className="p-8 md:p-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="mb-8 text-center">
                <p className="text-gray-700 text-lg mb-4">
                  No te preocupes, no se ha realizado ningún cargo a tu tarjeta.
                </p>
                <p className="text-gray-600">
                  Si cancelaste por error o tienes alguna duda, estamos aquí para ayudarte.
                </p>
              </div>

              <div className="grid gap-4 mb-8">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-500 rounded-lg flex-shrink-0">
                      <HelpCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">¿Tienes dudas?</h3>
                      <p className="text-gray-600 text-sm mb-3">
                        Consulta nuestras preguntas frecuentes o contacta a soporte.
                      </p>
                      <button className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-1">
                        Ver FAQ
                        <ArrowLeft className="w-4 h-4 rotate-180" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-purple-500 rounded-lg flex-shrink-0">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Habla con nosotros</h3>
                      <p className="text-gray-600 text-sm mb-3">
                        Nuestro equipo está disponible para resolver tus dudas.
                      </p>
                      <button className="text-purple-600 hover:text-purple-700 font-semibold text-sm flex items-center gap-1">
                        Contactar Soporte
                        <ArrowLeft className="w-4 h-4 rotate-180" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/subscription')}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-4 px-6 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Ver Planes Nuevamente
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/provider/dashboard')}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-4 px-6 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  Ir al Dashboard
                  <ArrowLeft className="w-5 h-5 rotate-180" />
                </motion.button>
              </div>
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
            Puedes suscribirte en cualquier momento. Estamos aquí cuando estés listo.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
