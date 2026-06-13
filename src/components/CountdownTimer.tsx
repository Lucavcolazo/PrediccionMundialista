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
    <div className="flex flex-col items-center gap-0.5">
      <span
        className="text-2xl font-black tabular-nums leading-none"
        style={{ color: 'var(--accent-green)' }}
      >
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">{label}</span>
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
      <span className="text-sm font-semibold" style={{ color: 'var(--accent-green)' }}>
        ¡Iniciando!
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {timeLeft.days > 0 && <Pad value={timeLeft.days} label="días" />}
      {timeLeft.days > 0 && <span className="text-xl font-light text-[var(--text-muted)] mb-2">:</span>}
      <Pad value={timeLeft.hours} label="hs" />
      <span className="text-xl font-light text-[var(--text-muted)] mb-2">:</span>
      <Pad value={timeLeft.minutes} label="min" />
      <span className="text-xl font-light text-[var(--text-muted)] mb-2">:</span>
      <Pad value={timeLeft.seconds} label="seg" />
    </div>
  );
}
