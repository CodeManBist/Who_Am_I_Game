import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Character } from '@/lib/types';

export function CharacterGrid({
  characters,
  selectedId,
  onSelect,
}: {
  characters: Character[];
  selectedId?: string;
  onSelect: (c: Character) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {characters.map((c) => {
        const selected = c.id === selectedId;
        return (
          <button
            key={c.id}
            onClick={() => onSelect(c)}
            className={cn(
              'group relative aspect-[3/4] overflow-hidden rounded-xl border-2 transition-all',
              selected
                ? 'border-primary ring-2 ring-primary/40 scale-[1.02]'
                : 'border-border/60 hover:border-primary/40 hover:scale-[1.01]'
            )}
          >
            <img
              src={c.imageUrl}
              alt={c.archetype}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-2.5">
              <p className="text-xs font-semibold text-white/90">{c.archetype}</p>
            </div>
            {selected && (
              <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white animate-scale-in">
                <Check className="h-3.5 w-3.5" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
