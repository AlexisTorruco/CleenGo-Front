// src/app/client/chat/[appointmentId]/page.tsx
import { Suspense } from "react";
import ChatPageClient from "./ChatPageClient";

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Cargando chat...
        </div>
      }
    >
      <ChatPageClient />
    </Suspense>
  );
}
