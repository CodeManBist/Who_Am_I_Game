import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export function RoomCode({
  code,
  className = '',
  large = false,
}: {
  code: string;
  className?: string;
  large?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (large) {
    return (
      <button
        onClick={copy}
        className={`group inline-flex items-center gap-3 rounded-lg border border-[#2A2A25] bg-[#181815] px-6 py-3 transition-all hover:border-[#FF5A36]/40 ${className}`}
      >
        <span className="font-display text-3xl font-bold tracking-[0.1em]">{code}</span>
        {copied ? (
          <Check className="h-5 w-5 text-[#8FCB9B]" />
        ) : (
          <Copy className="h-5 w-5 text-[#5A564F] transition-colors group-hover:text-[#9A958B]" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={copy}
      className={`group inline-flex items-center gap-2 rounded-md border border-[#2A2A25] bg-[#181815] px-2.5 py-1 font-mono text-xs font-semibold tracking-wider transition-all hover:border-[#FF5A36]/40 ${className}`}
    >
      <span>{code}</span>
      {copied ? (
        <Check className="h-3 w-3 text-[#8FCB9B]" />
      ) : (
        <Copy className="h-3 w-3 text-[#5A564F] transition-colors group-hover:text-[#9A958B]" />
      )}
    </button>
  );
}
