"use client";

import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
  Users,
  UserCog,
  UserCheck,
  Trash2,
  DollarSign,
  Search,
  Shield,
  RefreshCw,
  Eye,
  X,
} from "lucide-react";

type UserRole = "client" | "provider" | "admin";

type Plan = {
  id: string;
  name: string;
  price: number;
  description: string;
  isActive: boolean;
};

type Subscription = {
  id: string;
  startDate?: string | null;
  paymentStatus: boolean;
  isActive: boolean;
  plan?: Plan;
};

type AppointmentLite = {
  id: string;
  date: string;
  startHour: string;
  endHour?: string | null;
  status: string;
  isActive: boolean;
};

interface UserRow {
  id: string;
  name: string | null;
  surname: string | null;
  email: string;
  role: UserRole;
  isActive: boolean;
}

interface DashboardStats {
  totalClients: number;
  totalProviders: number;
  totalUsers: number;
  ingresos: number;
}

type AdminUsersResponse = {
  total: number;
  page: number;
  totalPages: number;
  users: UserRow[];
};

type UserDetail = UserRow & {
  phone?: string | null;
  birthDate?: string | null;
  profileImgUrl?: string | null;

  street?: string | null;
  exteriorNumber?: string | null;
  interiorNumber?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  fullAddress?: string | null;

  rating?: number | null;

  // CLIENT:
  clientAppointments?: AppointmentLite[];
  reviewsReceived?: any[];

  // PROVIDER:
  about?: string | null;
  days?: string[] | null;
  hours?: string[] | null;
  services?: { id: string; name: string }[];
  suscription?: Subscription | null;
  appointments?: AppointmentLite[];
};

function buildUrl(path: string) {
  const baseUrl = process.env.VITE_BACKEND_URL;
  if (!baseUrl) throw new Error("VITE_BACKEND_URL no está definida.");
  return new URL(path, baseUrl).toString();
}

function getTokenOrThrow() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No hay token. Inicia sesión como admin.");
  return token;
}

function roleBadge(role: UserRole) {
  if (role === "admin") return "bg-[#0C2340] text-white";
  if (role === "provider") return "bg-blue-600 text-white";
  return "bg-green-600 text-white";
}

function statusBadge(active: boolean) {
  return active ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800";
}

export default function AdminDashboard() {
  // --------------------------
  // STATS
  // --------------------------
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [errorStats, setErrorStats] = useState<string | null>(null);

  // --------------------------
  // USERS LIST
  // --------------------------
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [errorUsers, setErrorUsers] = useState<string | null>(null);

  // filtros
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("active");
  const [search, setSearch] = useState("");

  // paginación
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // --------------------------
  // USER DETAIL (DRAWER)
  // --------------------------
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  // ==========================
  // 1) Fetch dashboard stats
  // ==========================
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setErrorStats(null);
        const token = getTokenOrThrow();

        const url = buildUrl("/admin/dashboard");
        const res = await fetch(url, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });

        if (res.status === 401)
          throw new Error("401: Token inválido o expirado.");
        if (res.status === 403)
          throw new Error("403: Acceso denegado. Necesitas rol ADMIN.");
        if (!res.ok)
          throw new Error(`Error obteniendo estadísticas (${res.status}).`);

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

  // ==========================
  // 2) Fetch users (admin/users)
  // ==========================
  const fetchUsers = async () => {
    try {
      setErrorUsers(null);
      setLoadingUsers(true);
      const token = getTokenOrThrow();

      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));

      // Por defecto: mostramos solo activos (más útil para admin)
      if (statusFilter !== "all") params.set("status", statusFilter);

      if (roleFilter !== "all") params.set("role", roleFilter);

      const trimmed = search.trim();
      if (trimmed.length >= 2) params.set("search", trimmed);

      const url = buildUrl(`/admin/users?${params.toString()}`);

      const res = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (res.status === 401)
        throw new Error("401: Token inválido o expirado.");
      if (res.status === 403)
        throw new Error("403: Acceso denegado. Necesitas rol ADMIN.");
      if (!res.ok)
        throw new Error(`Error obteniendo usuarios (${res.status}).`);

      const data = (await res.json()) as AdminUsersResponse;

      setUsers(data.users ?? []);
      setTotalPages(data.totalPages ?? 1);
    } catch (err: any) {
      console.error(err);
      setErrorUsers(err?.message ?? "Error desconocido obteniendo usuarios.");
      setUsers([]);
      setTotalPages(1);
    } finally {
      setLoadingUsers(false);
    }
  };

  // cuando cambian filtros/página
  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, roleFilter, statusFilter]);

  // search: aplica al presionar Enter o botón
  const applySearch = () => {
    setPage(1);
    fetchUsers();
  };

  // ==========================
  // 3) Fetch user detail (drawer)
  // ==========================
  const fetchUserDetail = async (id: string) => {
    try {
      setErrorDetail(null);
      setLoadingDetail(true);
      setSelectedId(id);
      setSelectedUser(null);

      const token = getTokenOrThrow();
      const url = buildUrl(`/admin/users/${id}`);

      const res = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (res.status === 401)
        throw new Error("401: Token inválido o expirado.");
      if (res.status === 403)
        throw new Error("403: Acceso denegado. Necesitas rol ADMIN.");
      if (!res.ok) throw new Error(`Error obteniendo detalle (${res.status}).`);

      const data = (await res.json()) as UserDetail;
      setSelectedUser(data);
    } catch (err: any) {
      console.error(err);
      setErrorDetail(err?.message ?? "Error desconocido obteniendo detalle.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeDrawer = () => {
    setSelectedId(null);
    setSelectedUser(null);
    setErrorDetail(null);
  };

  // ==========================
  // 4) Actions: activate/deactivate, change role
  // ==========================
  const toggleActive = async (u: UserRow, nextActive: boolean) => {
    const actionLabel = nextActive ? "activar" : "desactivar";

    const resConfirm = await Swal.fire({
      title: `¿Seguro que deseas ${actionLabel} este usuario?`,
      html: `<div style="text-align:left">
              <b>${u.name ?? "(sin nombre)"} ${u.surname ?? ""}</b><br/>
              <span style="color:#555">${u.email}</span><br/>
              <small>Rol: <b>${u.role}</b></small>
            </div>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: `Sí, ${actionLabel}`,
      cancelButtonText: "Cancelar",
    });

    if (!resConfirm.isConfirmed) return;

    try {
      const token = getTokenOrThrow();
      const url = buildUrl(`/admin/users/${u.id}/active`);

      const res = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: nextActive }),
      });

      if (res.status === 401)
        throw new Error("401: Token inválido o expirado.");
      if (res.status === 403) throw new Error("403: Acceso denegado.");
      if (!res.ok) throw new Error(`Error al ${actionLabel} (${res.status}).`);

      await Swal.fire({
        title: "Listo ✅",
        text: nextActive ? "Usuario activado." : "Usuario desactivado.",
        icon: "success",
      });

      // refrescar lista
      fetchUsers();

      // refrescar detalle si estaba abierto
      if (selectedId === u.id) fetchUserDetail(u.id);
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        title: "Ups…",
        text: err?.message ?? "No se pudo completar la acción.",
        icon: "error",
      });
    }
  };

  const changeRole = async (u: UserRow, newRole: UserRole) => {
    const resConfirm = await Swal.fire({
      title: "Confirmar cambio de rol",
      html: `<div style="text-align:left">
              <b>${u.name ?? "(sin nombre)"} ${u.surname ?? ""}</b><br/>
              <span style="color:#555">${u.email}</span><br/><br/>
              Rol actual: <b>${u.role}</b><br/>
              Nuevo rol: <b>${newRole}</b>
            </div>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, cambiar rol",
      cancelButtonText: "Cancelar",
    });

    if (!resConfirm.isConfirmed) return;

    try {
      const token = getTokenOrThrow();
      const url = buildUrl(`/admin/users/${u.id}/role`);

      const res = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.status === 401)
        throw new Error("401: Token inválido o expirado.");
      if (res.status === 403) throw new Error("403: Acceso denegado.");
      if (!res.ok) throw new Error(`Error cambiando rol (${res.status}).`);

      await Swal.fire({
        title: "Rol actualizado ✅",
        text: `Ahora es ${newRole}.`,
        icon: "success",
      });

      fetchUsers();
      if (selectedId === u.id) fetchUserDetail(u.id);
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        title: "Ups…",
        text: err?.message ?? "No se pudo cambiar el rol.",
        icon: "error",
      });
    }
  };

  // Totales desde backend
  const totals = useMemo(() => {
    return {
      clients: stats?.totalClients ?? 0,
      providers: stats?.totalProviders ?? 0,
      totalUsers: stats?.totalUsers ?? 0,
      ingresos: stats?.ingresos ?? 0,
    };
  }, [stats]);

  return (
    <div className="min-h-screen bg-gray-100 p-6 text-[#0C2340] relative">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-4xl font-bold mb-2">Administrador — Dashboard</h1>
          <p className="text-gray-600">
            Gestiona usuarios, roles, estado activo y revisa estadísticas
            generales.
          </p>
        </div>

        <button
          onClick={() => {
            // refrescar todo
            fetchUsers();
            // stats (re-fetch simple)
            // (Si quieres, luego hacemos endpoint para invalidar cache)
            Swal.fire({
              title: "Actualizando…",
              text: "Recargando datos del dashboard.",
              icon: "info",
              timer: 900,
              showConfirmButton: false,
            });
          }}
          className="px-4 py-2 rounded-xl bg-white shadow hover:bg-gray-50 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refrescar
        </button>
      </div>

      {(errorStats || errorUsers) && (
        <div className="mt-4 space-y-2">
          {errorStats && (
            <p className="text-red-600 font-semibold">{errorStats}</p>
          )}
          {errorUsers && (
            <p className="text-red-600 font-semibold">{errorUsers}</p>
          )}
        </div>
      )}

      {/* --- Estadísticas --- */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 my-8">
        <div className="bg-white p-6 rounded-2xl shadow-md flex items-center gap-4">
          <Users className="w-12 h-12 text-[#0C2340]" />
          <div>
            <p className="text-sm text-gray-500">Total de Usuarios</p>
            <h2 className="text-2xl font-bold">{totals.totalUsers}</h2>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-md flex items-center gap-4">
          <UserCheck className="w-12 h-12 text-green-500" />
          <div>
            <p className="text-sm text-gray-500">Clientes Registrados</p>
            <h2 className="text-2xl font-bold">{totals.clients}</h2>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-md flex items-center gap-4">
          <UserCog className="w-12 h-12 text-blue-500" />
          <div>
            <p className="text-sm text-gray-500">Proveedores Registrados</p>
            <h2 className="text-2xl font-bold">{totals.providers}</h2>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-md flex items-center gap-4">
          <DollarSign className="w-12 h-12 text-yellow-500" />
          <div>
            <p className="text-sm text-gray-500">Ingresos Totales</p>
            <h2 className="text-2xl font-bold">${totals.ingresos}</h2>
          </div>
        </div>
      </div>

      {/* --- Filtros y búsqueda --- */}
      <div className="bg-white p-4 rounded-2xl shadow-md mb-6 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => {
                setRoleFilter("all");
                setPage(1);
              }}
              className={`px-4 py-2 rounded-xl shadow ${
                roleFilter === "all" ? "bg-[#0C2340] text-white" : "bg-white"
              }`}
            >
              Todos
            </button>

            <button
              onClick={() => {
                setRoleFilter("client");
                setPage(1);
              }}
              className={`px-4 py-2 rounded-xl shadow ${
                roleFilter === "client" ? "bg-[#0C2340] text-white" : "bg-white"
              }`}
            >
              Clientes
            </button>

            <button
              onClick={() => {
                setRoleFilter("provider");
                setPage(1);
              }}
              className={`px-4 py-2 rounded-xl shadow ${
                roleFilter === "provider"
                  ? "bg-[#0C2340] text-white"
                  : "bg-white"
              }`}
            >
              Proveedores
            </button>

            <button
              onClick={() => {
                setRoleFilter("admin");
                setPage(1);
              }}
              className={`px-4 py-2 rounded-xl shadow ${
                roleFilter === "admin" ? "bg-[#0C2340] text-white" : "bg-white"
              }`}
            >
              Admins
            </button>
          </div>

          <div className="flex gap-2 flex-wrap items-center">
            <label className="text-sm text-gray-600">Estado:</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border bg-white"
            >
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
              <option value="all">Todos</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-2 w-full bg-gray-50 border rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applySearch();
              }}
              placeholder="Buscar por nombre o email (mín. 2 letras)…"
              className="bg-transparent outline-none w-full text-sm"
            />
          </div>
          <button
            onClick={applySearch}
            className="px-4 py-2 rounded-xl bg-[#0C2340] text-white shadow hover:opacity-95"
          >
            Buscar
          </button>
        </div>
      </div>

      {/* --- Tabla usuarios --- */}
      <div className="bg-white p-6 rounded-2xl shadow-md overflow-x-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Usuarios</h2>
          <div className="text-sm text-gray-600">
            Página <b>{page}</b> de <b>{totalPages}</b>
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="text-left border-b">
              <th className="p-3 font-semibold">Nombre</th>
              <th className="p-3 font-semibold">Email</th>
              <th className="p-3 font-semibold">Rol</th>
              <th className="p-3 font-semibold">Estado</th>
              <th className="p-3 font-semibold">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {loadingUsers ? (
              <tr>
                <td className="p-4 text-gray-500" colSpan={5}>
                  Cargando usuarios…
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b hover:bg-gray-50 transition">
                  <td className="p-3">
                    {u.name ?? "(Sin nombre)"} {u.surname ?? ""}
                  </td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${roleBadge(
                        u.role
                      )}`}
                    >
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge(
                        u.isActive
                      )}`}
                    >
                      {u.isActive ? "ACTIVO" : "INACTIVO"}
                    </span>
                  </td>

                  <td className="p-3">
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => fetchUserDetail(u.id)}
                        className="p-2 bg-white border hover:bg-gray-50 rounded-xl transition flex items-center gap-2"
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4" />
                        Ver
                      </button>

                      {u.isActive ? (
                        <button
                          onClick={() => toggleActive(u, false)}
                          className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition flex items-center gap-2"
                          title="Desactivar usuario"
                        >
                          <Trash2 className="w-4 h-4" />
                          Desactivar
                        </button>
                      ) : (
                        <button
                          onClick={() => toggleActive(u, true)}
                          className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition flex items-center gap-2"
                          title="Activar usuario"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Activar
                        </button>
                      )}

                      {/* Solo muestra opción "Hacer Admin" si NO es admin */}
                      {u.role !== "admin" && (
                        <button
                          onClick={() => changeRole(u, "admin")}
                          className="p-2 bg-[#0C2340] hover:opacity-95 text-white rounded-xl transition flex items-center gap-2"
                          title="Hacer ADMIN"
                        >
                          <Shield className="w-4 h-4" />
                          Hacer Admin
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {!loadingUsers && users.length === 0 && (
          <p className="text-center text-gray-500 mt-4">
            No hay usuarios para este filtro.
          </p>
        )}

        {/* Paginación */}
        <div className="flex items-center justify-between mt-6">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className={`px-4 py-2 rounded-xl shadow ${
              page <= 1
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-white hover:bg-gray-50"
            }`}
          >
            Anterior
          </button>

          <div className="text-sm text-gray-600">
            Página <b>{page}</b> / <b>{totalPages}</b>
          </div>

          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className={`px-4 py-2 rounded-xl shadow ${
              page >= totalPages
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-white hover:bg-gray-50"
            }`}
          >
            Siguiente
          </button>
        </div>
      </div>

      {/* -----------------------------
          DRAWER Detalle Usuario
         ----------------------------- */}
      {selectedId && (
        <div className="fixed inset-0 z-50">
          {/* overlay */}
          <div className="absolute inset-0 bg-black/40" onClick={closeDrawer} />

          {/* panel */}
          <div className="absolute right-0 top-0 h-full w-full sm:w-[520px] bg-white shadow-2xl p-6 overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold">Detalle de usuario</h3>
                <p className="text-sm text-gray-600">{selectedId}</p>
              </div>

              <button
                onClick={closeDrawer}
                className="p-2 rounded-xl border hover:bg-gray-50"
                title="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingDetail && (
              <p className="mt-6 text-gray-500">Cargando detalle…</p>
            )}

            {errorDetail && (
              <p className="mt-6 text-red-600 font-semibold">{errorDetail}</p>
            )}

            {selectedUser && (
              <div className="mt-6 space-y-6">
                {/* header */}
                <div className="rounded-2xl border p-4 bg-gray-50">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <p className="text-lg font-bold">
                        {selectedUser.name ?? "(Sin nombre)"}{" "}
                        {selectedUser.surname ?? ""}
                      </p>
                      <p className="text-sm text-gray-600">
                        {selectedUser.email}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${roleBadge(
                          selectedUser.role
                        )}`}
                      >
                        {selectedUser.role.toUpperCase()}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge(
                          selectedUser.isActive
                        )}`}
                      >
                        {selectedUser.isActive ? "ACTIVO" : "INACTIVO"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* acciones rápidas */}
                <div className="flex gap-2 flex-wrap">
                  {selectedUser.isActive ? (
                    <button
                      onClick={() => toggleActive(selectedUser, false)}
                      className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Desactivar
                    </button>
                  ) : (
                    <button
                      onClick={() => toggleActive(selectedUser, true)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Activar
                    </button>
                  )}

                  {selectedUser.role !== "admin" && (
                    <button
                      onClick={() => changeRole(selectedUser, "admin")}
                      className="px-4 py-2 rounded-xl bg-[#0C2340] text-white hover:opacity-95 flex items-center gap-2"
                    >
                      <Shield className="w-4 h-4" />
                      Hacer Admin
                    </button>
                  )}
                </div>

                {/* info general */}
                <div className="rounded-2xl border p-4">
                  <h4 className="font-bold mb-3">Información</h4>
                  <div className="text-sm text-gray-700 space-y-2">
                    <p>
                      <b>Teléfono:</b> {selectedUser.phone ?? "—"}
                    </p>
                    <p>
                      <b>Fecha nacimiento:</b> {selectedUser.birthDate ?? "—"}
                    </p>
                    <p>
                      <b>Dirección:</b> {selectedUser.fullAddress ?? "—"}
                    </p>
                    <p>
                      <b>Rating:</b> {String(selectedUser.rating ?? "—")}
                    </p>
                  </div>
                </div>

                {/* provider extras */}
                {selectedUser.role === "provider" && (
                  <div className="rounded-2xl border p-4">
                    <h4 className="font-bold mb-3">Proveedor</h4>
                    <div className="text-sm text-gray-700 space-y-2">
                      <p>
                        <b>About:</b> {selectedUser.about ?? "—"}
                      </p>
                      <p>
                        <b>Días:</b>{" "}
                        {(selectedUser.days ?? []).join(", ") || "—"}
                      </p>
                      <p>
                        <b>Horas:</b>{" "}
                        {(selectedUser.hours ?? []).join(", ") || "—"}
                      </p>
                      <p>
                        <b>Servicios:</b>{" "}
                        {(selectedUser.services ?? [])
                          .map((s) => s.name)
                          .join(", ") || "—"}
                      </p>

                      <div className="mt-3 p-3 rounded-xl bg-gray-50 border">
                        <p className="font-semibold mb-1">Suscripción</p>
                        <p>
                          <b>Plan:</b>{" "}
                          {selectedUser.suscription?.plan?.name
                            ? selectedUser.suscription.plan.name
                            : "—"}
                        </p>
                        <p>
                          <b>Pago:</b>{" "}
                          {selectedUser.suscription?.paymentStatus
                            ? "Sí"
                            : "No"}
                        </p>
                        <p>
                          <b>Activa:</b>{" "}
                          {selectedUser.suscription?.isActive ? "Sí" : "No"}
                        </p>
                        <p>
                          <b>Inicio:</b>{" "}
                          {selectedUser.suscription?.startDate ?? "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* client extras */}
                {selectedUser.role === "client" && (
                  <div className="rounded-2xl border p-4">
                    <h4 className="font-bold mb-3">Cliente</h4>
                    <div className="text-sm text-gray-700 space-y-2">
                      <p>
                        <b>Citas (cliente):</b>{" "}
                        {selectedUser.clientAppointments?.length ?? 0}
                      </p>
                      <p>
                        <b>Reviews recibidos:</b>{" "}
                        {selectedUser.reviewsReceived?.length ?? 0}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
