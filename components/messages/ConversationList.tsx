import type { Conversation } from "../../types";

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });

type ConversationListProps = {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (conversationId: string) => void;
};

export default function ConversationList({
  conversations,
  selectedId,
  onSelect,
}: ConversationListProps) {
  return (
    <div className="flex flex-col gap-3">
      {conversations.map((conversation) => (
        <button
          key={conversation.id}
          type="button"
          onClick={() => onSelect(conversation.id)}
          className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
            selectedId === conversation.id
              ? "border-botanical-200 bg-botanical-50"
              : "border-botanical-100 bg-white hover:bg-botanical-50/70"
          }`}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-botanical-200 text-xs font-semibold text-botanical-800">
            {conversation.initials}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-botanical-900">
              {conversation.leadName}
            </p>
            <p className="text-xs text-botanical-600">
              {conversation.lastMessage}
            </p>
          </div>
          <div className="text-xs text-botanical-500">
            {formatTime(conversation.updatedAt)}
          </div>
        </button>
      ))}
    </div>
  );
}
