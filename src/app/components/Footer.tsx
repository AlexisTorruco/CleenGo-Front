
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#1A2332] text-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Column 1 - Brand */}
          <div>

            <p className="text-gray-400 text-sm leading-relaxed">
              La plataforma líder en servicios de limpieza profesional en Latinoamérica.
            </p>
          </div>

          {/* Column 2 - Servicios */}
          <div>
            <h3 className="font-bold text-lg mb-4">Servicios</h3>
            <ul className="space-y-2">

              <li>
                <Link
                  href="/client/providers"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Proveedores
                </Link>
              </li>

            </ul>
          </div>

          {/* Column 3 - Empresa */}
          <div>
            <h3 className="font-bold text-lg mb-4">Empresa</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/sobre-nosotros"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Sobre nosotros
                </Link>
              </li>
              <li>
                <Link
                  href="/terminos"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Términos
                </Link>
              </li>
              <li>
                <Link
                  href="/privacidad"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Privacidad
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4 - Contacto */}
          <div>
            <h3 className="font-bold text-lg mb-4">Contacto</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="tel:+525512345678"
                  className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  +52 55 1234 5678
                </a>
              </li>
              <li>
                <a
                  href="mailto:cleengo65@gmail.com"
                  className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  cleengo65@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} CleenGo. Todos los derechos reservados.
            </p>

            
          </div>
        </div>
      </div>
    </footer>
  );
}