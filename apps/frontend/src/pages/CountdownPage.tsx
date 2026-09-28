import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Countdown } from '@/components/game/Countdown';
import { gameSocket } from '@/services/websocket';
import { useAuth } from '@/lib/auth-context';

export function CountdownPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();

  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!roomCode || !auth.token) {
      return;
    }

    const unsubscribe = gameSocket.onMessage((event) => {
      console.log(
        'Countdown WebSocket event:',
        event
      );

      if (event.type === 'game_countdown') {
        const seconds = event.seconds;

        if (typeof seconds === 'number') {
          setCount(seconds);
        }

        return;
      }

      if (event.type === 'game_started') {
        setCount(0);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [roomCode, auth.token]);

  /*
   * Connect to WebSocket if it isn't already connected.
   */
  useEffect(() => {
    if (!auth.token) {
      return;
    }

    gameSocket.connect(auth.token);
  }, [auth.token]);

  /*
   * Server controls the countdown.
   */
  if (count !== null) {
    return (
      <Countdown
        seconds={count}
        onComplete={() => navigate(`/game/${roomCode}`)}
      />
    );
  }

  /*
   * Waiting for the server to start the countdown.
   */
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#11110F] px-6 text-[#F5F1E8]">
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

        <p className="mt-4 text-sm text-[#5A564F]">
          Waiting for the server to start the countdown...
        </p>
      </div>
    </div>
  );
}