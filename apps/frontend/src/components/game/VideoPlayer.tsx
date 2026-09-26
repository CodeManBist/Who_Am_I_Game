import { Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Player } from '@/lib/types';
import { PlayerAvatar } from './PlayerCard';
import { ConnectionStatus } from './ConnectionStatus';

export function VideoPlayer({
  player,
  micOn = true,
  cameraOn = true,
  className,
  size = 'md',
}: {
  player: Player;
  micOn?: boolean;
  cameraOn?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const heights = {
    sm: 'aspect-video',
    md: 'aspect-video',
    lg: 'aspect-video',
  };

  return (
    <div
      className={cn(
        'video-gradient relative overflow-hidden rounded-2xl border border-border/60',
        heights[size],
        className
      )}
    >
      {/* subtle noise overlay */}
      <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence baseFrequency=\'0.9\'/%3E%3C/filter%3E%3Crect width=\'100\' height=\'100\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }} />

      {/* avatar center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <PlayerAvatar player={player} size={size === 'lg' ? 'xl' : 'lg'} className="opacity-90 ring-white/10" />
      </div>

      {/* top bar: name + connection */}
      <div className="absolute left-3 top-3 flex items-center gap-2">
        <span className="rounded-md bg-black/40 px-2 py-1 text-xs font-medium backdrop-blur-sm">
          {player.name}
        </span>
      </div>
      <ConnectionStatus connected className="absolute right-3 top-3" />

      {/* bottom bar: mic/cam controls */}
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 backdrop-blur-sm">
        <span className={cn('flex h-6 w-6 items-center justify-center rounded-full', micOn ? 'bg-white/10' : 'bg-red-500/20')}>
          {micOn ? <Mic className="h-3 w-3 text-white" /> : <MicOff className="h-3 w-3 text-red-400" />}
        </span>
        <span className={cn('flex h-6 w-6 items-center justify-center rounded-full', cameraOn ? 'bg-white/10' : 'bg-red-500/20')}>
          {cameraOn ? <Video className="h-3 w-3 text-white" /> : <VideoOff className="h-3 w-3 text-red-400" />}
        </span>
      </div>
    </div>
  );
}
