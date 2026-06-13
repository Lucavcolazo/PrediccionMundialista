interface FlagImageProps {
  code: string;       // ISO 3166-1 alpha-2 lowercase (e.g. "ar", "fr")
  teamName: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_MAP = {
  sm:  { width: 24,  height: 18,  emoji: 'text-base' },
  md:  { width: 40,  height: 30,  emoji: 'text-2xl' },
  lg:  { width: 56,  height: 42,  emoji: 'text-3xl' },
  xl:  { width: 80,  height: 60,  emoji: 'text-5xl' },
};

// Fallback emoji map for common teams
const FLAG_EMOJI: Record<string, string> = {
  ar: '🇦🇷', au: '🇦🇺', be: '🇧🇪', br: '🇧🇷', cm: '🇨🇲',
  ca: '🇨🇦', cl: '🇨🇱', co: '🇨🇴', hr: '🇭🇷', dk: '🇩🇰',
  ec: '🇪🇨', eg: '🇪🇬', fr: '🇫🇷', de: '🇩🇪', gh: '🇬🇭',
  ir: '🇮🇷', it: '🇮🇹', jp: '🇯🇵', kr: '🇰🇷', mx: '🇲🇽',
  ma: '🇲🇦', nl: '🇳🇱', nz: '🇳🇿', ng: '🇳🇬', pa: '🇵🇦',
  py: '🇵🇾', pe: '🇵🇪', pl: '🇵🇱', pt: '🇵🇹', sa: '🇸🇦',
  sn: '🇸🇳', rs: '🇷🇸', si: '🇸🇮', za: '🇿🇦', es: '🇪🇸',
  ch: '🇨🇭', tn: '🇹🇳', ua: '🇺🇦', us: '🇺🇸', uy: '🇺🇾',
  ve: '🇻🇪', cr: '🇨🇷', hn: '🇭🇳', bo: '🇧🇴', gt: '🇬🇹',
  tg: '🇹🇬',
  'gb-eng': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'gb-wls': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
};

export function FlagImage({ code, teamName, size = 'md', className = '' }: FlagImageProps) {
  const { width, height, emoji } = SIZE_MAP[size];
  const src = `https://flagcdn.com/w${width * 2}/${code}.png`;
  const emoji_fallback = FLAG_EMOJI[code] ?? '🏳';

  return (
    <img
      src={src}
      alt={`${teamName} flag`}
      width={width}
      height={height}
      className={`object-cover rounded-sm ${className}`}
      style={{ aspectRatio: '4/3', minWidth: width }}
      onError={(e) => {
        const el = e.currentTarget;
        el.style.display = 'none';
        const span = document.createElement('span');
        span.className = emoji;
        span.textContent = emoji_fallback;
        el.parentNode?.insertBefore(span, el.nextSibling);
      }}
    />
  );
}
