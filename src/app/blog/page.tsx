// src/app/blog/page.tsx

import Image from "next/image";
import Link from "next/link";

const posts = [
  {
    id: 1,
    title: "5 consejos para mantener tu espacio siempre impecable",
    category: "Tips de limpieza",
    date: "10 de diciembre 2025",
    readTime: "4 min de lectura",
    excerpt:
      "Pequeños hábitos diarios pueden marcar una gran diferencia en la limpieza y orden de tu hogar u oficina.",
  },
  {
    id: 2,
    title: "Cómo elegir un proveedor de limpieza confiable en CleenGo",
    category: "Guía CleenGo",
    date: "7 de diciembre 2025",
    readTime: "3 min de lectura",
    excerpt:
      "Te mostramos en qué fijarte al momento de contratar: calificaciones, horarios, reseñas y servicios disponibles.",
  },
  {
    id: 3,
    title: "Limpieza profesional para Airbnbs y alojamientos temporales",
    category: "Hospitalidad",
    date: "3 de diciembre 2025",
    readTime: "5 min de lectura",
    excerpt:
      "La primera impresión lo es todo. Descubre cómo un buen servicio de limpieza impacta directamente en tus reseñas.",
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A65FF] via-[#1E73FF] to-[#3D8AFF] pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* HERO */}
        <section className="bg-white/95 rounded-3xl shadow-xl px-6 py-8 md:px-10 md:py-10 flex flex-col md:flex-row gap-8 items-center mb-10">
          {/* Texto */}
          <div className="flex-1 space-y-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
              Blog CleenGo · Limpieza inteligente
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
              Consejos, guías y buenas prácticas
              <span className="text-[#0A65FF]">
                {" "}
                para un espacio impecable.
              </span>
            </h1>
            <p className="text-gray-600 text-sm md:text-base max-w-xl">
              Aquí compartimos recomendaciones para que saques el máximo
              provecho a los servicios de limpieza profesional y mantengas tus
              espacios limpios, organizados y listos para recibir a quien más
              importa.
            </p>

            <div className="flex flex-wrap gap-3 items-center pt-2">
              <Link
                href="/client/providers"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#22C55E] text-white text-sm font-semibold hover:bg-[#16A34A] transition"
              >
                Ver proveedores
              </Link>
              <span className="text-xs md:text-sm text-gray-500">
                Actualizado regularmente con contenido práctico para tu día a
                día.
              </span>
            </div>
          </div>

          {/* Imagen / Mascota */}
          <div className="w-32 h-32 md:w-40 md:h-40 relative">
            <div className="absolute inset-0 rounded-full bg-[#0A65FF]/10 blur-2xl" />
            <div className="relative w-full h-full flex items-center justify-center rounded-full bg-white border border-blue-100 shadow-md">
              <Image
                src="/bloop-icon-light.svg"
                alt="CleenGo Bloop"
                width={120}
                height={120}
                className="w-20 h-20 md:w-24 md:h-24"
              />
            </div>
          </div>
        </section>

        {/* LISTA DE POSTS */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl md:text-2xl font-semibold text-white">
              Artículos destacados
            </h2>
            <span className="text-xs md:text-sm text-white/80">
              {posts.length} artículo{posts.length !== 1 ? "s" : ""} disponible
              {posts.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {posts.map((post) => (
              <article
                key={post.id}
                className="bg-white/95 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300 border border-gray-100 flex flex-col overflow-hidden"
              >
                {/* Header del post */}
                <div className="px-5 pt-4 pb-3 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold bg-blue-50 text-blue-700">
                      {post.category}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {post.readTime}
                    </span>
                  </div>
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 leading-snug">
                    {post.title}
                  </h3>
                </div>

                {/* Contenido */}
                <div className="px-5 py-4 flex-1 flex flex-col">
                  <p className="text-sm text-gray-600 mb-4 flex-1">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                    <span>{post.date}</span>
                    <span>CleenGo · Equipo editorial</span>
                  </div>

                  <button
                    type="button"
                    className="mt-auto inline-flex items-center justify-center w-full text-sm font-semibold text-[#0A65FF] hover:text-[#0654d6] hover:bg-blue-50/70 rounded-xl px-4 py-2 transition-colors"
                  >
                    Leer más
                    <svg
                      className="w-4 h-4 ml-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
