import { Link } from 'react-router-dom';
import { ArrowRight, Mic, Video } from 'lucide-react';
import { LogoMark } from '@/components/game/BrandLogo';
import { LiveBadge } from '@/components/game/LiveBadge';
import { MysteryPhoto } from '@/components/game/MysteryPhoto';

const PLAYER_A =
  'https://images.pexels.com/photos/7958715/pexels-photo-7958715.jpeg?auto=compress&cs=tinysrgb&w=600&h=800&fit=crop';
const PLAYER_B =
  'https://images.pexels.com/photos/34622355/pexels-photo-34622355.jpeg?auto=compress&cs=tinysrgb&w=600&h=800&fit=crop';
const MYSTERY =
  'https://images.pexels.com/photos/4209126/pexels-photo-4209126.jpeg?auto=compress&cs=tinysrgb&w=500&h=650&fit=crop';

function VideoFrame({
  src,
  label,
  micOn = true,
  delay = '0s',
  rotate = '0deg',
}: {
  src: string;
  label: string;
  micOn?: boolean;
  delay?: string;
  rotate?: string;
}) {
  return (
    <div style={{ animation: `drift 10s ease-in-out infinite ${delay}`, transform: `rotate(${rotate})` }}>
      <div className="group relative aspect-[3/4] w-full overflow-hidden rounded-md border border-[#2A2A25] bg-[#181815]">
        <img
          src={src}
          alt={label}
          className="h-full w-full object-cover opacity-85 transition-all duration-700 group-hover:opacity-95 group-hover:scale-[1.03]"
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
            {label}
          </span>
        </div>
        <div className="absolute right-2 top-2">
          <LiveBadge />
        </div>
        <div className="absolute bottom-2 left-2 flex items-center gap-1">
          <span className="flex items-center gap-1 rounded-full bg-black/50 px-1.5 py-0.5 backdrop-blur-sm">
            <Mic className="h-2.5 w-2.5" style={{ color: micOn ? '#8FCB9B' : '#E56B6F' }} />
          </span>
          <span className="flex items-center gap-1 rounded-full bg-black/50 px-1.5 py-0.5 backdrop-blur-sm">
            <Video className="h-2.5 w-2.5 text-[#8FCB9B]" />
          </span>
        </div>
        <div className="absolute bottom-2 right-2">
          <span className="flex items-center gap-1 rounded-full bg-black/50 px-1.5 py-0.5 backdrop-blur-sm">
            <span className="h-1 w-1 rounded-full bg-[#8FCB9B]" />
            <span className="text-[8px] text-white/60">connected</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#11110F] text-[#F5F1E8]">
      {/* ── HEADER ── */}
      <header className="relative z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 sm:px-10 sm:py-7">
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <span className="font-display text-sm font-semibold tracking-tight">WHO AM I?</span>
          </div>
          <nav className="flex items-center gap-5 sm:gap-8">
            <Link to="/how-to-play" className="hidden text-[13px] text-[#9A958B] transition-colors hover:text-[#F5F1E8] sm:inline">
              How to play
            </Link>
            <Link to="/join" className="text-[13px] text-[#9A958B] transition-colors hover:text-[#F5F1E8]">
              Join a room
            </Link>
            <Link
              to="/create"
              className="group inline-flex items-center gap-1.5 rounded-md bg-[#FF5A36] px-3.5 py-1.5 text-[13px] font-semibold text-white transition-all hover:bg-[#ff6b4a]"
            >
              Create room
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </nav>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 pt-6 pb-20 sm:px-10 sm:pt-10 sm:pb-28">
          <div className="grid items-center gap-10 lg:grid-cols-[0.85fr_1fr] lg:gap-6">
            {/* LEFT */}
            <div className="animate-enter-up">
              <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#FF5A36]">
                A game for two
              </p>
              <h1 className="font-display text-[2.75rem] font-bold leading-[0.95] tracking-[-0.02em] sm:text-6xl lg:text-[4.5rem]">
                How well do
                <br />
                you know
                <br />
                <span className="text-[#FF5A36]">your friend?</span>
              </h1>
              <p className="mt-5 max-w-[20rem] text-[15px] leading-relaxed text-[#9A958B]">
                Pick a person. Keep them secret. Ask questions until you know.
              </p>
              <div className="mt-7 flex items-center gap-5">
                <Link
                  to="/create"
                  className="group inline-flex items-center gap-2 rounded-md bg-[#FF5A36] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#ff6b4a]"
                >
                  Create a room
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to="/join"
                  className="text-sm font-medium text-[#9A958B] underline underline-offset-[6px] transition-colors hover:text-[#F5F1E8]"
                >
                  Join a room
                </Link>
              </div>
            </div>

            {/* RIGHT — game scene */}
            <div className="relative animate-enter-up" style={{ animationDelay: '0.12s', opacity: 0 }}>
              <div className="relative mx-auto max-w-lg">
                <div className="relative grid grid-cols-2 gap-2.5 sm:gap-4">
                  <VideoFrame src={PLAYER_A} label="Player 01" micOn delay="0s" rotate="0.5deg" />
                  <VideoFrame src={PLAYER_B} label="Player 02" micOn={false} delay="2s" rotate="-0.5deg" />
                  <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
                    <MysteryPhoto src={MYSTERY} size="lg" />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-center gap-3">
                  <div className="h-px w-8 bg-[#3a3a32]" />
                  <span className="font-display text-[10px] font-semibold uppercase tracking-[0.3em] text-[#5A564F]">
                    Face to face
                  </span>
                  <div className="h-px w-8 bg-[#3a3a32]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="border-t border-[#1F1F1A] px-6 py-14 sm:px-10 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-8 sm:grid-cols-3 sm:gap-12">
            {[
              { num: '01', word: 'PICK', desc: 'Choose someone they know.' },
              { num: '02', word: 'ASK', desc: 'Talk. Question. Investigate.' },
              { num: '03', word: 'GUESS', desc: 'Trust your instincts.' },
            ].map((item, i) => (
              <div key={item.num} className="relative">
                <div className="flex items-baseline gap-2.5">
                  <span className="font-display text-xs font-medium text-[#4a463f]">{item.num}</span>
                  <h3 className="font-display text-2xl font-bold tracking-tight sm:text-[1.75rem]">{item.word}</h3>
                </div>
                <p className="mt-1.5 text-sm text-[#8a857c]">{item.desc}</p>
                {i < 2 && <div className="absolute -right-6 top-2 hidden h-px w-4 bg-[#2A2A25] lg:block" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GAME PREVIEW ── */}
      <section className="px-6 pb-20 sm:px-10 sm:pb-28">
        <div className="mx-auto max-w-5xl">
          <p className="mb-5 text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-[#4a463f]">
            What it looks like
          </p>
          <div className="relative overflow-hidden rounded-xl border border-[#2A2A25] bg-[#181815]">
            {/* preview header */}
            <div className="flex items-center justify-between border-b border-[#2A2A25] px-4 py-2.5">
              <div className="flex items-center gap-2.5">
                <LogoMark size={16} />
                <span className="font-display text-[11px] font-semibold">WHO AM I?</span>
                <span className="ml-1 font-mono text-[10px] text-[#4a463f]">K7Q-29P</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded bg-[#FF5A36]/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#FF5A36]">
                  Your turn
                </span>
                <span className="font-mono text-[11px] text-[#9A958B]">00:42</span>
                <LiveBadge />
              </div>
            </div>
            {/* preview body */}
            <div className="flex">
              <div className="flex-1 border-r border-[#2A2A25] p-4 sm:p-6">
                <p className="mb-3 text-center text-[9px] font-semibold uppercase tracking-[0.22em] text-[#FF5A36]">
                  Who are they?
                </p>
                <div className="mx-auto mb-4 w-24 sm:w-28">
                  <div
                    className="relative bg-[#f0ebe2] p-1.5 pb-5"
                    style={{ transform: 'rotate(-2.5deg)', filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.4))' }}
                  >
                    <div className="relative aspect-[4/5] overflow-hidden">
                      <img src={MYSTERY} alt="Mystery" className="h-full w-full object-cover" style={{ filter: 'sepia(0.35) contrast(1.12) brightness(0.88)' }} />
                      <div className="absolute inset-0 bg-black/35" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-display text-4xl font-bold text-white/85">?</span>
                      </div>
                    </div>
                    <span style={{ fontFamily: "'Caveat', cursive" }} className="absolute bottom-0.5 left-0 right-0 text-center text-xs font-semibold text-[#3a3530]">
                      WHO?
                    </span>
                  </div>
                </div>
                <div className="relative aspect-video overflow-hidden rounded-md border border-[#2A2A25]">
                  <img src={PLAYER_B} alt="Opponent" className="h-full w-full object-cover opacity-85" style={{ filter: 'saturate(0.8) contrast(1.08) brightness(0.92)' }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                  <div className="absolute bottom-2 left-2">
                    <span className="rounded bg-black/50 px-1.5 py-0.5 text-[8px] font-semibold text-white/80 backdrop-blur-sm">Rahul</span>
                  </div>
                  <div className="absolute bottom-2 right-2">
                    <LiveBadge />
                  </div>
                </div>
              </div>
              {/* chat */}
              <div className="hidden w-56 flex-col sm:flex lg:w-64">
                <div className="border-b border-[#2A2A25] px-4 py-2.5">
                  <span className="text-[11px] font-semibold text-[#9A958B]">Game Chat</span>
                </div>
                <div className="flex-1 space-y-2.5 px-4 py-4">
                  {[
                    { name: 'Sagar', text: 'Is your person a footballer?', you: true },
                    { name: 'Rahul', text: 'Yeah 😂', you: false },
                    { name: 'Sagar', text: 'Did they play in Spain?', you: true },
                    { name: 'Rahul', text: 'Yes.', you: false },
                    { name: 'Sagar', text: 'Are they from Argentina?', you: true },
                    { name: 'Rahul', text: '...', you: false },
                  ].map((m, i) => (
                    <div key={i} className={`flex ${m.you ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] ${m.you ? 'text-right' : ''}`}>
                        {!m.you && <p className="mb-0.5 text-[9px] font-medium text-[#FF5A36]">{m.name}</p>}
                        <div className={`inline-block rounded-md px-2.5 py-1.5 text-[11px] leading-snug ${m.you ? 'bg-[#FF5A36] text-white' : 'bg-[#211F1B] text-[#d5d0c7]'}`}>
                          {m.text}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-[#2A2A25] p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex-1 rounded-md border border-[#2A2A25] bg-[#11110F] px-2.5 py-1.5 text-[10px] text-[#4a463f]">
                      Ask a question...
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-md bg-[#FF5A36] px-3 py-2 text-[11px] font-semibold text-white">
                    <span>Make Your Guess</span>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#1F1F1A] px-6 py-7 sm:px-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <span className="font-display text-sm font-semibold tracking-tight">WHO AM I?</span>
          </div>
          <p className="text-[13px] text-[#5A564F]">A game for two friends.</p>
          <Link to="/create" className="group inline-flex items-center gap-1.5 text-[13px] font-medium text-[#F5F1E8] transition-colors">
            Create a room
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </footer>
    </div>
  );
}
