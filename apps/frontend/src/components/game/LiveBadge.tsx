export function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF5A36] opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#FF5A36]" />
      </span>
      <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#FF5A36]">Live</span>
    </span>
  );
}
