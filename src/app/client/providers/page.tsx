"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import Swal from "sweetalert2";
import ProviderFilters, { FilterData } from "./components/ProviderFilters";

// Tipo de proveedor según el backend
interface Provider {
  id: number;
  name: string;
  rating: number;
  photo: string;
  services: string[];
  workDays: string[];
  workHours: string[];
  verified: boolean;
}

export default function ProvidersPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // Cargar TODOS los proveedores al inicio
  useEffect(() => {
    loadAllProviders();
  }, []);

  const loadAllProviders = async () => {
    setLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
      const response = await fetch(`${backendUrl}/provider`);

      if (!response.ok) {
        throw new Error("Error al cargar proveedores");
      }

      const data = await response.json();
      setProviders(data);
      setInitialLoad(false);
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los proveedores",
        confirmButtonColor: "#22C55E",
      });
    } finally {
      setLoading(false);
    }
  };

  // Buscar con filtros
  const handleSearch = async (filters: FilterData) => {
    setLoading(true);

    try {
      const params = new URLSearchParams();

      if (filters.date) params.append("date", filters.date);
      filters.days.forEach(day => params.append("days", day));
      filters.hours.forEach(hour => params.append("hours", hour));
      filters.services.forEach(service => params.append("services", service));
      if (filters.rating > 0) params.append("rating", filters.rating.toString());

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
      const response = await fetch(`${backendUrl}/provider/filters?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Error al buscar proveedores");
      }

      const data = await response.json();
      setProviders(data);

      if (data.length > 0) {
        Swal.fire({
          icon: "success",
          title: "¡Proveedores encontrados!",
          text: `Se encontraron ${data.length} proveedor${data.length !== 1 ? 'es' : ''} disponible${data.length !== 1 ? 's' : ''}`,
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "info",
          title: "Sin resultados",
          text: "No se encontraron proveedores con esos filtros",
          confirmButtonColor: "#22C55E",
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Hubo un error al buscar proveedores",
        confirmButtonColor: "#22C55E",
      });
    } finally {
      setLoading(false);
    }
  };

  // Limpiar filtros y recargar todos
  const handleClearFilters = () => {
    loadAllProviders();
    Swal.fire({
      icon: "success",
      title: "Filtros Limpios",
      text: "Mostrando todos los proveedores",
      timer: 4000,
      showConfirmButton: false,
    });
  };

  // Agendar cita
  const handleBookAppointment = (providerId: number, providerName: string) => {
    if (!user) {
      Swal.fire({
        icon: "warning",
        title: "Inicia sesión",
        text: "Debes iniciar sesión para agendar una cita",
        showCancelButton: true,
        confirmButtonText: "Iniciar sesión",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#22C55E",
        cancelButtonColor: "#6B7280",
      }).then((result) => {
        if (result.isConfirmed) {
          router.push("/login");
        }
      });
    } else {
      Swal.fire({
        icon: "question",
        title: `¿Agendar cita con ${providerName}?`,
        text: "Serás redirigido para completar tu reserva",
        showCancelButton: true,
        confirmButtonText: "Continuar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#22C55E",
        cancelButtonColor: "#6B7280",
      }).then((result) => {
        if (result.isConfirmed) {
          router.push(`/client/appointments/create?providerId=${providerId}`);
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A65FF] via-[#1E73FF] to-[#3D8AFF] pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-3">
            Nuestros Proveedores
          </h1>
          <p className="text-lg text-white/90">
            Profesionales verificados y calificados por nuestra comunidad
          </p>
        </div>

        {/* Grid: Sidebar (solo si está logueado) + Proveedores */}
        <div className={`grid ${user ? 'lg:grid-cols-[350px_1fr]' : 'lg:grid-cols-1'} gap-6`}>

          {/* SIDEBAR DE FILTROS - Solo visible si el usuario está logueado */}
          {user && (
            <ProviderFilters
              onSearch={handleSearch}
              onClear={handleClearFilters}
              loading={loading}
            />
          )}

          {/* GRID DE PROVEEDORES */}
          <div>
            {/* Loading */}
            {loading && (
              <div className="bg-white rounded-2xl p-12 text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#22C55E] mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando proveedores...</p>
              </div>
            )}

            {/* Sin proveedores */}
            {!loading && providers.length === 0 && !initialLoad && (
              <div className="bg-white rounded-2xl p-12 text-center shadow-xl">
                <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-2xl font-bold text-gray-700 mb-2">No hay proveedores disponibles</h3>
                <p className="text-gray-500">Intenta más tarde</p>
              </div>
            )}

            {/* Con proveedores */}
            {!loading && providers.length > 0 && (
              <>
                {/* Contador */}
                <div className="bg-white rounded-lg px-6 py-3 mb-6 shadow-md">
                  <p className="text-gray-700 font-medium">
                    {providers.length} proveedor{providers.length !== 1 ? 'es' : ''} disponible{providers.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Grid de tarjetas */}
                <div className="grid gap-5">
                  {providers.map((provider) => (
                    <div
                      key={provider.id}
                      className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                    >
                      <div className="grid md:grid-cols-[240px_1fr] gap-0">
                        {/* Imagen */}
                        <div className="relative bg-gradient-to-br from-gray-100 to-gray-200">
                          <img
                            src={provider.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(provider.name)}&background=22C55E&color=fff&size=400`}
                            alt={provider.name}
                            className="w-full h-full object-cover"
                          />

                          {/* Rating Badge */}
                          <div className="absolute top-3 right-3 bg-white rounded-full px-3 py-1 shadow-lg flex items-center gap-1">
                            <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="font-bold text-sm text-gray-900">{provider.rating ?? 0}</span>
                          </div>

                          {/* Verified Badge */}
                          {provider.verified && (
                            <div className="absolute bottom-3 left-3 bg-[#22C55E] text-white rounded-lg px-3 py-1 shadow-lg flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span className="font-semibold text-xs">Verificado</span>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="p-5">
                          <h2 className="text-2xl font-bold text-gray-900 mb-3">{provider.name}</h2>

                          {/* Rating con estrellas */}
                          <div className="flex items-center gap-1 mb-4">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-5 h-5 ${i < (provider.rating ?? 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>

                          {/* Días - CON VALIDACIÓN */}
                          {provider.workDays && provider.workDays.length > 0 && (
                            <div className="mb-4 pb-4 border-b border-gray-200">
                              <h3 className="text-xs font-semibold text-gray-700 mb-2 uppercase">Disponible</h3>
                              <div className="flex flex-wrap gap-1.5">
                                {provider.workDays?.map((day, index) => (
                                  <span key={`${provider.id}-day-${index}`} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                    {day}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Servicios - CON VALIDACIÓN */}
                          {provider.services && provider.services.length > 0 && (
                            <div className="mb-4">
                              <h3 className="text-xs font-semibold text-gray-700 mb-2 uppercase">Servicios</h3>
                              <div className="flex flex-wrap gap-1.5">
                                {provider.services?.map((service, index) => (
                                  <span key={`${provider.id}-service-${index}`} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                                    {service}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Botón */}
                          <button
                            onClick={() => handleBookAppointment(provider.id, provider.name)}
                            className="w-full bg-[#22C55E] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#16A34A] transition-colors"
                          >
                            Agendar Cita
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
