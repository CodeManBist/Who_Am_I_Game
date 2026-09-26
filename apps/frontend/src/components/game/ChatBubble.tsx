import type { ChatMessage } from '@/lib/types';

export function ChatBubble({ message, isYou }: { message: ChatMessage; isYou: boolean }) {
  return (
    <div className={`flex ${isYou ? 'justify-end' : 'justify-start'} animate-slide-up`}>
      <div className={`max-w-[80%] ${isYou ? 'text-right' : ''}`}>
        {!isYou && (
          <p className="mb-0.5 text-[10px] font-medium text-[#FF5A36]">{message.senderName}</p>
        )}
        <div
          className={`inline-block rounded-lg px-3 py-2 text-[13px] leading-snug ${
            isYou
              ? 'bg-[#FF5A36] text-white rounded-br-sm'
              : 'bg-[#211F1B] text-[#d5d0c7] rounded-bl-sm'
          }`}
        >
          {message.text}
        </div>
      </div>
    </div>
  );
}

export function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2 text-[11px] text-[#5A564F]">
      <span className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-[#5A564F]"
            style={{ animation: `typing-dot 1.4s ease-in-out ${i * 0.2}s infinite` }}
          />
        ))}
      </span>
      <span>{name} is typing...</span>
    </div>
  );
}
