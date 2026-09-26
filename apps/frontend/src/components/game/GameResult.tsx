import { Trophy, RotateCw, Home, Clock, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Character, GameResult } from '@/lib/types';
import { Button } from '@/components/ui/button';

export function GameResult({
  result,
  character,
  onPlayAgain,
  onHome,
}: {
  result: GameResult;
  character?: Character;
  onPlayAgain: () => void;
  onHome: () => void;
}) {
  const correct = result.correct;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      {/* celebration / somber bg */}
      {correct && (
        <>
          {[...Array(20)].map((_, i) => (
            <span
              key={i}
              className="absolute top-0 h-2 w-2 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                background: ['hsl(256 89% 68%)', 'hsl(190 90% 55%)', 'hsl(140 70% 50%)'][i % 3],
                animation: `confetti-fall ${2 + Math.random() * 2}s ease-in ${Math.random()}s infinite`,
              }}
            />
          ))}
        </>
      )}
      <div
        className={cn(
          'absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl',
          correct ? 'bg-green-500/10' : 'bg-red-500/8'
        )}
      />

      <div className="relative w-full max-w-md text-center">
        {/* character reveal */}
        {character && (
          <div className="mx-auto mb-6 h-40 w-40 overflow-hidden rounded-3xl border-2 border-border/60 animate-scale-in">
            <img src={character.imageUrl} alt={character.name} className="h-full w-full object-cover" />
          </div>
        )}

        {correct ? (
          <>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-green-500/15 px-4 py-1.5 ring-1 ring-green-500/30">
              <Trophy className="h-4 w-4 text-green-400" />
              <span className="text-sm font-semibold text-green-400">You won!</span>
            </div>
            <h1 className="mb-2 text-5xl font-black tracking-tight sm:text-6xl">
              <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                YOU GOT IT!
              </span>
            </h1>
            <p className="mb-1 text-lg text-muted-foreground">
              You figured out <span className="font-semibold text-foreground">{result.loserName}'s</span> mystery person.
            </p>
          </>
        ) : (
          <>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-red-500/15 px-4 py-1.5 ring-1 ring-red-500/30">
              <span className="text-sm font-semibold text-red-400">{result.winnerName} won</span>
            </div>
            <h1 className="mb-2 text-5xl font-black tracking-tight sm:text-6xl">Not quite!</h1>
            <p className="mb-1 text-lg text-muted-foreground">
              The mystery person was <span className="font-semibold text-foreground">{result.actualName}</span>.
            </p>
          </>
        )}

        <p className="mb-6 text-xl font-bold text-primary">{character?.name}</p>

        {/* stats */}
        <div className="mx-auto mb-8 flex max-w-xs items-center justify-center gap-6">
          <div className="flex flex-col items-center gap-1">
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-2xl font-bold">{result.questionsAsked}</span>
            <span className="text-xs text-muted-foreground">Questions</span>
          </div>
          <div className="h-10 w-px bg-border" />
          <div className="flex flex-col items-center gap-1">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-2xl font-bold">{result.timeElapsed}</span>
            <span className="text-xs text-muted-foreground">Time</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={onPlayAgain} size="lg" className="gap-2">
            <RotateCw className="h-4 w-4" />
            Play Again
          </Button>
          <Button variant="outline" onClick={onHome} size="lg" className="gap-2">
            <Home className="h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
