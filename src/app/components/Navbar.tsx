// src/app/components/Navbar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { io, Socket } from "socket.io-client";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";

type UnreadSummaryItem = {
  appointmentId: string;
  otherUser: { id: string; name: string; surname?: string };
  count: number;
};

type GroupedUnread = {
  otherUser: { id: string; name: string; surname?: string };
  total: number;
  appointmentIds: string[];
};

type AppointmentLite = {
  id: string;
  date: string;
  startHour: string;
  endHour: string;
  status: string;
};

export default function Navbar() {
  const { user, token, logout } = useAuth();
  const role = user?.role;
  const router = useRouter();

  const [isMounted, setIsMounted] = useState(false);

  // Drawer mobile
  const [mobileOpen, setMobileOpen] = useState(false);

  // 🔔 Notificaciones
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [unreadSummary, setUnreadSummary] = useState<UnreadSummaryItem[]>([]);
  const [selectOpenUserId, setSelectOpenUserId] = useState<string | null>(null);

  const [apptCache, setApptCache] = useState<Record<string, AppointmentLite>>(
    {}
  );
  const [apptLoading, setApptLoading] = useState<Record<string, boolean>>({});

  const notifRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.VITE_BACKEND_URL ||
    "http://localhost:3000";

  useEffect(() => setIsMounted(true), []);

  const effectiveUser = isMounted ? user : null;
  const effectiveRole = isMounted ? role : undefined;

  // Cierra todo (menu + dropdowns)
  const closeAll = () => {
    setMobileOpen(false);
    setNotifOpen(false);
    setSelectOpenUserId(null);
  };

  // 🔐 Logout (con confirmación, limpieza, disconnect socket, redirect)
  const handleLogout = useCallback(async () => {
    const result = await Swal.fire({
      title: "¿Cerrar sesión?",
      text: "Tu sesión se cerrará",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#14B8A6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, cerrar sesión",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    logout();
    closeAll();

    socketRef.current?.disconnect();
    socketRef.current = null;

    await Swal.fire({
      icon: "success",
      title: "Sesión cerrada",
      text: "Has salido correctamente",
      timer: 1200,
      showConfirmButton: false,
    });

    router.push("/");
  }, [logout, router]);

  const groupedUnread = useMemo<GroupedUnread[]>(() => {
    const map = new Map<string, GroupedUnread>();

    for (const item of unreadSummary) {
      const k = item.otherUser.id;
      const prev = map.get(k);
      if (!prev) {
        map.set(k, {
          otherUser: item.otherUser,
          total: Number(item.count ?? 0),
          appointmentIds: [item.appointmentId],
        });
      } else {
        prev.total += Number(item.count ?? 0);
        if (!prev.appointmentIds.includes(item.appointmentId))
          prev.appointmentIds.push(item.appointmentId);
      }
    }

    return Array.from(map.values())
      .filter((x) => x.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [unreadSummary]);

  const totalUnread = useMemo(
    () => groupedUnread.reduce((sum, g) => sum + (g.total ?? 0), 0),
    [groupedUnread]
  );

  const fetchUnreadSummary = useCallback(async () => {
    if (!backendUrl || !token || !effectiveUser) return;

    try {
      setNotifLoading(true);
      const res = await fetch(`${backendUrl}/chat/unread-summary`, {
        headers: {
          Authorization: `Bearer ${token}`,
          accept: "application/json",
        },
        cache: "no-store",
      });

      if (!res.ok) {
        setUnreadSummary([]);
        return;
      }

      const data: UnreadSummaryItem[] = await res.json();
      setUnreadSummary(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn("unread-summary error", e);
      setUnreadSummary([]);
    } finally {
      setNotifLoading(false);
    }
  }, [backendUrl, token, effectiveUser]);

  // Socket.io realtime (del navbar anterior)
  useEffect(() => {
    if (!backendUrl || !token || !effectiveUser) return;

    socketRef.current?.disconnect();
    socketRef.current = null;

    const s = io(backendUrl, {
      transports: ["websocket", "polling"],
      auth: { token },
      reconnection: true,
      reconnectionDelay: 500,
      reconnectionDelayMax: 2000,
    });

    socketRef.current = s;

    s.on("connect", () => {
      fetchUnreadSummary();
    });

    s.on("unreadSummaryUpdated", (payload: any) => {
      if (!effectiveUser?.id) return;
      if (
        payload?.userId &&
        String(payload.userId) !== String(effectiveUser.id)
      )
        return;

      const summary = Array.isArray(payload?.summary) ? payload.summary : [];
      setUnreadSummary(summary);
    });

    return () => {
      s.off();
      s.disconnect();
      socketRef.current = null;
    };
  }, [backendUrl, token, effectiveUser, fetchUnreadSummary]);

  // Cargar unread al iniciar sesión + focus
  useEffect(() => {
    if (!effectiveUser || !token) return;
    fetchUnreadSummary();

    const onFocus = () => fetchUnreadSummary();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [effectiveUser, token, fetchUnreadSummary]);

  // Cerrar dropdown notifs al click afuera
  useEffect(() => {
    if (!notifOpen) return;

    const onDown = (e: MouseEvent) => {
      const el = notifRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) {
        setNotifOpen(false);
        setSelectOpenUserId(null);
      }
    };

    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [notifOpen]);

  // Evitar scroll cuando drawer abierto
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const getStatusLabel = (status: string) => {
    const s = String(status ?? "").toLowerCase();
    if (s.includes("confirmed")) return "Confirmada";
    if (s.includes("pending")) return "Pendiente";
    if (s.includes("completed")) return "Completada";
    if (s.includes("cancel")) return "Cancelada";
    if (s.includes("reject")) return "Rechazada";
    return status;
  };

  const getStatusPillClass = (status: string) => {
    const s = String(status ?? "").toLowerCase();
    if (s.includes("confirmed")) return "bg-blue-50 text-blue-700";
    if (s.includes("pending")) return "bg-yellow-50 text-yellow-800";
    if (s.includes("completed")) return "bg-green-50 text-green-700";
    if (s.includes("cancel")) return "bg-red-50 text-red-700";
    if (s.includes("reject")) return "bg-gray-200 text-gray-700";
    return "bg-gray-100 text-gray-700";
  };

  const formatAppointmentLabel = (a?: AppointmentLite) => {
    try {
      if (!a?.date) return "";
      const startIso = `${a.date}T${a.startHour ?? "00:00"}`;
      const endIso = `${a.date}T${a.endHour ?? a.startHour ?? "00:00"}`;
      const start = new Date(startIso);
      const end = new Date(endIso);

      const dateStr = start.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      const startTime = start.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      const endTime = end.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      return `${dateStr} · ${startTime} - ${endTime}`;
    } catch {
      return `${a?.date ?? ""} · ${a?.startHour ?? ""} - ${a?.endHour ?? ""}`;
    }
  };

  const fetchAppointmentLite = useCallback(
    async (appointmentId: string) => {
      if (!backendUrl || !token) return;
      if (apptCache[appointmentId]) return;
      if (apptLoading[appointmentId]) return;

      setApptLoading((prev) => ({ ...prev, [appointmentId]: true }));

      try {
        const res = await fetch(`${backendUrl}/appointments/${appointmentId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            accept: "application/json",
          },
          cache: "no-store",
        });

        if (!res.ok) return;

        const data = await res.json();
        const lite: AppointmentLite = {
          id: data?.id ?? appointmentId,
          date: data?.date ?? "",
          startHour: data?.startHour ?? "",
          endHour: data?.endHour ?? "",
          status: data?.status ?? "",
        };

        setApptCache((prev) => ({ ...prev, [appointmentId]: lite }));
      } catch (e) {
        console.warn("fetch appointment lite error", e);
      } finally {
        setApptLoading((prev) => ({ ...prev, [appointmentId]: false }));
      }
    },
    [backendUrl, token, apptCache, apptLoading]
  );

  const goToChat = (appointmentId: string) => {
    closeAll();
    window.location.href = `/client/chat/${appointmentId}`;
  };

  const markAllReadForAppointment = async (appointmentId: string) => {
    if (!backendUrl || !token) return;
    await fetch(`${backendUrl}/chat/appointments/${appointmentId}/read`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  };

  const markAllReadForPerson = async (appointmentIds: string[]) => {
    if (!appointmentIds.length) return;

    try {
      setNotifLoading(true);
      await Promise.all(
        appointmentIds.map((id) => markAllReadForAppointment(id))
      );
      await fetchUnreadSummary();
    } finally {
      setNotifLoading(false);
    }
  };

  const markAllReadEverywhere = async () => {
    const all = groupedUnread.flatMap((g) => g.appointmentIds);
    const unique = Array.from(new Set(all));
    await markAllReadForPerson(unique);
  };

  // -------- Menús por rol (para reusar en desktop + mobile) --------
  const GuestLinks = (
    <>
      <Link
        href="/client/home"
        onClick={closeAll}
        className="text-gray-700 font-medium hover:text-teal-500 transition"
      >
        Inicio
      </Link>
      <Link
        href="/client/providers"
        onClick={closeAll}
        className="text-gray-700 font-medium hover:text-teal-500 transition"
      >
        Proveedores
      </Link>
      <Link
        href="/subscriptions"
        onClick={closeAll}
        className="text-gray-700 font-medium hover:text-teal-500 transition"
      >
        Suscripción
      </Link>
      <Link
        href="/blog"
        onClick={closeAll}
        className="text-gray-700 font-medium hover:text-teal-500 transition"
      >
        Blog
      </Link>
      <Link
        href="/login"
        onClick={closeAll}
        className="bg-teal-500 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-teal-600 transition shadow-sm text-center"
      >
        Iniciar sesión
      </Link>
    </>
  );

  const ClientLinks = (
    <>
      <Link
        href="/client/home"
        onClick={closeAll}
        className="text-gray-700 font-medium hover:text-teal-500 transition"
      >
        Inicio
      </Link>
      <Link
        href="/client/providers"
        onClick={closeAll}
        className="text-gray-700 font-medium hover:text-teal-500 transition"
      >
        Proveedores
      </Link>
      <Link
        href="/blog"
        onClick={closeAll}
        className="text-gray-700 font-medium hover:text-teal-500 transition"
      >
        Blog
      </Link>
      <Link
        href="/client/appointments"
        onClick={closeAll}
        className="text-gray-700 font-medium hover:text-teal-500 transition"
      >
        Mis citas
      </Link>
      <Link
        href="/client/profile"
        onClick={closeAll}
        className="text-gray-700 font-medium hover:text-teal-500 transition"
      >
        Perfil
      </Link>

      <div className="text-gray-700 font-medium">
        ¡Hola, <span className="text-teal-500 font-semibold">{user?.name}</span>
        !
      </div>

      <button
        onClick={handleLogout}
        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition"
      >
        Cerrar sesión
      </button>
    </>
  );

  const ProviderLinks = (
    <>
      <Link
        href="/client/home"
        onClick={closeAll}
        className="text-gray-700 font-medium hover:text-teal-500 transition"
      >
        Inicio
      </Link>
      <Link
        href="/client/providers"
        onClick={closeAll}
        className="text-gray-700 font-medium hover:text-teal-500 transition"
      >
        Proveedores
      </Link>
      <Link
        href="/subscriptions"
        onClick={closeAll}
        className="text-gray-700 font-medium hover:text-teal-500 transition"
      >
        Suscripción
      </Link>
      <Link
        href="/blog"
        onClick={closeAll}
        className="text-gray-700 font-medium hover:text-teal-500 transition"
      >
        Blog
      </Link>
      <Link
        href="/provider/appointments"
        onClick={closeAll}
        className="text-gray-700 font-medium hover:text-teal-500 transition"
      >
        Mis servicios
      </Link>
      <Link
        href="/provider/profile"
        onClick={closeAll}
        className="text-gray-700 font-medium hover:text-teal-500 transition"
      >
        Perfil
      </Link>

      <div className="text-gray-700 font-medium">
        ¡Hola, <span className="text-teal-500 font-semibold">{user?.name}</span>
        !
      </div>

      <button
        onClick={handleLogout}
        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition"
      >
        Cerrar sesión
      </button>
    </>
  );

  const MenuLinks = !effectiveUser
    ? GuestLinks
    : effectiveRole === "client"
    ? ClientLinks
    : effectiveRole === "provider"
    ? ProviderLinks
    : null;

  return (
    <>
      <nav className="w-full bg-white shadow-md fixed top-0 left-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2" onClick={closeAll}>
            <Image
              src="/logo-horizontal.svg"
              alt="CleenGo Logo"
              width={180}
              height={60}
              className="h-12 w-auto"
            />
          </Link>

          {/* Desktop menu */}
          <div
            suppressHydrationWarning
            className="hidden lg:flex items-center gap-6"
          >
            {MenuLinks}
          </div>

          {/* Right actions (siempre visibles) */}
          <div className="flex items-center gap-2">
            {/* 🔔 Bell - ahora también en móvil (no se esconde) */}
            {effectiveUser && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={async () => {
                    const next = !notifOpen;
                    setNotifOpen(next);
                    setSelectOpenUserId(null);
                    if (next) await fetchUnreadSummary();
                  }}
                  className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-700 transition"
                  title="Mensajes"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0m6 0H9"
                    />
                  </svg>

                  {totalUnread > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {totalUnread > 99 ? "99+" : totalUnread}
                    </span>
                  )}
                </button>

                {/* Dropdown notificaciones */}
                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-[340px] max-w-[calc(100vw-24px)] bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
                    <div className="px-4 py-3 border-b flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          Mensajes
                        </p>
                        <p className="text-xs text-gray-500">
                          Sin leer: {totalUnread}
                        </p>
                      </div>

                      <button
                        onClick={markAllReadEverywhere}
                        disabled={notifLoading || totalUnread === 0}
                        className="text-xs font-semibold text-teal-600 hover:underline disabled:opacity-50"
                        title="Marcar todo como leído"
                      >
                        Marcar todo leído
                      </button>
                    </div>

                    <div className="max-h-[360px] overflow-y-auto">
                      {notifLoading && (
                        <div className="px-4 py-4 text-sm text-gray-600">
                          Cargando...
                        </div>
                      )}

                      {!notifLoading && groupedUnread.length === 0 && (
                        <div className="px-4 py-8 text-center">
                          <div className="text-3xl mb-2">✅</div>
                          <p className="text-sm text-gray-700 font-semibold">
                            No tienes mensajes sin leer
                          </p>
                          <p className="text-xs text-gray-500">
                            Cuando alguien te escriba, aparecerá aquí.
                          </p>
                        </div>
                      )}

                      {!notifLoading &&
                        groupedUnread.map((g) => {
                          const fullName = `${g.otherUser.name} ${
                            g.otherUser.surname ?? ""
                          }`.trim();

                          return (
                            <div key={g.otherUser.id}>
                              <div className="px-4 py-3 border-b last:border-b-0 flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 truncate">
                                    {fullName}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {g.total} mensaje(s) sin leer
                                  </p>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      const nextOpen =
                                        selectOpenUserId === g.otherUser.id
                                          ? null
                                          : g.otherUser.id;
                                      setSelectOpenUserId(nextOpen);
                                      if (nextOpen)
                                        g.appointmentIds.forEach((id) =>
                                          fetchAppointmentLite(id)
                                        );
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-teal-500 text-white text-xs font-bold hover:bg-teal-600"
                                    title="Elegir cita"
                                  >
                                    Elegir
                                  </button>

                                  <button
                                    onClick={() =>
                                      markAllReadForPerson(g.appointmentIds)
                                    }
                                    disabled={notifLoading}
                                    className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 disabled:opacity-50"
                                    title="Marcar todos los mensajes de esta persona como leídos"
                                  >
                                    Leídos
                                  </button>
                                </div>
                              </div>

                              {selectOpenUserId === g.otherUser.id && (
                                <div className="px-4 py-2 bg-gray-50 border-b">
                                  <p className="text-xs text-gray-600 mb-2">
                                    Selecciona la cita para abrir el chat:
                                  </p>

                                  <div className="flex flex-col gap-2">
                                    {g.appointmentIds.map((apptId) => {
                                      const a = apptCache[apptId];
                                      const loading = apptLoading[apptId];

                                      return (
                                        <button
                                          key={apptId}
                                          onClick={() => goToChat(apptId)}
                                          className="text-left px-3 py-2 rounded-lg bg-white hover:bg-gray-100 border w-full"
                                          title={apptId}
                                        >
                                          <div className="flex items-center justify-between gap-2">
                                            <div className="min-w-0">
                                              {loading && (
                                                <div className="text-xs text-gray-500">
                                                  Cargando cita…
                                                </div>
                                              )}

                                              {!loading && a?.date ? (
                                                <>
                                                  <div className="font-semibold text-gray-900">
                                                    {formatAppointmentLabel(a)}
                                                  </div>
                                                  <div className="text-xs text-gray-500 font-mono">
                                                    {apptId.slice(0, 8)}
                                                  </div>
                                                </>
                                              ) : !loading ? (
                                                <>
                                                  <div className="font-semibold text-gray-900">
                                                    Cita: {apptId.slice(0, 8)}…
                                                  </div>
                                                  <div className="text-xs text-gray-500">
                                                    (sin detalles)
                                                  </div>
                                                </>
                                              ) : null}
                                            </div>

                                            {!loading && a?.status ? (
                                              <span
                                                className={`shrink-0 px-2 py-1 rounded-full text-[11px] font-bold ${getStatusPillClass(
                                                  a.status
                                                )}`}
                                              >
                                                {getStatusLabel(a.status)}
                                              </span>
                                            ) : null}
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Hamburger (solo móvil) */}
            <button
              onClick={() => {
                setMobileOpen(true);
                setNotifOpen(false);
              }}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-700 transition"
              aria-label="Abrir menú"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Drawer Mobile (corrige tu problema de responsive) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          {/* Backdrop */}
          <button
            className="absolute inset-0 bg-black/30"
            onClick={closeAll}
            aria-label="Cerrar menú"
          />

          {/* Panel */}
          <div className="absolute right-0 top-0 h-full w-[86%] max-w-sm bg-white shadow-2xl flex flex-col">
            <div className="h-16 px-4 border-b flex items-center justify-between">
              <Link
                href="/"
                onClick={closeAll}
                className="flex items-center gap-2"
              >
                <Image
                  src="/logo-horizontal.svg"
                  alt="CleenGo Logo"
                  width={160}
                  height={50}
                  className="h-10 w-auto"
                />
              </Link>

              <button
                onClick={closeAll}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-700"
                aria-label="Cerrar"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
              <div className="flex flex-col gap-4">
                {/* Links */}
                {MenuLinks}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spacer para que no tape contenido por ser fixed */}
      <div className="h-16" />
    </>
  );
}
