import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, LogOut, Menu, X } from 'lucide-react';
import { LogoMark } from '@/components/game/BrandLogo';
import { useAuth } from '@/lib/auth-context';

const links = [
  { label: 'Home', to: '/' },
  { label: 'How to play', to: '/how-to-play' },
  { label: 'Create a room', to: '/create' },
  { label: 'Join a room', to: '/join' },
];

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const auth = useAuth();

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <div className="relative z-50 sm:hidden">
      <button
        type="button"
        aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={open}
        aria-controls="mobile-navigation-menu"
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#2A2A25] bg-[#181815] text-[#F5F1E8] transition-colors hover:border-[#FF5A36]/50"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-label="Close navigation menu"
            className="fixed inset-0 z-40 cursor-default bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside
            id="mobile-navigation-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation menu"
            className="fixed inset-y-0 right-0 z-50 flex h-[100dvh] w-72 max-w-[88vw] flex-col border-l border-[#2A2A25] bg-[#151512] px-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-[calc(env(safe-area-inset-top)+1rem)] shadow-2xl animate-enter-fade"
          >
            <div className="mb-7 flex items-center justify-between border-b border-[#2A2A25] pb-5">
              <Link to="/" onClick={() => setOpen(false)} className="flex items-center gap-3">
                <LogoMark />
                <span className="font-display text-sm font-semibold tracking-wide text-[#F5F1E8]">WHO AM I?</span>
              </Link>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close navigation menu" className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#2A2A25] text-[#9A958B] hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
              {links.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="group flex min-h-12 items-center justify-between rounded-xl px-3 text-[15px] font-medium text-[#D8D3C9] transition-colors hover:bg-[#211F1B] hover:text-white"
                >
                  {item.label}
                  <ArrowRight className="h-4 w-4 text-[#5A564F] transition-colors group-hover:text-[#FF5A36]" />
                </Link>
              ))}
            </nav>
            <div className="mt-auto border-t border-[#2A2A25] pt-4">
              {auth.isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => { setOpen(false); auth.logout(); }}
                  className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm text-[#9A958B] transition-colors hover:bg-[#211F1B] hover:text-[#F5F1E8]"
                >
                  <LogOut className="h-4 w-4" />
                  Log out{auth.user?.username ? ` · ${auth.user.username}` : ''}
                </button>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setOpen(false)}
                  className="flex min-h-12 items-center rounded-xl px-3 text-sm text-[#9A958B] transition-colors hover:bg-[#211F1B] hover:text-[#F5F1E8]"
                >
                  Log in or register
                </Link>
              )}
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
