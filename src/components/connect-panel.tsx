import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown, CircleAlert, CircleCheck, Copy, Download, Plus, RefreshCcw, ScanQrCode } from 'lucide-react';
import { useApps, useSupportUrl } from '@/hooks/useUserData';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { QRModal } from '@/components/qr-modal';
import { QRCodeSVG } from 'qrcode.react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getSubscriptionUrl } from '@/lib/subscription';
import { getInitialData } from '@/lib/initialData';
import { detectOS, mapOSToPlatform } from '@/lib/osDetector';
import { sanitizeNetworkUrl } from '@/lib/urlSafety';
import { ONLINE_WINDOW_MS } from '@/lib/dateFormatter';
import { pickFeatured } from '@/lib/featuredApp';
import { SectionMark } from '@/components/section-mark';
import type { ParsedLink } from '@/lib/linkParser';

const pill = (variant: 'default' | 'outline') =>
  cn(
    buttonVariants({ variant, size: 'lg' }),
    'h-11 rounded-full px-4 has-[>svg]:px-4 min-w-0'
  );


/** One numbered step: the number, a short title, then its own action. */
function Step({ n, title, badge, children }: { n: string; title: string; badge?: ReactNode; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span
        aria-hidden="true"
        className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-foreground tabular-nums"
      >
        {n}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {badge}
        </div>
        {children}
      </div>
    </li>
  );
}

/**
 * The page's main task, as a sequence: 1 install the app, 2 add the
 * subscription, 3 turn the connection on. Each step carries its own button,
 * so the order on screen is the order to follow. One app is featured for the
 * visitor's platform; others are in the apps list. When the subscription has
 * ended nothing here can help yet, so only an explanation remains.
 */
export function ConnectPanel({
  className,
  status = 'active',
  lastOnline = null,
  onCheck,
  checking = false,
  summary,
}: {
  className?: string;
  status?: string;
  lastOnline?: string | null;
  /** Re-fetch the subscription status (did the connection come through?) */
  onCheck?: () => void;
  checking?: boolean;
  /** One line shown above the steps on phones, e.g. "your 30-day, 50 GB plan is ready" */
  summary?: string | null;
}) {
  const { t, i18n } = useTranslation();
  const { apps } = useApps();
  const { supportUrl } = useSupportUrl();
  const safeSupportUrl = sanitizeNetworkUrl(supportUrl);
  const { copyToClipboard, isCopied } = useCopyToClipboard();
  const [qrOpen, setQrOpen] = useState(false);
  const [otherWays, setOtherWays] = useState(false);
  const [stepsOpen, setStepsOpen] = useState(false);
  // Inline follow-up shown right under the action the visitor just took
  const [lastAction, setLastAction] = useState<{ kind: 'copy' | 'import'; app?: string } | null>(null);

  const ended = status === 'limited' || status === 'expired' || status === 'disabled';
  const lastOnlineMs = lastOnline ? new Date(lastOnline).getTime() : NaN;
  const workingNow = !ended && Number.isFinite(lastOnlineMs) && Date.now() - lastOnlineMs <= ONLINE_WINDOW_MS;
  const idle = !ended && Number.isFinite(lastOnlineMs) && Date.now() - lastOnlineMs > 24 * 60 * 60 * 1000;

  const subscriptionUrl = useMemo(() => getSubscriptionUrl(), []);
  const lang = (i18n.language || 'en').slice(0, 2);

  const os = detectOS();
  const onDesktop = os === 'windows' || os === 'macos' || os === 'linux';
  // Setup wording differs by system: phone apps use "+", desktop apps use a menu and Ctrl+V
  const pf = os === 'android' ? 'android' : os === 'ios' ? 'ios' : os === 'macos' ? 'mac' : onDesktop ? 'desktop' : 'android';
  // Already set up (connected recently, or connected before but idle): show the short version
  const compact = workingNow || idle;

  // The one app featured for this platform: one-tap import first, then recommended.
  const featured = useMemo(
    () => pickFeatured(apps, mapOSToPlatform(os), subscriptionUrl, getInitialData()?.user?.username ?? '', lang),
    [apps, subscriptionUrl, lang, os]
  );

  const appName = featured?.app.name;
  const importHref = featured?.importHref ?? null;
  const download = featured?.download ?? null;
  const copied = isCopied(subscriptionUrl);
  const num = new Intl.NumberFormat(i18n.language);

  // The inline line below says what to do next, so the toast stays quiet
  const handleCopy = useCallback(async () => {
    const ok = await copyToClipboard(subscriptionUrl, subscriptionUrl, { silent: true });
    if (ok) setLastAction({ kind: 'copy' });
  }, [copyToClipboard, subscriptionUrl]);

  const followUp =
    lastAction?.kind === 'import' && lastAction.app
      ? t('connect.afterImport', { app: lastAction.app })
      : lastAction?.kind === 'copy'
        ? appName
          ? t('connect.nextAfterCopy', { app: appName })
          : t('connect.nextAfterCopyAny')
        : null;

  const qrLink = useMemo<ParsedLink>(
    () => ({ protocol: 'unknown', name: t('config.subscriptionLink'), raw: subscriptionUrl }),
    [subscriptionUrl, t]
  );

  const copyButton = (primary: boolean) => (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(pill(primary ? 'default' : 'outline'), 'flex-1')}
      aria-label={`${t('qr.copy')}: ${t('config.subscriptionLink')}`}
    >
      {copied ? <Check /> : <Copy />}
      {copied ? t('qr.copied') : t('qr.copy')}
    </button>
  );
  const qrButton = (
    <button
      type="button"
      onClick={() => setQrOpen(true)}
      className={cn(pill('outline'), 'shrink-0')}
      aria-label={`${onDesktop ? t('qr.scanWithPhone') : t('qr.forOtherDevice')}: ${t('config.subscriptionLink')}`}
    >
      <ScanQrCode />
      {onDesktop ? t('qr.scanWithPhone') : t('qr.forOtherDevice')}
    </button>
  );

  return (
    <section
      aria-labelledby="connect-title"
      className={cn(
        'flex flex-col gap-5 rounded-2xl sm:rounded-3xl bg-card p-4 sm:p-6 shadow-sm ring-1 ring-foreground/10',
        className
      )}
    >
      <h2 id="connect-title" className={cn('flex items-center gap-2 font-bold text-foreground', compact || ended ? 'text-lg' : 'text-lg lg:text-2xl')}>
        <SectionMark />
        {t('connect.title')}
      </h2>
      {summary && (
        <p className="-mt-2 flex items-start gap-2 text-[15px] leading-relaxed text-foreground lg:hidden">
          <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
          {summary}
        </p>
      )}

      {ended && (
        <p className="flex items-start gap-2 rounded-xl bg-muted/60 p-3 text-[15px] leading-relaxed text-foreground">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          {status === 'disabled' ? t('connect.disabledNote') : t('connect.endedNote')}
        </p>
      )}

      {/* Already set up: the link and QR are one tap away, for another app or device.
          On wide screens the QR is shown right here: scan it with your phone. */}
      {!ended && compact && (
        <div className="flex flex-col gap-3 lg:my-auto">
          {!idle && !(workingNow && lastAction) && (
            <p className="text-[15px] leading-relaxed text-foreground/80 text-pretty lg:hidden">{t('connect.compactPurpose')}</p>
          )}
          {idle && <p className="text-[15px] leading-relaxed text-foreground/80 text-pretty">{t('connect.idleNote')}</p>}
          {/* They just added it here and it now works: say so */}
          {workingNow && lastAction && (
            <p role="status" className="flex items-start gap-2 rounded-xl bg-success/10 p-3 text-[15px] font-medium leading-relaxed text-foreground">
              <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
              {t('connect.success')}
            </p>
          )}
          {subscriptionUrl.length <= 2900 && (
            <div className="hidden lg:flex items-center gap-4">
              <div className="shrink-0 rounded-xl bg-white p-1.5 ring-1 ring-foreground/10 dark:bg-white/90">
                <QRCodeSVG value={subscriptionUrl} size={104} level="L" bgColor="transparent" aria-hidden="true" />
              </div>
              <p className="text-[15px] leading-relaxed text-foreground/80 text-pretty">{t('qr.hintInline')}</p>
            </div>
          )}
          <div className="flex gap-2">
            {copyButton(false)}
            <span className="contents lg:hidden">{qrButton}</span>
          </div>
          <p role="status" aria-live="polite" className={cn('text-sm leading-relaxed text-foreground', !followUp && 'sr-only')}>
            {followUp}
          </p>
        </div>
      )}
      {/* The full steps stay behind a toggle */}
      {!ended && compact && (
        <button
          type="button"
          onClick={() => setStepsOpen(v => !v)}
          aria-expanded={stepsOpen}
          aria-controls="connect-steps"
          className="-my-1 inline-flex min-h-11 items-center gap-1 self-start text-sm font-medium text-primary"
        >
          {stepsOpen ? t('connect.hideSteps') : t('connect.showSteps')}
          <ChevronDown aria-hidden="true" className={cn('size-4 transition-transform', stepsOpen && 'rotate-180')} />
        </button>
      )}

      {!ended && (!compact || stepsOpen) && (
        <ol id="connect-steps" className="flex flex-col gap-5">
          {/* 1. Install */}
          <Step
            n={num.format(1)}
            title={appName ? t('connect.step1Title', { app: appName }) : t('connect.step1TitleAny')}
            badge={appName && featured?.app.recommended ? (
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-sm font-medium text-foreground">
                {t('apps.recommended')}
              </span>
            ) : undefined}
          >
            {download ? (
              <a
                href={sanitizeNetworkUrl(download.url)}
                target="_blank"
                rel="noreferrer"
                className={cn(pill('outline'), 'self-start')}
                title={download.name}
              >
                <Download />
                {t('apps.downloadApp', { app: appName })}
              </a>
            ) : (
              <a
                href="#apps"
                className={cn(pill('outline'), 'self-start')}
              >
                {t('connect.chooseApp')}
              </a>
            )}
            {appName && (
              <p className="text-[15px] text-foreground/80 leading-relaxed text-pretty">{t('connect.step1Skip', { app: appName })}</p>
            )}
          </Step>

          {/* 2. Add the subscription */}
          <Step n={num.format(2)} title={t('connect.step2Title')}>
            {importHref && appName ? (
              <>
                <a
                  href={importHref}
                  className={cn(pill('default'), 'w-full')}
                  onClick={() => {
                    setLastAction({ kind: 'import', app: appName });
                    setOtherWays(true);
                  }}
                  {...(importHref.startsWith('https:') ? { target: '_blank', rel: 'noreferrer' } : {})}
                >
                  <Plus />
                  <span className="truncate">{t('apps.importTo', { app: appName })}</span>
                </a>
                <button
                  type="button"
                  onClick={() => setOtherWays(v => !v)}
                  aria-expanded={otherWays}
                  aria-controls="other-ways"
                  className="-my-1 inline-flex min-h-11 items-center gap-1 self-start text-sm text-muted-foreground hover:text-primary"
                >
                  {t('connect.otherWays')}
                  <ChevronDown aria-hidden="true" className={cn('size-4 transition-transform', otherWays && 'rotate-180')} />
                </button>
                {otherWays && (
                  <div id="other-ways" className="flex gap-2">
                    {copyButton(false)}
                    {qrButton}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex gap-2">
                  {copyButton(true)}
                  {qrButton}
                </div>
                {!followUp && (
                  <p className="text-[15px] text-foreground/80 leading-relaxed">
                    {appName
                      ? t(`connect.stepPaste_${pf}`, { app: appName, defaultValue: t('connect.stepPaste', { app: appName }) })
                      : t(`connect.stepPasteAny_${pf}`, { defaultValue: t('connect.stepPasteAny') })}
                  </p>
                )}
              </>
            )}
            {/* What to do next, right where the visitor acted */}
            <p role="status" aria-live="polite" className={cn('text-sm leading-relaxed text-foreground', !followUp && 'sr-only')}>
              {followUp}
            </p>
            {followUp && onCheck && (
              <button
                type="button"
                onClick={onCheck}
                disabled={checking}
                className={cn(pill('outline'), 'self-start')}
              >
                <RefreshCcw className={cn(checking && 'animate-spin')} aria-hidden="true" />
                {checking ? t('connect.checking') : t('connect.checkNow')}
              </button>
            )}
          </Step>

          {/* 3. Turn it on */}
          <Step n={num.format(3)} title={t('connect.step3Title')}>
            <p className="text-[15px] text-foreground/80 leading-relaxed">
              {appName
                ? t(`connect.stepConnect_${pf}`, { app: appName, defaultValue: t('connect.stepConnect', { app: appName }) })
                : t(`connect.stepConnectAny_${pf}`, { defaultValue: t('connect.stepConnectAny') })}
            </p>
            {safeSupportUrl !== '#' && (
              <a
                href={safeSupportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="-my-2 inline-flex min-h-11 items-center self-start text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                {t('connect.stillStuck')}
              </a>
            )}
          </Step>
        </ol>
      )}

      <QRModal link={qrLink} open={qrOpen} onOpenChange={setQrOpen} />
    </section>
  );
}
