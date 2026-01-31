import type { Message } from "../../types";

type MessageThreadProps = {
  messages: Message[];
};

export default function MessageThread({ messages }: MessageThreadProps) {
  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto rounded-2xl border border-botanical-100 bg-white p-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.direction === "outbound" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
              message.direction === "outbound"
                ? "bg-botanical-700 text-white"
                : "bg-botanical-50 text-botanical-800"
            }`}
          >
            <p>{message.body}</p>
            <p className="mt-2 text-xs opacity-70">
              {new Date(message.createdAt).toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
