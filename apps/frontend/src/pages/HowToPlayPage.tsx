import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { LogoMark } from '@/components/game/BrandLogo';
import { LiveBadge } from '@/components/game/LiveBadge';
import { MysteryPhoto } from '@/components/game/MysteryPhoto';
import { RoomCode } from '@/components/game/RoomCode';
import { HOW_TO_PLAY_STEPS } from '@/lib/mock-data';

const PLAYER_A =
  'https://images.pexels.com/photos/7958715/pexels-photo-7958715.jpeg?auto=compress&cs=tinysrgb&w=400&h=500&fit=crop';
const PLAYER_B =
  'https://images.pexels.com/photos/34622355/pexels-photo-34622355.jpeg?auto=compress&cs=tinysrgb&w=400&h=500&fit=crop';
const MYSTERY =
  'https://images.pexels.com/photos/4209126/pexels-photo-4209126.jpeg?auto=compress&cs=tinysrgb&w=400&h=500&fit=crop';

export function HowToPlayPage() {
  return (
    <div className="min-h-screen bg-[#11110F] text-[#F5F1E8]">
      {/* header */}
      <header className="relative z-30 border-b border-[#1F1F1A]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 sm:px-10 sm:py-6">
          <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
            <LogoMark />
            <span className="font-display text-sm font-semibold tracking-tight">WHO AM I?</span>
          </Link>
          <Link
            to="/create"
            className="group inline-flex items-center gap-1.5 rounded-md bg-[#FF5A36] px-3.5 py-1.5 text-[13px] font-semibold text-white transition-all hover:bg-[#ff6b4a]"
          >
            Create room
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </header>

      {/* hero */}
      <section className="px-6 py-16 sm:px-10 sm:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#FF5A36]">
            How to play
          </p>
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
            Pick a person.
            <br />
            Hide the name.
            <br />
            <span className="text-[#FF5A36]">Read your friend.</span>
          </h1>
        </div>
      </section>

      {/* steps */}
      <section className="px-6 pb-20 sm:px-10 sm:pb-28">
        <div className="mx-auto max-w-3xl space-y-16">
          {/* Step 01 — Create a room */}
          <div className="grid items-center gap-6 sm:grid-cols-[1fr_auto] sm:gap-12">
            <div>
              <span className="font-display text-xs font-medium text-[#4a463f]">STEP 01</span>
              <h2 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Create a room
              </h2>
              <p className="mt-2 text-sm text-[#9A958B]">
                Start a private game and share the code with one friend.
              </p>
            </div>
            <div className="flex justify-center">
              <RoomCode code="K7Q-29P" large />
            </div>
          </div>

          <div className="h-px bg-[#1F1F1A]" />

          {/* Step 02 — Pick someone */}
          <div className="grid items-center gap-6 sm:grid-cols-[1fr_auto] sm:gap-12">
            <div>
              <span className="font-display text-xs font-medium text-[#4a463f]">STEP 02</span>
              <h2 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Pick someone
              </h2>
              <p className="mt-2 text-sm text-[#9A958B]">
                Upload a photo or choose from examples. Your friend sees the image, not the name.
              </p>
            </div>
            <div className="flex justify-center">
              <MysteryPhoto src={MYSTERY} size="md" float={false} />
            </div>
          </div>

          <div className="h-px bg-[#1F1F1A]" />

          {/* Step 03 — Meet face to face */}
          <div className="grid items-center gap-6 sm:grid-cols-[1fr_auto] sm:gap-12">
            <div>
              <span className="font-display text-xs font-medium text-[#4a463f]">STEP 03</span>
              <h2 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Meet face to face
              </h2>
              <p className="mt-2 text-sm text-[#9A958B]">
                Turn on your camera and microphone. See each other live.
              </p>
            </div>
            <div className="flex justify-center gap-2">
              <div className="relative aspect-[3/4] w-20 overflow-hidden rounded-md border border-[#2A2A25]">
                <img src={PLAYER_A} alt="Player 1" className="h-full w-full object-cover opacity-85" style={{ filter: 'saturate(0.8) contrast(1.08) brightness(0.92)' }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-1 left-1">
                  <span className="rounded bg-black/50 px-1 py-0.5 text-[7px] font-semibold text-white/75 backdrop-blur-sm">P01</span>
                </div>
              </div>
              <div className="relative aspect-[3/4] w-20 overflow-hidden rounded-md border border-[#2A2A25]">
                <img src={PLAYER_B} alt="Player 2" className="h-full w-full object-cover opacity-85" style={{ filter: 'saturate(0.8) contrast(1.08) brightness(0.92)' }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-1 left-1">
                  <span className="rounded bg-black/50 px-1 py-0.5 text-[7px] font-semibold text-white/75 backdrop-blur-sm">P02</span>
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-[#1F1F1A]" />

          {/* Step 04 — Ask questions */}
          <div className="grid items-center gap-6 sm:grid-cols-[1fr_auto] sm:gap-12">
            <div>
              <span className="font-display text-xs font-medium text-[#4a463f]">STEP 04</span>
              <h2 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Ask questions
              </h2>
              <p className="mt-2 text-sm text-[#9A958B]">
                Talk naturally. Narrow it down. Use the conversation to figure out who they picked.
              </p>
            </div>
            <div className="w-full max-w-xs space-y-2">
              {[
                { name: 'Sagar', text: 'Is your person a footballer?', you: true },
                { name: 'Rahul', text: 'Yeah 😂', you: false },
                { name: 'Sagar', text: 'Are they from Argentina?', you: true },
              ].map((m, i) => (
                <div key={i} className={`flex ${m.you ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] ${m.you ? 'text-right' : ''}`}>
                    {!m.you && <p className="mb-0.5 text-[9px] font-medium text-[#FF5A36]">{m.name}</p>}
                    <div className={`inline-block rounded-md px-2.5 py-1.5 text-[11px] ${m.you ? 'bg-[#FF5A36] text-white' : 'bg-[#211F1B] text-[#d5d0c7]'}`}>
                      {m.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="h-px bg-[#1F1F1A]" />

          {/* Step 05 — Make your guess */}
          <div className="grid items-center gap-6 sm:grid-cols-[1fr_auto] sm:gap-12">
            <div>
              <span className="font-display text-xs font-medium text-[#4a463f]">STEP 05</span>
              <h2 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Make your guess
              </h2>
              <p className="mt-2 text-sm text-[#9A958B]">
                One shot. Type the name and lock it in.
              </p>
            </div>
            <div className="w-full max-w-xs">
              <div className="rounded-lg border border-[#2A2A25] bg-[#181815] p-4">
                <p className="mb-3 text-sm text-[#9A958B]">Who is it?</p>
                <div className="mb-3 rounded-md border border-[#2A2A25] bg-[#11110F] px-3 py-2 text-xs text-[#5A564F]">
                  Type their name...
                </div>
                <div className="flex items-center justify-center gap-1.5 rounded-md bg-[#FF5A36] px-3 py-2 text-xs font-semibold text-white">
                  <span>Lock in guess</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-[#1F1F1A]" />

          {/* Step 06 — Reveal */}
          <div className="grid items-center gap-6 sm:grid-cols-[1fr_auto] sm:gap-12">
            <div>
              <span className="font-display text-xs font-medium text-[#4a463f]">STEP 06</span>
              <h2 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Reveal
              </h2>
              <p className="mt-2 text-sm text-[#9A958B]">
                The mystery photograph is revealed. Did you get it right?
              </p>
            </div>
            <div className="flex justify-center">
              <div className="relative bg-[#f0ebe2] p-1.5 pb-5" style={{ transform: 'rotate(2deg)', filter: 'drop-shadow(0 12px 28px rgba(0,0,0,0.5))' }}>
                <div className="relative aspect-[4/5] w-28 overflow-hidden">
                  <img src={MYSTERY} alt="Revealed" className="h-full w-full object-cover" style={{ filter: 'sepia(0.2) contrast(1.1) brightness(0.95)' }} />
                </div>
                <span style={{ fontFamily: "'Caveat', cursive" }} className="absolute bottom-0.5 left-0 right-0 text-center text-sm font-semibold text-[#3a3530]">
                  Lionel Messi
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[#1F1F1A] px-6 py-16 sm:px-10 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
            Ready?
          </h2>
          <div className="mt-8 flex justify-center">
            <Link
              to="/create"
              className="group inline-flex items-center gap-2 rounded-md bg-[#FF5A36] px-6 py-3 text-base font-semibold text-white transition-all hover:bg-[#ff6b4a]"
            >
              Create a room
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* footer */}
      <footer className="border-t border-[#1F1F1A] px-6 py-7 sm:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <span className="font-display text-sm font-semibold tracking-tight">WHO AM I?</span>
          </div>
          <p className="text-[13px] text-[#5A564F]">A game for two friends.</p>
        </div>
      </footer>
    </div>
  );
}
