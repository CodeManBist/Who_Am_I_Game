import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type {
  ChatMessage as ChatMessageType,
  Player,
} from '@/lib/types';
import {
  ChatMessageBubble,
  TypingIndicator,
} from './ChatMessage';

export function GameChat({
  messages,
  you,
  opponentTyping,
  opponentName,
  className,
}: {
  messages: ChatMessageType[];
  you: Player | null;
  opponentTyping: boolean;
  opponentName: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col rounded-2xl border border-border/60 bg-card/50',
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <span className="text-sm font-semibold">
          Game Chat
        </span>

        <span className="text-xs text-muted-foreground">
          {messages.length} messages
        </span>
      </div>

      <ScrollArea
        className="flex-1 p-4"
        style={{ maxHeight: '100%' }}
      >
        <div className="space-y-3">
          {messages.map((message) => (
            <ChatMessageBubble
              key={message.id}
              message={message}
              isYou={
                message.senderId ===
                you?.userId
              }
            />
          ))}

          {opponentTyping && (
            <TypingIndicator
              name={opponentName}
            />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}