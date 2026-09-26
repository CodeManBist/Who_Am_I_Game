import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, RotateCw, MessageCircle, Clock } from 'lucide-react';
import { useGame } from '@/lib/game-context';
import { MOCK_CHARACTERS } from '@/lib/mock-data';
import type { GameResult as GameResultType } from '@/lib/types';

export function GameResultPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const game = useGame();

  const result: GameResultType = game.result ?? {
    correct: true,
    guess: 'Lionel Messi',
    actualName: 'Lionel Messi',
    questionsAsked: 7,
    timeElapsed: '01:24',
    winnerName: 'Sagar',
    loserName: 'Rahul',
  };

  const character = MOCK_CHARACTERS.find((c) => c.name === result.actualName) ?? MOCK_CHARACTERS[0];
  const correct = result.correct;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#11110F] text-[#F5F1E8] px-6 py-12">
      {/* ambient glow */}
      <div
        className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ backgroundColor: correct ? 'rgba(143,203,155,0.08)' : 'rgba(229,107,111,0.06)' }}
      />

      {/* restrained confetti for correct */}
      {correct && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <span
              key={i}
              className="absolute top-0 h-1.5 w-1.5 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: ['#FF5A36', '#8FCB9B', '#F5F1E8'][i % 3],
                animation: `confetti-fall ${2.5 + Math.random() * 2}s ease-in ${Math.random() * 0.5}s infinite`,
              }}
            />
          ))}
        </div>
      )}

      <div className="relative w-full max-w-md text-center">
        {/* reveal photo */}
        <div className="mx-auto mb-6 w-36 sm:w-44 animate-scale-in">
          <div
            className="relative bg-[#f0ebe2] p-1.5 pb-7"
            style={{ transform: 'rotate(2deg)', filter: 'drop-shadow(0 16px 36px rgba(0,0,0,0.6))' }}
          >
            <div className="relative aspect-[4/5] w-full overflow-hidden">
              <img
                src={character.imageUrl}
                alt={character.name}
                className="h-full w-full object-cover"
                style={{ filter: 'sepia(0.2) contrast(1.1) brightness(0.95)' }}
              />
            </div>
            <span
              style={{ fontFamily: "'Caveat', cursive" }}
              className="absolute bottom-1 left-0 right-0 text-center text-base font-semibold text-[#3a3530]"
            >
              {character.name}
            </span>
          </div>
        </div>

        {/* result heading */}
        {correct ? (
          <>
            <div className="mb-2 inline-flex items-center gap-2 rounded-md bg-[#8FCB9B]/12 px-3 py-1 ring-1 ring-[#8FCB9B]/25">
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8FCB9B]">You won</span>
            </div>
            <h1 className="font-display text-4xl font-black tracking-tight sm:text-5xl">
              <span className="text-[#8FCB9B]">YOU GOT THEM.</span>
            </h1>
            <p className="mt-3 text-sm text-[#9A958B]">You knew it.</p>
          </>
        ) : (
          <>
            <div className="mb-2 inline-flex items-center gap-2 rounded-md bg-[#E56B6F]/12 px-3 py-1 ring-1 ring-[#E56B6F]/25">
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#E56B6F]">
                {result.winnerName} won
              </span>
            </div>
            <h1 className="font-display text-4xl font-black tracking-tight sm:text-5xl">
              NOT THIS TIME.
            </h1>
            <p className="mt-3 text-sm text-[#9A958B]">
              {result.loserName === game.you.name
                ? `${result.winnerName} had you fooled.`
                : `The mystery person was ${result.actualName}.`
              }
            </p>
          </>
        )}

        {/* stats */}
        <div className="mx-auto mt-6 flex max-w-xs items-center justify-center gap-6">
          <div className="flex flex-col items-center gap-1">
            <MessageCircle className="h-4 w-4 text-[#5A564F]" />
            <span className="text-xl font-bold">{result.questionsAsked}</span>
            <span className="text-[10px] uppercase tracking-wide text-[#5A564F]">Questions</span>
          </div>
          <div className="h-8 w-px bg-[#2A2A25]" />
          <div className="flex flex-col items-center gap-1">
            <Clock className="h-4 w-4 text-[#5A564F]" />
            <span className="text-xl font-bold">{result.timeElapsed}</span>
            <span className="text-[10px] uppercase tracking-wide text-[#5A564F]">Time</span>
          </div>
        </div>

        {/* buttons */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => {
              game.reset();
              navigate(`/room/${roomCode}/select`);
            }}
            className="group inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#FF5A36] px-6 text-base font-semibold text-white transition-all hover:bg-[#ff6b4a]"
          >
            <RotateCw className="h-4 w-4" />
            Play again
          </button>
          <button
            onClick={() => {
              game.reset();
              navigate('/');
            }}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-[#2A2A25] bg-[#181815] px-6 text-base font-medium text-[#F5F1E8] transition-all hover:border-[#3a3a32] hover:bg-[#211F1B]"
          >
            Leave room
          </button>
        </div>
      </div>
    </div>
  );
}
