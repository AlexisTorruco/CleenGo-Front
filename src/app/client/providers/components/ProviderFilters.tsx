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

const DAYS_OPTIONS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const HOURS_OPTIONS = ["06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
const SERVICES_OPTIONS = ["Jardinería", "Limpieza"];

export default function ProviderFilters({ onSearch, onClear, loading }: ProviderFiltersProps) {
  const [filters, setFilters] = useState<FilterData>({
    date: "",
    days: [],
    hours: [],
    services: [],
    rating: 0
  });

  const [errors, setErrors] = useState({
    days: false,
    hours: false,
    services: false
  });

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleClear = () => {
    setFilters({
      date: "",
      days: [],
      hours: [],
      services: [],
      rating: 0
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

  // Función para limpiar solo el rating
  const clearRating = () => {
    setFilters({ ...filters, rating: 0 });
  };

  // Función para limpiar solo la fecha
  const clearDate = () => {
    setFilters({ ...filters, date: "" });
  };

  // Función para limpiar solo los días
  const clearDays = () => {
    setFilters({ ...filters, days: [] });
  };

  const toggleDay = (day: string) => {
    setFilters(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
    if (errors.days) {
      setErrors(prev => ({ ...prev, days: false }));
    }
  };

  const toggleHour = (hour: string) => {
    setFilters(prev => ({
      ...prev,
      hours: prev.hours.includes(hour)
        ? prev.hours.filter(h => h !== hour)
        : [...prev.hours, hour]
    }));
    if (errors.hours) {
      setErrors(prev => ({ ...prev, hours: false }));
    }
  };

  const toggleService = (service: string) => {
    setFilters(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
    if (errors.services) {
      setErrors(prev => ({ ...prev, services: false }));
    }
  };

  // LÓGICA DE DESHABILITACIÓN
  const isDaysDisabled = filters.date !== ""; // Deshabilitar días si hay fecha
  const isDateDisabled = filters.days.length > 0; // Deshabilitar fecha si hay días

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xl h-fit sticky top-24">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Filtros</h3>

      {/* Fecha */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-gray-700">
            📅 Fecha en calendario
          </label>
          {/* BOTÓN PARA LIMPIAR FECHA */}
          {filters.date && (
            <button
              type="button"
              onClick={clearDate}
              className="text-xs text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Limpiar
            </button>
          )}
        </div>
        <input
          type="date"
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent transition-all ${
            isDateDisabled 
              ? 'bg-gray-100 cursor-not-allowed border-gray-200 text-gray-400' 
              : 'bg-white border-gray-300'
          }`}
          value={filters.date}
          min={new Date().toISOString().split('T')[0]}
          max={`${new Date().getFullYear() + 1}-12-31`}
          onChange={(e) => setFilters({ ...filters, date: e.target.value })}
          disabled={isDateDisabled}
        />
        {isDateDisabled ? (
          <p className="text-xs text-amber-600 mt-1 font-medium">
            ⚠️ Ya seleccionaste días. Si quieres agendar un turno con anticipación, limpia los días para seleccionar una fecha específica.
          </p>
        ) : (
          <p className="text-xs text-gray-500 mt-1">
            Disponible desde hoy hasta diciembre {new Date().getFullYear() + 1}
          </p>
        )}
      </div>

      {/* Días */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-gray-700">
            📆 Días
          </label>
          {/* BOTÓN PARA LIMPIAR DÍAS */}
          {filters.days.length > 0 && (
            <button
              type="button"
              onClick={clearDays}
              className="text-xs text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Limpiar
            </button>
          )}
        </div>
        <div className={`space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3 transition-all ${
          isDaysDisabled 
            ? 'bg-gray-50 border-gray-200 cursor-not-allowed' 
            : 'bg-white border-gray-200'
        }`}>
          {DAYS_OPTIONS.map((day) => (
            <label 
              key={day} 
              className={`flex items-center gap-2 p-1 rounded ${
                isDaysDisabled 
                  ? 'cursor-not-allowed opacity-50' 
                  : 'cursor-pointer hover:bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                className="w-4 h-4 text-[#22C55E] rounded focus:ring-[#22C55E]"
                checked={filters.days.includes(day)}
                onChange={() => toggleDay(day)}
                disabled={isDaysDisabled}
              />
              <span className={`text-sm ${isDaysDisabled ? 'text-gray-400' : 'text-gray-700'}`}>
                {day}
              </span>
            </label>
          ))}
        </div>
        {isDaysDisabled ? (
          <p className="text-xs text-amber-600 mt-1 font-medium">
            ⚠️ Ya seleccionaste una fecha en el calendario para agendar un turno con anticipación. Limpia la fecha para poder seleccionar tu turno para los días próximos.
          </p>
        ) : (
          <p className="text-xs mt-1 text-gray-500">
            {filters.days.length > 0 
              ? `${filters.days.length} día${filters.days.length !== 1 ? 's' : ''} seleccionado${filters.days.length !== 1 ? 's' : ''}`
              : 'Ningún día seleccionado'
            }
          </p>
        )}
      </div>

      {/* Horarios */}
      <div className="mb-5">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          🕐 Horarios
        </label>
        <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3 border-gray-200">
          {HOURS_OPTIONS.map((hour) => (
            <label key={hour} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
              <input
                type="checkbox"
                className="w-4 h-4 text-[#22C55E] rounded focus:ring-[#22C55E]"
                checked={filters.hours.includes(hour)}
                onChange={() => toggleHour(hour)}
              />
              <span className="text-sm text-gray-700">{hour}</span>
            </label>
          ))}
        </div>
        <p className="text-xs mt-1 text-gray-500">
          {filters.hours.length > 0
            ? `${filters.hours.length} horario${filters.hours.length !== 1 ? 's' : ''} seleccionado${filters.hours.length !== 1 ? 's' : ''}`
            : 'Ningún horario seleccionado'
          }
        </p>
      </div>

      {/* Servicios */}
      <div className="mb-5">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          🧹 Servicios
        </label>
        <div className="space-y-2 border rounded-lg p-3 border-gray-200">
          {SERVICES_OPTIONS.map((service) => (
            <label key={service} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
              <input
                type="checkbox"
                className="w-4 h-4 text-[#22C55E] rounded focus:ring-[#22C55E]"
                checked={filters.services.includes(service)}
                onChange={() => toggleService(service)}
              />
              <span className="text-sm text-gray-700">{service}</span>
            </label>
          ))}
        </div>
        <p className="text-xs mt-1 text-gray-500">
          {filters.services.length > 0
            ? `${filters.services.length} servicio${filters.services.length !== 1 ? 's' : ''} seleccionado${filters.services.length !== 1 ? 's' : ''}`
            : 'Ningún servicio seleccionado'
          }
        </p>
      </div>

      {/* Rating con estrellas clickeables */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-semibold text-gray-700">
            ⭐ Rating  {filters.rating} {filters.rating > 0 ? '★' : ''}
          </label>
          {/* BOTÓN PARA LIMPIAR RATING */}
          {filters.rating > 0 && (
            <button
              type="button"
              onClick={clearRating}
              className="text-xs text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Limpiar
            </button>
          )}
        </div>
        
        {/* Estrellas interactivas */}
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setFilters({ ...filters, rating: star })}
              className="transition-all duration-200 hover:scale-110 focus:outline-none"
            >
              <svg
                className={`w-10 h-10 ${
                  star <= filters.rating 
                    ? 'text-yellow-400 fill-current' 
                    : 'text-gray-300 fill-current hover:text-yellow-200'
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
            ? 'Selecciona un rating mínimo (opcional) para conocer nuestros proveedores con más estrellas' 
            : `Mostrando proveedores con ${filters.rating}+ estrellas`
          }
        </p>
      </div>

      {/* Botones */}
      <div className="space-y-3">
        <button
          onClick={handleSearch}
          disabled={loading}
          className="w-full bg-[#22C55E] text-white py-3 rounded-lg font-semibold hover:bg-[#16A34A] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {loading ? "Buscando..." : "Buscar Proveedores"}
        </button>

        <button
          onClick={handleClear}
          className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
        >
          Limpiar todos los filtros
        </button>
      </div>
    </div>
  );
}