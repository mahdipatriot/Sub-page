// SC-07/J-002/J-003: URL safety validation for subscription template.
// Prevents javascript:, data:, and other dangerous schemes from being
// rendered in href attributes.
//
// P5.12: Safe schemes are split into two categories:
//   - Network resource URLs (icons, downloads, support links): https only.
//   - Subscription import links: vless/vmess/trojan/ss only (no http/https).

// Network resource URLs (icons, downloads, support links) must use https.
const NETWORK_SAFE_SCHEMES = new Set(["https:"]);

// Subscription import links only allow proxy schemes (no http/https).
const IMPORT_SAFE_SCHEMES = new Set(["vless:", "vmess:", "trojan:", "ss:"]);

// Combined set kept for backward compatibility (union of both categories).
const SAFE_SCHEMES = new Set([
  ...NETWORK_SAFE_SCHEMES,
  ...IMPORT_SAFE_SCHEMES,
]);

function hasSafeScheme(
  url: string | null | undefined,
  schemes: Set<string>
): boolean {
  if (!url || typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    return schemes.has(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Validates a network resource URL (icon, download, support link).
 * Only https: is allowed — http: is rejected to prevent mixed-content/insecure loads.
 */
export function isSafeNetworkUrl(
  url: string | null | undefined
): boolean {
  return hasSafeScheme(url, NETWORK_SAFE_SCHEMES);
}

/**
 * Sanitizes a network resource URL (icon, download, support link).
 * Returns the URL if it uses https:, otherwise "#".
 */
export function sanitizeNetworkUrl(
  url: string | null | undefined
): string {
  return isSafeNetworkUrl(url) ? (url as string) : "#";
}

/**
 * Validates a subscription import URL.
 * Only vless:, vmess:, trojan:, ss: are allowed — http/https are rejected.
 */
export function isSafeImportUrl(
  url: string | null | undefined
): boolean {
  return hasSafeScheme(url, IMPORT_SAFE_SCHEMES);
}

/**
 * Sanitizes a subscription import URL.
 * Returns the URL if it uses a proxy scheme, otherwise "#".
 */
export function sanitizeImportUrl(
  url: string | null | undefined
): string {
  return isSafeImportUrl(url) ? (url as string) : "#";
}

// App deep links ("Add to app" buttons). Admin-configured import_url values
// open a VPN client directly. Only known client schemes are allowed, so a
// javascript:, data:, file: or unknown scheme can never become a link.
// To support a new client, add its scheme here (lowercase, with the colon).
const APP_IMPORT_SCHEMES = new Set([
  ...IMPORT_SAFE_SCHEMES,
  "https:",       // universal / app links
  "v2rayng:",
  "v2raytun:",
  "v2box:",
  "hiddify:",
  "streisand:",
  "sing-box:",
  "sn:",          // NekoBox
  "clash:",       // Clash Verge, ClashX, FlClash, Clash Meta
  "stash:",
  "happ:",
  "foxray:",
  "karing:",
  "shadowrocket:",
]);

/**
 * Validates an app deep link (after placeholders are filled in).
 */
export function isSafeAppImportUrl(
  url: string | null | undefined
): boolean {
  return hasSafeScheme(url, APP_IMPORT_SCHEMES);
}

/**
 * Builds an app's "Add to app" link from its import_url template.
 *
 * Placeholders:
 *   {url}  → the subscription URL
 *   {name} → the username (used by some clients as the profile name)
 * {name} is always URL-encoded. {url} is encoded when it follows "=" (a
 * query value, e.g. `?url={url}`) and inserted as-is in a path (e.g.
 * `hiddify://import/{url}`), which is what those clients expect.
 *
 * Returns null when the template is empty or the result is not a safe link.
 */
export function buildAppImportUrl(
  template: string | null | undefined,
  subscriptionUrl: string,
  name: string = ""
): string | null {
  if (!template || typeof template !== "string") return null;
  const values: Record<string, string> = { url: subscriptionUrl, name };
  const built = template.replace(
    /(=?)\{(url|name)\}/g,
    (_match, eq: string, key: string) =>
      eq || key === "name"
        ? `${eq}${encodeURIComponent(values[key])}`
        : values[key]
  );
  return isSafeAppImportUrl(built) ? built : null;
}

/**
 * Generic URL safety check (union of network + import schemes).
 * Prefer isSafeNetworkUrl / isSafeImportUrl for new code.
 */
export function isSafeUrl(url: string | null | undefined): boolean {
  return hasSafeScheme(url, SAFE_SCHEMES);
}

/**
 * Generic URL sanitizer (union of network + import schemes).
 * Prefer sanitizeNetworkUrl / sanitizeImportUrl for new code.
 */
export function sanitizeUrl(url: string | null | undefined): string {
  return isSafeUrl(url) ? (url as string) : "#";
}
