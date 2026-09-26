import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Target } from 'lucide-react';
import { LogoMark } from '@/components/game/BrandLogo';
import { LiveBadge } from '@/components/game/LiveBadge';
import { RoomCode } from '@/components/game/RoomCode';
import { MysteryPhoto } from '@/components/game/MysteryPhoto';
import { ChatBubble, TypingIndicator } from '@/components/game/ChatBubble';
import { ChatInput } from '@/components/game/ChatInput';
import { GameControls } from '@/components/game/GameControls';
import { GuessModal } from '@/components/game/GuessModal';
import { useGame } from '@/lib/game-context';
import { MOCK_CHARACTERS } from '@/lib/mock-data';

const PLAYER_B =
  'https://images.pexels.com/photos/34622355/pexels-photo-34622355.jpeg?auto=compress&cs=tinysrgb&w=500&h=650&fit=crop';

export function GamePage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const game = useGame();
  const [seconds, setSeconds] = useState(42);
  const [guessOpen, setGuessOpen] = useState(false);
  const startedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    game.seedChat();
    game.simulateOpponentConfirm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [game.messages, game.opponentTyping]);

  const opponentCharacter = game.opponentCharacter ?? MOCK_CHARACTERS[1];
  const timeString = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  const submitGuess = (guess: string) => {
    setGuessOpen(false);
    game.submitGuess(guess, opponentCharacter.name, timeString);
    navigate(`/game/${roomCode}/result`);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#11110F] text-[#F5F1E8]">
      {/* ── TOP BAR ── */}
      <header className="flex h-14 items-center justify-between border-b border-[#1F1F1A] px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <LogoMark size={18} />
          <span className="font-display text-xs font-semibold tracking-tight hidden sm:inline">WHO AM I?</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-display text-[11px] font-semibold uppercase tracking-[0.15em] text-[#9A958B]">
            Round 01
          </span>
          <span className="font-mono text-sm tabular-nums text-[#F5F1E8]">{timeString}</span>
        </div>
        <div className="flex items-center gap-3">
          <RoomCode code={roomCode ?? ''} />
          <LiveBadge />
        </div>
      </header>

      {/* ── MAIN BODY ── */}
      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        {/* LEFT — mystery + opponent video */}
        <div className="flex flex-shrink-0 flex-col items-center gap-4 overflow-y-auto border-b border-[#1F1F1A] p-4 sm:p-6 lg:flex-1 lg:border-b-0 lg:border-r">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#FF5A36]">
            Who are they?
          </p>
          {/* mystery photo */}
          <MysteryPhoto src={opponentCharacter.imageUrl} size="md" float={false} rotate="-2deg" />
          {/* opponent video */}
          <div className="w-full max-w-xs">
            <div className="group relative aspect-[3/4] w-full overflow-hidden rounded-lg border border-[#2A2A25] bg-[#181815] animate-drift">
              <img
                src={PLAYER_B}
                alt="Rahul"
                className="h-full w-full object-cover opacity-85"
                style={{ filter: 'saturate(0.8) contrast(1.08) brightness(0.92)' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/15" />
              <div
                className="absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='80' height='80' filter='url(%23n)'/%3E%3C/svg%3E\")",
                }}
              />
              <div className="absolute left-2 top-2">
                <span className="rounded bg-black/50 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.12em] text-white/75 backdrop-blur-sm">
                  Rahul
                </span>
              </div>
              <div className="absolute right-2 top-2">
                <LiveBadge />
              </div>
              <div className="absolute bottom-2 right-2">
                <span className="flex items-center gap-1 rounded-full bg-black/50 px-1.5 py-0.5 backdrop-blur-sm">
                  <span className="h-1 w-1 rounded-full bg-[#8FCB9B]" />
                  <span className="text-[8px] text-white/60">connected</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — conversation + controls */}
        <div className="flex flex-1 flex-col overflow-hidden lg:max-w-md">
          {/* conversation header */}
          <div className="flex items-center justify-between border-b border-[#1F1F1A] px-4 py-2.5">
            <span className="text-xs font-semibold text-[#9A958B]">Game Conversation</span>
            <span className="text-[10px] text-[#5A564F]">{game.messages.length} messages</span>
          </div>

          {/* messages */}
          <div ref={scrollRef} className="flex-1 space-y-2.5 overflow-y-auto px-4 py-4">
            {game.messages.map((m) => (
              <ChatBubble key={m.id} message={m} isYou={m.senderId === game.you.id} />
            ))}
            {game.opponentTyping && <TypingIndicator name={game.opponent.name} />}
          </div>

          {/* input */}
          <ChatInput onSend={game.sendMessage} />

          {/* bottom controls */}
          <div className="border-t border-[#1F1F1A] p-3">
            <button
              onClick={() => setGuessOpen(true)}
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#FF5A36] text-base font-semibold text-white transition-all hover:bg-[#ff6b4a]"
            >
              <Target className="h-4 w-4" />
              Make your guess
            </button>
            <div className="mt-3 flex items-center justify-center">
              <GameControls onLeave={() => navigate('/')} />
            </div>
          </div>
        </div>
      </div>

      <GuessModal open={guessOpen} onOpenChange={setGuessOpen} onSubmit={submitGuess} />
    </div>
  );
}
