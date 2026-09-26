import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, UserCircle, Users } from 'lucide-react';
import { LogoMark } from '@/components/game/BrandLogo';
import { RoomCode } from '@/components/game/RoomCode';
import { ConnectionStatus } from '@/components/game/ConnectionStatus';
import { useAuth } from '@/lib/auth-context';

export function CreateRoomPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [name, setName] = useState(auth.user?.username ?? '');
  const [created, setCreated] = useState(false);

  const create = () => {
    if (!name.trim()) return;
    setCreated(true);
  };

  if (created) {
    return (
      <div className="flex min-h-screen flex-col bg-[#11110F] text-[#F5F1E8]">
        <header className="border-b border-[#1F1F1A]">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 sm:px-10">
            <div className="flex items-center gap-2.5">
              <LogoMark />
              <span className="font-display text-sm font-semibold tracking-tight">WHO AM I?</span>
            </div>
            <button
              onClick={() => navigate('/')}
              className="text-[13px] text-[#9A958B] transition-colors hover:text-[#F5F1E8]"
            >
              Leave room
            </button>
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-md text-center animate-enter-up">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#FF5A36]">
              Your room
            </p>
            <div className="mb-6 flex justify-center">
              <RoomCode code="K7Q-29P" large />
            </div>
            <p className="mb-8 text-sm text-[#9A958B]">
              Share this with one friend.
            </p>

            <div className="mb-8 flex justify-center gap-3">
              <button className="inline-flex items-center gap-2 rounded-md border border-[#2A2A25] bg-[#181815] px-4 py-2.5 text-sm font-medium text-[#F5F1E8] transition-all hover:border-[#3a3a32]">
                Copy room code
              </button>
              <button
                onClick={() => navigate('/room/K7Q-29P')}
                className="inline-flex items-center gap-2 rounded-md border border-[#2A2A25] bg-[#181815] px-4 py-2.5 text-sm font-medium text-[#F5F1E8] transition-all hover:border-[#3a3a32]"
              >
                Copy invite link
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 rounded-lg border border-[#1F1F1A] bg-[#181815] px-4 py-3">
              <ConnectionStatus connected={false} />
              <span className="text-sm text-[#9A958B]">Waiting for player 2...</span>
            </div>

            <button
              onClick={() => navigate('/room/K7Q-29P')}
              className="group mt-8 inline-flex items-center gap-2 rounded-md bg-[#FF5A36] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#ff6b4a]"
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
    <div className="flex min-h-screen flex-col bg-[#11110F] text-[#F5F1E8]">
      <header className="border-b border-[#1F1F1A]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 sm:px-10">
          <button onClick={() => navigate('/')} className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
            <LogoMark />
            <span className="font-display text-sm font-semibold tracking-tight">WHO AM I?</span>
          </button>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-[13px] text-[#9A958B] transition-colors hover:text-[#F5F1E8]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
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
                onChange={(e) => setName(e.target.value)}
                placeholder="What should your friend call you?"
                className="h-12 w-full rounded-md border border-[#2A2A25] bg-[#181815] px-4 text-base text-[#F5F1E8] placeholder:text-[#5A564F] transition-colors focus:border-[#FF5A36]/50"
                autoFocus
              />
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#5A564F]">
                Avatar (optional)
              </label>
              <div className="flex items-center gap-3 rounded-md border border-dashed border-[#2A2A25] p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#211F1B]">
                  <UserCircle className="h-6 w-6 text-[#5A564F]" />
                </div>
                <p className="text-sm text-[#5A564F]">Click to upload an avatar</p>
              </div>
            </div>

            <button
              onClick={create}
              disabled={!name.trim()}
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#FF5A36] text-base font-semibold text-white transition-all hover:bg-[#ff6b4a] disabled:opacity-30 disabled:pointer-events-none"
            >
              Create room
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
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
