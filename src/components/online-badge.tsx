import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { formatTimeAgo } from '@/lib/dateFormatter';
import { cn } from '@/lib/utils';

type OnlineBadgeProps = {
  lastOnline?: string | null;
  showText?: boolean;
  /**
   * Never show the green "online" look, e.g. when the subscription has ended:
   * a recent connection says nothing about whether it works now.
   */
  neutral?: boolean;
};

export const OnlineBadge: FC<OnlineBadgeProps> = ({ lastOnline, showText = false, neutral = false }) => {
  const { t } = useTranslation();

  const { text, isOnline } = formatTimeAgo(lastOnline, t);
  const online = isOnline && !neutral;
  // Text for "never connected", "online", or "last used: …"
  const when = isOnline ? t('time.recently') : text;
  const label = !lastOnline ? text : online ? text : `${t('userInfo.lastUsed')}: ${when}`;

  const dot = !lastOnline ? (
    <div className="w-2.5 h-2.5 rounded-full border-2 border-muted-foreground/50" />
  ) : online ? (
    <div className="relative">
      <div className="w-2.5 h-2.5 rounded-full bg-success" />
      <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-success animate-ping opacity-75 motion-reduce:hidden" />
    </div>
  ) : (
    <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/60" />
  );

  return (
    <div className="inline-flex items-center gap-2" title={label}>
      <span aria-hidden="true">{dot}</span>
      {/* Visible text, or the same text for screen readers when only the dot shows */}
      <span className={showText ? cn(online ? 'text-sm text-success font-medium' : 'text-sm text-muted-foreground') : 'sr-only'}>
        {label}
      </span>
    </div>
  );
};
