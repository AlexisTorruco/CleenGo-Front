// app/client/appointments/create/page.tsx
import { Suspense } from "react";
import CreateAppointmentPageClient from "./CreateAppointmentPageClient";

export default function CreateAppointmentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-[#0A65FF] via-[#1E73FF] to-[#3D8AFF] flex items-center justify-center px-4">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-6 md:p-8 max-w-md w-full text-center">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              Cargando formulario de cita...
            </h1>
            <p className="text-sm text-gray-600">
              Estamos preparando los datos para crear tu cita simulada. Por
              favor, espera unos segundos.
            </p>
          </div>
        </div>
      }
    >
      <CreateAppointmentPageClient />
    </Suspense>
  );
}
