"use client";

import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
  Users,
  UserCog,
  UserCheck,
  DollarSign,
  Search,
  RefreshCw,
  Eye,
  X,
  MoreVertical,
  Shield,
  Crown,
  MapPin,
  Mail,
  Phone,
  Calendar,
} from "lucide-react";

/** ===== Tipos ===== */
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

type UserRow = {
  id: string;
  name: string | null;
  surname: string | null;
  email: string;
  role: UserRole;
  isActive: boolean;
  profileImgUrl?: string | null;

  // Para “coronita” si el back lo manda en la lista:
  suscription?: Subscription | null;
};

type UserDetail = UserRow & {
  phone?: string | null;
  birthDate?: string | null;

  street?: string | null;
  exteriorNumber?: string | null;
  interiorNumber?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  fullAddress?: string | null;

  rating?: number | null;

  // Client:
  clientAppointments?: AppointmentLite[];
  reviewsReceived?: any[];

  // Provider:
  about?: string | null;
  days?: string[] | null;
  hours?: string[] | null;
  services?: { id: string; name: string }[];
  appointments?: AppointmentLite[];
};

type DashboardStats = {
  totalClients: number;
  totalProviders: number;
  totalUsers: number;
  ingresos: number;
};

type AdminUsersResponse = {
  total: number;
  page: number;
  totalPages: number;
  users: UserRow[];
};

/** ===== Helpers ===== */
function buildUrl(path: string) {
  const baseUrl = process.env.VITE_BACKEND_URL; // ✅ no cambiamos nombre
  if (!baseUrl) throw new Error("VITE_BACKEND_URL no está definida.");
  return new URL(path, baseUrl).toString();
}

function getTokenOrThrow() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No hay token. Inicia sesión como admin.");
  return token;
}

function safeName(u: { name?: string | null; surname?: string | null }) {
  const n = (u.name ?? "").trim();
  const s = (u.surname ?? "").trim();
  return `${n || "(Sin nombre)"}${s ? ` ${s}` : ""}`;
}

function initials(u: { name?: string | null; surname?: string | null }) {
  const n = (u.name ?? "").trim();
  const s = (u.surname ?? "").trim();
  const a = n ? n[0].toUpperCase() : "U";
  const b = s ? s[0].toUpperCase() : "";
  return (a + b).slice(0, 2);
}

function rolePill(role: UserRole) {
  if (role === "admin") return "bg-[#0C2340] text-white border-white/20";
  if (role === "provider") return "bg-blue-600 text-white border-white/20";
  return "bg-emerald-600 text-white border-white/20";
}

function statusPill(active: boolean) {
  return active
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : "bg-red-50 text-red-700 border-red-200";
}

function isPremiumProvider(u: UserRow | UserDetail) {
  // Premium si: role provider + suscription activa + paymentStatus true (y plan con price > 0 opcional)
  if (u.role !== "provider") return false;
  const s = u.suscription;
  if (!s) return false;
  return Boolean(s.isActive && s.paymentStatus);
}

function formatDate(d?: string | null) {
  if (!d) return "—";
  return d;
}

/** Mini “bar chart” simple sin deps */
function RoleBars({
  clients,
  providers,
  admins,
}: {
  clients: number;
  providers: number;
  admins: number;
}) {
  const max = Math.max(1, clients, providers, admins);
  const rows = [
    { label: "Clientes", value: clients, bar: "bg-emerald-500" },
    { label: "Proveedores", value: providers, bar: "bg-blue-500" },
    { label: "Admins", value: admins, bar: "bg-[#0C2340]" },
  ];
  return (
    <div className="rounded-3xl border border-white/30 bg-white/70 backdrop-blur-xl shadow-sm p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-gray-600">Distribución</p>
          <p className="text-lg font-bold text-[#0C2340]">Usuarios por rol</p>
        </div>
        <div className="px-3 py-2 rounded-2xl bg-white/60 border border-white/40 text-xs text-gray-700">
          Live
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {rows.map((r) => {
          const w = Math.round((r.value / max) * 100);
          return (
            <div key={r.label} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700 font-medium">{r.label}</span>
                <span className="text-gray-600">{r.value}</span>
              </div>
              <div className="h-3 rounded-full bg-gray-100/70 overflow-hidden border border-white/40">
                <div className={`h-full ${r.bar}`} style={{ width: `${w}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-3xl border border-white/30 bg-white/70 backdrop-blur-xl shadow-sm p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-white/70 border border-white/40 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-600">{label}</p>
        <p className="text-2xl font-extrabold text-[#0C2340]">{value}</p>
      </div>
    </div>
  );
}

/** ===== Componente ===== */
export default function DashboardAdmin() {
  const [tab, setTab] = useState<"overview" | "users">("overview");

  // Stats
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [errorStats, setErrorStats] = useState<string | null>(null);

  // Users list
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [errorUsers, setErrorUsers] = useState<string | null>(null);

  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("active");
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Actions menu
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Drawer detail
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<
    "general" | "activity" | "subscription"
  >("general");

  const totals = useMemo(() => {
    const c = stats?.totalClients ?? 0;
    const p = stats?.totalProviders ?? 0;
    const t = stats?.totalUsers ?? c + p;
    const a = Math.max(0, t - (c + p));
    return {
      clients: c,
      providers: p,
      admins: a,
      totalUsers: t,
      ingresos: stats?.ingresos ?? 0,
    };
  }, [stats]);

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
      if (res.status === 403) throw new Error("403: Acceso denegado (ADMIN).");
      if (!res.ok) throw new Error(`Error stats (${res.status}).`);
      const data = (await res.json()) as DashboardStats;
      setStats(data);
    } catch (err: any) {
      setErrorStats(err?.message ?? "Error desconocido en stats.");
    }
  };

  const fetchUsers = async () => {
    try {
      setErrorUsers(null);
      setLoadingUsers(true);

      const token = getTokenOrThrow();
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));

      if (statusFilter !== "all") params.set("status", statusFilter);
      if (roleFilter !== "all") params.set("role", roleFilter);

      const q = search.trim();
      if (q.length >= 2) params.set("search", q);

      const url = buildUrl(`/admin/users?${params.toString()}`);
      const res = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (res.status === 401)
        throw new Error("401: Token inválido o expirado.");
      if (res.status === 403) throw new Error("403: Acceso denegado (ADMIN).");
      if (!res.ok) throw new Error(`Error users (${res.status}).`);

      const data = (await res.json()) as AdminUsersResponse;
      setUsers(data.users ?? []);
      setTotalPages(data.totalPages ?? 1);
    } catch (err: any) {
      setErrorUsers(err?.message ?? "Error desconocido obteniendo usuarios.");
      setUsers([]);
      setTotalPages(1);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, roleFilter, statusFilter]);

  const applySearch = () => {
    setPage(1);
    fetchUsers();
  };

  const fetchUserDetail = async (id: string) => {
    try {
      setSelectedId(id);
      setSelectedUser(null);
      setErrorDetail(null);
      setLoadingDetail(true);
      setDetailTab("general");

      const token = getTokenOrThrow();
      const url = buildUrl(`/admin/users/${id}`);
      const res = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (res.status === 401)
        throw new Error("401: Token inválido o expirado.");
      if (res.status === 403) throw new Error("403: Acceso denegado (ADMIN).");
      if (!res.ok) throw new Error(`Error detalle (${res.status}).`);

      const data = (await res.json()) as UserDetail;
      setSelectedUser(data);
    } catch (err: any) {
      setErrorDetail(err?.message ?? "Error desconocido obteniendo detalle.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeDrawer = () => {
    setSelectedId(null);
    setSelectedUser(null);
    setErrorDetail(null);
    setOpenMenuId(null);
  };

  const toggleActive = async (u: UserRow, nextActive: boolean) => {
    const actionLabel = nextActive ? "activar" : "desactivar";
    const confirm = await Swal.fire({
      title: `¿Seguro que deseas ${actionLabel} este usuario?`,
      html: `<div style="text-align:left">
              <b>${safeName(u)}</b><br/>
              <span style="color:#555">${u.email}</span><br/>
              <small>Rol: <b>${u.role}</b></small>
            </div>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: `Sí, ${actionLabel}`,
      cancelButtonText: "Cancelar",
    });
    if (!confirm.isConfirmed) return;

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
      if (!res.ok) throw new Error(`Error al ${actionLabel} (${res.status}).`);

      await Swal.fire({
        title: "Listo ✅",
        text: nextActive ? "Usuario activado." : "Usuario desactivado.",
        icon: "success",
      });

      fetchUsers();
      if (selectedId === u.id) fetchUserDetail(u.id);
    } catch (err: any) {
      Swal.fire({
        title: "Ups…",
        text: err?.message ?? "No se pudo completar la acción.",
        icon: "error",
      });
    }
  };

  const changeRole = async (u: UserRow, newRole: UserRole) => {
    const confirm = await Swal.fire({
      title: "Confirmar cambio de rol",
      html: `<div style="text-align:left">
              <b>${safeName(u)}</b><br/>
              <span style="color:#555">${u.email}</span><br/><br/>
              Rol actual: <b>${u.role}</b><br/>
              Nuevo rol: <b>${newRole}</b>
            </div>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, cambiar rol",
      cancelButtonText: "Cancelar",
    });
    if (!confirm.isConfirmed) return;

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
      if (!res.ok) throw new Error(`Error cambiando rol (${res.status}).`);

      await Swal.fire({
        title: "Rol actualizado ✅",
        text: `Ahora es ${newRole}.`,
        icon: "success",
      });

      fetchUsers();
      if (selectedId === u.id) fetchUserDetail(u.id);
    } catch (err: any) {
      Swal.fire({
        title: "Ups…",
        text: err?.message ?? "No se pudo cambiar el rol.",
        icon: "error",
      });
    }
  };

  return (
    <div className="min-h-screen px-4 sm:px-6 py-6 bg-gradient-to-br from-blue-600 via-blue-500 to-teal-400">
      {/* Glass container */}
      <div className="mx-auto max-w-7xl rounded-[32px] bg-white/75 backdrop-blur-2xl border border-white/30 shadow-2xl overflow-hidden">
        {/* Top header */}
        <div className="px-5 sm:px-8 py-6 border-b border-white/40 bg-white/55">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0C2340]">
                Admin Dashboard
              </h1>
              <p className="text-gray-700 mt-1">
                Gestión moderna de usuarios, roles y suscripciones.
              </p>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={async () => {
                  await Swal.fire({
                    title: "Actualizando…",
                    text: "Recargando datos.",
                    icon: "info",
                    timer: 700,
                    showConfirmButton: false,
                  });
                  fetchDashboard();
                  fetchUsers();
                }}
                className="px-4 py-2 rounded-2xl bg-white/70 border border-white/40 hover:bg-white transition flex items-center gap-2 text-[#0C2340] font-semibold shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Refrescar
              </button>
            </div>
          </div>

          {(errorStats || errorUsers) && (
            <div className="mt-4 space-y-1">
              {errorStats && (
                <p className="text-red-600 font-semibold">{errorStats}</p>
              )}
              {errorUsers && (
                <p className="text-red-600 font-semibold">{errorUsers}</p>
              )}
            </div>
          )}

          {/* Tabs */}
          <div className="mt-5 flex gap-2 flex-wrap">
            <button
              onClick={() => setTab("overview")}
              className={`px-4 py-2 rounded-2xl border shadow-sm font-semibold transition ${
                tab === "overview"
                  ? "bg-[#0C2340] text-white border-[#0C2340]"
                  : "bg-white/70 border-white/40 hover:bg-white"
              }`}
            >
              Resumen
            </button>
            <button
              onClick={() => setTab("users")}
              className={`px-4 py-2 rounded-2xl border shadow-sm font-semibold transition ${
                tab === "users"
                  ? "bg-[#0C2340] text-white border-[#0C2340]"
                  : "bg-white/70 border-white/40 hover:bg-white"
              }`}
            >
              Usuarios
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 sm:px-8 py-6">
          {/* OVERVIEW */}
          {tab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  icon={<Users className="w-6 h-6 text-[#0C2340]" />}
                  label="Usuarios totales"
                  value={totals.totalUsers}
                />
                <StatCard
                  icon={<UserCheck className="w-6 h-6 text-emerald-600" />}
                  label="Clientes"
                  value={totals.clients}
                />
                <StatCard
                  icon={<UserCog className="w-6 h-6 text-blue-600" />}
                  label="Proveedores"
                  value={totals.providers}
                />
                <StatCard
                  icon={<DollarSign className="w-6 h-6 text-yellow-600" />}
                  label="Ingresos"
                  value={`$${totals.ingresos}`}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <RoleBars
                    clients={totals.clients}
                    providers={totals.providers}
                    admins={totals.admins}
                  />
                </div>

                <div className="rounded-3xl border border-white/30 bg-white/70 backdrop-blur-xl shadow-sm p-5">
                  <p className="text-sm text-gray-600">Tip</p>
                  <p className="text-lg font-bold text-[#0C2340] mt-1">
                    Vista limpia, cero saturación
                  </p>
                  <p className="text-sm text-gray-700 mt-3">
                    Todo lo pesado (tabla + filtros + acciones) está en{" "}
                    <b>Usuarios</b>. Aquí solo métricas y visual.
                  </p>

                  <button
                    onClick={() => setTab("users")}
                    className="mt-5 w-full px-4 py-3 rounded-2xl bg-[#0C2340] text-white font-semibold hover:opacity-95 transition"
                  >
                    Ir a Usuarios
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* USERS */}
          {tab === "users" && (
            <div className="space-y-5">
              {/* Filters */}
              <div className="rounded-3xl border border-white/30 bg-white/70 backdrop-blur-xl shadow-sm p-4">
                <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
                  <div className="flex gap-2 flex-wrap">
                    {(["all", "client", "provider", "admin"] as const).map(
                      (r) => (
                        <button
                          key={r}
                          onClick={() => {
                            setRoleFilter(r);
                            setPage(1);
                          }}
                          className={`px-4 py-2 rounded-2xl border shadow-sm font-semibold transition ${
                            roleFilter === r
                              ? "bg-[#0C2340] text-white border-[#0C2340]"
                              : "bg-white/70 border-white/40 hover:bg-white"
                          }`}
                        >
                          {r === "all"
                            ? "Todos"
                            : r === "client"
                            ? "Clientes"
                            : r === "provider"
                            ? "Proveedores"
                            : "Admins"}
                        </button>
                      )
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-gray-700 font-semibold">
                      Estado:
                    </span>
                    <select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value as any);
                        setPage(1);
                      }}
                      className="px-3 py-2 rounded-2xl border bg-white/80"
                    >
                      <option value="active">Activos</option>
                      <option value="inactive">Inactivos</option>
                      <option value="all">Todos</option>
                    </select>
                  </div>
                </div>

                <div className="mt-3 flex flex-col sm:flex-row gap-2">
                  <div className="flex items-center gap-2 w-full bg-white/80 border border-white/40 rounded-2xl px-3 py-2">
                    <Search className="w-4 h-4 text-gray-500" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && applySearch()}
                      placeholder="Buscar por nombre o email (mín. 2 letras)…"
                      className="bg-transparent outline-none w-full text-sm text-gray-800"
                    />
                  </div>
                  <button
                    onClick={applySearch}
                    className="px-4 py-2 rounded-2xl bg-[#0C2340] text-white font-semibold hover:opacity-95 transition"
                  >
                    Buscar
                  </button>
                </div>
              </div>

              {/* List container */}
              <div className="rounded-3xl border border-white/30 bg-white/70 backdrop-blur-xl shadow-sm overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-white/40 flex items-center justify-between">
                  <div>
                    <p className="text-lg font-extrabold text-[#0C2340]">
                      Usuarios
                    </p>
                    <p className="text-sm text-gray-700">
                      Página <b>{page}</b> de <b>{totalPages}</b>
                    </p>
                  </div>
                </div>

                {/* Desktop table */}
                <div className="hidden md:block">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-600 border-b border-white/40">
                        <th className="p-4 font-semibold">Usuario</th>
                        <th className="p-4 font-semibold">Rol</th>
                        <th className="p-4 font-semibold">Estado</th>
                        <th className="p-4 font-semibold text-right">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingUsers ? (
                        <tr>
                          <td colSpan={4} className="p-6 text-gray-700">
                            Cargando…
                          </td>
                        </tr>
                      ) : (
                        users.map((u) => (
                          <tr
                            key={u.id}
                            className="border-b border-white/30 hover:bg-white/60 transition"
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-3 min-w-[360px]">
                                {/* Avatar */}
                                {u.profileImgUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={u.profileImgUrl}
                                    alt={safeName(u)}
                                    className="w-11 h-11 rounded-2xl object-cover border border-white/50"
                                  />
                                ) : (
                                  <div className="w-11 h-11 rounded-2xl bg-white/70 border border-white/50 flex items-center justify-center font-extrabold text-[#0C2340]">
                                    {initials(u)}
                                  </div>
                                )}

                                <div className="leading-tight">
                                  <div className="flex items-center gap-2">
                                    <p className="font-extrabold text-[#0C2340]">
                                      {safeName(u)}
                                    </p>

                                    {/* Coronita premium */}
                                    {isPremiumProvider(u) && (
                                      <span className="inline-flex items-center gap-1 text-xs font-bold text-yellow-700 bg-yellow-50 border border-yellow-200 px-2 py-1 rounded-full">
                                        <Crown className="w-3 h-3" />
                                        PREMIUM
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-700 flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-500" />
                                    {u.email}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="p-4">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold border ${rolePill(
                                  u.role
                                )}`}
                              >
                                {u.role.toUpperCase()}
                              </span>
                            </td>

                            <td className="p-4">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold border ${statusPill(
                                  u.isActive
                                )}`}
                              >
                                {u.isActive ? "ACTIVO" : "INACTIVO"}
                              </span>
                            </td>

                            <td className="p-4">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => fetchUserDetail(u.id)}
                                  className="px-3 py-2 rounded-2xl bg-white/70 border border-white/50 hover:bg-white transition flex items-center gap-2 font-semibold text-[#0C2340]"
                                >
                                  <Eye className="w-4 h-4" />
                                  Ver
                                </button>

                                <div className="relative">
                                  <button
                                    onClick={() =>
                                      setOpenMenuId((prev) =>
                                        prev === u.id ? null : u.id
                                      )
                                    }
                                    className="p-2 rounded-2xl bg-white/70 border border-white/50 hover:bg-white transition"
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </button>

                                  {openMenuId === u.id && (
                                    <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl border shadow-xl overflow-hidden z-20">
                                      <button
                                        onClick={() => {
                                          setOpenMenuId(null);
                                          toggleActive(u, !u.isActive);
                                        }}
                                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
                                      >
                                        <span className="w-7 h-7 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center">
                                          <UserCheck className="w-4 h-4 text-red-600" />
                                        </span>
                                        {u.isActive ? "Desactivar" : "Activar"}
                                      </button>

                                      {u.role !== "admin" && (
                                        <button
                                          onClick={() => {
                                            setOpenMenuId(null);
                                            changeRole(u, "admin");
                                          }}
                                          className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
                                        >
                                          <span className="w-7 h-7 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                                            <Shield className="w-4 h-4 text-[#0C2340]" />
                                          </span>
                                          Hacer Admin
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards (responsive pro) */}
                <div className="md:hidden p-4 space-y-3">
                  {loadingUsers ? (
                    <div className="text-gray-700">Cargando…</div>
                  ) : (
                    users.map((u) => (
                      <div
                        key={u.id}
                        className="rounded-3xl bg-white/70 border border-white/40 shadow-sm p-4"
                      >
                        <div className="flex items-start gap-3">
                          {u.profileImgUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={u.profileImgUrl}
                              alt={safeName(u)}
                              className="w-12 h-12 rounded-2xl object-cover border border-white/60"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-2xl bg-white/70 border border-white/60 flex items-center justify-center font-extrabold text-[#0C2340]">
                              {initials(u)}
                            </div>
                          )}

                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-extrabold text-[#0C2340]">
                                {safeName(u)}
                              </p>
                              {isPremiumProvider(u) && (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-yellow-700 bg-yellow-50 border border-yellow-200 px-2 py-1 rounded-full">
                                  <Crown className="w-3 h-3" />
                                  PREMIUM
                                </span>
                              )}
                            </div>

                            <p className="text-sm text-gray-700 mt-1 flex items-center gap-2">
                              <Mail className="w-4 h-4 text-gray-500" />
                              {u.email}
                            </p>

                            <div className="mt-3 flex items-center gap-2 flex-wrap">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold border ${rolePill(
                                  u.role
                                )}`}
                              >
                                {u.role.toUpperCase()}
                              </span>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold border ${statusPill(
                                  u.isActive
                                )}`}
                              >
                                {u.isActive ? "ACTIVO" : "INACTIVO"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={() => fetchUserDetail(u.id)}
                            className="flex-1 px-3 py-2 rounded-2xl bg-[#0C2340] text-white font-semibold hover:opacity-95 transition flex items-center justify-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            Ver
                          </button>

                          <button
                            onClick={() => toggleActive(u, !u.isActive)}
                            className={`flex-1 px-3 py-2 rounded-2xl font-semibold transition flex items-center justify-center gap-2 ${
                              u.isActive
                                ? "bg-red-500 text-white hover:opacity-95"
                                : "bg-emerald-600 text-white hover:opacity-95"
                            }`}
                          >
                            {u.isActive ? "Desactivar" : "Activar"}
                          </button>
                        </div>

                        {u.role !== "admin" && (
                          <button
                            onClick={() => changeRole(u, "admin")}
                            className="mt-2 w-full px-3 py-2 rounded-2xl bg-white/80 border border-white/50 text-[#0C2340] font-semibold hover:bg-white transition flex items-center justify-center gap-2"
                          >
                            <Shield className="w-4 h-4" />
                            Hacer Admin
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Empty */}
                {!loadingUsers && users.length === 0 && (
                  <div className="p-6 text-center text-gray-700">
                    No hay usuarios para este filtro.
                  </div>
                )}

                {/* Pagination */}
                <div className="px-4 sm:px-6 py-4 flex items-center justify-between border-t border-white/40">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className={`px-4 py-2 rounded-2xl border font-semibold transition ${
                      page <= 1
                        ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                        : "bg-white/70 border-white/50 hover:bg-white text-[#0C2340]"
                    }`}
                  >
                    Anterior
                  </button>

                  <div className="text-sm text-gray-700">
                    Página <b>{page}</b> / <b>{totalPages}</b>
                  </div>

                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className={`px-4 py-2 rounded-2xl border font-semibold transition ${
                      page >= totalPages
                        ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                        : "bg-white/70 border-white/50 hover:bg-white text-[#0C2340]"
                    }`}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Drawer */}
        {selectedId && (
          <div className="fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={closeDrawer}
            />

            <div className="absolute right-0 top-0 h-full w-full sm:w-[560px] bg-white/85 backdrop-blur-2xl shadow-2xl border-l border-white/40 overflow-y-auto">
              <div className="p-6 border-b border-white/40 bg-white/70">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-gray-600">Perfil</p>
                    <h3 className="text-xl font-extrabold text-[#0C2340]">
                      Detalle de usuario
                    </h3>
                  </div>

                  <button
                    onClick={closeDrawer}
                    className="p-2 rounded-2xl bg-white/70 border border-white/50 hover:bg-white transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* tabs */}
                <div className="mt-4 flex gap-2 flex-wrap">
                  {[
                    { key: "general", label: "General" },
                    { key: "activity", label: "Actividad" },
                    { key: "subscription", label: "Suscripción" },
                  ].map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setDetailTab(t.key as any)}
                      className={`px-4 py-2 rounded-2xl border font-semibold transition ${
                        detailTab === (t.key as any)
                          ? "bg-[#0C2340] text-white border-[#0C2340]"
                          : "bg-white/70 border-white/50 hover:bg-white text-[#0C2340]"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6">
                {loadingDetail && <p className="text-gray-700">Cargando…</p>}
                {errorDetail && (
                  <p className="text-red-600 font-semibold">{errorDetail}</p>
                )}

                {selectedUser && (
                  <div className="space-y-5">
                    {/* Header card */}
                    <div className="rounded-3xl bg-white/70 border border-white/40 shadow-sm p-4">
                      <div className="flex items-center gap-4">
                        {selectedUser.profileImgUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={selectedUser.profileImgUrl}
                            alt={safeName(selectedUser)}
                            className="w-16 h-16 rounded-3xl object-cover border border-white/60"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-3xl bg-white/70 border border-white/60 flex items-center justify-center font-extrabold text-[#0C2340] text-xl">
                            {initials(selectedUser)}
                          </div>
                        )}

                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-lg font-extrabold text-[#0C2340]">
                              {safeName(selectedUser)}
                            </p>

                            {isPremiumProvider(selectedUser) && (
                              <span className="inline-flex items-center gap-1 text-xs font-extrabold text-yellow-700 bg-yellow-50 border border-yellow-200 px-2 py-1 rounded-full">
                                <Crown className="w-3 h-3" />
                                PREMIUM
                              </span>
                            )}
                          </div>

                          <p className="text-sm text-gray-700 mt-1 flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-500" />
                            {selectedUser.email}
                          </p>

                          <div className="mt-3 flex items-center gap-2 flex-wrap">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold border ${rolePill(
                                selectedUser.role
                              )}`}
                            >
                              {selectedUser.role.toUpperCase()}
                            </span>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold border ${statusPill(
                                selectedUser.isActive
                              )}`}
                            >
                              {selectedUser.isActive ? "ACTIVO" : "INACTIVO"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* quick actions */}
                      <div className="mt-4 flex gap-2 flex-wrap">
                        <button
                          onClick={() =>
                            toggleActive(selectedUser, !selectedUser.isActive)
                          }
                          className={`px-4 py-2 rounded-2xl font-semibold transition ${
                            selectedUser.isActive
                              ? "bg-red-500 text-white hover:opacity-95"
                              : "bg-emerald-600 text-white hover:opacity-95"
                          }`}
                        >
                          {selectedUser.isActive ? "Desactivar" : "Activar"}
                        </button>

                        {selectedUser.role !== "admin" && (
                          <button
                            onClick={() => changeRole(selectedUser, "admin")}
                            className="px-4 py-2 rounded-2xl bg-[#0C2340] text-white font-semibold hover:opacity-95 transition"
                          >
                            Hacer Admin
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Tabs content */}
                    {detailTab === "general" && (
                      <div className="rounded-3xl bg-white/70 border border-white/40 shadow-sm p-4">
                        <p className="font-extrabold text-[#0C2340] mb-3">
                          Información
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-800">
                          <div className="p-3 rounded-2xl bg-white/70 border border-white/40">
                            <p className="text-gray-600 flex items-center gap-2">
                              <Phone className="w-4 h-4" /> Teléfono
                            </p>
                            <p className="font-semibold mt-1">
                              {selectedUser.phone ?? "—"}
                            </p>
                          </div>

                          <div className="p-3 rounded-2xl bg-white/70 border border-white/40">
                            <p className="text-gray-600 flex items-center gap-2">
                              <Calendar className="w-4 h-4" /> Nacimiento
                            </p>
                            <p className="font-semibold mt-1">
                              {formatDate(selectedUser.birthDate ?? null)}
                            </p>
                          </div>

                          <div className="p-3 rounded-2xl bg-white/70 border border-white/40 sm:col-span-2">
                            <p className="text-gray-600 flex items-center gap-2">
                              <MapPin className="w-4 h-4" /> Dirección
                            </p>
                            <p className="font-semibold mt-1">
                              {selectedUser.fullAddress ??
                                ([
                                  selectedUser.street,
                                  selectedUser.exteriorNumber,
                                  selectedUser.neighborhood,
                                  selectedUser.city,
                                  selectedUser.state,
                                  selectedUser.postalCode,
                                ]
                                  .filter(Boolean)
                                  .join(", ") ||
                                  "—")}
                            </p>
                          </div>
                        </div>

                        {selectedUser.role === "provider" && (
                          <div className="mt-4 p-4 rounded-3xl bg-white/70 border border-white/40">
                            <p className="font-extrabold text-[#0C2340] mb-2">
                              Datos de proveedor
                            </p>
                            <div className="text-sm text-gray-800 space-y-2">
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
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {detailTab === "activity" && (
                      <div className="rounded-3xl bg-white/70 border border-white/40 shadow-sm p-4">
                        <p className="font-extrabold text-[#0C2340] mb-3">
                          Actividad
                        </p>

                        {selectedUser.role === "client" ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-800">
                            <div className="p-3 rounded-2xl bg-white/70 border border-white/40">
                              <p className="text-gray-600">
                                Citas como cliente
                              </p>
                              <p className="text-2xl font-extrabold text-[#0C2340] mt-1">
                                {selectedUser.clientAppointments?.length ?? 0}
                              </p>
                            </div>
                            <div className="p-3 rounded-2xl bg-white/70 border border-white/40">
                              <p className="text-gray-600">Reviews recibidos</p>
                              <p className="text-2xl font-extrabold text-[#0C2340] mt-1">
                                {selectedUser.reviewsReceived?.length ?? 0}
                              </p>
                            </div>
                          </div>
                        ) : selectedUser.role === "provider" ? (
                          <div className="p-3 rounded-2xl bg-white/70 border border-white/40 text-sm text-gray-800">
                            <p className="text-gray-600">
                              Citas como proveedor
                            </p>
                            <p className="text-2xl font-extrabold text-[#0C2340] mt-1">
                              {selectedUser.appointments?.length ?? 0}
                            </p>
                          </div>
                        ) : (
                          <p className="text-gray-700">—</p>
                        )}
                      </div>
                    )}

                    {detailTab === "subscription" && (
                      <div className="rounded-3xl bg-white/70 border border-white/40 shadow-sm p-4">
                        <p className="font-extrabold text-[#0C2340] mb-3">
                          Suscripción
                        </p>

                        {selectedUser.role !== "provider" ? (
                          <p className="text-gray-700 text-sm">
                            Este apartado aplica principalmente para
                            proveedores.
                          </p>
                        ) : (
                          <div className="space-y-3 text-sm text-gray-800">
                            <div className="p-3 rounded-2xl bg-white/70 border border-white/40">
                              <p className="text-gray-600">Plan</p>
                              <p className="font-semibold mt-1">
                                {selectedUser.suscription?.plan?.name ?? "—"}
                              </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="p-3 rounded-2xl bg-white/70 border border-white/40">
                                <p className="text-gray-600">Pago</p>
                                <p className="font-semibold mt-1">
                                  {selectedUser.suscription?.paymentStatus
                                    ? "Sí"
                                    : "No"}
                                </p>
                              </div>
                              <div className="p-3 rounded-2xl bg-white/70 border border-white/40">
                                <p className="text-gray-600">Activa</p>
                                <p className="font-semibold mt-1">
                                  {selectedUser.suscription?.isActive
                                    ? "Sí"
                                    : "No"}
                                </p>
                              </div>
                            </div>

                            <div className="p-3 rounded-2xl bg-white/70 border border-white/40">
                              <p className="text-gray-600">Inicio</p>
                              <p className="font-semibold mt-1">
                                {formatDate(
                                  selectedUser.suscription?.startDate ?? null
                                )}
                              </p>
                            </div>

                            {isPremiumProvider(selectedUser) && (
                              <div className="p-4 rounded-3xl bg-yellow-50 border border-yellow-200 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-white border border-yellow-200 flex items-center justify-center">
                                  <Crown className="w-5 h-5 text-yellow-700" />
                                </div>
                                <div>
                                  <p className="font-extrabold text-yellow-800">
                                    Proveedor Premium
                                  </p>
                                  <p className="text-sm text-yellow-700">
                                    Acceso a beneficios y mayor visibilidad.
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Overlay para cerrar menú */}
        {openMenuId && (
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpenMenuId(null)}
          />
        )}
      </div>
    </div>
  );
}
