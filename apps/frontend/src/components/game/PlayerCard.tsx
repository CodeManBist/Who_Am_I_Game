import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { Player } from '@/lib/types';
import { ConnectionStatus } from './ConnectionStatus';

export function PlayerAvatar({
  player,
  size = 'md',
  className,
}: {
  player: Player;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const sizes = {
    sm: 'h-10 w-10',
    md: 'h-14 w-14',
    lg: 'h-20 w-20',
    xl: 'h-28 w-28',
  };

  return (
    <Avatar className={cn(sizes[size], 'ring-2 ring-border', className)}>
      <AvatarImage src={player.avatarUrl} alt={player.name} />
      <AvatarFallback className="bg-secondary text-sm font-semibold">
        {player.name.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}

export function PlayerCard({
  player,
  className,
  compact = false,
}: {
  player: Player;
  className?: string;
  compact?: boolean;
}) {
  const connected = player.status === 'host' || player.status === 'connected';

  return (
    <div
      className={cn(
        'glass relative flex flex-col items-center gap-3 rounded-2xl border border-border/60 p-5 transition-all',
        player.isYou && 'ring-1 ring-primary/40',
        className
      )}
    >
      <div className="relative">
        <PlayerAvatar player={player} size={compact ? 'md' : 'lg'} />
        {connected && (
          <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-card bg-green-400" />
        )}
      </div>
      <div className="text-center">
        <p className="font-semibold">{player.name}</p>
        <div className="mt-1 flex items-center justify-center gap-2">
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
              player.isYou
                ? 'bg-primary/15 text-primary'
                : 'bg-secondary text-muted-foreground'
            )}
          >
            {player.isYou ? 'You' : player.status === 'connected' ? 'Connected' : 'Waiting'}
          </span>
        </div>
      </div>
      <ConnectionStatus connected={connected} className="absolute right-3 top-3" />
    </div>
  );
}
