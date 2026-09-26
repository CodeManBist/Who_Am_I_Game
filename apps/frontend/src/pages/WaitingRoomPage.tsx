import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Mic, MicOff, Video, VideoOff, Loader2 } from 'lucide-react';
import { LogoMark } from '@/components/game/BrandLogo';
import { RoomCode } from '@/components/game/RoomCode';
import { ConnectionStatus } from '@/components/game/ConnectionStatus';
import { LiveBadge } from '@/components/game/LiveBadge';

const PLAYER_A =
  'https://images.pexels.com/photos/7958715/pexels-photo-7958715.jpeg?auto=compress&cs=tinysrgb&w=500&h=650&fit=crop';
const PLAYER_B =
  'https://images.pexels.com/photos/34622355/pexels-photo-34622355.jpeg?auto=compress&cs=tinysrgb&w=500&h=650&fit=crop';

export function WaitingRoomPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [opponentJoined, setOpponentJoined] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setOpponentJoined(true), 2500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[#11110F] text-[#F5F1E8]">
      {/* header */}
      <header className="border-b border-[#1F1F1A]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-10">
          <div className="flex items-center gap-3">
            <LogoMark />
            <span className="font-display text-sm font-semibold tracking-tight">WHO AM I?</span>
          </div>
          <div className="flex items-center gap-3">
            <RoomCode code={roomCode ?? ''} />
            <span className="hidden items-center gap-1.5 rounded-md border border-[#2A2A25] bg-[#181815] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#9A958B] sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF5A36]" />
              Private
            </span>
          </div>
        </div>
      </header>

      {/* main split-screen */}
      <div className="flex flex-1 flex-col">
        {/* top: room info */}
        <div className="border-b border-[#1F1F1A] px-6 py-3 sm:px-10">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <span className="font-mono text-xs text-[#5A564F]">ROOM {roomCode}</span>
            {opponentJoined ? (
              <span className="flex items-center gap-2 text-xs text-[#8FCB9B] animate-enter-fade">
                <span className="h-1.5 w-1.5 rounded-full bg-[#8FCB9B]" />
                Rahul is here
              </span>
            ) : (
              <span className="flex items-center gap-2 text-xs text-[#9A958B]">
                <Loader2 className="h-3 w-3 animate-spin" />
                Waiting for your friend...
              </span>
            )}
          </div>
        </div>

        {/* split video area */}
        <div className="relative flex flex-1 items-stretch">
          {/* LEFT — your camera */}
          <div className="flex flex-1 flex-col items-center justify-center p-4 sm:p-8">
            <div className="w-full max-w-xs">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#5A564F]">
                  Your camera
                </span>
                <span className="rounded bg-[#FF5A36]/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#FF5A36]">
                  You
                </span>
              </div>
              <div
                className="relative aspect-[3/4] w-full overflow-hidden rounded-lg border border-[#2A2A25] bg-[#181815] animate-drift"
              >
                {camOn ? (
                  <img src={PLAYER_A} alt="You" className="h-full w-full object-cover opacity-85" style={{ filter: 'saturate(0.8) contrast(1.08) brightness(0.92)' }} />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <VideoOff className="h-8 w-8 text-[#5A564F]" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-2 left-2">
                  <span className="rounded bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white/80 backdrop-blur-sm">Sagar</span>
                </div>
                <div className="absolute bottom-2 right-2">
                  <LiveBadge />
                </div>
              </div>
            </div>
          </div>

          {/* CENTER — VS */}
          <div className="flex items-center justify-center px-2">
            <span className="font-display text-2xl font-bold text-[#3a3a32] sm:text-4xl">VS</span>
          </div>

          {/* RIGHT — opponent camera */}
          <div className="flex flex-1 flex-col items-center justify-center p-4 sm:p-8">
            <div className="w-full max-w-xs">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#5A564F]">
                  Opponent camera
                </span>
                {opponentJoined ? (
                  <ConnectionStatus connected label="Connected" />
                ) : (
                  <span className="text-[9px] font-semibold uppercase tracking-wide text-[#5A564F]">
                    Waiting
                  </span>
                )}
              </div>
              {opponentJoined ? (
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg border border-[#2A2A25] bg-[#181815] animate-scale-in">
                  <img src={PLAYER_B} alt="Rahul" className="h-full w-full object-cover opacity-85" style={{ filter: 'saturate(0.8) contrast(1.08) brightness(0.92)' }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-2 left-2">
                    <span className="rounded bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white/80 backdrop-blur-sm">Rahul</span>
                  </div>
                  <div className="absolute bottom-2 right-2">
                    <LiveBadge />
                  </div>
                </div>
              ) : (
                <div className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[#2A2A25] bg-[#181815]/50">
                  <Loader2 className="h-8 w-8 animate-spin text-[#5A564F]" />
                  <p className="text-xs text-[#5A564F]">Waiting for player 2...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* bottom controls + CTA */}
        <div className="border-t border-[#1F1F1A] px-6 py-5 sm:px-10">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
            {/* mic/cam controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMicOn(!micOn)}
                aria-label={micOn ? 'Mute microphone' : 'Unmute microphone'}
                className={`flex h-10 w-10 items-center justify-center rounded-md border transition-all ${
                  micOn
                    ? 'border-[#2A2A25] bg-[#181815] text-[#9A958B] hover:text-[#F5F1E8]'
                    : 'border-[#E56B6F]/30 bg-[#E56B6F]/10 text-[#E56B6F]'
                }`}
              >
                {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setCamOn(!camOn)}
                aria-label={camOn ? 'Turn off camera' : 'Turn on camera'}
                className={`flex h-10 w-10 items-center justify-center rounded-md border transition-all ${
                  camOn
                    ? 'border-[#2A2A25] bg-[#181815] text-[#9A958B] hover:text-[#F5F1E8]'
                    : 'border-[#E56B6F]/30 bg-[#E56B6F]/10 text-[#E56B6F]'
                }`}
              >
                {camOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </button>
            </div>

            {/* main action */}
            <button
              onClick={() => navigate(`/room/${roomCode}/select`)}
              disabled={!opponentJoined}
              className="group inline-flex h-12 items-center gap-2 rounded-md bg-[#FF5A36] px-6 text-base font-semibold text-white transition-all hover:bg-[#ff6b4a] disabled:opacity-30 disabled:pointer-events-none"
            >
              Choose your person
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
