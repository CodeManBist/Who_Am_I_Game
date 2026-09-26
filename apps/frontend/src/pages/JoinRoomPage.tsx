import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { LogoMark } from '@/components/game/BrandLogo';

const PLAYER_A =
  'https://images.pexels.com/photos/7958715/pexels-photo-7958715.jpeg?auto=compress&cs=tinysrgb&w=200&h=260&fit=crop';
const PLAYER_B =
  'https://images.pexels.com/photos/34622355/pexels-photo-34622355.jpeg?auto=compress&cs=tinysrgb&w=200&h=260&fit=crop';

export function JoinRoomPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const join = () => {
    if (code.trim().toUpperCase() !== 'K7Q-29P') {
      setError('Room not found. Try K7Q-29P.');
      return;
    }
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    navigate('/room/K7Q-29P');
  };

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
                  setCode(e.target.value);
                  setError('');
                }}
                placeholder="K7Q-29P"
                className="h-12 w-full rounded-md border border-[#2A2A25] bg-[#181815] px-4 font-mono text-base uppercase tracking-wider text-[#F5F1E8] placeholder:text-[#5A564F] transition-colors focus:border-[#FF5A36]/50"
                autoFocus
              />
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#5A564F]">
                Your name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="h-12 w-full rounded-md border border-[#2A2A25] bg-[#181815] px-4 text-base text-[#F5F1E8] placeholder:text-[#5A564F] transition-colors focus:border-[#FF5A36]/50"
              />
            </div>

            {error && <p className="text-sm text-[#E56B6F]">{error}</p>}

            <button
              onClick={join}
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#FF5A36] text-base font-semibold text-white transition-all hover:bg-[#ff6b4a]"
            >
              Enter game
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>

            <p className="text-center text-sm text-[#5A564F]">
              Only two people can play in this room.
            </p>
          </div>

          {/* visual preview of two players connecting */}
          <div className="mt-10 flex items-center justify-center gap-3 opacity-50">
            <div className="relative aspect-[3/4] w-16 overflow-hidden rounded-md border border-[#2A2A25]">
              <img src={PLAYER_A} alt="Player 1" className="h-full w-full object-cover" style={{ filter: 'saturate(0.8) contrast(1.08) brightness(0.92)' }} />
            </div>
            <span className="font-display text-lg font-bold text-[#3a3a32]">VS</span>
            <div className="relative aspect-[3/4] w-16 overflow-hidden rounded-md border border-[#2A2A25]">
              <img src={PLAYER_B} alt="Player 2" className="h-full w-full object-cover" style={{ filter: 'saturate(0.8) contrast(1.08) brightness(0.92)' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
