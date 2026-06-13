import { useState } from 'react';

interface FlagImageProps {
  code: string;       // ISO 3166-1 alpha-2 lowercase (e.g. "ar", "fr")
  logo?: string;      // Promiedos logo URL
  teamName: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_MAP = {
  sm:  { width: 24,  height: 18 },
  md:  { width: 40,  height: 30 },
  lg:  { width: 56,  height: 42 },
  xl:  { width: 80,  height: 60 },
};

export function FlagImage({ code, logo, teamName, size = 'md', className = '' }: FlagImageProps) {
  const { width, height } = SIZE_MAP[size];
  const [phase, setPhase] = useState<'flagcdn' | 'logo' | 'text'>('flagcdn');

  const isLikelyIso = code && code.length <= 6;
  const flagCdnSrc = isLikelyIso ? `https://flagcdn.com/w${width * 2}/${code}.png` : '';

  const abbr = teamName.substring(0, 3).toUpperCase();

  if (phase === 'text' || (!flagCdnSrc && !logo)) {
    return (
      <span
        className={`inline-flex items-center justify-center font-bold text-[var(--text-muted)] text-[10px] bg-[var(--bg-border)] rounded-sm ${className}`}
        style={{ width, height, minWidth: width, fontSize: 9, lineHeight: 1 }}
      >
        {abbr}
      </span>
    );
  }

  const src = phase === 'flagcdn' ? flagCdnSrc : (logo || '');

  return (
    <img
      src={src}
      alt={`${teamName}`}
      width={width}
      height={height}
      className={`object-contain rounded-sm shrink-0 ${className}`}
      style={{ minWidth: width }}
      onError={() => {
        if (phase === 'flagcdn' && logo) {
          setPhase('logo');
        } else {
          setPhase('text');
        }
      }}
    />
  );
}
