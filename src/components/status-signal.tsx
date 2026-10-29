import { cn } from '@/lib/utils';
import type { LogoTone } from '@/components/logo-mark';

/**
 * The logo's R and its signal, shown large in the status card. Three arcs,
 * like signal strength: how many arcs are lit says how the subscription is
 * doing, the colour says why. Decorative: the card's heading says it in words.
 *
 * working 3 lit, pulsing outward · idle 2 lit · low 1 lit, amber, slow pulse
 * ready   all arcs blue, lit once inner to outer (not started) · ended none lit, grey
 */
const lit: Record<LogoTone, number> = { working: 3, idle: 2, low: 1, ready: 0, ended: 0, neutral: 3 };
const tone: Record<LogoTone, string> = {
  working: 'text-success',
  idle: 'text-success',
  low: 'text-warning',
  ready: 'text-info',
  ended: 'text-muted-foreground',
  neutral: 'text-primary',
};

// The logo's R, shown large: stem, bowl and leg in a faint neutral, and the
// signal arcs coming out of the bowl (same angles as the header mark).
const C = { x: 34, y: 70 };
const ARCS = [
  'M42.3 39.1A32 32 0 0 1 65.3 63.3',
  'M46.4 23.6A48 48 0 0 1 81 60',
  'M50.6 8.2A64 64 0 0 1 96.6 56.7',
];

export function StatusSignal({ state, className }: { state: LogoTone; className?: string }) {
  const n = lit[state];
  const pulsing = state === 'working' || state === 'low';
  return (
    <svg
      viewBox="20 0 90 116"
      aria-hidden="true"
      focusable="false"
      className={cn('status-signal shrink-0 overflow-visible transition-colors duration-500', tone[state], className)}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g className="text-primary opacity-45" stroke="currentColor" strokeWidth={9}>
        <path d={`M${C.x} 52V104`} />
        <path d={`M${C.x} 52a18 18 0 0 1 0 36`} />
        <path d="M45.6 88 67 106" />
      </g>
      {ARCS.map((d, i) => {
        const on = i < n;
        return (
          <path
            key={d}
            d={d}
            stroke="currentColor"
            strokeWidth={8}
            className={cn(
              'transition-opacity duration-500',
              on || state === 'ready' ? 'opacity-100' : 'opacity-25',
              on && pulsing && 'signal-pulse',
              on && state === 'low' && 'signal-pulse-slow',
              state === 'ready' && 'signal-arm'
            )}
            // the pulse (or the "ready" light-up) travels outward, arc by arc
            style={(on && pulsing) || state === 'ready' ? { animationDelay: `${i * 260}ms` } : undefined}
          />
        );
      })}
    </svg>
  );
}
