import i18next from "i18next";

// Persian pages use Persian digits (۰–۹) and the Persian decimal sign (٫).
// Other languages keep Western digits. Pass `lang` when you have it;
// otherwise the active i18next language is used.
const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export function isPersian(lang?: string): boolean {
  return (lang ?? i18next.language ?? "").startsWith("fa");
}

/** Converts the digits in already-formatted text (e.g. "37.40 GB"). */
export function localizeDigits(text: string, lang?: string): string {
  if (!isPersian(lang)) return text;
  return text
    .replace(/(\d)\.(\d)/g, "$1٫$2")
    .replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
}

/**
 * Bytes as "37.4 GB" (one decimal at most), with Persian digits on Persian
 * pages. The smallest unit is MB: a bare "B" means nothing to most people,
 * and anything under 1 MB shows as "<1 MB". Callers show a word for zero.
 */
export function formatBytes(bytes: number, lang?: string): string {
  if (!bytes || bytes <= 0 || isNaN(bytes)) return localizeDigits(`0 ${byteUnit("MB", lang)}`, lang);
  const MB = 1024 * 1024;
  if (bytes < MB) {
    return isPersian(lang) ? `کمتر از ۱ ${byteUnit("MB", lang)}` : "<1 MB";
  }
  const sizes = ["MB", "GB", "TB"] as const;
  const i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes / MB) / Math.log(1024)));
  const value = bytes / MB / Math.pow(1024, i);
  const shown = value >= 100 ? String(Math.round(value)) : String(Number(value.toFixed(1)));
  return localizeDigits(`${shown} ${byteUnit(sizes[i], lang)}`, lang);
}

/**
 * Unit names as people say them: "گیگ" on Persian pages, "GB" elsewhere.
 * Persian text with these units is right-to-left, so show it with dir="auto".
 */
export function byteUnit(unit: "MB" | "GB" | "TB", lang?: string): string {
  if (!isPersian(lang)) return unit;
  return { MB: "مگ", GB: "گیگ", TB: "ترا" }[unit];
}

/** Whole-number percentage: "75%" or "۷۵٪". */
export function formatPercent(value: number, lang?: string): string {
  const n = Math.round(value);
  return isPersian(lang) ? `${localizeDigits(String(n), lang)}٪` : `${n}%`;
}
