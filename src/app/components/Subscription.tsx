// components/Subscription.tsx
import React from 'react';
import { Crown, Check, ArrowRight, Shield } from 'lucide-react';
import type { MockUser } from '../lib/mockUser';

interface Props {
  user: MockUser | null;
  onOpenCheckout: () => void;
  onSubscribeFree: () => void;
}

export function Subscription({ user, onOpenCheckout, onSubscribeFree }: Props) {
  const hasActiveSubscription = !!user?.hasSubscription;

  const daysRemaining = user?.subscriptionExpiry
    ? Math.max(
        0,
        Math.ceil(
          (new Date(user.subscriptionExpiry).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50/30 to-sky-50/30 dark:from-gray-900 dark:via-blue-950/30 dark:to-sky-950/30 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex mb-6">
            <div className="bg-linear-to-r from-blue-500 to-sky-600 p-4 rounded-2xl shadow-lg">
              <Crown className="w-6 h-6 text-white" />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Planes de Suscripción
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Elige el plan que mejor se adapte a tus necesidades como proveedor
          </p>

          {hasActiveSubscription && (
            <div className="mt-6">
              <span className="inline-block bg-linear-to-r from-green-500 to-emerald-600 text-white px-6 py-2 text-base rounded-full">
                ✓ Plan Premium Activo - {daysRemaining} días restantes
              </span>
            </div>
          )}
        </div>

        {/* Plans */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12 max-w-6xl mx-auto">
          {/* Free Plan */}
          <div>
            <div className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden h-full flex flex-col rounded-lg bg-white dark:bg-gray-800">
              <div className="bg-linear-to-r from-gray-600 via-gray-700 to-gray-800 p-8 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <Crown className="w-6 h-6 text-white" />
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
                  </div>
                </div>
              </div>

              <div className="p-8 flex-1 flex flex-col">
                <div className="space-y-3 mb-6 flex-1">
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-gray-600 shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">
                      Perfil básico de proveedor
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-gray-600 shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">
                      Hasta 5 visualizaciones por mes
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-gray-600 shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">
                      Contacto básico con clientes
                    </span>
                  </div>
                </div>

                <button
                  onClick={onSubscribeFree}
                  className="w-full text-lg py-3 px-4 bg-linear-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold flex items-center justify-center gap-2"
                >
                  Comenzar Gratis <ArrowRight className="w-5 h-5" />
                </button>
                <p className="text-center text-sm text-gray-500 mt-3">
                  Sin tarjeta de crédito requerida
                </p>
              </div>
            </div>
          </div>

          {/* Premium */}
          <div>
            <div
              className={`relative border-0 shadow-2xl overflow-hidden h-full flex flex-col rounded-lg bg-white dark:bg-gray-800 ${
                hasActiveSubscription ? 'ring-4 ring-green-500' : 'ring-4 ring-blue-500'
              }`}
            >
              <div className="absolute top-4 right-4 z-20">
                <span className="inline-block bg-linear-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                  ⭐ MÁS POPULAR
                </span>
              </div>

              <div className="bg-linear-to-r from-blue-500 via-sky-500 to-cyan-500 p-8 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/20 rounded-xl">
                      <Crown className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-white">Plan Premium</h3>
                      <p className="text-white/90 mt-1">Máximo alcance y visibilidad</p>
                    </div>
                  </div>
                  {hasActiveSubscription && (
                    <span className="inline-block bg-white/20 text-white px-4 py-2 rounded-full text-sm">
                      Activa
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="text-6xl font-bold text-white">$299</span>
                  <div>
                    <div className="text-white/90 text-xl">MXN/mes</div>
                  </div>
                </div>
              </div>

              <div className="p-8 flex-1 flex flex-col">
                <div className="space-y-3 mb-6 flex-1">
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-blue-600 shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">
                      Visualizaciones ilimitadas
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-blue-600 shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">
                      Badge &quot;Premium&quot; en tu perfil
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-blue-600 shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">Prioridad en búsquedas</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-blue-600 shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">Soporte prioritario</span>
                  </div>
                </div>

                <button
                  onClick={onOpenCheckout}
                  disabled={hasActiveSubscription}
                  className={`w-full text-lg py-3 px-4 rounded-lg hover:shadow-lg transition-all font-semibold flex items-center justify-center gap-2 ${
                    hasActiveSubscription
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-linear-to-r from-blue-500 to-cyan-500 text-white'
                  }`}
                >
                  {hasActiveSubscription ? (
                    <>
                      <Shield className="w-5 h-5" /> Plan Activo
                    </>
                  ) : (
                    <>
                      Comenzar Premium <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                {!hasActiveSubscription && (
                  <p className="text-center text-sm text-gray-500 mt-3">
                    Garantía de devolución de 30 días
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
