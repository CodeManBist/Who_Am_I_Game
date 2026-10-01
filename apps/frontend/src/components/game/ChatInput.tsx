import {
  useState,
  type FormEvent,
} from 'react';

import { Send } from 'lucide-react';

type ChatInputProps = {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Ask a question...',
}: ChatInputProps) {
  const [text, setText] =
    useState('');

  const submit = (
    e: FormEvent
  ) => {
    e.preventDefault();

    if (disabled) {
      return;
    }

    const trimmed =
      text.trim();

    if (!trimmed) {
      return;
    }

    onSend(trimmed);

    setText('');
  };

  return (
    <form
      onSubmit={submit}
      className="game-send-form flex items-center gap-2 border-t border-[#1F1F1A] p-3"
    >
      <input
        value={text}
        onChange={(e) =>
          setText(e.target.value)
        }
        placeholder={placeholder}
        disabled={disabled}
        className="min-h-11 flex-1 rounded-md border border-[#2A2A25] bg-[#181815] px-3 py-2 text-base text-[#F5F1E8] placeholder:text-[#5A564F] transition-colors focus:border-[#FF5A36]/40 disabled:cursor-not-allowed sm:text-sm"
        aria-label="Type your message"
      />

      <button
        type="submit"
        disabled={
          disabled ||
          !text.trim()
        }
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#FF5A36] text-white transition-colors hover:bg-[#ff6b4a] disabled:cursor-not-allowed disabled:opacity-30 sm:h-9 sm:w-9"
        aria-label="Send message"
      >
        <Send className="h-4 w-4" />
      </button>
    </form>
  );
}
