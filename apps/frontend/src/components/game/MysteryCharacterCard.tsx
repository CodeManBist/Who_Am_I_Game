import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Character } from '@/lib/types';

export function MysteryCharacterCard({
  character,
  revealed = false,
  className,
  size = 'md',
}: {
  character?: Character;
  revealed?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizes = {
    sm: 'h-28 w-28',
    md: 'h-40 w-40',
    lg: 'h-52 w-52',
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border/60 bg-secondary/30',
        sizes[size],
        className
      )}
    >
      {revealed && character ? (
        <img src={character.imageUrl} alt={character.name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-b from-secondary/40 to-secondary/10">
          <HelpCircle className="h-8 w-8 text-primary/60" />
          <span className="text-2xl font-bold text-primary/70">???</span>
        </div>
      )}
    </div>
  );
}
