//CleenGo-Front/src/app/components/DashboardAdmin.tsx
"use client";

import { useEffect, useState } from "react";
import { Users, UserCog, UserCheck, Trash2, DollarSign } from "lucide-react";

type UserRole = "client" | "provider" | "admin";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface DashboardStats {
  totalClients: number;
  totalProviders: number;
  totalUsers: number;
  ingresos: number;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState<"all" | "client" | "provider">("all");

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [errorStats, setErrorStats] = useState<string | null>(null);

  // ✅ Cargar STATS reales del backend
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setErrorStats(null);

        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No hay token. Inicia sesión como admin.");
        }

        const baseUrl = process.env.VITE_BACKEND_URL;
        if (!baseUrl) {
          throw new Error("VITE_BACKEND_URL no está definida.");
        }

        // ✅ asegura que quede: {base}/admin/dashboard
        const url = new URL("/admin/dashboard", baseUrl).toString();

        const res = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        if (res.status === 401) {
          throw new Error("401: Token inválido o expirado.");
        }
        if (res.status === 403) {
          throw new Error("403: Acceso denegado. Necesitas rol ADMIN.");
        }
        if (!res.ok) {
          throw new Error(`Error obteniendo estadísticas (${res.status}).`);
        }

        const data = (await res.json()) as DashboardStats;
        setStats(data);
      } catch (err: any) {
        console.error(err);
        setErrorStats(
          err?.message ?? "Error desconocido obteniendo estadísticas."
        );
      }
    };

    fetchDashboard();
  }, []);

  const filteredUsers =
    filter === "all" ? users : users.filter((u) => u.role === filter);

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm(
      "¿Seguro que deseas eliminar este usuario?"
    );
    if (!confirmDelete) return;

    setUsers((prev) => prev.filter((u) => u.id !== id));
    alert("Usuario eliminado.");
  };

  // Totales desde backend, fallback al mock
  const totals = {
    clients:
      stats?.totalClients ?? users.filter((u) => u.role === "client").length,
    providers:
      stats?.totalProviders ??
      users.filter((u) => u.role === "provider").length,
    totalUsers: stats?.totalUsers ?? users.length,
    ingresos: stats?.ingresos ?? 0,
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 text-[#0C2340]">
      <h1 className="text-4xl font-bold mb-6">Administrador — Dashboard</h1>

      {errorStats && (
        <p className="text-red-600 font-semibold mb-4">{errorStats}</p>
      )}

      {/* --- Estadísticas --- */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-10">
        {/* Total Usuarios */}
        <div className="bg-white p-6 rounded-2xl shadow-md flex items-center gap-4">
          <Users className="w-12 h-12 text-[#0C2340]" />
          <div>
            <p className="text-sm text-gray-500">Total de Usuarios</p>
            <h2 className="text-2xl font-bold">{totals.totalUsers}</h2>
          </div>
        </div>

        {/* Clientes */}
        <div className="bg-white p-6 rounded-2xl shadow-md flex items-center gap-4">
          <UserCheck className="w-12 h-12 text-green-500" />
          <div>
            <p className="text-sm text-gray-500">Clientes Registrados</p>
            <h2 className="text-2xl font-bold">{totals.clients}</h2>
          </div>
        </div>

        {/* Proveedores */}
        <div className="bg-white p-6 rounded-2xl shadow-md flex items-center gap-4">
          <UserCog className="w-12 h-12 text-blue-500" />
          <div>
            <p className="text-sm text-gray-500">Proveedores Registrados</p>
            <h2 className="text-2xl font-bold">{totals.providers}</h2>
          </div>
        </div>

        {/* Ingresos */}
        <div className="bg-white p-6 rounded-2xl shadow-md flex items-center gap-4">
          <DollarSign className="w-12 h-12 text-yellow-500" />
          <div>
            <p className="text-sm text-gray-500">Ingresos Totales</p>
            <h2 className="text-2xl font-bold">${totals.ingresos}</h2>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-xl shadow ${
            filter === "all" ? "bg-[#0C2340] text-white" : "bg-white"
          }`}
        >
          Todos
        </button>

        <button
          onClick={() => setFilter("client")}
          className={`px-4 py-2 rounded-xl shadow ${
            filter === "client" ? "bg-[#0C2340] text-white" : "bg-white"
          }`}
        >
          Clientes
        </button>

        <button
          onClick={() => setFilter("provider")}
          className={`px-4 py-2 rounded-xl shadow ${
            filter === "provider" ? "bg-[#0C2340] text-white" : "bg-white"
          }`}
        >
          Proveedores
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white p-6 rounded-2xl shadow-md overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b">
              <th className="p-3 font-semibold">Nombre</th>
              <th className="p-3 font-semibold">Email</th>
              <th className="p-3 font-semibold">Rol</th>
              <th className="p-3 font-semibold">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id} className="border-b hover:bg-gray-100 transition">
                <td className="p-3">{u.name}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3 capitalize">{u.role}</td>

                <td className="p-3">
                  <button
                    onClick={() => handleDelete(u.id)}
                    className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <p className="text-center text-gray-500 mt-4">
            No hay usuarios para este filtro.
          </p>
        )}
      </div>
    </div>
  );
}
