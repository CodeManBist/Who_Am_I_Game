import { useState, type FormEvent } from 'react';
import { Send } from 'lucide-react';

export function ChatInput({ onSend }: { onSend: (text: string) => void }) {
  const [text, setText] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-2 border-t border-[#1F1F1A] p-3">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Ask a question..."
        className="flex-1 rounded-md border border-[#2A2A25] bg-[#181815] px-3 py-2 text-sm text-[#F5F1E8] placeholder:text-[#5A564F] transition-colors focus:border-[#FF5A36]/40"
        autoFocus
        aria-label="Type your message"
      />
      <button
        type="submit"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#FF5A36] text-white transition-colors hover:bg-[#ff6b4a] disabled:opacity-30"
        disabled={!text.trim()}
        aria-label="Send message"
      >
        <Send className="h-4 w-4" />
      </button>
    </form>
  );
}
