export function MysteryPhoto({
  src,
  size = 'md',
  rotate = '-3.5deg',
  showQuestion = true,
  label = 'WHO?',
  float = true,
}: {
  src: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  rotate?: string;
  showQuestion?: boolean;
  label?: string;
  float?: boolean;
}) {
  const dims = {
    sm: 'w-20',
    md: 'w-28 sm:w-32',
    lg: 'w-36 sm:w-44',
    xl: 'w-44 sm:w-52',
  };
  const qSize = {
    sm: 'text-4xl',
    md: 'text-5xl',
    lg: 'text-6xl',
    xl: 'text-7xl',
  };

  return (
    <div
      className={`relative ${dims[size]} ${float ? 'animate-float' : ''}`}
      style={{ filter: 'drop-shadow(0 16px 36px rgba(0,0,0,0.6))' }}
    >
      <div className="relative bg-[#f0ebe2] p-1.5 pb-7" style={{ transform: `rotate(${rotate})` }}>
        <div className="relative aspect-[4/5] w-full overflow-hidden">
          <img
            src={src}
            alt="Mystery person"
            className="h-full w-full object-cover"
            style={{ filter: 'sepia(0.35) contrast(1.12) brightness(0.88)' }}
          />
          {showQuestion && (
            <>
              <div className="absolute inset-0 bg-black/35" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className={`font-display ${qSize[size]} font-bold text-white/85`}
                  style={{ textShadow: '0 2px 16px rgba(0,0,0,0.6)' }}
                >
                  ?
                </span>
              </div>
            </>
          )}
          {/* photo grain texture */}
          <div
            className="absolute inset-0 opacity-[0.08] mix-blend-overlay pointer-events-none"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='80' height='80' filter='url(%23n)'/%3E%3C/svg%3E\")",
            }}
          />
        </div>
        {/* handwritten label */}
        <div className="absolute bottom-1 left-0 right-0 text-center">
          <span style={{ fontFamily: "'Caveat', cursive" }} className="text-base font-semibold text-[#3a3530]">
            {label}
          </span>
        </div>
      </div>
      {/* ground shadow */}
      <div className="absolute -bottom-1 left-1/2 h-2.5 w-[70%] -translate-x-1/2 rounded-full bg-black/50 blur-md" />
    </div>
  );
}
