import { useEffect, useState } from 'react';
import { MobileMenu } from '@/components/game/MobileMenu';

type CountdownProps = {
  seconds: number;
  onComplete: () => void;
};

export function Countdown({
  seconds,
  onComplete,
}: CountdownProps) {
  const [showTitle, setShowTitle] = useState(false);

  useEffect(() => {
    if (seconds !== 0) {
      return;
    }

    setShowTitle(true);

    const timer = window.setTimeout(() => {
      onComplete();
    }, 900);

    return () => {
      window.clearTimeout(timer);
    };
  }, [seconds, onComplete]);

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-[#11110F]">
      <div className="absolute right-4 top-[calc(env(safe-area-inset-top)+0.75rem)] z-20 sm:right-6"><MobileMenu /></div>
      <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF5A36]/8 blur-3xl" />

      {showTitle ? (
        <div className="relative animate-scale-in text-center">
          <h1 className="font-display text-5xl font-black tracking-tight sm:text-7xl">
            <span className="text-[#FF5A36]">
              START!
            </span>
          </h1>
        </div>
      ) : (
        <div
          key={seconds}
          className="relative animate-count-pop text-center"
        >
          <span className="font-display text-[10rem] font-black leading-none text-[#F5F1E8] sm:text-[14rem]">
            {seconds > 0 ? seconds : 'START!'}
          </span>
        </div>
      )}
    </div>
  );
}
