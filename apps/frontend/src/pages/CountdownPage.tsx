import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Countdown } from '@/components/game/Countdown';

export function CountdownPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [started, setStarted] = useState(false);

  return (
    <div className="relative min-h-screen bg-[#11110F]">
      {!started ? (
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
          <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#8FCB9B]/8 blur-3xl" />
          <div className="relative text-center animate-scale-in">
            <div className="mb-6 inline-flex items-center gap-2 rounded-md bg-[#8FCB9B]/12 px-4 py-2 ring-1 ring-[#8FCB9B]/25">
              <CheckCircle2 className="h-4 w-4 text-[#8FCB9B]" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8FCB9B]">
                Both players ready
              </span>
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
              Get ready to play
            </h1>
            <button
              onClick={() => setStarted(true)}
              className="group mt-8 inline-flex h-12 items-center gap-2 rounded-md bg-[#FF5A36] px-8 text-base font-semibold text-white transition-all hover:bg-[#ff6b4a]"
            >
              Simulate countdown
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="transition-transform group-hover:translate-x-0.5">
                <path d="M1 7H13M13 7L7 1M13 7L7 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            <p className="mt-4 text-sm text-[#5A564F]">
              The countdown will begin when both players confirm
            </p>
          </div>
        </div>
      ) : (
        <Countdown onComplete={() => navigate(`/game/${roomCode}`)} />
      )}
    </div>
  );
}
