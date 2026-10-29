import type { AppClient } from '@/types/user';
import { buildAppImportUrl, isSafeNetworkUrl } from '@/lib/urlSafety';

/** The best download link for this language: exact, then English, then any. */
export function pickDownload(app: AppClient, lang: string) {
  const all = (app.download_links || []).filter(l => l && isSafeNetworkUrl(l.url));
  return (
    all.find(l => l.language === lang) ??
    all.find(l => l.language === 'en') ??
    all[0] ??
    null
  );
}

/**
 * The one app featured for a platform: one-tap import first, then the
 * recommended one. The Connect panel shows it; the apps list leaves it out
 * so the same button never appears twice.
 */
export function pickFeatured(
  apps: AppClient[] | null | undefined,
  platform: string,
  subscriptionUrl: string,
  username: string,
  lang: string
) {
  return (
    (apps ?? [])
      .filter(app => app && (app.platform || 'other').toLowerCase() === platform)
      .map(app => ({
        app,
        importHref: buildAppImportUrl(app.import_url, subscriptionUrl, username),
        download: pickDownload(app, lang),
      }))
      .filter(f => f.importHref || f.download)
      .sort(
        (a, b) =>
          Number(!!b.importHref) - Number(!!a.importHref) ||
          Number(!!b.app.recommended) - Number(!!a.app.recommended)
      )[0] ?? null
  );
}
