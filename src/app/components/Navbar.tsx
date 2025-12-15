// src/app/components/Navbar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useAuth } from "@/app/contexts/AuthContext";

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

  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

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

  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.VITE_BACKEND_URL ||
    "http://localhost:3000";

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const effectiveUser = isMounted ? user : null;
  const effectiveRole = isMounted ? role : undefined;

  const handleMenuItemClick = () => setIsOpen(false);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    setNotifOpen(false);
    setSelectOpenUserId(null);
  };

  const groupedUnread = useMemo<GroupedUnread[]>(() => {
    const map = new Map<string, GroupedUnread>();

    for (const item of unreadSummary) {
      const key = item.otherUser.id;
      const prev = map.get(key);
      if (!prev) {
        map.set(key, {
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

  const totalUnread = useMemo(
    () => groupedUnread.reduce((sum, g) => sum + g.total, 0),
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
    } catch {
      setUnreadSummary([]);
    } finally {
      setNotifLoading(false);
    }
  }, [backendUrl, token, effectiveUser]);

  const fetchAppointmentLite = useCallback(
    async (appointmentId: string) => {
      if (!backendUrl || !token) return;
      if (apptCache[appointmentId] || apptLoading[appointmentId]) return;

      setApptLoading((p) => ({ ...p, [appointmentId]: true }));

      try {
        const res = await fetch(`${backendUrl}/appointments/${appointmentId}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });

        if (!res.ok) return;

        const data = await res.json();

        setApptCache((p) => ({
          ...p,
          [appointmentId]: {
            id: data.id,
            date: data.date,
            startHour: data.startHour,
            endHour: data.endHour,
            status: data.status,
          },
        }));
      } finally {
        setApptLoading((p) => ({ ...p, [appointmentId]: false }));
      }
    },
    [backendUrl, token, apptCache, apptLoading]
  );

  useEffect(() => {
    if (!effectiveUser || !token) return;
    fetchUnreadSummary();

    const onFocus = () => fetchUnreadSummary();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [effectiveUser, token, fetchUnreadSummary]);

  useEffect(() => {
    if (!notifOpen) return;

    const onDown = (e: MouseEvent) => {
      if (
        notifRef.current &&
        e.target instanceof Node &&
        !notifRef.current.contains(e.target)
      ) {
        setNotifOpen(false);
        setSelectOpenUserId(null);
      }
    };

    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [notifOpen]);

  const goToChat = (appointmentId: string) => {
    setNotifOpen(false);
    setIsOpen(false);
    window.location.href = `/client/chat/${appointmentId}`;
  };

  return (
    <nav className="w-full bg-white shadow-md fixed top-0 left-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" onClick={handleMenuItemClick}>
          <Image
            src="/logo-horizontal.svg"
            alt="CleenGo Logo"
            width={180}
            height={60}
            className="h-12 w-auto"
            priority
          />
        </Link>

        {/* Right */}
        <div className="flex items-center gap-3">
          {/* Hamburger */}
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
          className={`lg:flex lg:items-center lg:gap-6 ${
            isOpen
              ? "flex flex-col w-full mt-4 space-y-4 bg-white p-4 rounded-lg shadow-lg absolute top-16 left-0"
              : "hidden lg:flex"
          }`}
        >
          {!effectiveUser && (
            <>
              <Link href="/login">Iniciar Sesión</Link>
            </>
          )}

          {effectiveUser && (
            <>
              <span className="text-gray-700">
                ¡Hola <b className="text-teal-500">{user?.name}</b>!
              </span>
              <button
                onClick={handleLogout}
                className="bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200"
              >
                Cerrar sesión
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
