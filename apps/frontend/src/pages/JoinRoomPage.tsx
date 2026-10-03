import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Loader2, Video } from 'lucide-react';

import { LogoMark } from '@/components/game/BrandLogo';
import { MobileMenu } from '@/components/game/MobileMenu';
import { useAuth } from '@/lib/auth-context';

const API_URL = 'http://localhost:3001/api/v1';

export function JoinRoomPage() {
  const navigate = useNavigate();
  const auth = useAuth();

  const [code, setCode] = useState('');
  const [name, setName] = useState(auth.user?.username ?? '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const join = async () => {
    const roomCode = code.trim().toUpperCase();

    if (!roomCode) {
      setError('Please enter a room code.');
      return;
    }

    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }

    if (!auth.token) {
      navigate(`/auth?redirect=/join`);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        `${API_URL}/rooms/${encodeURIComponent(roomCode)}/join`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth.token}`,
          },
        }
      );

      const data = await response.json();

      console.log('Join room response:', data);

      if (!response.ok) {
        setError(
          data?.error ||
            data?.message ||
            'Unable to join the room.'
        );
        return;
      }

      /*
       * The backend has successfully added Player 2.
       *
       * We already know the room code because it came
       * directly from the input.
       */

      navigate(`/room/${roomCode}`);
    } catch (error) {
      console.error('Join room error:', error);

      setError(
        error instanceof Error
          ? error.message
          : 'Unable to connect to the server.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#11110F] text-[#F5F1E8]">
      <header className="border-b border-[#1F1F1A]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)] sm:px-10 sm:py-5">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            <LogoMark />

            <span className="hidden font-display text-sm font-semibold tracking-tight sm:inline">
              WHO AM I?
            </span>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 text-[13px] text-[#9A958B] transition-colors hover:bg-[#181815] hover:text-[#F5F1E8]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
            <MobileMenu />
          </div>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        <div className="w-full max-w-md animate-enter-up">
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Someone invited you.
          </h1>

          <p className="mt-2 text-sm text-[#9A958B]">
            Enter the room code your friend shared with you.
          </p>

          <div className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#5A564F]">
                Room code
              </label>

              <input
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    void join();
                  }
                }}
                placeholder="E63T47"
                disabled={loading}
                className="h-12 w-full rounded-md border border-[#2A2A25] bg-[#181815] px-4 font-mono text-base uppercase tracking-wider text-[#F5F1E8] placeholder:text-[#5A564F] transition-colors focus:border-[#FF5A36]/50 disabled:cursor-not-allowed disabled:opacity-50"
                autoFocus
              />
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#5A564F]">
                Your name
              </label>

              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    void join();
                  }
                }}
                placeholder="Your name"
                disabled={loading}
                className="h-12 w-full rounded-md border border-[#2A2A25] bg-[#181815] px-4 text-base text-[#F5F1E8] placeholder:text-[#5A564F] transition-colors focus:border-[#FF5A36]/50 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {error && (
              <p className="text-sm text-[#E56B6F]">
                {error}
              </p>
            )}

            <button
              onClick={() => void join()}
              disabled={loading}
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#FF5A36] text-base font-semibold text-white transition-all hover:bg-[#ff6b4a] disabled:pointer-events-none disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Joining room...
                </>
              ) : (
                <>
                  Enter game

                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>

            <p className="text-center text-sm text-[#5A564F]">
              Only two people can play in this room.
            </p>
          </div>

          {/* visual preview of two players connecting */}
          <div className="mt-10 flex items-center justify-center gap-3 opacity-50">
            <div className="relative aspect-[3/4] w-16 overflow-hidden rounded-md border border-[#2A2A25]">
              <video autoPlay muted playsInline className="h-full w-full object-cover opacity-70" aria-label="Player 1 live video" />
              <div className="absolute inset-0 flex items-center justify-center"><Video className="h-4 w-4 text-[#5A564F]" /></div>
            </div>

            <span className="font-display text-lg font-bold text-[#3a3a32]">
              VS
            </span>

            <div className="relative aspect-[3/4] w-16 overflow-hidden rounded-md border border-[#2A2A25]">
              <video autoPlay muted playsInline className="h-full w-full object-cover opacity-70" aria-label="Player 2 live video" />
              <div className="absolute inset-0 flex items-center justify-center"><Video className="h-4 w-4 text-[#5A564F]" /></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
