import { useEffect, useRef } from "react";
import type { Message } from "../../types";

type MessageThreadProps = {
  messages: Message[];
};

export default function MessageThread({ messages }: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  return (
    <div className="flex h-[55vh] min-h-[360px] flex-col gap-4 overflow-y-auto rounded-2xl border border-botanical-100 bg-white p-4">
      {messages.length === 0 ? (
        <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-botanical-200 bg-botanical-50/40 px-4 text-center text-sm text-botanical-600">
          Aun no hay mensajes en esta conversacion. Envia el primer mensaje para iniciar el seguimiento.
        </div>
      ) : (
        messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.direction === "outbound" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                message.direction === "outbound"
                  ? "bg-botanical-700 text-white"
                  : "bg-botanical-50 text-botanical-800"
              }`}
            >
              <p className="break-words">{message.body}</p>
              <p className="mt-2 text-xs opacity-70">
                {new Date(message.createdAt).toLocaleTimeString("es-ES", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))
      )}
      <div ref={bottomRef} />
    </div>
  );
}
