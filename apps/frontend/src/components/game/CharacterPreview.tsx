import { Sparkles, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Character } from '@/lib/types';
import { Button } from '@/components/ui/button';

export function CharacterPreview({
  character,
  onConfirm,
  onChooseAnother,
  className,
}: {
  character: Character;
  onConfirm: () => void;
  onChooseAnother: () => void;
  className?: string;
}) {
  return (
    <div className={cn('glass rounded-2xl border border-border/60 p-5', className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-xl border border-border/60 mx-auto sm:mx-0">
          <img src={character.imageUrl} alt={character.name} className="h-full w-full object-cover" />
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Your mystery person</p>
            <p className="text-lg font-bold">{character.name}</p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 ring-1 ring-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">AI identified this as</span>
            <span className="text-sm font-semibold text-primary">{character.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Confidence</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${character.confidence}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-primary">{character.confidence}%</span>
          </div>
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onChooseAnother}>
          Choose Another
        </Button>
        <Button onClick={onConfirm} className="gap-2">
          <Check className="h-4 w-4" />
          Confirm Character
        </Button>
      </div>
    </div>
  );
}
