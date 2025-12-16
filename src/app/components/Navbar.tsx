//src/app/components/Navbar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { io, Socket } from "socket.io-client";

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
  // ✅ aquí solo agrego token, no cambio nada más
  const { user, token, logout } = useAuth();
  const role = user?.role;

  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // 🔔 Notificaciones (mensajes sin leer)
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [unreadSummary, setUnreadSummary] = useState<UnreadSummaryItem[]>([]);
  // state to track which user's submenu is open inside notifications
  const [selectOpenUserId, setSelectOpenUserId] = useState<string | null>(null);

  // cache + loading state for appointment lite fetches
  const [apptCache, setApptCache] = useState<Record<string, AppointmentLite>>(
    {}
  );
  const [apptLoading, setApptLoading] = useState<Record<string, boolean>>({});

  const notifRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const backendUrl = process.env.VITE_BACKEND_URL;

  // Marcamos cuando el componente ya se montó en el cliente
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Valores "seguros" para SSR + cliente
  const effectiveUser = isMounted ? user : null;
  const effectiveRole = isMounted ? role : undefined;

  // Cerrar menú cuando se hace click en algún link
  const handleMenuItemClick = () => {
    setIsOpen(false);
  };

  // Logout que también cierra el menú
  const handleLogout = () => {
    logout();
    setIsOpen(false);
    setNotifOpen(false);
    setSelectOpenUserId(null);
    socketRef.current?.disconnect();
    socketRef.current = null;
  };

  // ✅ Agrupar unread por persona
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
        if (!prev.appointmentIds.includes(item.appointmentId)) {
          prev.appointmentIds.push(item.appointmentId);
        }
      }
    }

    return Array.from(map.values())
      .filter((x) => x.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [unreadSummary]);

  const totalUnread = useMemo(() => {
    return groupedUnread.reduce((sum, g) => sum + (g.total ?? 0), 0);
  }, [groupedUnread]);

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

  // Helpers for status label / pill class
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
      // Build ISO strings using date + hour (assume backend provides HH:mm)
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
    } catch (e) {
      return `${a?.date ?? ""} · ${a?.startHour ?? ""} - ${a?.endHour ?? ""}`;
    }
  };

  // Fetch a light version of an appointment and cache it
  const fetchAppointmentLite = useCallback(
    async (appointmentId: string) => {
      if (!backendUrl || !token) return;
      if (apptCache[appointmentId]) return; // already cached
      if (apptLoading[appointmentId]) return; // in flight

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

  // Cargar unread al montar sesión + refrescar al volver a la pestaña
  useEffect(() => {
    if (!effectiveUser || !token) return;
    fetchUnreadSummary();

    const onFocus = () => fetchUnreadSummary();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [effectiveUser, token, fetchUnreadSummary]);

  useEffect(() => {
    if (!backendUrl || !token || !effectiveUser) return;

    // evitar duplicados
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
      // opcional: al conectar, refrescar snapshot por si acaso
      fetchUnreadSummary();
    });

    // ✅ EVENTO QUE EMITE EL BACK
    s.on("unreadSummaryUpdated", (payload: any) => {
      // si por alguna razón llega otro user, ignoramos
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

  // Cerrar dropdown al hacer click afuera
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

  const goToChat = (appointmentId: string) => {
    // ✅ ruta única que ya usas y funciona para ambos roles
    setNotifOpen(false);
    setIsOpen(false);
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
      // ✅ marcamos read por cada cita donde esa persona te dejó mensajes sin leer
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

  return (
    <nav className="w-full bg-white shadow-md fixed top-0 left-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2"
          onClick={handleMenuItemClick}
        >
          <Image
            src="/logo-horizontal.svg"
            alt="CleenGo Logo"
            width={180}
            height={60}
            className="h-12 w-auto"
          />
        </Link>

        {/* Right side: bell + hamburger */}
        <div className="flex items-center gap-3">
          {/* 🔔 Bell (solo si hay usuario) */}
          {effectiveUser && (
            <div className="relative" ref={notifRef}>
              <button
                onClick={async () => {
                  const next = !notifOpen;
                  setNotifOpen(next);
                  if (next) await fetchUnreadSummary();
                }}
                className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-700 transition"
                title="Mensajes"
              >
                {/* Bell icon */}
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

              {/* Dropdown */}
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-[340px] bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
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

                        // ✅ “Entrar a verlos”: abre el chat de la primera cita con esa persona
                        const firstAppointmentId = g.appointmentIds[0];

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
                                    if (nextOpen) {
                                      g.appointmentIds.forEach((id) =>
                                        fetchAppointmentLite(id)
                                      );
                                    }
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
                                        onClick={() => {
                                          setSelectOpenUserId(null);
                                          goToChat(apptId);
                                        }}
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

          {/* Hamburger button - Mobile */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-teal-500 focus:outline-none"
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
                  d={
                    isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"
                  }
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Menu */}
        <div
          suppressHydrationWarning
          className={`lg:flex lg:items-center lg:gap-6 ${
            isOpen
              ? "flex flex-col w-full mt-4 space-y-4 bg-white p-4 rounded-lg shadow-lg absolute top-16 left-0 lg:static lg:shadow-none lg:p-0"
              : "hidden lg:flex"
          }`}
        >
          {/* ------------------- */}
          {/* GUEST NAVBAR       */}
          {/* ------------------- */}
          {!effectiveUser && (
            <div className="flex flex-col lg:flex-row lg:items-center lg:gap-6 gap-3 w-full">
              <Link
                href="/client/home"
                onClick={handleMenuItemClick}
                className="text-gray-700 font-medium hover:text-teal-500 transition"
              >
                Inicio
              </Link>
              <Link
                href="/client/providers"
                onClick={handleMenuItemClick}
                className="text-gray-700 font-medium hover:text-teal-500 transition"
              >
                Proveedores
              </Link>
              <Link
                href="/subscriptions"
                onClick={handleMenuItemClick}
                className="text-gray-700 font-medium hover:text-teal-500 transition"
              >
                Suscripción
              </Link>
              <Link
                href="/blog"
                onClick={handleMenuItemClick}
                className="text-gray-700 font-medium hover:text-teal-500 transition"
              >
                Blog
              </Link>
              <Link
                href="/login"
                onClick={handleMenuItemClick}
                className="bg-teal-500 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-teal-600 transition shadow-sm text-center"
              >
                Iniciar Sesión
              </Link>
            </div>
          )}

          {/* ------------------- */}
          {/* CLIENT NAVBAR       */}
          {/* ------------------- */}
          {effectiveUser && effectiveRole === "client" && (
            <div className="flex flex-col lg:flex-row lg:items-center lg:gap-6 gap-3 w-full">
              <Link
                href="/client/home"
                onClick={handleMenuItemClick}
                className="text-gray-700 font-medium hover:text-teal-500 transition text-center"
              >
                Inicio
              </Link>
              <Link
                href="/client/providers"
                onClick={handleMenuItemClick}
                className="text-gray-700 font-medium hover:text-teal-500 transition text-center"
              >
                Proveedores
              </Link>

              <Link
                href="/blog"
                onClick={handleMenuItemClick}
                className="text-gray-700 font-medium hover:text-teal-500 transition text-center"
              >
                Blog
              </Link>
              <Link
                href="/client/appointments"
                onClick={handleMenuItemClick}
                className="relative text-gray-700 hover:text-teal-500 transition text-center"
              >
                <svg
                  className="w-6 h-6 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
                <span className="absolute -top-2 -right-2 bg-teal-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  0
                </span>
              </Link>
              <Link
                href="/client/profile"
                onClick={handleMenuItemClick}
                className="text-gray-700 hover:text-teal-500 transition text-center"
              >
                <svg
                  className="w-6 h-6 mx-auto"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
              <span className="text-gray-700 font-medium text-center">
                ¡Hola,{" "}
                <span className="text-teal-500 font-semibold">
                  {user?.name}
                </span>
                !
              </span>
              <button
                onClick={handleLogout}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition"
              >
                Cerrar Sesión
              </button>
            </div>
          )}

          {/* ------------------- */}
          {/* PROVIDER NAVBAR     */}
          {/* ------------------- */}
          {effectiveUser && effectiveRole === "provider" && (
            <div className="flex flex-col lg:flex-row lg:items-center lg:gap-6 gap-3 w-full">
              <Link
                href="/client/home"
                onClick={handleMenuItemClick}
                className="text-gray-700 font-medium hover:text-teal-500 transition text-center"
              >
                Inicio
              </Link>
              <Link
                href="/client/providers"
                onClick={handleMenuItemClick}
                className="text-gray-700 font-medium hover:text-teal-500 transition text-center"
              >
                Proveedores
              </Link>
              <Link
                href="/subscriptions"
                onClick={handleMenuItemClick}
                className="text-gray-700 font-medium hover:text-teal-500 transition text-center"
              >
                Suscripción
              </Link>
              <Link
                href="/blog"
                onClick={handleMenuItemClick}
                className="text-gray-700 font-medium hover:text-teal-500 transition text-center"
              >
                Blog
              </Link>
              <Link
                href="/provider/appointments"
                onClick={handleMenuItemClick}
                className="text-gray-700 hover:text-teal-500 transition text-center"
              >
                <svg
                  className="w-6 h-6 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </Link>
              <Link
                href="/provider/profile"
                onClick={handleMenuItemClick}
                className="text-gray-700 hover:text-teal-500 transition text-center"
              >
                <svg
                  className="w-6 h-6 mx-auto"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
              <span className="text-gray-700 font-medium text-center">
                ¡Hola,{" "}
                <span className="text-teal-500 font-semibold">
                  {user?.name}
                </span>
                !
              </span>
              <button
                onClick={handleLogout}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition"
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
