"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import ProviderFilters, { FilterData } from "./components/ProviderFilters";
import { useAuth } from "../../contexts/AuthContext";

// 🔹 AJUSTADO PARA COINCIDIR CON EL BACK (Swagger)
interface Provider {
  id: string; // viene como uuid en el back
  name: string;
  surname?: string;
  rating: number;
  profileImgUrl?: string | null; // <- campo real del back
  services?: string[];           // opcional por si lo agregan después
  days: string[];                // "days" en swagger
  hours: string[];               // "hours" en swagger
  about?: string;
  isActive?: boolean;
}

export default function ProvidersPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Evita problemas de hidratación (SSR vs CSR)
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const backendUrl = process.env.VITE_BACKEND_URL;

  // Cargar TODOS los proveedores al inicio
  useEffect(() => {
    loadAllProviders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAllProviders = async () => {
    if (!backendUrl) {
      console.error("❌ VITE_BACKEND_URL no está definido");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}provider`);
      if (!response.ok) throw new Error("Error al cargar proveedores");

      const data: Provider[] = await response.json();
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

  // Buscar con filtros (los reales del back)
  const handleSearch = async (filters: FilterData) => {
    if (!backendUrl) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (filters.date) params.append("date", filters.date);
      filters.days.forEach((day) => params.append("day", day));
      filters.hours.forEach((hour) => params.append("hour", hour));
      filters.services.forEach((service) => params.append("services", service));
      if (filters.rating > 0)
        params.append("rating", filters.rating.toString());

      const response = await fetch(
        `${backendUrl}provider/filter?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("Error al buscar proveedores");
      }

      const data: Provider[] = await response.json();
      setProviders(data);

      if (data.length > 0) {
        Swal.fire({
          icon: "success",
          title: "¡Proveedores encontrados!",
          text: `Se encontraron ${data.length} proveedor${
            data.length !== 1 ? "es" : ""
          } disponible${data.length !== 1 ? "s" : ""}`,
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
  };

  // Agendar cita
  const handleBookAppointment = (providerId: string, providerName: string) => {
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
        // 👇 AQUÍ ES DONDE CAMBIA
        router.push(
          `/client/appointments/create?providerId=${providerId}&providerName=${encodeURIComponent(
            providerName
          )}`
        );
      }
    });
  }
};


  // Solo usamos user para layout cuando ya estamos en el cliente
  const showFilters = isClient && !!user;

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

        {/* Botón filtros móviles */}
        {showFilters && (
          <div className="lg:hidden mb-4">
            <button
              type="button"
              onClick={() =>
                setIsMobileFiltersOpen((open) => !open)
              }
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/90 text-gray-800 shadow-md text-sm font-semibold"
            >
              <span>Filtros avanzados</span>
              <span className="flex items-center gap-1 text-xs text-gray-500">
                {isMobileFiltersOpen ? "Ocultar" : "Mostrar"}
                <svg
                  className={`w-4 h-4 transition-transform ${
                    isMobileFiltersOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </span>
            </button>

            {isMobileFiltersOpen && (
              <div className="mt-4">
                <ProviderFilters
                  onSearch={handleSearch}
                  onClear={handleClearFilters}
                  loading={loading}
                />
              </div>
            )}
          </div>
        )}

        {/* Layout principal */}
        <div
          className={`grid gap-6 ${
            showFilters ? "lg:grid-cols-[340px_1fr]" : "lg:grid-cols-1"
          }`}
        >
          {/* Sidebar filtros desktop */}
          {showFilters && (
            <div className="hidden lg:block">
              <ProviderFilters
                onSearch={handleSearch}
                onClear={handleClearFilters}
                loading={loading}
              />
            </div>
          )}

          {/* Columna proveedores */}
          <div>
            {/* Loading */}
            {loading && (
              <div className="bg-white rounded-2xl p-12 text-center shadow-xl">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#22C55E] mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando proveedores...</p>
              </div>
            )}

            {/* Sin proveedores */}
            {!loading && providers.length === 0 && !initialLoad && (
              <div className="bg-white rounded-2xl p-12 text-center shadow-xl">
                <svg
                  className="w-24 h-24 text-gray-300 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="text-2xl font-bold text-gray-700 mb-2">
                  No hay proveedores disponibles
                </h3>
                <p className="text-gray-500">Intenta más tarde</p>
              </div>
            )}

            {/* Con proveedores */}
            {!loading && providers.length > 0 && (
              <>
                {/* Contador */}
                <div className="bg-white/95 rounded-xl px-4 py-2 mb-5 shadow-md flex items-center justify-between text-sm">
                  <span className="text-gray-700 font-medium">
                    {providers.length} proveedor
                    {providers.length !== 1 ? "es" : ""} disponible
                    {providers.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Grid de tarjetas PRO */}
                <div className="grid gap-5 md:grid-cols-2">
                  {providers.map((provider) => {
                    // Imagen del provider (back) + fallback
                    const imageUrl = provider.profileImgUrl
                      ? provider.profileImgUrl.startsWith("http")
                        ? provider.profileImgUrl
                        : backendUrl
                        ? `${backendUrl}uploads/${provider.profileImgUrl}`
                        : provider.profileImgUrl
                      : null;

                    // Descripción corta
                    const description =
                      provider.about ||
                      "Cuento con experiencia en limpieza y mantenimiento residencial y comercial.";

                    return (
                      <div
                        key={provider.id}
                        className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:-translate-y-1"
                      >
                        <div className="p-5 flex flex-col gap-4">
                          {/* Top: avatar + nombre + rating */}
                          <div className="flex gap-4 items-start">
                            {/* Avatar */}
                            <div className="shrink-0">
                              {imageUrl ? (
                                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#22C55E]/70 shadow-md bg-gray-100">
                                  <img
                                    src={imageUrl}
                                    alt={provider.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-16 h-16 rounded-full bg-[#22C55E] flex items-center justify-center text-white font-bold text-xl shadow-md">
                                  {provider.name?.charAt(0)?.toUpperCase() ??
                                    "?"}
                                </div>
                              )}
                            </div>

                            {/* Nombre + rating + servicios */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h2 className="text-lg font-semibold text-gray-900 truncate">
                                  {provider.name}
                                </h2>

                                {/* Badge rating */}
                                <div className="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-100">
                                  <svg
                                    className="w-3.5 h-3.5 text-yellow-400"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                  <span className="text-xs font-semibold text-gray-800">
                                    {(provider.rating ?? 0).toFixed(1)}
                                  </span>
                                </div>
                              </div>

                              {/* Servicios / tags (simulados por ahora) */}
                              {provider.services && provider.services.length > 0 && (
                                <p className="text-xs text-[#0A65FF] font-medium mb-1 truncate">
                                  {provider.services.join(" · ")}
                                </p>
                              )}

                              {/* Descripción */}
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {description}
                              </p>
                            </div>
                          </div>

                          {/* Middle: días + horarios */}
                          <div className="grid grid-cols-2 gap-3">
                            {/* Días */}
                            {provider.days && provider.days.length > 0 && (
                              <div>
                                <h3 className="text-[11px] font-semibold text-gray-500 uppercase mb-1">
                                  Disponible
                                </h3>
                                <div className="flex flex-wrap gap-1">
                                  {provider.days.slice(0, 4).map((day, i) => (
                                    <span
                                      key={`${provider.id}-day-${i}`}
                                      className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[11px] font-medium"
                                    >
                                      {day}
                                    </span>
                                  ))}
                                  {provider.days.length > 4 && (
                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[11px] font-medium">
                                      +{provider.days.length - 4}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Horarios */}
                            {provider.hours && provider.hours.length > 0 && (
                              <div>
                                <h3 className="text-[11px] font-semibold text-gray-500 uppercase mb-1">
                                  Horarios
                                </h3>
                                <div className="flex flex-wrap gap-1">
                                  {provider.hours.slice(0, 3).map((hour, i) => (
                                    <span
                                      key={`${provider.id}-hour-${i}`}
                                      className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-[11px] font-medium"
                                    >
                                      {hour}
                                    </span>
                                  ))}
                                  {provider.hours.length > 3 && (
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-[11px] font-medium">
                                      +{provider.hours.length - 3}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* CTA */}
                          <button
                            onClick={() =>
                              handleBookAppointment(provider.id.toString(), provider.name)
                            }
                            className="w-full bg-[#22C55E] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#16A34A] transition-colors mt-1"
                          >
                            Agendar Cita
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
