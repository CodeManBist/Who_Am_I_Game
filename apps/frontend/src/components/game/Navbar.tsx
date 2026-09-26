import { Link, useLocation } from 'react-router-dom';
import { HelpCircle, Settings, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Navbar() {
  const location = useLocation();
  const inGame = location.pathname.startsWith('/game');

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full',
        inGame ? 'glass border-b border-border/50' : 'border-b border-border/30'
      )}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/30 transition-all group-hover:bg-primary/25 group-hover:ring-primary/50">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            Who Am I?
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            to="/"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <HelpCircle className="h-4 w-4" />
            How to Play
          </Link>
          <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </nav>
    </header>
  );
}
