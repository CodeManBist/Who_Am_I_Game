import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Phone, ShieldCheck, Loader2 } from 'lucide-react';
import { LogoMark } from '@/components/game/BrandLogo';
import { useAuth } from '@/lib/auth-context';

export function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/create';
  const auth = useAuth();

  const [step, setStep] = useState<'phone' | 'otp' | 'name'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // If already authenticated, redirect
  useEffect(() => {
    if (auth.isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [auth.isAuthenticated, navigate, redirectTo]);

  const handleSendOtp = () => {
    if (phone.trim().length < 10) {
      setError('Enter a valid phone number.');
      return;
    }
    setError('');
    setSending(true);
    setTimeout(() => {
      setSending(false);
      auth.sendOtp(phone.trim());
      setStep('otp');
    }, 800);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newOtp = pasted.split('').concat(Array(6 - pasted.length).fill(''));
      setOtp(newOtp);
      otpRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const handleVerifyOtp = () => {
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Enter the 6-digit code.');
      return;
    }
    setError('');
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      // For demo: any 6-digit code matches the generated one
      // But we also allow "123456" as a universal demo code
      if (code === auth.generatedOtp || code === '123456') {
        setStep('name');
      } else {
        setError('Wrong code. Try again.');
      }
    }, 700);
  };

  const handleComplete = () => {
    if (!name.trim()) {
      setError('Enter your name.');
      return;
    }
    setError('');
    if (auth.verifyOtp(phone.trim(), auth.generatedOtp || '123456', name.trim())) {
      navigate(redirectTo, { replace: true });
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#11110F] text-[#F5F1E8]">
      {/* header */}
      <header className="border-b border-[#1F1F1A]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 sm:px-10">
          <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
            <LogoMark />
            <span className="font-display text-sm font-semibold tracking-tight">WHO AM I?</span>
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
          {/* step indicator */}
          <div className="mb-8 flex items-center justify-center gap-2">
            {['phone', 'otp', 'name'].map((s, i) => {
              const stepIndex = ['phone', 'otp', 'name'].indexOf(step);
              const isActive = i === stepIndex;
              const isDone = i < stepIndex;
              return (
                <div
                  key={s}
                  className={`h-1.5 w-8 rounded-full transition-all ${
                    isActive ? 'bg-[#FF5A36]' : isDone ? 'bg-[#8FCB9B]' : 'bg-[#2A2A25]'
                  }`}
                />
              );
            })}
          </div>

          {/* STEP 1: PHONE */}
          {step === 'phone' && (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Phone className="h-5 w-5 text-[#FF5A36]" />
                <h1 className="font-display text-2xl font-bold tracking-tight">Enter your number</h1>
              </div>
              <p className="mb-6 text-sm text-[#9A958B]">
                We'll send you a code to verify it's you.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#5A564F]">
                    Phone number
                  </label>
                  <input
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setError('');
                    }}
                    placeholder="+1 555 000 1234"
                    className="h-12 w-full rounded-md border border-[#2A2A25] bg-[#181815] px-4 text-base text-[#F5F1E8] placeholder:text-[#5A564F] transition-colors focus:border-[#FF5A36]/50"
                    autoFocus
                    inputMode="tel"
                  />
                </div>

                {error && <p className="text-sm text-[#E56B6F]">{error}</p>}

                <button
                  onClick={handleSendOtp}
                  disabled={sending || !phone.trim()}
                  className="group flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#FF5A36] text-base font-semibold text-white transition-all hover:bg-[#ff6b4a] disabled:opacity-30 disabled:pointer-events-none"
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send code
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-[#5A564F]">
                  Demo only. No real SMS is sent.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: OTP */}
          {step === 'otp' && (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#FF5A36]" />
                <h1 className="font-display text-2xl font-bold tracking-tight">Verify your number</h1>
              </div>
              <p className="mb-6 text-sm text-[#9A958B]">
                Enter the 6-digit code we sent to {phone}.
              </p>

              {/* demo hint */}
              <div className="mb-5 rounded-md bg-[#FF5A36]/8 px-3 py-2 ring-1 ring-[#FF5A36]/15">
                <p className="text-xs text-[#9A958B]">
                  Demo code: <span className="font-mono font-semibold text-[#FF5A36]">{auth.generatedOtp}</span> or use <span className="font-mono font-semibold text-[#FF5A36]">123456</span>
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      maxLength={1}
                      className="h-14 w-12 rounded-md border border-[#2A2A25] bg-[#181815] text-center text-xl font-semibold text-[#F5F1E8] transition-colors focus:border-[#FF5A36]/50"
                      inputMode="numeric"
                      aria-label={`Digit ${i + 1}`}
                    />
                  ))}
                </div>

                {error && <p className="text-center text-sm text-[#E56B6F]">{error}</p>}

                <button
                  onClick={handleVerifyOtp}
                  disabled={verifying || otp.join('').length !== 6}
                  className="group flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#FF5A36] text-base font-semibold text-white transition-all hover:bg-[#ff6b4a] disabled:opacity-30 disabled:pointer-events-none"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setStep('phone');
                    setOtp(['', '', '', '', '', '']);
                    setError('');
                  }}
                  className="w-full text-center text-sm text-[#9A958B] underline underline-offset-[6px] transition-colors hover:text-[#F5F1E8]"
                >
                  Change number
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: NAME */}
          {step === 'name' && (
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight">What's your name?</h1>
              <p className="mb-6 mt-2 text-sm text-[#9A958B]">
                This is what your friend will see during the game.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#5A564F]">
                    Your name
                  </label>
                  <input
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError('');
                    }}
                    placeholder="Sagar"
                    className="h-12 w-full rounded-md border border-[#2A2A25] bg-[#181815] px-4 text-base text-[#F5F1E8] placeholder:text-[#5A564F] transition-colors focus:border-[#FF5A36]/50"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleComplete()}
                  />
                </div>

                {error && <p className="text-sm text-[#E56B6F]">{error}</p>}

                <button
                  onClick={handleComplete}
                  disabled={!name.trim()}
                  className="group flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#FF5A36] text-base font-semibold text-white transition-all hover:bg-[#ff6b4a] disabled:opacity-30 disabled:pointer-events-none"
                >
                  Start playing
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
