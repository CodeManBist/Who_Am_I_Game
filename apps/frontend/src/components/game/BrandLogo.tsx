export function LogoMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className="shrink-0">
      <rect x="0.5" y="0.5" width="19" height="19" rx="3" stroke="currentColor" strokeWidth="1" opacity="0.25" />
      <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.2" />
      <path d="M10 7V4M10 13V16M7 10H4M13 10H16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="10" cy="10" r="0.8" fill="#FF5A36" />
    </svg>
  );
}

export function BrandLogo({ size = 20 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark size={size} />
      <span className="font-display text-sm font-semibold tracking-tight">WHO AM I?</span>
    </div>
  );
}
