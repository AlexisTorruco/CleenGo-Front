"use client";

import { useState } from "react";
import Swal from "sweetalert2";

interface ProviderFiltersProps {
  onSearch: (filters: FilterData) => void;
  onClear: () => void;
  loading: boolean;
}

export interface FilterData {
  date: string;
  days: string[];
  hours: string[];
  services: string[];
  rating: number;
}

const DAYS_OPTIONS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

const HOURS_OPTIONS = [
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];

const SERVICES_OPTIONS = ["Jardinería", "Limpieza"];

export default function ProviderFilters({
  onSearch,
  onClear,
  loading,
}: ProviderFiltersProps) {
  const [filters, setFilters] = useState<FilterData>({
    date: "",
    days: [],
    hours: [],
    services: [],
    rating: 0,
  });

  // Para errores futuros si quieres validar algo obligatorio
  const [errors, setErrors] = useState({
    days: false,
    hours: false,
    services: false,
  });

  // Estado para panel móvil
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Estado de secciones del acordeón
  const [openSections, setOpenSections] = useState({
    date: true,
    days: true,
    hours: false,
    services: false,
    rating: false,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSearch = () => {
    onSearch(filters);
    // En móvil cierra panel después de buscar
    setIsMobileFiltersOpen(false);
  };

  const handleClear = () => {
    setFilters({
      date: "",
      days: [],
      hours: [],
      services: [],
      rating: 0,
    });
    setErrors({ days: false, hours: false, services: false });

    Swal.fire({
      icon: "info",
      title: "Filtros limpiados",
      text: "Todos los filtros han sido reseteados",
      showConfirmButton: true,
      confirmButtonText: "Aceptar",
      confirmButtonColor: "#22C55E",
    });

    onClear();
  };

  // Helpers para limpiar individuales
  const clearRating = () => setFilters((prev) => ({ ...prev, rating: 0 }));
  const clearDate = () => setFilters((prev) => ({ ...prev, date: "" }));
  const clearDays = () => setFilters((prev) => ({ ...prev, days: [] }));
  const clearHours = () => setFilters((prev) => ({ ...prev, hours: [] }));
  const clearServices = () =>
    setFilters((prev) => ({ ...prev, services: [] }));

  // Toggles
  const toggleDay = (day: string) => {
    setFilters((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day],
    }));
    if (errors.days) setErrors((prev) => ({ ...prev, days: false }));
  };

  const toggleHour = (hour: string) => {
    setFilters((prev) => ({
      ...prev,
      hours: prev.hours.includes(hour)
        ? prev.hours.filter((h) => h !== hour)
        : [...prev.hours, hour],
    }));
    if (errors.hours) setErrors((prev) => ({ ...prev, hours: false }));
  };

  const toggleService = (service: string) => {
    setFilters((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
    if (errors.services) setErrors((prev) => ({ ...prev, services: false }));
  };

  // Deshabilitación cruzada fecha / días
  const isDaysDisabled = filters.date !== "";
  const isDateDisabled = filters.days.length > 0;

  // --- UI ---

  // chip pequeño reutilizable para resumen de filtros
  const Chip = ({ label }: { label: string }) => (
    <span className="px-2 py-0.5 rounded-full text-[11px] bg-blue-50 text-blue-700 border border-blue-100">
      {label}
    </span>
  );

  // Contenido del panel (se usa en mobile y desktop)
  const FiltersContent = (
    <div className="space-y-4">
      {/* Resumen de filtros arriba */}
      <div className="flex flex-wrap gap-2 text-xs">
        {filters.date && <Chip label={`Fecha: ${filters.date}`} />}
        {filters.days.length > 0 && (
          <Chip
            label={`Días: ${filters.days.length}${
              filters.days.length > 3 ? " +" : ""
            }`}
          />
        )}
        {filters.hours.length > 0 && (
          <Chip label={`Horarios: ${filters.hours.length}`} />
        )}
        {filters.services.length > 0 && (
          <Chip label={`Servicios: ${filters.services.length}`} />
        )}
        {filters.rating > 0 && (
          <Chip label={`Rating: ${filters.rating}+ ⭐`} />
        )}
        {filters.date === "" &&
          filters.days.length === 0 &&
          filters.hours.length === 0 &&
          filters.services.length === 0 &&
          filters.rating === 0 && (
            <span className="text-[11px] text-gray-400">
              Sin filtros aplicados
            </span>
          )}
      </div>

      {/* Fecha */}
      <div className="border border-gray-100 rounded-xl overflow-hidden">
        <div
          role="button"
          tabIndex={0}
          onClick={() => toggleSection("date")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") toggleSection("date");
          }}
          className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">
              📅 Fecha
            </span>
            {filters.date && (
              <Chip
                label={new Date(filters.date).toLocaleDateString("es-MX", {
                  day: "2-digit",
                  month: "short",
                })}
              />
            )}
          </div>

          <div className="flex items-center gap-2">
            {filters.date && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearDate();
                }}
                className="text-[11px] text-red-500 hover:text-red-700 font-medium"
              >
                Limpiar
              </button>
            )}
            <span
              className={`text-xs transition-transform ${
                openSections.date ? "rotate-90" : ""
              }`}
            >
              ▶
            </span>
          </div>
        </div>

        {openSections.date && (
          <div className="px-3 pb-3 pt-1 space-y-1 text-xs text-gray-500">
            <input
              type="date"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent transition-all text-sm ${
                isDateDisabled
                  ? "bg-gray-100 cursor-not-allowed border-gray-200 text-gray-400"
                  : "bg-white border-gray-200"
              }`}
              value={filters.date}
              min={new Date().toISOString().split("T")[0]}
              max={`${new Date().getFullYear() + 1}-12-31`}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, date: e.target.value }))
              }
              disabled={isDateDisabled}
            />
            {isDateDisabled ? (
              <p className="text-[11px] text-amber-600">
                ⚠️ Limpia los días para poder elegir una fecha específica.
              </p>
            ) : (
              <p className="text-[11px]">
                Desde hoy hasta diciembre {new Date().getFullYear() + 1}.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Días */}
      <div className="border border-gray-100 rounded-xl overflow-hidden">
        <div
          role="button"
          tabIndex={0}
          onClick={() => toggleSection("days")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") toggleSection("days");
          }}
          className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">📆 Días</span>
            {filters.days.length > 0 && (
              <Chip label={`${filters.days.length} seleccionado(s)`} />
            )}
          </div>

          <div className="flex items-center gap-2">
            {filters.days.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearDays();
                }}
                className="text-[11px] text-red-500 hover:text-red-700 font-medium"
              >
                Limpiar
              </button>
            )}
            <span
              className={`text-xs transition-transform ${
                openSections.days ? "rotate-90" : ""
              }`}
            >
              ▶
            </span>
          </div>
        </div>

        {openSections.days && (
          <div
            className={`px-3 pb-3 pt-1 space-y-2 max-h-40 overflow-y-auto ${
              isDaysDisabled ? "opacity-60 pointer-events-none" : ""
            }`}
          >
            {DAYS_OPTIONS.map((day) => (
              <label
                key={day}
                className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 px-1 py-1 rounded"
              >
                <input
                  type="checkbox"
                  className="w-4 h-4 text-[#22C55E] rounded focus:ring-[#22C55E]"
                  checked={filters.days.includes(day)}
                  onChange={() => toggleDay(day)}
                  disabled={isDaysDisabled}
                />
                <span
                  className={
                    isDaysDisabled ? "text-gray-400" : "text-gray-700"
                  }
                >
                  {day}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Horarios */}
      <div className="border border-gray-100 rounded-xl overflow-hidden">
        <div
          role="button"
          tabIndex={0}
          onClick={() => toggleSection("hours")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") toggleSection("hours");
          }}
          className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">
              🕒 Horarios
            </span>
            {filters.hours.length > 0 && (
              <Chip label={`${filters.hours.length} seleccionados`} />
            )}
          </div>
          <div className="flex items-center gap-2">
            {filters.hours.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearHours();
                }}
                className="text-[11px] text-red-500 hover:text-red-700 font-medium"
              >
                Limpiar
              </button>
            )}
            <span
              className={`text-xs transition-transform ${
                openSections.hours ? "rotate-90" : ""
              }`}
            >
              ▶
            </span>
          </div>
        </div>

        {openSections.hours && (
          <div className="px-3 pb-3 pt-1 space-y-2 max-h-40 overflow-y-auto">
            {HOURS_OPTIONS.map((hour) => (
              <label
                key={hour}
                className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 px-1 py-1 rounded"
              >
                <input
                  type="checkbox"
                  className="w-4 h-4 text-[#22C55E] rounded focus:ring-[#22C55E]"
                  checked={filters.hours.includes(hour)}
                  onChange={() => toggleHour(hour)}
                />
                <span className="text-gray-700">{hour}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Servicios */}
      <div className="border border-gray-100 rounded-xl overflow-hidden">
        <div
          role="button"
          tabIndex={0}
          onClick={() => toggleSection("services")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") toggleSection("services");
          }}
          className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">
              🧹 Servicios
            </span>
            {filters.services.length > 0 && (
              <Chip label={`${filters.services.length} seleccionados`} />
            )}
          </div>
          <div className="flex items-center gap-2">
            {filters.services.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearServices();
                }}
                className="text-[11px] text-red-500 hover:text-red-700 font-medium"
              >
                Limpiar
              </button>
            )}
            <span
              className={`text-xs transition-transform ${
                openSections.services ? "rotate-90" : ""
              }`}
            >
              ▶
            </span>
          </div>
        </div>

        {openSections.services && (
          <div className="px-3 pb-3 pt-1 space-y-2">
            {SERVICES_OPTIONS.map((service) => (
              <label
                key={service}
                className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 px-1 py-1 rounded"
              >
                <input
                  type="checkbox"
                  className="w-4 h-4 text-[#22C55E] rounded focus:ring-[#22C55E]"
                  checked={filters.services.includes(service)}
                  onChange={() => toggleService(service)}
                />
                <span className="text-gray-700">{service}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Rating */}
    {/* Rating mínimo */}
<div className="mb-5">
  <div className="flex items-center justify-between mb-2">
    <label className="block text-sm font-semibold text-gray-700">
      ⭐ Rating mínimo {filters.rating > 0 ? `: ${filters.rating}` : ""}
    </label>

    {filters.rating > 0 && (
      <button
        type="button"
        onClick={() => setFilters({ ...filters, rating: 0 })}
        className="text-xs text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
      >
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
        Limpiar
      </button>
    )}
  </div>

  {/* Estrellas */}
  <div className="flex gap-2">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => setFilters({ ...filters, rating: star })}
        className="transition-all duration-200 hover:scale-110"
      >
        <svg
          className={`w-8 h-8 ${
            star <= filters.rating
              ? "text-yellow-400 fill-yellow-400"
              : "text-gray-300 fill-gray-300 hover:text-yellow-300"
          }`}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      </button>
    ))}
  </div>

  <p className="text-xs text-gray-500 mt-2">
    {filters.rating === 0
      ? "Selecciona un mínimo de estrellas (opcional)."
      : `Mostrando proveedores con ${filters.rating}+ estrellas`}
  </p>
</div>


      {/* Botones principales */}
      <div className="space-y-2 pt-2">
        <button
          type="button"
          onClick={handleSearch}
          disabled={loading}
          className="w-full bg-[#22C55E] text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-[#16A34A] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {loading ? "Buscando..." : "Aplicar filtros"}
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="w-full bg-gray-100 text-gray-700 py-2.5 rounded-lg font-semibold text-sm hover:bg-gray-200 transition-colors"
        >
          Limpiar todos
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop / tablet – card fija en sidebar */}
      <div className="hidden lg:block">
        <div className="bg-white rounded-2xl p-5 shadow-xl sticky top-24 max-h-[80vh] overflow-y-auto border border-blue-50">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm font-bold">
              🔍
            </span>
            Filtros
          </h3>
          {FiltersContent}
        </div>
      </div>

      {/* Mobile – botón flotante + panel deslizable */}
      <div className="lg:hidden">
        {/* Botón fijo abajo */}
        <div className="fixed bottom-4 left-0 right-0 z-30 flex justify-center pointer-events-none">
          <button
            type="button"
            onClick={() => setIsMobileFiltersOpen(true)}
            className="pointer-events-auto inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white shadow-lg border border-blue-100 text-sm font-semibold text-gray-800"
          >
            <span>Filtros</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              {[
                filters.date,
                filters.days.length,
                filters.hours.length,
                filters.services.length,
                filters.rating,
              ].some((v) => (typeof v === "number" ? v > 0 : !!v))
                ? "Aplicados"
                : "0 activos"}
            </span>
          </button>
        </div>

        {/* Panel móvil */}
        {isMobileFiltersOpen && (
          <div className="fixed inset-0 z-40 bg-black/40 flex items-end">
            <div className="w-full max-h-[80vh] bg-white rounded-t-3xl p-4 shadow-2xl overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-gray-900">
                  Filtros de búsqueda
                </h3>
                <button
                  type="button"
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="text-sm text-gray-500 hover:text-gray-800"
                >
                  Cerrar ✕
                </button>
              </div>
              {FiltersContent}
            </div>
          </div>
        )}
      </div>
    </>
  );
}