export function ConnectionStatus({
  connected,
  label,
  className = '',
}: {
  connected: boolean;
  label?: string;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="relative flex h-2 w-2">
        {connected && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#8FCB9B] opacity-60" />
        )}
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${
            connected ? 'bg-[#8FCB9B]' : 'bg-[#5A564F]'
          }`}
        />
      </span>
      {label && (
        <span className={`text-[10px] font-medium ${connected ? 'text-[#8FCB9B]' : 'text-[#5A564F]'}`}>
          {label}
        </span>
      )}
    </span>
  );
}
