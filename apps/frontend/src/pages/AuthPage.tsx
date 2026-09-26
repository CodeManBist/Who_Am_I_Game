import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  Mail,
  Lock,
  User,
} from 'lucide-react';

import { LogoMark } from '@/components/game/BrandLogo';
import { useAuth } from '@/lib/auth-context';

export function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const redirectTo = searchParams.get('redirect') || '/create';

  const auth = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (auth.isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [auth.isAuthenticated, navigate, redirectTo]);

  const handleSubmit = async () => {
    setError('');

    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();

    if (!trimmedEmail || !password.trim()) {
      setError('Fill in all fields.');
      return;
    }

    if (mode === 'register' && !trimmedUsername) {
      setError('Enter a username.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);

      let result;

      if (mode === 'login') {
        result = await auth.login(trimmedEmail, password);
      } else {
        result = await auth.register(
          trimmedUsername,
          trimmedEmail,
          password
        );
      }

      if (!result.ok) {
        setError(
          result.error ||
            (mode === 'login'
              ? 'Login failed.'
              : 'Registration failed.')
        );
        return;
      }

      // Navigation is handled by the useEffect above
      // after auth.isAuthenticated becomes true.
    } catch (error) {
      console.error('Authentication error:', error);

      setError(
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === 'Enter' && !loading) {
      void handleSubmit();
    }
  };

  const switchMode = (
    nextMode: 'login' | 'register'
  ) => {
    setMode(nextMode);
    setError('');
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#11110F] text-[#F5F1E8]">
      <header className="border-b border-[#1F1F1A]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 sm:px-10">
          <Link
            to="/"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            <LogoMark />

            <span className="font-display text-sm font-semibold tracking-tight">
              WHO AM I?
            </span>
          </Link>

          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-[13px] text-[#9A958B] transition-colors hover:text-[#F5F1E8]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm animate-enter-up">

          <div className="mb-8 flex rounded-md border border-[#2A2A25] bg-[#181815] p-1">
            <button
              onClick={() => switchMode('login')}
              className={`flex-1 rounded py-2 text-sm font-semibold transition-all ${
                mode === 'login'
                  ? 'bg-[#FF5A36] text-white'
                  : 'text-[#9A958B] hover:text-[#F5F1E8]'
              }`}
            >
              Log in
            </button>

            <button
              onClick={() => switchMode('register')}
              className={`flex-1 rounded py-2 text-sm font-semibold transition-all ${
                mode === 'register'
                  ? 'bg-[#FF5A36] text-white'
                  : 'text-[#9A958B] hover:text-[#F5F1E8]'
              }`}
            >
              Register
            </button>
          </div>

          {mode === 'login' ? (
            <>
              <h1 className="font-display text-2xl font-bold tracking-tight">
                Welcome back.
              </h1>

              <p className="mb-6 mt-2 text-sm text-[#9A958B]">
                Log in to create or join a room.
              </p>
            </>
          ) : (
            <>
              <h1 className="font-display text-2xl font-bold tracking-tight">
                Create an account.
              </h1>

              <p className="mb-6 mt-2 text-sm text-[#9A958B]">
                Pick a username your friend will see.
              </p>
            </>
          )}

          <div className="space-y-4">

            {mode === 'register' && (
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#5A564F]">
                  Username
                </label>

                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5A564F]" />

                  <input
                    value={username}
                    onChange={(event) => {
                      setUsername(event.target.value);
                      setError('');
                    }}
                    placeholder="Sagar"
                    disabled={loading}
                    autoFocus
                    className="h-12 w-full rounded-md border border-[#2A2A25] bg-[#181815] pl-10 pr-4 text-base text-[#F5F1E8] placeholder:text-[#5A564F] transition-colors focus:border-[#FF5A36]/50 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#5A564F]">
                Email
              </label>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5A564F]" />

                <input
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError('');
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="sagar@demo.com"
                  type="email"
                  disabled={loading}
                  autoFocus={mode === 'login'}
                  className="h-12 w-full rounded-md border border-[#2A2A25] bg-[#181815] pl-10 pr-4 text-base text-[#F5F1E8] placeholder:text-[#5A564F] transition-colors focus:border-[#FF5A36]/50 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#5A564F]">
                Password
              </label>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5A564F]" />

                <input
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError('');
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter your password"
                  type="password"
                  disabled={loading}
                  className="h-12 w-full rounded-md border border-[#2A2A25] bg-[#181815] pl-10 pr-4 text-base text-[#F5F1E8] placeholder:text-[#5A564F] transition-colors focus:border-[#FF5A36]/50 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-[#E56B6F]">
                {error}
              </p>
            )}

            <button
              onClick={() => void handleSubmit()}
              disabled={loading}
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#FF5A36] text-base font-semibold text-white transition-all hover:bg-[#ff6b4a] disabled:pointer-events-none disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />

                  {mode === 'login'
                    ? 'Logging in...'
                    : 'Creating...'}
                </>
              ) : (
                <>
                  {mode === 'login'
                    ? 'Log in'
                    : 'Create account'}

                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </div>

          {mode === 'login' && (
            <div className="mt-6 rounded-md bg-[#FF5A36]/8 px-3 py-2.5 ring-1 ring-[#FF5A36]/15">
              <p className="text-xs text-[#9A958B]">
                Demo accounts:
              </p>

              <p className="mt-1 font-mono text-xs text-[#F5F1E8]">
                sagar@demo.com / demo123
              </p>

              <p className="font-mono text-xs text-[#F5F1E8]">
                rahul@demo.com / demo123
              </p>
            </div>
          )}

          <p className="mt-6 text-center text-sm text-[#5A564F]">
            {mode === 'login'
              ? "Don't have an account? "
              : 'Already have an account? '}

            <button
              onClick={() =>
                switchMode(
                  mode === 'login'
                    ? 'register'
                    : 'login'
                )
              }
              disabled={loading}
              className="font-medium text-[#FF5A36] transition-colors hover:text-[#ff6b4a] disabled:opacity-50"
            >
              {mode === 'login'
                ? 'Register'
                : 'Log in'}
            </button>
          </p>

        </div>
      </div>
    </div>
  );
}