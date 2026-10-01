import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowLeft,
  Users,
  Loader2,
  Check,
  Copy,
} from 'lucide-react';

import { LogoMark } from '@/components/game/BrandLogo';
import { MobileMenu } from '@/components/game/MobileMenu';
import { RoomCode } from '@/components/game/RoomCode';
import { ConnectionStatus } from '@/components/game/ConnectionStatus';
import { useAuth } from '@/lib/auth-context';

const API_URL = 'http://localhost:3001/api/v1';

export function CreateRoomPage() {
  const navigate = useNavigate();
  const auth = useAuth();

  const [name, setName] = useState(auth.user?.username ?? '');
  const [created, setCreated] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  const create = async () => {
    if (!name.trim()) return;

    if (!auth.token) {
      navigate('/auth?redirect=/create');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_URL}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
      });

      const data = await response.json();

      console.log('Create room response:', data);

      if (!response.ok) {
        setError(
          data?.error ||
            data?.message ||
            'Failed to create room.'
        );
        return;
      }

      // Backend response:
      // {
      //   message: "Room created successfully",
      //   game: {
      //     id: "...",
      //     roomCode: "E63T47",
      //     status: "WAITING"
      //   }
      // }

      const newRoomCode =
        data?.game?.roomCode ||
        data?.roomCode ||
        data?.room?.roomCode;

      console.log('Extracted room code:', newRoomCode);

      if (!newRoomCode) {
        console.error('Create room response:', data);

        setError(
          'Room was created, but no room code was returned.'
        );
        return;
      }

      setRoomCode(newRoomCode);
      setCreated(true);
    } catch (error) {
      console.error('Create room error:', error);

      setError(
        error instanceof Error
          ? error.message
          : 'Unable to connect to the server.'
      );
    } finally {
      setLoading(false);
    }
  };

  const copyRoomCode = async () => {
    if (!roomCode) return;

    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied('code');
      window.setTimeout(() => setCopied(null), 1800);
    } catch (error) {
      console.error('Failed to copy room code:', error);
    }
  };

  const copyInviteLink = async () => {
    if (!roomCode) return;

    const inviteLink =
      `${window.location.origin}/room/${roomCode}`;

    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied('link');
      window.setTimeout(() => setCopied(null), 1800);
    } catch (error) {
      console.error('Failed to copy invite link:', error);
    }
  };

  if (created) {
    return (
      <div className="flex min-h-[100dvh] flex-col bg-[#11110F] text-[#F5F1E8]">
        <header className="border-b border-[#1F1F1A]">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)] sm:px-10 sm:py-5">
            <div className="flex items-center gap-2.5">
              <LogoMark />

              <span className="hidden font-display text-sm font-semibold tracking-tight sm:inline">
                WHO AM I?
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => navigate('/')}
                className="min-h-11 rounded-lg px-2.5 text-[13px] text-[#9A958B] transition-colors hover:bg-[#181815] hover:text-[#F5F1E8]"
              >
                Leave room
              </button>
              <MobileMenu />
            </div>
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
          <div className="w-full max-w-md text-center animate-enter-up">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#FF5A36]">
              Your room
            </p>

            <div className="mb-6 flex justify-center">
              <RoomCode
                code={roomCode}
                large
              />
            </div>

            <p className="mx-auto mb-2 max-w-sm text-sm text-[#9A958B]">
              This game needs two players. Share the invite link and wait for your friend to join before choosing characters.
            </p>

            <p className="mb-8 text-xs text-[#5A564F]">
              They can open the link on any phone or browser.
            </p>

            <div className="mb-8 flex flex-col justify-center gap-2 sm:flex-row sm:gap-3">
              <button
                onClick={copyRoomCode}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-[#2A2A25] bg-[#181815] px-4 py-2.5 text-sm font-medium text-[#F5F1E8] transition-all hover:border-[#3a3a32] sm:w-auto"
              >
                {copied === 'code' ? <Check className="h-4 w-4 text-[#8FCB9B]" /> : <Copy className="h-4 w-4" />}
                {copied === 'code' ? 'Copied' : 'Copy room code'}
              </button>

              <button
                onClick={copyInviteLink}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-[#2A2A25] bg-[#181815] px-4 py-2.5 text-sm font-medium text-[#F5F1E8] transition-all hover:border-[#3a3a32] sm:w-auto"
              >
                {copied === 'link' ? <Check className="h-4 w-4 text-[#8FCB9B]" /> : <Copy className="h-4 w-4" />}
                {copied === 'link' ? 'Copied' : 'Copy invite link'}
              </button>
            </div>

            <div className="flex items-start justify-center gap-3 rounded-lg border border-[#1F1F1A] bg-[#181815] px-4 py-3 text-left">
              <ConnectionStatus
                connected={auth.isAuthenticated}
              />

              <div>
                <p className="text-sm text-[#9A958B]">
                  Waiting for player 2
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[#5A564F]">
                  The character selection unlocks as soon as your friend joins this room.
                </p>
              </div>
            </div>

            <button
              onClick={() =>
                navigate(`/room/${roomCode}`)
              }
              className="group mt-8 inline-flex min-h-11 items-center gap-2 rounded-md bg-[#FF5A36] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#ff6b4a]"
            >
              Enter room

              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            Let's get a room ready.
          </h1>

          <p className="mt-2 text-sm text-[#9A958B]">
            Set up a private game and invite a friend.
          </p>

          <div className="mt-8 space-y-5">
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
                placeholder="What should your friend call you?"
                disabled={loading}
                className="h-12 w-full rounded-md border border-[#2A2A25] bg-[#181815] px-4 text-base text-[#F5F1E8] placeholder:text-[#5A564F] transition-colors focus:border-[#FF5A36]/50 disabled:cursor-not-allowed disabled:opacity-50"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-sm text-[#E56B6F]">
                {error}
              </p>
            )}

            <button
              onClick={() => void create()}
              disabled={!name.trim() || loading}
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#FF5A36] text-base font-semibold text-white transition-all hover:bg-[#ff6b4a] disabled:pointer-events-none disabled:opacity-30"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating room...
                </>
              ) : (
                <>
                  Create room

                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-sm text-[#5A564F]">
              <Users className="h-4 w-4" />

              Only you and one friend can join this room.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
