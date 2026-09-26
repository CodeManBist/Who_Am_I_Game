import { useEffect, useState } from 'react';

export function Countdown({ onComplete }: { onComplete: () => void }) {
  const [count, setCount] = useState(3);
  const [showTitle, setShowTitle] = useState(false);

  useEffect(() => {
    if (count === 0) {
      setShowTitle(true);
      const t = setTimeout(onComplete, 1500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count, onComplete]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#11110F]">
      <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF5A36]/8 blur-3xl" />

      {showTitle ? (
        <div className="relative animate-scale-in text-center">
          <h1 className="font-display text-5xl font-black tracking-tight sm:text-7xl">
            <span className="text-[#FF5A36]">WHO AM I?</span>
          </h1>
        </div>
      ) : (
        <div key={count} className="relative animate-count-pop text-center">
          <span className="font-display text-[10rem] font-black leading-none text-[#F5F1E8] sm:text-[14rem]">
            {count > 0 ? count : 'GO!'}
          </span>
        </div>
      )}
    </div>
  );
}
