"use client";

import { useEffect, useState } from "react";
import { Users, UserCog, UserCheck } from "lucide-react";

type UserRole = "client" | "provider" | "admin";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState<"all" | "client" | "provider">("all");

  // 🔥 Traer datos del backend (mock temporal)
  useEffect(() => {
    const fetchUsers = async () => {
      const data: User[] = [
        { id: "1", name: "Paulo", email: "paulo@gmail.com", role: "client" },
        { id: "2", name: "Maria", email: "maria@gmail.com", role: "provider" },
        { id: "3", name: "Carlos", email: "carlos@gmail.com", role: "client" },
        { id: "4", name: "Lucia", email: "lucia@gmail.com", role: "provider" },
      ];
      setUsers(data);
    };

    fetchUsers();
  }, []);

  // ✨ Filtro de usuarios
  const filteredUsers =
    filter === "all"
      ? users
      : users.filter((u) => u.role === filter);

  // ✨ Cálculo optimizado (una sola pasada)
  const totals = users.reduce(
    (acc, u) => {
      if (u.role === "client") acc.clients++;
      if (u.role === "provider") acc.providers++;
      return acc;
    },
    { clients: 0, providers: 0 }
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6 text-[#0C2340]">
      <h1 className="text-4xl font-bold mb-6">Administrador — Dashboard</h1>

      {/* --- Estadísticas --- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">

        {/* Total Usuarios */}
        <div className="bg-white p-6 rounded-2xl shadow-md flex items-center gap-4">
          <Users className="w-12 h-12 text-[#0C2340]" />
          <div>
            <p className="text-sm text-gray-500">Total de Usuarios</p>
            <h2 className="text-2xl font-bold">{users.length}</h2>
          </div>
        </div>

        {/* Total Clientes */}
        <div className="bg-white p-6 rounded-2xl shadow-md flex items-center gap-4">
          <UserCheck className="w-12 h-12 text-green-500" />
          <div>
            <p className="text-sm text-gray-500">Clientes Registrados</p>
            <h2 className="text-2xl font-bold">{totals.clients}</h2>
          </div>
        </div>

        {/* Total Proveedores */}
        <div className="bg-white p-6 rounded-2xl shadow-md flex items-center gap-4">
          <UserCog className="w-12 h-12 text-blue-500" />
          <div>
            <p className="text-sm text-gray-500">Proveedores Registrados</p>
            <h2 className="text-2xl font-bold">{totals.providers}</h2>
          </div>
        </div>
      </div>

      {/* --- Filtros --- */}
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

      {/* --- Tabla --- */}
      <div className="bg-white p-6 rounded-2xl shadow-md overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b">
              <th className="p-3 font-semibold">Nombre</th>
              <th className="p-3 font-semibold">Email</th>
              <th className="p-3 font-semibold">Rol</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.map((u) => (
              <tr
                key={u.id}
                className="border-b hover:bg-gray-100 transition"
              >
                <td className="p-3">{u.name}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3 capitalize">{u.role}</td>
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