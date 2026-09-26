import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/lib/types';

export function ChatMessageBubble({ message, isYou }: { message: ChatMessage; isYou: boolean }) {
  return (
    <div className={cn('flex animate-slide-up-fade', isYou ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[80%]', isYou && 'text-right')}>
        {!isYou && (
          <p className="mb-1 text-xs font-medium text-primary">{message.senderName}</p>
        )}
        <div
          className={cn(
            'inline-block rounded-2xl px-3.5 py-2 text-sm',
            isYou
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-secondary text-foreground rounded-bl-md'
          )}
        >
          {message.text}
        </div>
      </div>
    </div>
  );
}

export function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
            style={{ animation: `typing-dot 1.4s ease-in-out ${i * 0.2}s infinite` }}
          />
        ))}
      </span>
      <span>{name} is typing...</span>
    </div>
  );
}
