import { Clock, Users, Radio } from 'lucide-react';
import { RoomCode } from './RoomCode';
import { ConnectionStatus } from './ConnectionStatus';
import { cn } from '@/lib/utils';

export function GameHeader({
  roomCode,
  turnLabel = 'YOUR TURN',
  timer = '00:42',
  className,
}: {
  roomCode: string;
  turnLabel?: string;
  timer?: string;
  className?: string;
}) {
  return (
    <header
      className={cn(
        'glass flex h-16 items-center justify-between border-b border-border/50 px-4 sm:px-6',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <span className="hidden text-sm font-bold sm:inline">Who Am I?</span>
      </div>

      <div className="flex items-center gap-3">
        <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
          {turnLabel}
        </span>
        <div className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1">
          <Clock className="h-3.5 w-3.5 text-primary" />
          <span className="font-mono text-sm font-semibold tabular-nums">{timer}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <RoomCode code={roomCode} className="hidden sm:inline-flex" />
        <ConnectionStatus connected label="Live" />
      </div>
    </header>
  );
}

export function GameTimer({ seconds }: { seconds: number }) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return (
    <span className="font-mono tabular-nums">
      {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </span>
  );
}

export function RoomInfoCard({ className }: { className?: string }) {
  const items = [
    { icon: Users, label: '2 Players' },
    { icon: Radio, label: 'Private Room' },
    { icon: Clock, label: 'Voice + Video' },
  ];
  return (
    <div className={cn('glass rounded-xl border border-border/50 p-4', className)}>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Game</p>
      <div className="space-y-2.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2.5 text-sm">
            <item.icon className="h-4 w-4 text-primary" />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
