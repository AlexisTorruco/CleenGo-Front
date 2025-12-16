// components/CheckoutModal.tsx
import React from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (months?: number) => void;
}

export default function CheckoutModal({ open, onClose, onConfirm }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full p-6">
        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
          Mock de pago — Plan Premium
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Este es un simulador. Al confirmar, la suscripción se activará localmente (mock).
        </p>

        <div className="flex gap-3 mb-4">
          <button
            onClick={() => onConfirm(1)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Pagar 1 mes — $299 MXN
          </button>
          <button
            onClick={() => onConfirm(12)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
          >
            Pagar 12 meses — $2990 MXN
          </button>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
