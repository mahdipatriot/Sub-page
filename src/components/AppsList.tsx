import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { useApps } from '@/hooks/useUserData'
import { cn } from '@/lib/utils'
import { detectOS, getPlatformPriority, mapOSToPlatform } from '@/lib/osDetector'
import { ChevronDown, Download, Plus, ScanQrCode } from 'lucide-react'
import { sanitizeNetworkUrl, isSafeNetworkUrl, buildAppImportUrl } from '@/lib/urlSafety'
import { getSubscriptionUrl } from '@/lib/subscription'
import { getInitialData } from '@/lib/initialData'
import { pickFeatured } from '@/lib/featuredApp'
import { SectionMark } from '@/components/section-mark'
import { FaApple, FaAndroid, FaWindows, FaLinux, FaDesktop } from 'react-icons/fa'
import type { AppClient } from '@/types/user'
import type { ParsedLink } from '@/lib/linkParser'
import { QRModal } from '@/components/qr-modal'

const platformIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    ios: FaApple,
    android: FaAndroid,
    windows: FaWindows,
    linux: FaLinux,
    other: FaDesktop,
}

type Lang = 'fa' | 'en' | 'ru' | 'zh'

/**
 * Apps, as one quiet list: the apps for your own system first, and other
 * devices behind a single "another device?" toggle (pick a system, see its
 * apps). One decision at a time instead of a catalogue.
 */
export function AppsList({ showFeatured = false, collapsed = false }: { showFeatured?: boolean; collapsed?: boolean }) {
    const { t, i18n } = useTranslation()
    const { apps, appsError, appsLoading, appsRetry } = useApps()
    const currentPlatform = mapOSToPlatform(detectOS())
    const [otherOpen, setOtherOpen] = useState(false)
    const [picked, setPicked] = useState<string | null>(null)
    const [qrOpen, setQrOpen] = useState(false)
    // While a new subscriber follows the setup steps, the list waits behind one line
    const [unfolded, setUnfolded] = useState(false)

    if (appsLoading) {
        return (
            <div aria-busy="true" className="flex flex-col gap-3">
                <span className="sr-only">{t('common.loading')}</span>
                <div className="h-6 w-40 rounded-lg bg-muted animate-pulse motion-reduce:animate-none" />
                <div className="h-20 rounded-2xl bg-card ring-1 ring-foreground/10 animate-pulse motion-reduce:animate-none" />
            </div>
        )
    }

    if (appsError) {
        return (
            <div role="alert" className="flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl ring-1 ring-foreground/10 bg-card shadow-sm p-4 sm:p-6">
                <span className="text-[15px] text-foreground">{t('apps.loadError')}</span>
                {appsRetry && (
                    <button
                        type="button"
                        onClick={appsRetry}
                        className="inline-flex h-11 items-center rounded-full border border-border bg-background px-5 text-sm font-medium hover:bg-accent transition-colors"
                    >
                        {t('dashboard.retry')}
                    </button>
                )}
            </div>
        )
    }

    if (!apps || apps.length === 0) return null

    const lang: Lang = i18n.language?.startsWith('fa')
        ? 'fa'
        : i18n.language?.startsWith('ru')
            ? 'ru'
            : i18n.language?.startsWith('zh')
                ? 'zh'
                : 'en'

    const groups: Record<string, AppClient[]> = {}
    apps.forEach((a) => {
        const key = (a.platform || 'other').toLowerCase()
        if (!groups[key]) groups[key] = []
        groups[key]!.push(a)
    })
    // While the Connect panel shows its steps, its featured app is already on screen: leave it out here
    const featured = pickFeatured(apps, currentPlatform, getSubscriptionUrl(), getInitialData()?.user?.username ?? '', lang)
    if (!showFeatured && featured && groups[currentPlatform]) {
        groups[currentPlatform] = groups[currentPlatform]!.filter((a) => a !== featured.app)
    }
    const mine = groups[currentPlatform] ?? []
    const others = getPlatformPriority(detectOS()).filter((p) => p !== currentPlatform && groups[p]?.length)
    if (mine.length === 0 && others.length === 0) return null

    // Nothing more for this system: go straight to other devices
    const showOthers = otherOpen || mine.length === 0
    const active = picked && others.includes(picked) ? picked : others[0]

    const qrLink: ParsedLink = { protocol: 'unknown', name: t('config.subscriptionLink'), raw: getSubscriptionUrl() }
    const showQr = () => setQrOpen(true)

    return (
        <section id="apps" aria-labelledby="apps-title" className="scroll-mt-6">
            <h2 id="apps-title" className="flex items-center gap-2 text-xl font-bold text-foreground">
                <SectionMark />
                {t('apps.title')}
            </h2>
            {collapsed && !unfolded ? (
                <button
                    type="button"
                    onClick={() => setUnfolded(true)}
                    aria-expanded={false}
                    className="mt-1 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary"
                >
                    {t('apps.wantOther')}
                    <ChevronDown aria-hidden="true" className="size-4" />
                </button>
            ) : (
            <>

            {mine.length > 0 && (
                <>
                    <p className="mt-1 text-[15px] text-foreground/80">
                        {featured && !showFeatured ? t('apps.mineOther') : t('apps.mine')}
                    </p>
                    <AppRows apps={mine} lang={lang} t={t} />
                </>
            )}
            {mine.length === 0 && others.length > 0 && (
                <p className="mt-1 text-[15px] text-foreground/80">{t('apps.otherOnly')}</p>
            )}

            {others.length > 0 && (
                <div className="mt-3">
                    {mine.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setOtherOpen((v) => !v)}
                            aria-expanded={showOthers}
                            aria-controls="other-devices"
                            className="-my-1 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary"
                        >
                            {t('apps.otherDevices')}
                            <ChevronDown aria-hidden="true" className={cn('size-4 transition-transform', showOthers && 'rotate-180')} />
                        </button>
                    )}
                    {showOthers && active && (
                        <div id="other-devices" className="mt-2">
                            {/* Pick a system, see its apps */}
                            <div role="group" aria-label={t('apps.choosePlatform')} className="flex flex-wrap gap-2">
                                {others.map((p) => {
                                    const Icon = platformIcons[p] || FaDesktop
                                    const on = p === active
                                    return (
                                        <button
                                            key={p}
                                            type="button"
                                            aria-pressed={on}
                                            onClick={() => setPicked(p)}
                                            className={cn(
                                                'inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors',
                                                on ? 'bg-foreground/10 text-foreground ring-1 ring-foreground/25' : 'bg-muted text-foreground hover:bg-accent'
                                            )}
                                        >
                                            <Icon className="size-4" aria-hidden="true" />
                                            {t(`apps.platform.${p}`)}
                                        </button>
                                    )
                                })}
                            </div>
                            <AppRows apps={groups[active] ?? []} lang={lang} t={t} onQr={showQr} />
                        </div>
                    )}
                </div>
            )}
            </>
            )}
            <QRModal link={qrLink} open={qrOpen} onOpenChange={setQrOpen} />
        </section>
    )
}

/** Apps as rows: icon, name, one line about it, then download and add. */
function AppRows({ apps, lang, t, onQr }: { apps: AppClient[]; lang: Lang; t: TFunction; onQr?: () => void }) {
    return (
        <ul className="mt-3 divide-y divide-foreground/10 border-y border-foreground/10">
            {apps.map((app, idx) => (
                <AppRow key={`${app.name}-${idx}`} app={app} lang={lang} t={t} onQr={onQr} />
            ))}
        </ul>
    )
}

/** onQr set = an app for another device: one-tap "add" can't work here, so offer the QR to scan there */
function AppRow({ app, lang, t, onQr }: { app: AppClient; lang: Lang; t: TFunction; onQr?: () => void }) {
    const importHref = buildAppImportUrl(app.import_url, getSubscriptionUrl(), getInitialData()?.user?.username ?? '')
    const desc = app.description?.[lang] || app.description?.en || ''
    const all = (app.download_links || []).filter((l) => l && isSafeNetworkUrl(l.url))
    const forLang = all.filter((l) => l.language === lang)
    const forEn = all.filter((l) => l.language === 'en')
    const downloads = forLang.length > 0 ? forLang : forEn.length > 0 ? forEn : all
    const PlatformIcon = platformIcons[(app.platform || 'other').toLowerCase()] || FaDesktop

    return (
        <li className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
            <div className="flex min-w-0 flex-1 basis-56 items-center gap-3">
                {app.icon_url && isSafeNetworkUrl(app.icon_url) ? (
                    <img src={app.icon_url} alt="" className="size-9 shrink-0 rounded-lg object-cover" />
                ) : (
                    // No icon from the panel: the system's own icon, never a broken-looking letter
                    <span aria-hidden="true" className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <PlatformIcon className="size-4" />
                    </span>
                )}
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[15px] font-semibold text-foreground">{app.name}</h3>
                        {app.recommended && (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground">{t('apps.recommended')}</span>
                        )}
                    </div>
                    {desc && <p className="truncate text-sm text-muted-foreground">{desc}</p>}
                </div>
            </div>
            <div className="flex flex-wrap gap-2">
                {downloads.map((dl, i) => (
                    <a
                        key={i}
                        href={sanitizeNetworkUrl(dl.url)}
                        className="inline-flex h-11 sm:h-9 items-center gap-1.5 rounded-full border border-border px-3.5 text-sm hover:bg-accent transition-colors"
                        target="_blank"
                        rel="noreferrer"
                        title={dl.name}
                    >
                        <Download className="size-4" aria-hidden="true" />
                        {downloads.length > 1 ? dl.name : t('apps.download')}
                    </a>
                ))}
                {onQr ? (
                    <button
                        type="button"
                        onClick={onQr}
                        className="inline-flex h-11 sm:h-9 items-center gap-1.5 rounded-full border border-primary/50 px-3.5 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
                    >
                        <ScanQrCode className="size-4" aria-hidden="true" />
                        {t('apps.qrForDevice')}
                    </button>
                ) : importHref && (
                    <a
                        href={importHref}
                        className="inline-flex h-11 sm:h-9 items-center gap-1.5 rounded-full border border-primary/50 px-3.5 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
                        {...(importHref.startsWith('https:') ? { target: '_blank', rel: 'noreferrer' } : {})}
                    >
                        <Plus className="size-4" aria-hidden="true" />
                        {t('apps.importTo', { app: app.name })}
                    </a>
                )}
            </div>
        </li>
    )
}
