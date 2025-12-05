// app/oauth/callback/page.tsx
// Este es el Server Component que debe ser envuelto en Suspense

import { Suspense } from 'react';
// Asegúrate de importar el archivo con la extensión .tsx
import OAuthCallbackHandler from './OAuthCallbackHandler'; 

export default function OAuthCallbackPage() {
  return (
    // ¡La corrección clave!
    <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-700">
            <div className="bg-white shadow-md rounded-xl p-6 text-center w-80">
                <h2 className="text-lg font-semibold mb-2">Cargando autenticación...</h2>
                <p className="text-sm text-gray-500">Por favor espera unos segundos.</p>
            </div>
        </div>
    }>
      <OAuthCallbackHandler />
    </Suspense>
  );
}