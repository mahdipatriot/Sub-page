import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * How the connection is doing; the mark's signal arcs show it.
 * - working: green, arcs pulse outward like a signal being sent
 * - low:     amber, slower pulse (time or data running out)
 * - ready:   blue, still (not started yet)
 * - idle:    green, still (active but not used recently)
 * - ended:   grey, still, outer arc faded (no signal)
 * - neutral: brand colour, still (loading or error screens)
 */
export type LogoTone = 'working' | 'low' | 'ready' | 'idle' | 'ended' | 'neutral';

const waveTone: Record<LogoTone, string> = {
  working: 'text-success',
  low: 'text-warning',
  ready: 'text-info',
  idle: 'text-success',
  ended: 'text-muted-foreground',
  neutral: 'text-primary',
};

/**
 * Roopsida mark: an R whose bowl sends out three signal arcs. The letter is
 * drawn in on load, stroke by stroke; the arcs then become the page's live
 * connection light. Decorative: the status is always written out in text.
 */
// Arcs around the bowl's centre (9,19), radius 11 / 15 / 19, from 80° to 10°
const WAVES = [
  'M10.9 8.2a11 11 0 0 1 8.9 8.9',
  'M11.6 4.2a15 15 0 0 1 12.2 12.2',
  'M12.3 0.3a19 19 0 0 1 15.4 15.4',
];

export function LogoMark({ tone = 'neutral', className }: { tone?: LogoTone; className?: string }) {
  const pulsing = tone === 'working' || tone === 'low';
  // The draw-in plays once per browser session; after that the mark is just there
  const [drawn] = useState(() => {
    try { return sessionStorage.getItem('logo-drawn') === '1'; } catch { return false; }
  });
  useEffect(() => {
    try { sessionStorage.setItem('logo-drawn', '1'); } catch { /* storage may be blocked */ }
  }, []);
  return (
    <svg
      viewBox="4 0 26 36"
      aria-hidden="true"
      focusable="false"
      className={cn('logo-mark h-8 w-auto shrink-0 overflow-visible', className)}
      data-tone={tone}
      data-drawn={drawn ? '' : undefined}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* The letter: stem, bowl, leg */}
      <g className="text-primary" stroke="currentColor" strokeWidth={4.2}>
        <path className="logo-draw" style={{ animationDelay: '0ms' }} pathLength={1} d="M9 33V12" />
        <path className="logo-draw" style={{ animationDelay: '110ms' }} pathLength={1} d="M9 12a7 7 0 0 1 0 14" />
        <path className="logo-draw" style={{ animationDelay: '220ms' }} pathLength={1} d="M13.5 26 22 33" />
      </g>
      {/* The signal: three arcs from the bowl (same as the status card), the status colour */}
      <g className={cn('transition-colors duration-500', waveTone[tone])} stroke="currentColor" strokeWidth={2.2}>
        {WAVES.map((d, k) => (
          <path
            key={d}
            className={cn(
              'logo-draw',
              pulsing && 'logo-wave',
              tone === 'low' && 'logo-wave-slow',
              tone === 'ended' && k > 0 && '[stroke-opacity:0.4]'
            )}
            style={{ animationDelay: pulsing ? `${340 + k * 110}ms, ${1300 + k * 220}ms` : `${340 + k * 110}ms` }}
            pathLength={1}
            d={d}
          />
        ))}
      </g>
    </svg>
  );
}
