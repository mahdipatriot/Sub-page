import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserInfo, useConfigData, useChartData, useSupportUrl } from '@/hooks/useUserData';
import { useLanguage } from '@/hooks/useLanguage';
import { Layout } from '@/components/layout';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';
import { TrafficChart } from '@/components/traffic-chart';
import { ConnectionLinks } from '@/components/connection-links';
import { ConnectPanel } from '@/components/connect-panel';
import { AppsList } from '@/components/AppsList';
import { LogoMark, type LogoTone } from '@/components/logo-mark';
import { StatusSignal } from '@/components/status-signal';
import { SettingsMenu } from '@/components/settings-menu';
import { SectionMark } from '@/components/section-mark';
import { RENEW_BOT_URL, RENEW_BOT_HANDLE } from '@/constants/project';
import { formatRelativeExpiry, formatDate, formatTimeAgo, ONLINE_WINDOW_MS } from '@/lib/dateFormatter';
import { RefreshCcw, Bell, TriangleAlert, MessageCircle, ChevronDown, X, CircleCheck, Plus } from 'lucide-react';
import { cn } from './lib/utils';
// Renew / Edit buttons are commented out for now; restore this import with them.
// import { RENEW_BASE_URL, EDIT_BASE_URL } from './constants/project';
import { Button } from './components/ui/button';
import { isSafeNetworkUrl, sanitizeNetworkUrl } from '@/lib/urlSafety';
import { formatBytes, localizeDigits } from '@/lib/numerals';
import { getInitialData } from '@/lib/initialData';


// C14 fix: announce-url must only use https — reject http, javascript, data, etc.
// P8.9: Use the centralized isSafeNetworkUrl from urlSafety.ts instead of
// a local duplicate.

// Status colours come from theme tokens (see index.css), so each theme can tune
// them for contrast: green = active, amber = running low, blue = not started, red = ended (any cause).
const statusConfig = {
  active: {
    color: 'text-success',
    borderColor: 'ring-1 ring-success/25',
    // written out in full so Tailwind generates it
    dot: 'bg-success',
  },
  // Ended states: neutral card, only the title and dot carry the colour
  limited: {
    color: 'text-destructive',
    borderColor: 'ring-1 ring-foreground/10',
    // written out in full so Tailwind generates it
    dot: 'bg-destructive',
  },
  on_hold: {
    color: 'text-info',
    borderColor: 'ring-1 ring-info/25',
    // written out in full so Tailwind generates it
    dot: 'bg-info',
  },
  expired: {
    color: 'text-destructive',
    borderColor: 'ring-1 ring-foreground/10',
    // written out in full so Tailwind generates it
    dot: 'bg-destructive',
  },
  disabled: {
    color: 'text-destructive',
    borderColor: 'ring-1 ring-foreground/10',
    // written out in full so Tailwind generates it
    dot: 'bg-destructive',
  },
};

// Telegram chat links (t.me/<username>) accept ?text= to prefill the message,
// so the ready-made message needs no clipboard. Other links are left as-is.
const TG_HOSTS = ['t.me', 'www.t.me', 'telegram.me', 'www.telegram.me'];
const TG_RESERVED = ['joinchat', 'share', 'addstickers', 'addemoji', 'proxy', 'socks', 'c', 's'];
function withTelegramText(url: string, text: string): { href: string; prefilled: boolean } {
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    const isChat =
      u.protocol === 'https:' &&
      TG_HOSTS.includes(u.hostname.toLowerCase()) &&
      parts.length === 1 &&
      /^[A-Za-z0-9_]{4,}$/.test(parts[0]) &&
      !TG_RESERVED.includes(parts[0].toLowerCase()) &&
      !u.searchParams.has('start');
    if (!isChat) return { href: url, prefilled: false };
    u.searchParams.set('text', text);
    return { href: u.toString(), prefilled: true };
  } catch {
    return { href: url, prefilled: false };
  }
}

// One top bar for every state: wordmark on the start side, language and
// theme on the end side. The tagline only shows where there is room.
function BrandBar({ tagline, supportUrl, supportPending = false, tone = 'neutral', narrow = false }: { tagline: string; supportUrl?: string; supportPending?: boolean; tone?: LogoTone; narrow?: boolean }) {
  const { t } = useTranslation();
  return (
    <header className={cn('container relative mx-auto px-4 pt-5 sm:pt-8 flex items-center justify-between gap-4', narrow ? 'max-w-3xl' : 'max-w-5xl')}>
      <div className="flex min-w-0 items-center gap-3">
        {/* The wordmark: the animated mark is its "R" (its signal arcs are the live connection light) */}
        <p data-brand="Roopsida" dir="ltr" className="brand-wordmark inline-flex items-baseline text-2xl sm:text-3xl font-extrabold leading-none text-primary select-none">
          <span className="sr-only">Roopsida</span>
          <LogoMark tone={tone} className="h-[1.2em] -me-[0.06em]" />
          <span aria-hidden="true">oopsida</span>
        </p>
        <span className="hidden sm:inline truncate text-sm text-muted-foreground font-medium select-none">{tagline}</span>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {/* Support is always one tap away: renewal and problems both go there */}
        {supportUrl && supportUrl !== '#' ? (
          <a
            href={supportUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('userInfo.supportUrl')}
            className="inline-flex h-11 sm:h-9 items-center justify-center gap-1.5 rounded-full border border-border bg-background px-4 sm:px-3 text-sm font-medium hover:bg-accent transition-colors"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            <span>{t('userInfo.supportUrl')}</span>
          </a>
        ) : supportPending ? (
          // Same size as the button, so nothing moves when the link arrives
          <span aria-hidden="true" className="inline-block h-11 sm:h-9 w-28 rounded-full bg-muted animate-pulse motion-reduce:animate-none" />
        ) : null}
        <SettingsMenu className="sm:hidden" />
        <span className="hidden sm:contents">
          <LanguageSwitcher />
          <ThemeToggle />
        </span>
      </div>
    </header>
  );
}

function App() {
  const { t, i18n } = useTranslation();
  useLanguage();
  const [timeRange, setTimeRange] = useState('7d');
  const [announceOpen, setAnnounceOpen] = useState(false);
  const [announceDismissed, setAnnounceDismissed] = useState<string | null>(() => {
    try { return localStorage.getItem('announce-dismissed'); } catch { return null; }
  });

  const { startTime, period } = useMemo(() => {
    const now = new Date();
    const start = new Date();
    let selectedPeriod = 'hour';
    
    switch (timeRange) {
      case "24h":
        start.setTime(now.getTime() - 24 * 60 * 60 * 1000);
        selectedPeriod = 'hour';
        break;
      case "7d":
        start.setTime(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        selectedPeriod = 'day';
        break;
      case "30d":
        start.setTime(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        selectedPeriod = 'day';
        break;
      default:
        start.setTime(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        selectedPeriod = 'day';
    }
    
    return { startTime: start, period: selectedPeriod };
  }, [timeRange]);

  const { data, headers, error, isLoading, isValidating, refresh } = useUserInfo();
  // When the shown status was last fetched; a slow tick keeps "2 min ago" honest
  const [updatedAt, setUpdatedAt] = useState(() => Date.now());
  const [, setTick] = useState(0);
  useEffect(() => {
    if (data) setUpdatedAt(Date.now());
  }, [data]);
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 30000);
    return () => window.clearInterval(id);
  }, []);
  const { data: configData } = useConfigData();
  const { supportUrl } = useSupportUrl();
  const safeSupportUrl = sanitizeNetworkUrl(supportUrl);
  // The support link arrives with the first status response; keep its place until then
  const supportPending = !supportUrl && !headers && !error;
  
  // Check if we have initial/fallback data to use even if there's an error
  // P5.11: read initial data from the JSON script tag via getInitialData()
  // instead of window.__INITIAL_DATA__ (which required unsafe-inline CSP).
  const initialData = getInitialData();
  const hasInitialData = !!initialData?.user;
  const hasData = data || hasInitialData;
  const effectiveData = data || (hasInitialData ? initialData?.user : undefined);
  
  // Get raw announce header value
  const rawAnnounceHeader = useMemo(() => {
    if (!headers) return null;
    return (headers as any)['announce'] || (headers as any)['Announce'] || (headers as any)['ANNOUNCE'] || null;
  }, [headers]);

  // Decode announcement message (can be URL-encoded or base64)
  const announcementMessage = useMemo(() => {
    if (!rawAnnounceHeader || typeof rawAnnounceHeader !== 'string') return null;
    
    const announce = rawAnnounceHeader;

    // Check if it's base64 encoded (format: "base64:...")
    if (announce.startsWith('base64:')) {
      try {
        const base64Data = announce.substring(7).trim(); // Remove "base64:" prefix and trim whitespace
        if (!base64Data) return null;
        
        // Decode base64
        const decoded = decodeURIComponent(escape(atob(base64Data)));
        return decoded;
      } catch (error) {
        console.warn('Failed to decode base64 announcement:', error, 'Raw value:', announce);
        // If decoding fails, return the original value without the prefix
        return announce.substring(7);
      }
    }
    
    // Otherwise, try URL decoding
    try {
      return decodeURIComponent(announce);
    } catch {
      return announce;
    }
  }, [rawAnnounceHeader]);

  // Fetch chart data independently - don't wait for user info
  const { chartData, chartError, chartRetry } = useChartData(startTime, period, true);

  // Normalize status to lowercase and ensure it's valid (must be above early returns for Rules of Hooks)
  const normalizedStatus = useMemo(() => {
    if (!effectiveData?.status) return 'active';
    const status = String(effectiveData.status).toLowerCase();
    const validStatuses = ['active', 'disabled', 'limited', 'expired', 'on_hold'];
    return validStatuses.includes(status) ? status : 'active';
  }, [effectiveData?.status]);


  // Calculate expiry information
  const expiryInfo = useMemo(() => {
    if (!effectiveData) return { status: '', time: '', isExpired: false };
    
    // For on_hold status, show available duration instead of expiry
    if (effectiveData.status === 'on_hold' && effectiveData.on_hold_expire_duration) {
      const days = Math.floor(effectiveData.on_hold_expire_duration / 86400); // Convert seconds to days
      const hours = Math.floor((effectiveData.on_hold_expire_duration % 86400) / 3600);
      
      let timeText = '';
      if (days > 0) {
        timeText = `${days} ${t(days === 1 ? 'time.day' : 'time.days')}`;
        if (hours > 0 && days < 30) {
          timeText += ` ${hours} ${t(hours === 1 ? 'time.hour' : 'time.hours')}`;
        }
      } else if (hours > 0) {
        timeText = `${hours} ${t(hours === 1 ? 'time.hour' : 'time.hours')}`;
      }
      
      return {
        status: t('userInfo.available'),
        time: localizeDigits(timeText, i18n.language),
        isExpired: false
      };
    }
    
    return formatRelativeExpiry(effectiveData.expire, t);
  }, [effectiveData, t, i18n.language]);

  // Exact expiry date under the relative "expires in". Not for on_hold (the
  // clock has not started) or subscriptions without an expiry.
  const expiryDateText = (() => {
    const exp = effectiveData?.expire;
    if (!effectiveData || effectiveData.status === 'on_hold' || !exp || exp === '0') return null;
    return formatDate(exp, i18n.language === 'fa' ? 'fa-IR' : i18n.language, false);
  })();

  // Show loading only if we have no data at all (not even initial data) and are still loading
  if (isLoading && !hasData) {
    return (
      <Layout>
        <div className="relative min-h-screen overflow-x-hidden">
          <BrandBar tagline={t('brand.tagline')} supportUrl={safeSupportUrl} supportPending={supportPending} />
          {/* Loading placeholder, shaped like the real page so nothing jumps */}
          <div aria-busy="true" className="container relative px-4 pt-4 sm:pt-10 mx-auto max-w-5xl">
            <span className="sr-only">{t('common.loading')}</span>
            <div className="mb-3 sm:mb-6 flex items-center justify-between gap-3">
              <div className="h-7 w-44 rounded-lg bg-muted animate-pulse motion-reduce:animate-none" />
              <div className="h-5 w-32 rounded-lg bg-muted animate-pulse motion-reduce:animate-none" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-5 lg:gap-0 lg:overflow-hidden lg:rounded-3xl lg:bg-card lg:ring-1 lg:ring-foreground/10">
              <div className="lg:col-span-3 rounded-2xl sm:rounded-3xl lg:rounded-none bg-card lg:bg-transparent ring-1 ring-foreground/10 lg:ring-0 p-4 sm:p-6 lg:p-8 lg:border-e lg:border-foreground/10 animate-pulse motion-reduce:animate-none">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="h-9 w-28 rounded-lg bg-muted" />
                    <div className="h-5 w-48 rounded bg-muted" />
                  </div>
                  <div className="size-16 sm:size-24 rounded-2xl bg-muted" />
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4 border-t border-foreground/10 pt-5">
                  <div className="space-y-2"><div className="h-4 w-20 rounded bg-muted" /><div className="h-8 w-24 rounded-lg bg-muted" /></div>
                  <div className="space-y-2"><div className="h-4 w-20 rounded bg-muted" /><div className="h-8 w-24 rounded-lg bg-muted" /></div>
                </div>
              </div>
              <div className="lg:col-span-2 rounded-2xl sm:rounded-3xl lg:rounded-none bg-card lg:bg-transparent ring-1 ring-foreground/10 lg:ring-0 p-4 sm:p-6 lg:p-8 space-y-4 animate-pulse motion-reduce:animate-none">
                <div className="h-6 w-24 rounded-lg bg-muted" />
                <div className="h-11 w-full rounded-full bg-muted" />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Only show error page if we have no data at all (not even initial/fallback) and we're not loading/retrying
  // If we have data (even from initial/fallback), continue showing it and retry in background
  if (error && !hasData && !isLoading && !isValidating) {
    return (
      <Layout>
        <div className="relative min-h-screen overflow-x-hidden">
          <BrandBar tagline={t('brand.tagline')} supportUrl={safeSupportUrl} supportPending={supportPending} />
          <div className="flex items-center justify-center min-h-[50vh] px-4">
            <div className="text-center space-y-6 p-8 rounded-2xl bg-card ring-1 ring-foreground/10 shadow-sm max-w-md">
              <TriangleAlert aria-hidden="true" className="mx-auto size-12 text-destructive" />
              <p className="text-2xl font-bold text-destructive">{t('dashboard.error')}</p>
              <p className="text-muted-foreground">{t('dashboard.errorDescription')}</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button onClick={() => refresh()} className="h-11 rounded-full px-6">
                  {t('dashboard.retry')}
                </Button>
                {safeSupportUrl !== '#' && (
                  <a
                    href={safeSupportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 items-center rounded-full border border-border bg-background px-6 text-sm font-medium hover:bg-accent transition-colors"
                  >
                    {t('status.contactSupport')}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!effectiveData) return null;

  // Running low on an active subscription: <= 20% data or <= 3 days left.
  const hasDataLimit = !!effectiveData.data_limit && effectiveData.data_limit > 0;
  const remainingBytes = hasDataLimit ? Math.max(0, effectiveData.data_limit - (effectiveData.used_traffic || 0)) : Infinity;
  const expireMs = effectiveData.expire && effectiveData.expire !== '0' ? new Date(effectiveData.expire).getTime() : NaN;
  const daysLeft = Number.isFinite(expireMs) ? (expireMs - Date.now()) / 864e5 : Infinity;
  const lowData = normalizedStatus === 'active' && hasDataLimit && remainingBytes / effectiveData.data_limit <= 0.2;
  const lowTime = normalizedStatus === 'active' && daysLeft <= 3;
  const ended = normalizedStatus === 'limited' || normalizedStatus === 'expired' || normalizedStatus === 'disabled';

  const remainingPct = hasDataLimit ? Math.max(0, Math.min(100, (remainingBytes / effectiveData.data_limit) * 100)) : 0;
  // Colour names the cause: red = data ran out, grey = ended for another
  // reason (date, disabled), amber = running low, otherwise calm.
  const dataTone = remainingBytes === 0
    ? 'text-destructive'
    : ended
      ? 'text-muted-foreground'
      : lowData
        ? 'text-warning'
        : 'text-foreground';
  const barTone = remainingBytes === 0
    ? 'bg-destructive'
    : ended
      ? 'bg-muted-foreground'
      : lowData
        ? 'bg-warning'
        : 'bg-success';
  const onlineMs = effectiveData.online_at ? new Date(effectiveData.online_at).getTime() : NaN;
  const workingNow = !ended && Number.isFinite(onlineMs) && Date.now() - onlineMs <= ONLINE_WINDOW_MS;
  // Same rule as the Connect panel: set up already (recently or long ago) = Connect is collapsed
  const connectCompact = workingNow || (!ended && Number.isFinite(onlineMs) && Date.now() - onlineMs > 864e5);
  const supportMessage = normalizedStatus === 'disabled'
    ? t('support.helpMessage', { username: effectiveData.username })
    : t('support.renewMessage', { username: effectiveData.username });

  // Ended: only the tile that explains why stays prominent
  const timeQuiet = ended && normalizedStatus !== 'expired';
  const dataQuiet = ended && normalizedStatus !== 'limited';
  // What is actually left over on an ended subscription, so the note names only that
  const leftoverTime = timeQuiet && !expiryInfo.isExpired && !!expiryInfo.time;
  const leftoverData = dataQuiet && hasDataLimit && remainingBytes > 0;
  const leftoverKey = leftoverTime && leftoverData ? 'both' : leftoverTime ? 'time' : leftoverData ? 'data' : null;
  const leftoverNote = !ended || !leftoverKey
    ? null
    : normalizedStatus === 'disabled'
      ? t(`status.leftoverDisabled_${leftoverKey}`)
      : t(`status.leftover_${leftoverKey}`);
  const showNoReAdd = ended && normalizedStatus !== 'disabled';
  // Facts for the "after renewal" list: leftover data is added, leftover time is not
  const factData = (normalizedStatus === 'active' || leftoverData) && hasDataLimit && remainingBytes > 0;
  const factTime = ended ? leftoverTime : Number.isFinite(daysLeft) && daysLeft > 0;
  const usedBytes = effectiveData.used_traffic || 0;
  const dataUsedUp = hasDataLimit && remainingBytes === 0;
  const bothUnlimited = !hasDataLimit && (!effectiveData.expire || effectiveData.expire === '0') && normalizedStatus !== 'on_hold';
  // The ended title is already red; the date beneath it doesn't need to shout too
  const timeTone = lowTime ? 'text-warning' : 'text-foreground';

  // Does the connection work? (active only)
  const connVerdict = normalizedStatus !== 'active'
    ? null
    : workingNow
      ? t('verdict.working')
      : !effectiveData.online_at
        ? t('verdict.notYet')
        : t('verdict.lastUsed', { when: formatTimeAgo(effectiveData.online_at, t).text });
  // Running low is the headline; "working" moves to the line beneath it
  const low = lowData || lowTime;
  const lowVerdict = !low
    ? null
    : lowData && lowTime
      ? t('verdict.lowBoth')
      : lowTime
        ? t('verdict.lowTime', { time: expiryInfo.time })
        : t('verdict.lowData', { left: formatBytes(remainingBytes, i18n.language) });
  const verdict = lowVerdict ?? connVerdict;

  const logoTone: LogoTone = ended
    ? 'ended'
    : low
      ? 'low'
      : normalizedStatus === 'on_hold'
        ? 'ready'
        : workingNow
          ? 'working'
          : 'idle';

  // Disabled: talk to support (message prefilled). Otherwise renewal is in the bot.
  const support = withTelegramText(safeSupportUrl, supportMessage);
  const dataText = hasDataLimit ? formatBytes(remainingBytes, i18n.language) : t('userInfo.unlimited');
  const renewViaBot = normalizedStatus !== 'disabled';
  // Never connected yet: setting up is the job, so Connect leads and status stays compact
  const needsSetup = normalizedStatus === 'on_hold' || (normalizedStatus === 'active' && !effectiveData.online_at);
  // Phones show Connect first for a new subscriber; this line answers "did I get what I paid for?"
  const readySummary = !needsSetup
    ? null
    : normalizedStatus === 'on_hold'
      ? t('connect.readyOnHold', { time: expiryInfo.time, data: dataText })
      : t('connect.readyActive', { time: expiryInfo.time, data: dataText });
  const ageMin = Math.floor((Date.now() - updatedAt) / 60000);
  const freshWhen = ageMin < 1
    ? t('fresh.justNow')
    : ageMin < 60
      ? localizeDigits(`${ageMin} ${t('time.mins')} ${t('time.ago')}`, i18n.language)
      : localizeDigits(`${Math.floor(ageMin / 60)} ${t('time.hours')} ${t('time.ago')}`, i18n.language);
  // Data meter: ten segments, like signal bars, filled from the start side
  const meterFilled = remainingPct > 0 ? Math.max(1, Math.round(remainingPct / 10)) : 0;

  const statusStyle = low
    ? { color: 'text-foreground', borderColor: 'ring-1 ring-warning/30', dot: 'bg-warning' }
    : statusConfig[normalizedStatus as keyof typeof statusConfig] || statusConfig.disabled;

  // Renew / Edit buttons are commented out for now (owner's request).
  // To restore: uncomment this, the import above, and the two button blocks below.
  // const needsRenew = normalizedStatus === 'limited' || normalizedStatus === 'expired';
  // const goRenew = () => {
  //   window.location.href = `${RENEW_BASE_URL}${encodeURIComponent(effectiveData.username)}`;
  // };
  // Connect panel, placed before or after the status card depending on what the visitor needs first.
  // Ended: nothing to set up, the status card already explains it.
  const connectEl = ended ? null : (
    <ConnectPanel
      className={cn(needsSetup ? 'lg:col-span-3' : 'lg:col-span-2', 'lg:rounded-none lg:bg-transparent lg:shadow-none lg:ring-0 lg:p-8')}
      status={normalizedStatus}
      lastOnline={effectiveData.online_at}
      onCheck={refresh}
      checking={isValidating}
      summary={readySummary}
    />
  );

  const stateHint: Record<string, string> = {
    on_hold: t('status.onHoldHint'),
    limited: t('status.limitedHint'),
    expired: t('status.expiredHint'),
    disabled: t('status.disabledHint'),
  };

  return (
    <Layout>
      <div className="relative min-h-screen overflow-x-hidden">

        <BrandBar tagline={t('brand.tagline')} supportUrl={safeSupportUrl} supportPending={supportPending} tone={logoTone} narrow={ended} />

        {/* Hero Section */}
        <div className="relative">
          <div className={cn('container relative px-4 pt-4 sm:pt-10 mx-auto', ended ? 'max-w-3xl' : 'max-w-5xl')}>
            {/* Header: whose subscription this is, live status, and account actions */}
            <div className="mb-3 sm:mb-6">
              <div>
                {/* One quiet row: whose subscription, when it was checked, check again */}
                <div className="flex items-center gap-x-2">
                <h1 className="min-w-0 flex-1 text-lg sm:text-2xl font-bold text-foreground">
                  <span className="sr-only">{t('userInfo.subscriptionOf')} </span>
                  {/* ltr so a long name is cut at its end, never its start; still aligned to the page's start side */}
                  <span dir="ltr" title={effectiveData.username} className="block truncate rtl:text-right">
                    {effectiveData.username}
                  </span>
                </h1>
                <div className="flex shrink-0 items-center gap-1">
                  {/* Proof that the page is current, e.g. after renewing */}
                  <span className="text-sm text-muted-foreground">
                    {t('fresh.updated')}: {freshWhen}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isValidating) refresh();
                    }}
                    disabled={isValidating}
                    aria-label={t('dashboard.refresh')}
                    title={t('dashboard.refresh')}
                    className="inline-flex size-11 sm:size-auto sm:h-9 shrink-0 items-center justify-center gap-1.5 rounded-full sm:px-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground disabled:cursor-wait transition-colors"
                  >
                    <RefreshCcw aria-hidden="true" className={cn('size-4', isValidating && 'animate-spin text-primary')} />
                    <span className="hidden sm:inline">{t('dashboard.refresh')}</span>
                  </button>
                </div>
                </div>
                {/* دکمه‌های تمدید و ویرایش اشتراک */}
                {/* Commented out for now (owner's request): Renew / Edit buttons.
                {effectiveData?.username && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {!needsRenew && (
                      <Button
                        onClick={goRenew}
                        variant="default"
                        className="h-11 sm:h-10 rounded-full px-5"
                      >
                        {t('subscription.renew', 'تمدید اشتراک')}
                      </Button>
                    )}
                    <Button
                      onClick={() => window.location.href = `${EDIT_BASE_URL}${encodeURIComponent(effectiveData.username)}`}
                      variant="outline"
                      className="h-11 sm:h-10 rounded-full px-5"
                    >
                      {t('subscription.edit', 'ویرایش اشتراک')}
                    </Button>
                  </div>
                )}
                */}
              </div>
            </div>

            {/* Status Hero. Phones: two stacked cards. Desktop: one panel with two panes and a
                full-height divider, so the outer edge always lines up whatever each pane holds. */}
            <div
              className={cn(
                'grid grid-cols-1 gap-4 sm:gap-6 mb-6 sm:mb-8',
                !ended && 'lg:grid-cols-5 lg:gap-0 lg:overflow-hidden lg:rounded-3xl lg:bg-card lg:shadow-sm lg:ring-1 lg:ring-foreground/10'
              )}
            >
              {/* Never connected yet: Connect leads, first in the page order too (phones, keyboards, screen readers) */}
              {needsSetup && connectEl}
              {/* Status card: the answer, then (if low or ended) the one action, then what's left */}
              <section
                aria-labelledby="status-title"
                className={cn(
                  'relative isolate flex-col p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-card shadow-sm',
                  needsSetup ? 'hidden lg:flex lg:justify-center' : 'flex',
                  statusStyle.borderColor,
                  !ended && (needsSetup ? 'lg:col-span-2' : 'lg:col-span-3'),
                  // inside the desktop panel: no card of its own; the divider sits between the panes
                  !ended && 'lg:rounded-none lg:bg-transparent lg:shadow-none lg:ring-0 lg:p-8 lg:border-foreground/10',
                  !ended && (needsSetup ? 'lg:border-s' : 'lg:border-e')
                )}
              >
                {/* The answer first: the state, large, then the plain verdict beneath it.
                    Beside it, the logo's signal shown large: lit arcs = how it's doing. */}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h2 id="status-title" className="text-pretty">
                      <span className={cn('block font-extrabold leading-tight tracking-tight', needsSetup ? 'text-2xl sm:text-3xl' : ended ? 'text-2xl sm:text-4xl' : 'text-3xl sm:text-4xl', statusStyle.color)}>
                        {t(`status.${normalizedStatus}`)}
                      </span>
                      {verdict && (
                        <span className={cn('mt-1 block text-lg sm:text-xl font-semibold leading-snug', low ? 'text-warning' : 'text-foreground')}>
                          <span className="sr-only">، </span>
                          {verdict}
                        </span>
                      )}
                    </h2>
                    {stateHint[normalizedStatus] && (
                      <p className={cn('mt-2 text-[15px] text-foreground/80 leading-relaxed text-pretty', needsSetup && 'hidden lg:block')}>{stateHint[normalizedStatus]}</p>
                    )}
                  </div>
                  <StatusSignal
                    state={logoTone}
                    className={ended || needsSetup ? 'size-12 sm:size-16' : 'size-16 sm:size-24 lg:size-28'}
                  />
                </div>

                {/* Low or ended: the one action, right after the explanation */}
                {(ended || low) && (renewViaBot || safeSupportUrl !== '#' || supportPending) && (
                  <div className="mt-4 flex flex-col items-stretch sm:items-start">
                    {renewViaBot || safeSupportUrl !== '#' ? (
                      <>
                        <div className="flex">
                          <a
                            href={renewViaBot ? RENEW_BOT_URL : support.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                              'inline-flex h-12 sm:h-11 w-full sm:w-auto items-center justify-center rounded-full px-6 text-[15px] font-semibold transition-colors',
                              lowData && !lowTime
                                ? 'border border-primary/60 text-primary hover:bg-primary/5'
                                : 'bg-primary text-primary-foreground hover:bg-primary/90'
                            )}
                          >
                            {renewViaBot ? t('status.renewButton') : t('status.contactSupport')}
                            <span className="sr-only"> {t('common.newTab')}</span>
                          </a>
                        </div>
                        <p className={cn('mt-2 text-sm text-muted-foreground text-center sm:text-start', !renewViaBot && !support.prefilled && 'sr-only')}>
                          {/* Running low: the connection still works, and what to do, in the same line as the bot */}
                          {low && <>{t(lowData && !lowTime ? 'status.lowLeadData' : 'status.lowLead', { conn: connVerdict ?? '' })} </>}
                          {renewViaBot
                            ? (() => {
                                // The handle sits in its own left-to-right box so the @ stays in front
                                const [before, after = ''] = t('renew.botHint', { bot: '%BOT%' }).split('%BOT%');
                                return <>{before}<bdi dir="ltr">{RENEW_BOT_HANDLE}</bdi>{after}</>;
                              })()
                            : support.prefilled
                              ? t('support.prefillHint')
                              : ''}
                        </p>
                      </>
                    ) : (
                      // Same size as the button, so nothing moves when the link arrives
                      <span aria-hidden="true" className="inline-block h-11 w-52 rounded-full bg-muted animate-pulse motion-reduce:animate-none" />
                    )}
                    {/* What renewing does, in numbers: reconnects by itself (ended), leftover data added, leftover time not.
                        Shown on low states too, so nobody renews early without knowing the cost. */}
                    {(showNoReAdd || low) && (factData || factTime || showNoReAdd) && (
                      <details open={!low} className="group mt-4 self-stretch rounded-xl bg-muted/50 px-3 sm:px-4">
                        <summary className={cn('flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden', !low && 'pointer-events-none')}>
                          {t(low ? 'renewFacts.titleEarlyQ' : 'renewFacts.title')}
                          {low && <ChevronDown aria-hidden="true" className="size-4 shrink-0 transition-transform group-open:rotate-180" />}
                        </summary>
                        <ul className="pb-3 sm:pb-4 space-y-1.5 text-[15px] leading-relaxed text-foreground">
                          {showNoReAdd && (
                            <li className="flex items-start gap-2">
                              <CircleCheck aria-hidden="true" className="mt-1 size-4 shrink-0 text-success" />
                              {t('renewFacts.reconnect')}
                            </li>
                          )}
                          {factData && (
                            <li className="flex items-start gap-2">
                              <Plus aria-hidden="true" className="mt-1 size-4 shrink-0 text-success" />
                              {t('renewFacts.dataCarriesN', { data: formatBytes(remainingBytes, i18n.language) })}
                            </li>
                          )}
                          {factTime && (
                            <li className="flex items-start gap-2 text-foreground/80">
                              <X aria-hidden="true" className="mt-1 size-4 shrink-0 text-muted-foreground" />
                              {t('renewFacts.timeLostN', { time: expiryInfo.time })}
                            </li>
                          )}
                        </ul>
                      </details>
                    )}
                    {/* Disabled: no renewal, just what happens to what's left */}
                    {!showNoReAdd && leftoverNote && (
                      <p className="mt-3 text-[15px] text-foreground/80 leading-relaxed text-pretty">{leftoverNote}</p>
                    )}
                  </div>
                )}

                {/* What's left: time and data, same size, side by side (one line when both are unlimited) */}
                {bothUnlimited ? (
                  <dl className={cn('border-t border-foreground/10', needsSetup ? 'hidden lg:block mt-4 pt-4' : 'mt-6 pt-5')}>
                    <dt className="text-sm text-muted-foreground">{t('userInfo.timeAndData')}</dt>
                    <dd className="mt-1 text-2xl sm:text-3xl font-bold leading-tight text-foreground">{t('userInfo.unlimited')}</dd>
                    {usedBytes > 0 && (
                      <dd className="mt-1 text-sm text-muted-foreground">
                        {t('userInfo.usedOnly', { used: formatBytes(usedBytes, i18n.language) })}
                      </dd>
                    )}
                  </dl>
                ) : (
                <dl className={cn('grid-cols-2 border-t border-foreground/10', needsSetup ? 'hidden lg:grid mt-4 pt-4' : 'grid mt-6 pt-5')}>
                  <div className="pe-3 sm:pe-5">
                    <dt className="text-sm text-muted-foreground">{timeQuiet && !expiryInfo.isExpired ? t(normalizedStatus === 'disabled' ? 'userInfo.untilEnd' : 'userInfo.timeLeft') : expiryInfo.status}</dt>
                    <dd className={cn('mt-1 font-bold leading-tight', timeQuiet ? 'text-lg text-muted-foreground' : cn('text-2xl sm:text-3xl', timeTone))}>{expiryInfo.time}</dd>
                    {expiryDateText && (
                      <dd className="mt-1 text-sm text-muted-foreground tabular-nums">
                        <bdi>{expiryDateText}</bdi>
                      </dd>
                    )}
                  </div>
                  <div className="border-s border-foreground/10 ps-3 sm:ps-5">
                    <dt className="text-sm text-muted-foreground">
                      {dataUsedUp ? t('userInfo.data') : normalizedStatus === 'on_hold' ? t('userInfo.totalLimit') : ended && hasDataLimit && remainingBytes > 0 ? t('userInfo.unused') : t('remaining')}
                    </dt>
                    <dd className={cn(
                      'mt-1 font-bold leading-tight tabular-nums',
                      dataUsedUp
                        ? 'text-base sm:text-lg text-foreground'
                        : dataQuiet
                          ? 'text-lg text-muted-foreground'
                          : cn('text-2xl sm:text-3xl', hasDataLimit ? dataTone : 'text-foreground')
                    )}>
                      {hasDataLimit ? (
                        dataUsedUp ? (
                          // The title already says it ran out: say how much was used, calmly
                          t('userInfo.allUsed', { total: formatBytes(effectiveData.data_limit, i18n.language) })
                        ) : (
                          <span dir="auto" className="inline-block">{formatBytes(remainingBytes, i18n.language)}</span>
                        )
                      ) : (
                        t('userInfo.unlimited')
                      )}
                    </dd>
                    {!hasDataLimit && usedBytes > 0 && (
                      <dd className="mt-1 text-sm text-muted-foreground">
                        {t('userInfo.usedOnly', { used: formatBytes(usedBytes, i18n.language) })}
                      </dd>
                    )}
                    {hasDataLimit && !dataUsedUp && usedBytes > 0 && (
                      <dd className="mt-2">
                        {!dataQuiet && (
                        <div
                          role="progressbar"
                          aria-label={t('remaining')}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={Math.round(remainingPct)}
                          aria-valuetext={t('userInfo.remainingOf', {
                            left: formatBytes(remainingBytes, i18n.language),
                            total: formatBytes(effectiveData.data_limit, i18n.language),
                          })}
                          className="flex w-full gap-1"
                        >
                          {Array.from({ length: 10 }, (_, i) => (
                            <span
                              key={i}
                              className={cn('h-2 flex-1 rounded-full transition-colors duration-500', i < meterFilled ? barTone : 'bg-foreground/25 dark:bg-foreground/35')}
                            />
                          ))}
                        </div>
                        )}
                        <p className={cn('text-sm text-muted-foreground', !dataQuiet && 'mt-1')}>
                          {t('userInfo.usedOfTotal', {
                            used: formatBytes(usedBytes, i18n.language),
                            total: formatBytes(effectiveData.data_limit, i18n.language),
                          })}
                        </p>
                      </dd>
                    )}
                  </div>
                </dl>
                )}


              </section>

              {/* Connect after status, unless setting up comes first (then it was rendered above) */}
              {!needsSetup && connectEl}
            </div>

            {/* Announcement: after the status, one line by default */}
            {(announcementMessage || headers?.['announce-url']) && announceDismissed !== (announcementMessage ?? headers?.['announce-url'] ?? '') && (
              <div className="mb-4 sm:mb-6">
                <div className="flex items-start gap-3 rounded-2xl bg-muted/60 px-4 py-3 ring-1 ring-foreground/10">
                  <Bell className="mt-1 size-4 shrink-0 text-warning" aria-hidden="true" />
                  <span className="sr-only">{t('userInfo.announcement')}: </span>
                  <div className="flex-1 min-w-0">
                    {announcementMessage && (
                      <p
                        id="announcement-text"
                        dir="auto"
                        className={cn('text-[15px] leading-relaxed text-foreground whitespace-pre-wrap break-words text-start', !announceOpen && 'line-clamp-3')}
                      >
                        {announcementMessage}
                      </p>
                    )}
                    {announceOpen && headers?.['announce-url'] && isSafeNetworkUrl(headers['announce-url']) && (
                      <a
                        href={headers['announce-url']}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex min-h-11 items-center gap-1 text-sm text-primary hover:underline font-medium"
                      >
                        {t('userInfo.viewAnnouncement')}
                      </a>
                    )}
                  </div>
                  {((announcementMessage?.length ?? 0) > 180 || !!headers?.['announce-url']) && (
                  <button
                    type="button"
                    onClick={() => setAnnounceOpen(v => !v)}
                    aria-expanded={announceOpen}
                    aria-controls="announcement-text"
                    className="-my-2 -me-2 inline-flex h-11 shrink-0 items-center gap-1 rounded-full px-2 text-sm font-medium text-foreground"
                  >
                    {announceOpen ? t('userInfo.announceLess') : t('userInfo.announceMore')}
                    <ChevronDown className={cn('size-4 transition-transform', announceOpen && 'rotate-180')} aria-hidden="true" />
                  </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const key = announcementMessage ?? headers?.['announce-url'] ?? '';
                      try { localStorage.setItem('announce-dismissed', key); } catch { /* storage may be blocked */ }
                      setAnnounceDismissed(key);
                    }}
                    aria-label={t('userInfo.announceDismiss')}
                    title={t('userInfo.announceDismiss')}
                    className="-my-2 -me-2 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content Section: all apps, then advanced configs, then usage last */}
        <div className={cn('container relative px-4 pt-4 sm:pt-6 pb-12 mx-auto', ended ? 'max-w-3xl' : 'max-w-5xl')}>
          {!ended && <AppsList showFeatured={connectCompact} collapsed={needsSetup} />}

          {(() => {
            const hasLinks = !ended && !!configData?.links && configData.links.length > 0;
            // Usage history: hidden once ended, otherwise shown (even while loading) unless it failed
            const everUsed = usedBytes > 0 || (effectiveData.lifetime_used_traffic ?? 0) > 0;
            const hasChartContainer = !ended && everUsed;

            if (!hasLinks && !hasChartContainer) {
              return null;
            }

            const statsKey = chartData ? Object.keys(chartData.stats)[0] : undefined;
            const usageData = statsKey && chartData ? (chartData.stats as any)[statsKey] ?? [] : [];
            const isChartLoading = !chartError && !chartData;

            return (
              <section aria-labelledby="more-title" className="mt-8 sm:mt-10">
              {/* Same heading style as the apps section; rows separated by rules, no boxes */}
              <h2 id="more-title" className="flex items-center gap-2 text-xl font-bold text-foreground">
                <SectionMark />
                {t('dashboard.more')}
              </h2>
              <div className="mt-2 flex w-full flex-col divide-y divide-foreground/10 border-y border-foreground/10">
                {hasChartContainer && (
                  <div className="w-full min-w-0">
                    <TrafficChart
                      data={usageData}
                      isLoading={isChartLoading}
                      error={chartError}
                      onRetry={chartRetry}
                      timeRange={timeRange}
                      onTimeRangeChange={setTimeRange}
                    />
                  </div>
                )}

                {hasLinks && configData?.links && (
                  <ConnectionLinks links={configData.links} />
                )}
              </div>
              </section>
            );
          })()}
        </div>
      </div>
    </Layout>
  );
}

export default App;
