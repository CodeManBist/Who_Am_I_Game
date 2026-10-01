import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, RotateCw, MessageCircle, Clock } from 'lucide-react';
import { useGame } from '@/lib/game-context';
import type { GameResult as GameResultType } from '@/lib/types';
import { MobileMenu } from '@/components/game/MobileMenu';

const API_URL = 'http://localhost:3001/api/v1';

export function GameResultPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const game = useGame();
  const [result, setResult] = useState<GameResultType | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadResult = async () => {
      if (!roomCode || !game.you) return;
      const token = localStorage.getItem('whoami-token');
      if (!token) return;
      try {
        const response = await fetch(`${API_URL}/rooms/${encodeURIComponent(roomCode)}/result`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || data?.message || 'Could not load result');
        const correct = data.result === 'WIN';
        setResult({
          correct,
          guess: data.winningGuess || '',
          actualName: data.actualCharacterName || 'Unknown',
          questionsAsked: data.questionCount ?? 0,
          timeElapsed: data.game?.startedAt && data.game?.endedAt
            ? new Date(new Date(data.game.endedAt).getTime() - new Date(data.game.startedAt).getTime()).toISOString().slice(14, 19)
            : '00:00',
          winnerName: data.winnerName || '',
          loserName: data.loserName || '',
        });
        setImageUrl(data.actualCharacterImageUrl || null);
      } catch (error) {
        console.error('Failed to load game result:', error);
      }
    };
    void loadResult();
  }, [roomCode, game.you?.userId]);

  useEffect(() => {
    if (!roomCode || !result) return;
    const interval = window.setInterval(async () => {
      const token = localStorage.getItem('whoami-token');
      if (!token) return;
      try {
        const response = await fetch(`${API_URL}/rooms/${encodeURIComponent(roomCode)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok && data.game?.status === 'WAITING') {
          game.reset();
          navigate(`/room/${roomCode}/select`, { replace: true });
        }
      } catch (error) {
        console.error('Could not refresh room state:', error);
      }
    }, 2500);
    return () => window.clearInterval(interval);
  }, [roomCode, result, game.reset, navigate]);

  const startRematch = async () => {
    if (!roomCode) return;
    const token = localStorage.getItem('whoami-token');
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/rooms/${encodeURIComponent(roomCode)}/rematch`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || 'Could not start rematch');
      game.reset();
      navigate(`/room/${roomCode}/select`);
    } catch (error) {
      console.error('Could not start rematch:', error);
    }
  };

  if (!result) return <div className="flex min-h-[100dvh] items-center justify-center px-4 text-center bg-[#11110F] text-[#F5F1E8]">Loading result...</div>;

  const correct = result.correct;

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-start overflow-x-clip bg-[#11110F] px-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-[calc(env(safe-area-inset-top)+4rem)] text-[#F5F1E8] sm:justify-center sm:px-6 sm:py-12">
      <div className="absolute right-4 top-[calc(env(safe-area-inset-top)+0.75rem)] z-20 sm:right-6"><MobileMenu /></div>
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
        {imageUrl && <div className="mx-auto mb-6 w-36 sm:w-44 animate-scale-in">
          <div
            className="relative bg-[#f0ebe2] p-1.5 pb-7"
            style={{ transform: 'rotate(2deg)', filter: 'drop-shadow(0 16px 36px rgba(0,0,0,0.6))' }}
          >
            <div className="relative aspect-[4/5] w-full overflow-hidden">
              <img
                src={imageUrl || ''}
                alt={result.actualName}
                className="h-full w-full object-cover"
                style={{ filter: 'sepia(0.2) contrast(1.1) brightness(0.95)' }}
              />
            </div>
            <span
              style={{ fontFamily: "'Caveat', cursive" }}
              className="absolute bottom-1 left-0 right-0 text-center text-base font-semibold text-[#3a3530]"
            >
              {result.actualName}
            </span>
          </div>
        </div>}

        {/* result heading */}
        {correct ? (
          <>
            <div className="mb-2 inline-flex items-center gap-2 rounded-md bg-[#8FCB9B]/12 px-3 py-1 ring-1 ring-[#8FCB9B]/25">
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8FCB9B]">You won</span>
            </div>
            <h1 className="font-display text-3xl font-black tracking-tight sm:text-5xl">
              <span className="text-[#8FCB9B]">YOU GOT THEM.</span>
            </h1>
            <p className="mt-3 text-sm text-[#9A958B]">You knew it.</p>
          </>
        ) : (
          <>
            <div className="mb-2 inline-flex items-center gap-2 rounded-md bg-[#E56B6F]/12 px-3 py-1 ring-1 ring-[#E56B6F]/25">
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#E56B6F]">
                {result.winnerName ? `${result.winnerName} won` : 'Game ended'}
              </span>
            </div>
            <h1 className="font-display text-3xl font-black tracking-tight sm:text-5xl">
              NOT THIS TIME.
            </h1>
            <p className="mt-3 text-sm text-[#9A958B]">
              {!result.winnerName
                ? 'The game ended before a guess was made.'
                : result.loserName === game.you?.name
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
            onClick={startRematch}
            className="group inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-[#FF5A36] px-6 text-base font-semibold text-white transition-all hover:bg-[#ff6b4a] sm:w-auto"
          >
            <RotateCw className="h-4 w-4" />
            Play again
          </button>
          <button
            onClick={() => {
              game.reset();
              navigate('/');
            }}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-[#2A2A25] bg-[#181815] px-6 text-base font-medium text-[#F5F1E8] transition-all hover:border-[#3a3a32] hover:bg-[#211F1B] sm:w-auto"
          >
            Leave room
          </button>
        </div>
      </div>
    </div>
  );
}
