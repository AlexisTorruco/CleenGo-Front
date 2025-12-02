"use client";

import { AuthProvider } from "../../contexts/AuthContext";
import Navbar from "../../components/Navbar";
import Link from "next/link";

// Datos mockeados de proveedores
const mockProviders = [
  {
    id: 1,
    name: "María González",
    rating: 4.9,
    reviews: 127,
    location: "Ciudad de México",
    experience: 8,
    completedJobs: 342,
    pricePerRoom: 25,
    description: "Profesional de limpieza con más de 8 años de experiencia. Me especializo en limpieza profunda de hogares y oficinas. Atención al detalle garantizada.",
    services: ["Limpieza general", "Limpieza profunda", "Ventanas", "Cocina", "Baños"],
    verified: true,
    image: "https://ui-avatars.com/api/?name=Maria+Gonzalez&background=22C55E&color=fff&size=400"
  },
  {
    id: 2,
    name: "Carlos Rodríguez",
    rating: 4.8,
    reviews: 98,
    location: "Argentina, Buenos Aires",
    experience: 5,
    completedJobs: 256,
    pricePerRoom: 22,
    description: "Experto en limpieza de oficinas y espacios comerciales. Trabajo con productos ecológicos y técnicas modernas de limpieza.",
    services: ["Oficinas", "Alfombras", "Pisos", "Muebles", "Desinfección"],
    verified: true,
    image: "https://ui-avatars.com/api/?name=Carlos+Rodriguez&background=0A65FF&color=fff&size=400"
  },
  {
    id: 3,
    name: "Ana Martínez",
    rating: 5.0,
    reviews: 156,
    location: "Monterrey",
    experience: 10,
    completedJobs: 489,
    pricePerRoom: 30,
    description: "Servicios de limpieza premium para hogares y eventos especiales. Certificada en manejo de productos de limpieza profesionales.",
    services: ["Hogares", "Eventos", "Mudanzas", "Post-construcción", "Cristalería"],
    verified: true,
    image: "https://ui-avatars.com/api/?name=Ana+Martinez&background=8B5CF6&color=fff&size=400"
  },
  {
    id: 4,
    name: "Roberto Sánchez",
    rating: 4.7,
    reviews: 84,
    location: "Chile",
    experience: 6,
    completedJobs: 198,
    pricePerRoom: 20,
    description: "Especialista en limpieza de hogares y departamentos. Servicio rápido y eficiente con atención personalizada.",
    services: ["Hogares", "Departamentos", "Cocina", "Baños", "Limpieza general"],
    verified: true,
    image: "https://ui-avatars.com/api/?name=Roberto+Sanchez&background=F59E0B&color=fff&size=400"
  },
  {
    id: 5,
    name: "Laura Pérez",
    rating: 4.9,
    reviews: 142,
    location: "Argentina, Tucumán",
    experience: 7,
    completedJobs: 315,
    pricePerRoom: 28,
    description: "Limpieza profunda y mantenimiento regular. Especializada en hogares con mascotas y niños. Productos hipoalergénicos.",
    services: ["Hogares", "Mascotas", "Desinfección", "Ventanas", "Alfombras"],
    verified: true,
    image: "https://ui-avatars.com/api/?name=Laura+Perez&background=EC4899&color=fff&size=400"
  },
  {
    id: 6,
    name: "Jorge Ramírez",
    rating: 4.6,
    reviews: 76,
    location: "Perú",
    experience: 4,
    completedJobs: 167,
    pricePerRoom: 24,
    description: "Limpieza comercial y residencial. Experiencia en limpieza post-remodelación y mudanzas.",
    services: ["Comercial", "Post-construcción", "Mudanzas", "Oficinas", "Pisos"],
    verified: true,
    image: "https://ui-avatars.com/api/?name=Jorge+Ramirez&background=06B6D4&color=fff&size=400"
  }
];

export default function ProvidersPage() {
  return (
    <AuthProvider>
      <Navbar />

      <div className="min-h-screen bg-gradient-to-br from-[#0A65FF] via-[#1E73FF] to-[#3D8AFF] pt-32 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-10 text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-3">
              Nuestros Proveedores
            </h1>
            <p className="text-lg text-white/90">
              Profesionales verificados y calificados por nuestra comunidad
            </p>
          </div>

          {/* Provider Cards Grid */}
          <div className="grid gap-5">
            {mockProviders.map((provider) => (
              <div
                key={provider.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <div className="grid md:grid-cols-[240px_1fr] gap-0">
                  {/* Left Side - Image */}
                  <div className="relative bg-gradient-to-br from-gray-100 to-gray-200">
                    <img
                      src={provider.image}
                      alt={provider.name}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Rating Badge */}
                    <div className="absolute top-3 right-3 bg-white rounded-full px-3 py-1 shadow-lg flex items-center gap-1">
                      <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="font-bold text-sm text-gray-900">{provider.rating}</span>
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

                  {/* Right Side - Info */}
                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">{provider.name}</h2>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-4 h-4 ${i < Math.floor(provider.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">{provider.rating} ({provider.reviews} reseñas)</span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-gray-500 text-xs mb-0.5">Desde</div>
                        <div className="text-3xl font-bold text-[#22C55E]">${provider.pricePerRoom}</div>
                        <div className="text-gray-500 text-xs">por habitación</div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-5 mb-4 pb-4 border-b border-gray-200">
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <svg className="w-4 h-4 text-[#22C55E]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs font-medium">{provider.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                          <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                        </svg>
                        <span className="text-xs font-medium">{provider.experience} años</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-700">
                        <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-xs font-medium">{provider.completedJobs} trabajos</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">{provider.description}</p>

                    {/* Services */}
                    <div className="mb-4">
                      <h3 className="font-semibold text-gray-900 mb-2 text-xs uppercase tracking-wide flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-[#22C55E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Servicios especializados
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {provider.services.map((service, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium"
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2.5">
                      <button className="flex-1 bg-[#22C55E] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#16A34A] transition-colors">
                        Cotizar Servicio
                      </button>
                      <button className="px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:border-gray-400 transition-colors">
                        Ver Perfil
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}