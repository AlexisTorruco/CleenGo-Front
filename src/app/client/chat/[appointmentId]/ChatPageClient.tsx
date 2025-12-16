"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { useAuth } from "@/app/contexts/AuthContext";
import { io, Socket } from "socket.io-client";

type MsgUser = {
  id: string;
  name: string;
  surname?: string;
  profileImgUrl?: string | null;
  role?: string;
};

type ChatMessage = {
  id: string;
  content: string;
  read: boolean;
  createdAt: string; // ideal: ISO con offset/Z desde backend
  sender: MsgUser;
  receiver: MsgUser;
  appointment: { id: string };
};

type PresencePayload = {
  appointmentId: string;
  onlineUserIds: string[];
};

type MessagesReadPayload = {
  appointmentId: string;
  readerId: string;
  updatedCount: number;
  at: string;
};

export default function ChatPageClient() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const router = useRouter();
  const { user, token } = useAuth();

  const backendUrl = process.env.VITE_BACKEND_URL;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  // UX
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  const socketRef = useRef<Socket | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  // Para no autoscrollear si el usuario está leyendo arriba
  const [isAtBottom, setIsAtBottom] = useState(true);

  const meId = user?.id;

  const authHeaders = useMemo(() => {
    const h: Record<string, string> = {};
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, [token]);

  // Identifica al "otro" usuario del chat (en base a los mensajes)
  const other = useMemo(() => {
    const first = messages.find((m) => m.sender?.id && m.receiver?.id);
    if (!first || !meId) return null;
    return first.sender.id === meId ? first.receiver : first.sender;
  }, [messages, meId]);

  // Scroll helper
  const scrollToBottom = useCallback((smooth = true) => {
    const el = messagesRef.current;
    if (!el) return;
    const top = el.scrollHeight;
    if (smooth) el.scrollTo({ top, behavior: "smooth" });
    else el.scrollTop = top;
  }, []);

  // ✅ Fecha/hora local del navegador (México/Argentina/etc.)
  // No forzamos TZ. No agregamos "Z". Solo parseo directo.
  const toDateSafe = (value: string) => {
    if (!value) return new Date();

    // ISO normal: 2025-12-16T01:09:00.000Z ó con offset
    if (
      value.includes("T") &&
      (value.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(value))
    ) {
      return new Date(value);
    }

    // "YYYY-MM-DD HH:mm:ss" => tratarlo como UTC para que NO se desface
    if (value.includes(" ") && !value.includes("T")) {
      return new Date(value.replace(" ", "T") + "Z");
    }

    // "YYYY-MM-DDTHH:mm:ss" pero sin Z/offset => tratarlo como UTC
    if (
      value.includes("T") &&
      !value.endsWith("Z") &&
      !/[+-]\d{2}:\d{2}$/.test(value)
    ) {
      return new Date(value + "Z");
    }

    return new Date(value);
  };

  const formatDate = useCallback((raw: string) => {
    const d = toDateSafe(raw);
    if (Number.isNaN(d.getTime())) return raw;

    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }, []);

  const loadMessages = useCallback(async () => {
    if (!backendUrl || !token || !appointmentId) return;

    const res = await fetch(`${backendUrl}/chat/messages/${appointmentId}`, {
      headers: authHeaders,
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`GET messages failed: ${res.status}`);
    const data: ChatMessage[] = await res.json();
    setMessages(data);
  }, [appointmentId, authHeaders, backendUrl, token]);

  // ✅ marcar leído: por WS (ideal) y fallback HTTP si no hay WS
  const markRead = useCallback(async () => {
    if (!appointmentId) return;

    const s = socketRef.current;
    if (s?.connected) {
      s.emit("markRead", { appointmentId });
      return;
    }

    if (!backendUrl || !token) return;
    await fetch(`${backendUrl}/chat/appointments/${appointmentId}/read`, {
      method: "PATCH",
      headers: authHeaders,
    }).catch(() => {});
  }, [appointmentId, authHeaders, backendUrl, token]);

  // =========================
  // INIT (carga inicial)
  // =========================
  useEffect(() => {
    const run = async () => {
      if (!user || !token) {
        router.push("/login");
        return;
      }

      try {
        setLoading(true);
        await loadMessages();
      } catch (e) {
        console.error(e);
        Swal.fire("Error", "No se pudo abrir el chat", "error");
      } finally {
        setLoading(false);
        // ✅ Solo al abrir el chat: bajar al final
        setTimeout(() => scrollToBottom(false), 50);
        setTimeout(() => inputRef.current?.focus(), 80);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId]);

  // =========================
  // SOCKET.IO (1 sola vez por appointment/token)
  // =========================
  useEffect(() => {
    if (!token || !appointmentId || !backendUrl) return;

    // limpiar socket anterior si cambió appointmentId
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
      s.emit("joinAppointment", { appointmentId });
      // al conectar, marcamos read (WS) por si ya llegaron mensajes
      markRead().catch(() => {});
    });

    s.on("disconnect", () => {
      // si el socket cae, no queremos “se quedó escribiendo…”
      setTypingUsers(new Set());
    });

    // ✅ PRESENCIA REAL POR CHAT (snapshot que manda tu gateway)
    s.on("presence", (payload: PresencePayload) => {
      // solo si corresponde a este appointment
      if (String(payload.appointmentId) !== String(appointmentId)) return;
      setOnlineUsers(new Set(payload.onlineUserIds || []));
    });

    // ✅ typing
    s.on("typing", ({ userId }: { userId: string }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        next.add(userId);
        return next;
      });
    });

    s.on("stopTyping", ({ userId }: { userId: string }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    // ✅ mensajes
    s.on("newMessage", async (msg: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });

      // si el mensaje es para mí y estoy dentro del chat => marco leído
      if (meId && msg.receiver?.id === meId) {
        markRead().catch(() => {});
      }

      // autoscroll SOLO si estoy abajo (o si el mensaje es mío)
      const mine = msg.sender?.id === meId;
      if (mine || isAtBottom) {
        setTimeout(() => scrollToBottom(true), 30);
      }
    });

    // ✅ palomitas azules SIN refetch (payload viene del gateway)
    s.on("messagesRead", (payload: MessagesReadPayload) => {
      if (!meId) return;
      if (String(payload.appointmentId) !== String(appointmentId)) return;

      // si yo fui el lector, no necesito marcar nada (yo no veo mis propias palomitas)
      if (payload.readerId === meId) return;

      setMessages((prev) =>
        prev.map((m) => {
          const iAmSender = m.sender?.id === meId;
          const readerIsReceiver = m.receiver?.id === payload.readerId;
          if (iAmSender && readerIsReceiver) return { ...m, read: true };
          return m;
        })
      );
    });

    return () => {
      // ✅ cortar typing al salir (para que el otro no se quede viendo “escribiendo…”)
      if (appointmentId) {
        s.emit("stopTyping", { appointmentId });
      }

      s.off();
      s.disconnect();
      socketRef.current = null;
    };
  }, [
    backendUrl,
    token,
    appointmentId,
    meId,
    markRead,
    scrollToBottom,
    isAtBottom,
  ]);

  // =========================
  // Scroll tracking (para no forzar autoscroll)
  // =========================
  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;

    const onScroll = () => {
      const nearBottom =
        el.scrollHeight - (el.scrollTop + el.clientHeight) < 80;
      setIsAtBottom(nearBottom);
    };

    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const send = async () => {
    const content = text.trim();
    if (!content) return;
    if (!appointmentId) return;

    try {
      setSending(true);
      setText("");

      socketRef.current?.emit("sendMessage", { appointmentId, content });

      // ✅ no perder foco
      requestAnimationFrame(() => inputRef.current?.focus());

      // ✅ si estoy abajo, mantengo abajo
      if (isAtBottom) setTimeout(() => scrollToBottom(true), 30);
    } catch (e) {
      console.error(e);
      Swal.fire("Error", "No se pudo enviar el mensaje", "error");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Cargando chat...
      </div>
    );
  }

  const otherIsOnline = other?.id ? onlineUsers.has(other.id) : false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A65FF] via-[#1E73FF] to-[#3D8AFF] pt-20 pb-6 px-4">
      <div className="max-w-4xl mx-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Chat de la cita</p>
            <h2 className="text-lg font-bold text-gray-900">
              {other ? `${other.name} ${other.surname ?? ""}` : "Chat"}
            </h2>

            {other && (
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                <span
                  className={`w-2 h-2 rounded-full ${
                    otherIsOnline ? "bg-green-500" : "bg-gray-400"
                  }`}
                />
                {otherIsOnline ? "En línea" : "Desconectado"}
              </div>
            )}

            {other && typingUsers.has(other.id) && (
              <p className="text-xs italic text-gray-500 mt-1">
                {other.name} está escribiendo…
              </p>
            )}
          </div>

          <button
            onClick={() => {
              const role = String((user as any)?.role ?? "").toLowerCase();
              if (role === "provider") router.push("/provider/profile");
              else router.push("/client/profile");
            }}
            className="text-sm font-semibold text-blue-600 hover:underline"
          >
            Volver
          </button>
        </div>

        {/* Mensajes (scroll SOLO aquí) */}
        <div
          ref={messagesRef}
          className="p-4 h-[60vh] overflow-y-auto space-y-3"
        >
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-10">
              Aún no hay mensajes. Escribe el primero 👇
            </div>
          ) : (
            messages.map((m) => {
              const mine = m.sender.id === meId;

              // ✔✔ gris = enviado
              // ✔✔ azul = leído
              const checksText = mine ? "✔✔" : "";
              const checksClass = mine
                ? m.read
                  ? "text-blue-600 font-semibold"
                  : "text-gray-400"
                : "";

              return (
                <div
                  key={m.id}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                      mine
                        ? "bg-[#22C55E]/15 text-gray-900"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>

                    <div className="mt-1 flex items-center justify-between gap-3">
                      <p className="text-[11px] text-gray-500">
                        {formatDate(m.createdAt)}
                      </p>

                      {mine && (
                        <span
                          className={`text-[12px] select-none ${checksClass}`}
                        >
                          {checksText}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t flex gap-2">
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              socketRef.current?.emit("typing", { appointmentId });
            }}
            onBlur={() =>
              socketRef.current?.emit("stopTyping", { appointmentId })
            }
            placeholder="Escribe un mensaje…"
            className="flex-1 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 px-3 py-2 text-sm outline-none focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/40"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                send();
              }
            }}
            disabled={sending}
          />

          <button
            onClick={send}
            disabled={sending}
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${
              sending ? "bg-[#22C55E]/60" : "bg-[#22C55E] hover:bg-[#16A34A]"
            }`}
          >
            {sending ? "Enviando..." : "Enviar"}
          </button>
        </div>
      </div>
    </div>
  );
}