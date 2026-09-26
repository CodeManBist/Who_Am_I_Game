import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, Check, Loader2, Sparkles } from 'lucide-react';
import { LogoMark } from '@/components/game/BrandLogo';
import { MOCK_CHARACTERS } from '@/lib/mock-data';
import type { Character } from '@/lib/types';

export function CharacterSelectPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Character | null>(null);
  const [identifying, setIdentifying] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleSelect = (c: Character) => {
    setSelected(c);
    setIdentifying(true);
    setTimeout(() => setIdentifying(false), 1800);
  };

  const confirm = () => {
    setConfirmed(true);
    setTimeout(() => {
      navigate(`/room/${roomCode}/countdown`);
    }, 2200);
  };

  if (confirmed) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#11110F] text-[#F5F1E8] overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#8FCB9B]/8 blur-3xl" />
        <div className="relative text-center animate-scale-in">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#8FCB9B]/15 ring-1 ring-[#8FCB9B]/30">
            <Check className="h-7 w-7 text-[#8FCB9B]" />
          </div>
          <h1 className="font-display text-2xl font-bold">Locked in.</h1>
          <p className="mt-2 text-sm text-[#9A958B]">Your mystery person is secret.</p>
          <div className="mt-5 flex items-center justify-center gap-2 text-sm text-[#5A564F]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Waiting for Rahul to confirm...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#11110F] text-[#F5F1E8]">
      {/* header */}
      <header className="border-b border-[#1F1F1A]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-10">
          <div className="flex items-center gap-3">
            <LogoMark />
            <span className="font-display text-sm font-semibold tracking-tight">WHO AM I?</span>
          </div>
          <button
            onClick={() => navigate(`/room/${roomCode}`)}
            className="inline-flex items-center gap-1.5 text-[13px] text-[#9A958B] transition-colors hover:text-[#F5F1E8]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to room
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-10 sm:px-10 sm:py-14">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Pick someone they know.
        </h1>
        <p className="mt-2 text-sm text-[#9A958B]">
          Choose a person your friend can figure out by asking questions.
        </p>

        {/* upload area */}
        <div className="mt-8">
          <button className="group relative w-full overflow-hidden rounded-lg border border-dashed border-[#2A2A25] bg-[#181815] p-8 transition-all hover:border-[#FF5A36]/40 hover:bg-[#211F1B]">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#211F1B] ring-1 ring-[#2A2A25] transition-all group-hover:bg-[#FF5A36]/10 group-hover:ring-[#FF5A36]/30">
                <Upload className="h-5 w-5 text-[#9A958B] transition-colors group-hover:text-[#FF5A36]" />
              </div>
              <div>
                <p className="text-sm font-semibold">Upload a photo</p>
                <p className="mt-0.5 text-xs text-[#5A564F]">JPG, PNG up to 10MB</p>
              </div>
            </div>
          </button>
          <p className="mt-3 text-center text-xs text-[#5A564F]">Or choose from examples</p>
        </div>

        {/* character grid */}
        <div className="mt-6 grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3">
          {MOCK_CHARACTERS.map((c) => {
            const isSelected = selected?.id === c.id;
            return (
              <button
                key={c.id}
                onClick={() => handleSelect(c)}
                className={`group relative aspect-[4/5] overflow-hidden rounded-md border transition-all ${
                  isSelected
                    ? 'border-[#FF5A36] ring-2 ring-[#FF5A36]/30'
                    : 'border-[#2A2A25] hover:border-[#3a3a32]'
                }`}
              >
                <img
                  src={c.imageUrl}
                  alt={c.archetype}
                  className="h-full w-full object-cover opacity-80 transition-all group-hover:opacity-95 group-hover:scale-[1.03]"
                  style={{ filter: 'saturate(0.85) contrast(1.05) brightness(0.9)' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <p className="text-[10px] font-semibold text-white/85">{c.archetype}</p>
                </div>
                {isSelected && (
                  <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#FF5A36] text-white animate-scale-in">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* preview / identification panel */}
        {selected && (
          <div className="mt-8 animate-slide-up">
            {identifying ? (
              <div className="rounded-lg border border-[#2A2A25] bg-[#181815] p-6">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-[#FF5A36]" />
                  <span className="text-sm font-semibold text-[#9A958B]">IDENTIFYING...</span>
                </div>
                <div className="mt-4 relative h-1 overflow-hidden rounded-full bg-[#211F1B]">
                  <div className="absolute inset-0 shimmer-bg" />
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-[#2A2A25] bg-[#181815] p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-md border border-[#2A2A25] mx-auto sm:mx-0">
                    <img src={selected.imageUrl} alt={selected.name} className="h-full w-full object-cover" style={{ filter: 'saturate(0.85) contrast(1.05) brightness(0.9)' }} />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#FF5A36]">SECRET</p>
                      <p className="font-display text-lg font-bold">{selected.name}</p>
                    </div>
                    <div className="flex items-center gap-2 rounded-md bg-[#FF5A36]/8 px-3 py-2 ring-1 ring-[#FF5A36]/15">
                      <Sparkles className="h-3.5 w-3.5 text-[#FF5A36]" />
                      <span className="text-xs text-[#9A958B]">AI identified:</span>
                      <span className="text-xs font-semibold text-[#F5F1E8]">{selected.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#5A564F]">Confidence</span>
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#211F1B]">
                        <div className="h-full rounded-full bg-[#FF5A36] transition-all" style={{ width: `${selected.confidence}%` }} />
                      </div>
                      <span className="text-[10px] font-semibold text-[#FF5A36]">{selected.confidence}%</span>
                    </div>
                  </div>
                </div>
                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <button
                    onClick={() => setSelected(null)}
                    className="inline-flex items-center justify-center rounded-md border border-[#2A2A25] bg-[#181815] px-4 py-2 text-sm font-medium text-[#F5F1E8] transition-all hover:border-[#3a3a32]"
                  >
                    Choose another
                  </button>
                  <button
                    onClick={confirm}
                    className="group inline-flex items-center justify-center gap-2 rounded-md bg-[#FF5A36] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#ff6b4a]"
                  >
                    <Check className="h-4 w-4" />
                    Lock it in
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {!selected && (
          <div className="mt-8 text-center">
            <p className="text-sm text-[#5A564F]">Select a character to continue</p>
          </div>
        )}
      </div>
    </div>
  );
}
