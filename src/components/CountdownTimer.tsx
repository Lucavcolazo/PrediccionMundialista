import { useEffect, useState } from 'react';

interface CountdownTimerProps {
  targetDate: string; // ISO 8601
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calcTimeLeft(targetDate: string): TimeLeft | null {
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) return null;

  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1_000),
  };
}

function Pad({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span
        className="font-mono-score text-xl font-semibold text-[var(--accent-gold)] bg-[var(--accent-gold-dim)] border border-[rgba(201,168,76,0.2)] rounded-lg px-2.5 py-1.5 min-w-[44px] text-center"
      >
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[9px] uppercase tracking-[1px] text-[var(--text-muted)] mt-1">{label}</span>
    </div>
  );
}

export function CountdownTimer({ targetDate, className = '' }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() => calcTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calcTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) {
    return (
      <span className="text-sm font-semibold" style={{ color: 'var(--accent-gold)' }}>
        ¡Iniciando!
      </span>
    );
  }

  return (
    <div className={`flex justify-center gap-2 mt-2.5 ${className}`}>
      {timeLeft.days > 0 && <Pad value={timeLeft.days} label="días" />}
      {timeLeft.days > 0 && <span className="font-mono-score text-lg text-[var(--accent-gold)] pt-1.5">:</span>}
      <Pad value={timeLeft.hours} label="hs" />
      <span className="font-mono-score text-lg text-[var(--accent-gold)] pt-1.5">:</span>
      <Pad value={timeLeft.minutes} label="min" />
      <span className="font-mono-score text-lg text-[var(--accent-gold)] pt-1.5">:</span>
      <Pad value={timeLeft.seconds} label="seg" />
    </div>
  );
}
