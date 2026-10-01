import { useState } from 'react';
import { Lock, AlertTriangle } from 'lucide-react';

export function GuessModal({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (guess: string) => void | Promise<void>;
}) {
  const [guess, setGuess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  const submit = async () => {
    if (!guess.trim()) return;
    setSubmitting(true);
    setSubmitError(false);
    try {
      await onSubmit(guess.trim());
      setGuess('');
    } catch {
      setSubmitError(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-[calc(env(safe-area-inset-top)+1rem)] sm:items-center sm:py-4">
      <button
        type="button"
        aria-label="Close guess dialog"
        disabled={submitting}
        className="absolute inset-0 bg-black/70 animate-enter-fade disabled:cursor-wait"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative my-auto w-full max-w-md rounded-xl border border-[#2A2A25] bg-[#181815] p-5 shadow-2xl animate-scale-in sm:p-6">
        <div className="mb-1 flex items-center gap-2">
          <Lock className="h-5 w-5 text-[#FF5A36]" />
          <h2 className="font-display text-xl font-bold">Make a guess</h2>
        </div>
        <p className="mb-5 text-sm text-[#9A958B]">Who is your opponent&apos;s character? A full name, nickname, or recognized surname can count.</p>

        <input
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          onFocus={() => setSubmitError(false)}
          placeholder="Enter a name or nickname..."
          className="mb-4 h-12 w-full rounded-md border border-[#2A2A25] bg-[#11110F] px-4 text-base text-[#F5F1E8] placeholder:text-[#5A564F] transition-colors focus:border-[#FF5A36]/50"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          aria-label="Enter your guess"
        />

        {submitError && (
          <p role="alert" className="-mt-2 mb-3 text-sm text-[#E56B6F]">
            We couldn&apos;t send your guess. Check your connection and try again.
          </p>
        )}

        <div className="mb-5 flex items-start gap-2 rounded-md bg-[#FF5A36]/8 px-3 py-2.5 ring-1 ring-[#FF5A36]/15">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FF5A36]" />
          <p className="text-xs text-[#9A958B]">A wrong guess won&apos;t end the game. Keep playing and try again on a later turn.</p>
        </div>

        <button
          onClick={submit}
          disabled={!guess.trim() || submitting}
          className="group flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#FF5A36] text-base font-semibold text-white transition-all hover:bg-[#ff6b4a] disabled:opacity-30 disabled:pointer-events-none"
        >
          {submitting ? 'Checking...' : 'Submit guess'}
          {!submitting && (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="transition-transform group-hover:translate-x-0.5">
              <path d="M1 7H13M13 7L7 1M13 7L7 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
