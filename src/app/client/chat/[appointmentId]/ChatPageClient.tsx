//src/app/client/chat/[appointmentId]/ChatPageClient.tsx
"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { useAuth } from "@/app/contexts/AuthContext";

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
  createdAt: string;
  sender: MsgUser;
  receiver: MsgUser;
  appointment: { id: string };
};

export default function ChatPageClient() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const router = useRouter();
  const { user, token } = useAuth();

  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.VITE_BACKEND_URL;


  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const meId = user?.id;

  const other = useMemo(() => {
    const first = messages.find((m) => !m.id.startsWith("temp-"));
    if (!first || !meId) return null;
    return first.sender.id === meId ? first.receiver : first.sender;
  }, [messages, meId]);

  const scrollToBottom = () =>
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });

  const authHeaders = useMemo(() => {
    const h: Record<string, string> = {};
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, [token]);

  const loadMessages = useCallback(async () => {
    if (!backendUrl || !token || !appointmentId) return;

    const res = await fetch(`${backendUrl}/chat/messages/${appointmentId}`, {
      headers: authHeaders,
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`GET messages failed: ${res.status}`);
    const data: ChatMessage[] = await res.json();

    // Mantén cualquier mensaje temporal "enviando" al final, si aún existe
    setMessages((prev) => {
      const temps = prev.filter((m) => m.id.startsWith("temp-"));
      return temps.length ? [...data, ...temps] : data;
    });
  }, [appointmentId, authHeaders, backendUrl, token]);

  const markRead = useCallback(async () => {
    if (!backendUrl || !token || !appointmentId) return;
    await fetch(`${backendUrl}/chat/appointments/${appointmentId}/read`, {
      method: "PATCH",
      headers: authHeaders,
    }).catch(() => { });
  }, [appointmentId, authHeaders, backendUrl, token]);

  const markReadIfNeeded = useCallback(
    async (data: ChatMessage[]) => {
      if (!meId) return;

      const hasUnreadForMe = data.some(
        (m) => m.receiver?.id === meId && m.read === false
      );
      if (!hasUnreadForMe) return;

      await markRead();
      await loadMessages();
    },
    [loadMessages, markRead, meId]
  );

  useEffect(() => {
    const run = async () => {
      if (!user || !token) {
        router.push("/login");
        return;
      }

      if (!backendUrl) {
        setLoading(false);
        Swal.fire({
          icon: "error",
          title: "Falta BACKEND_URL",
          text: "Configura NEXT_PUBLIC_BACKEND_URL",
        });
        return;
      }

      try {
        setLoading(true);

        // 1) marco leído al entrar
        await markRead();

        // 2) cargo mensajes
        const res = await fetch(
          `${backendUrl}/chat/messages/${appointmentId}`,
          {
            headers: authHeaders,
            cache: "no-store",
          }
        );
        if (!res.ok) throw new Error(`GET messages failed: ${res.status}`);
        const data: ChatMessage[] = await res.json();
        setMessages(data);

        // 3) si había sin leer para mí, aseguro read=true
        await markReadIfNeeded(data);
      } catch (e) {
        console.error(e);
        Swal.fire({
          icon: "error",
          title: "No se pudo abrir el chat",
          text: "Revisa consola / backend.",
        });
      } finally {
        setLoading(false);
        setTimeout(scrollToBottom, 150);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId]);

  // ✅ Polling simple (sin websockets)
  useEffect(() => {
    if (!token || !appointmentId) return;

    const intervalMs = 4000;
    const id = window.setInterval(async () => {
      try {
        const res = await fetch(
          `${backendUrl}/chat/messages/${appointmentId}`,
          {
            headers: authHeaders,
            cache: "no-store",
          }
        );
        if (!res.ok) return;
        const data: ChatMessage[] = await res.json();

        setMessages((prev) => {
          const prevNonTemp = prev.filter((m) => !m.id.startsWith("temp-"));
          const temps = prev.filter((m) => m.id.startsWith("temp-"));

          if (prevNonTemp.length !== data.length) return [...data, ...temps];

          const prevLast = prevNonTemp[prevNonTemp.length - 1];
          const nextLast = data[data.length - 1];
          if (!prevLast || !nextLast) return [...data, ...temps];

          if (
            prevLast.id !== nextLast.id ||
            prevLast.createdAt !== nextLast.createdAt
          )
            return [...data, ...temps];

          const prevReadMap = prevNonTemp
            .map((m) => `${m.id}:${m.read}`)
            .join("|");
          const nextReadMap = data.map((m) => `${m.id}:${m.read}`).join("|");
          if (prevReadMap !== nextReadMap) return [...data, ...temps];

          return prev;
        });

        await markReadIfNeeded(data);
      } catch (e) {
        console.warn("polling chat error", e);
      }
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [appointmentId, authHeaders, backendUrl, markReadIfNeeded, token]);

  const send = async () => {
    const content = text.trim();
    if (!content) return;
    if (!backendUrl || !token) return;
    if (!appointmentId) return;
    if (!user?.id) return;

    const tempId = `temp-${Date.now()}`;

    // ✅ Mensaje temporal: muestra ✔ mientras el POST está en vuelo
    const tempMsg: ChatMessage = {
      id: tempId,
      content,
      read: false,
      createdAt: new Date().toISOString(),
      sender: {
        id: user.id,
        name: user.name ?? "Tú",
        surname: (user as any).surname,
        profileImgUrl: (user as any).profileImgUrl,
        role: (user as any).role,
      },
      receiver: other ?? { id: "", name: "" },
      appointment: { id: String(appointmentId) },
    };

    try {
      setSending(true);
      setText("");
      setMessages((prev) => [...prev, tempMsg]);
      setTimeout(scrollToBottom, 50);

      const res = await fetch(`${backendUrl}/chat/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({ appointmentId, content }),
      });

      if (!res.ok) {
        const err = await res.text().catch(() => "");
        throw new Error(`POST message failed: ${res.status} ${err}`);
      }

      // quito el temporal y recargo reales
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      await loadMessages();
      setTimeout(scrollToBottom, 100);
    } catch (e) {
      console.error(e);

      // si falló, quitamos temporal y regresamos el texto
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setText(content);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo enviar el mensaje.",
      });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A65FF] via-[#1E73FF] to-[#3D8AFF] pt-20 pb-6 px-4">
      <div className="max-w-4xl mx-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Chat de la cita</p>
            <h2 className="text-lg font-bold text-gray-900">
              {other
                ? `${other.name} ${other.surname ?? ""}`
                : `Appointment ${String(appointmentId).slice(0, 6)}…`}
            </h2>
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

        {/* Mensajes */}
        <div className="p-4 h-[60vh] overflow-y-auto space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-10">
              Aún no hay mensajes. Escribe el primero 👇
            </div>
          ) : (
            messages.map((m) => {
              const mine = m.sender.id === meId;
              const isTemp = m.id.startsWith("temp-");

              // ✅ Opción A:
              // ✔ gris = "enviando" (temp)
              // ✔✔ gris = "enviado/guardado"
              // ✔✔ azul = "leído" (read=true)
              const checksText = mine ? (isTemp ? "✔" : "✔✔") : "";
              const checksClass = mine
                ? isTemp
                  ? "text-gray-400"
                  : m.read
                    ? "text-blue-600 font-semibold"
                    : "text-gray-400"
                : "";

              return (
                <div
                  key={m.id}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${mine
                        ? "bg-[#22C55E]/15 text-gray-900"
                        : "bg-gray-100 text-gray-900"
                      }`}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>

                    <div className="mt-1 flex items-center justify-between gap-3">
                      <p className="text-[11px] text-gray-500">
                        {new Date(m.createdAt).toLocaleString()}
                      </p>

                      {mine && (
                        <span
                          className={`text-[12px] select-none ${checksClass}`}
                          title={
                            isTemp
                              ? "Enviando..."
                              : m.read
                                ? "Leído"
                                : "Enviado"
                          }
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
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe un mensaje…"
            className="flex-1 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 px-3 py-2 text-sm outline-none focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/40"
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
            disabled={sending}
          />

          <button
            onClick={send}
            disabled={sending}
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${sending
                ? "bg-[#22C55E]/60 cursor-not-allowed"
                : "bg-[#22C55E] hover:bg-[#16A34A]"
              }`}
          >
            {sending ? "Enviando..." : "Enviar"}
          </button>
        </div>
      </div>
    </div>
  );
}
