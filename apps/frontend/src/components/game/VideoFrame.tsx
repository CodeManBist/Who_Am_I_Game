import { Mic, Video } from 'lucide-react';

export function VideoFrame({
  src,
  label,
  micOn = true,
  camOn = true,
  connected = true,
  delay = '0s',
  rotate = '0deg',
  className = '',
}: {
  src: string;
  label: string;
  micOn?: boolean;
  camOn?: boolean;
  connected?: boolean;
  delay?: string;
  rotate?: string;
  className?: string;
}) {
  return (
    <div
      style={{ animation: `drift 10s ease-in-out infinite ${delay}`, transform: `rotate(${rotate})` }}
      className={className}
    >
      <div className="group relative aspect-[3/4] w-full overflow-hidden rounded-md border border-[#2A2A25] bg-[#181815]">
        {camOn ? (
          <img
            src={src}
            alt={label}
            className="h-full w-full object-cover opacity-85 transition-all duration-700 group-hover:opacity-95 group-hover:scale-[1.03]"
            style={{ filter: 'saturate(0.8) contrast(1.08) brightness(0.92)' }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#181815]">
            <Video className="h-6 w-6 text-[#5A564F]" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/15" />

        {/* grain texture */}
        <div
          className="absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='80' height='80' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />

        {/* top-left label */}
        <div className="absolute left-2 top-2">
          <span className="rounded bg-black/50 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.12em] text-white/75 backdrop-blur-sm">
            {label}
          </span>
        </div>

        {/* bottom controls */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1">
          <span className="flex items-center gap-1 rounded-full bg-black/50 px-1.5 py-0.5 backdrop-blur-sm">
            <Mic className="h-2.5 w-2.5" style={{ color: micOn ? '#8FCB9B' : '#E56B6F' }} />
          </span>
          <span className="flex items-center gap-1 rounded-full bg-black/50 px-1.5 py-0.5 backdrop-blur-sm">
            <Video className="h-2.5 w-2.5" style={{ color: camOn ? '#8FCB9B' : '#E56B6F' }} />
          </span>
        </div>

        {/* bottom-right connection */}
        <div className="absolute bottom-2 right-2">
          <span className="flex items-center gap-1 rounded-full bg-black/50 px-1.5 py-0.5 backdrop-blur-sm">
            <span className={`h-1 w-1 rounded-full ${connected ? 'bg-[#8FCB9B]' : 'bg-[#E56B6F]'}`} />
            <span className="text-[8px] text-white/60">{connected ? 'connected' : 'offline'}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
