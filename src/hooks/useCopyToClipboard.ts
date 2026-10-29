import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface CopyOptions {
  /** Second line in the success toast, e.g. what to do next. */
  description?: string;
  /** Skip the success toast when the caller confirms the copy inline. */
  silent?: boolean;
}

interface UseCopyToClipboardReturn {
  copiedId: string | null;
  copyToClipboard: (text: string, id?: string, opts?: CopyOptions) => Promise<boolean>;
  isCopied: (id?: string) => boolean;
}

// Copies through a temporary off-screen textarea. Works where the async
// Clipboard API is unavailable (older WebViews, non-https pages).
function legacyCopy(text: string): boolean {
  if (typeof document === 'undefined') return false;
  const active = document.activeElement as HTMLElement | null;
  const el = document.createElement('textarea');
  el.value = text;
  el.setAttribute('readonly', '');
  el.style.position = 'fixed';
  el.style.top = '0';
  el.style.insetInlineStart = '-9999px';
  el.style.opacity = '0';
  document.body.appendChild(el);
  el.select();
  el.setSelectionRange(0, text.length);
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  document.body.removeChild(el);
  active?.focus?.();
  return ok;
}

export function useCopyToClipboard(
  timeout: number = 2000
): UseCopyToClipboardReturn {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const resetTimer = useRef<number | null>(null);
  const { t } = useTranslation();

  useEffect(() => () => {
    if (resetTimer.current) window.clearTimeout(resetTimer.current);
  }, []);

  const copyToClipboard = useCallback(
    async (text: string, id?: string, opts?: CopyOptions): Promise<boolean> => {
      // The async Clipboard API is missing or blocked in some in-app
      // browsers and on plain-http pages, so fall back to execCommand.
      let ok = false;
      if (navigator?.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(text);
          ok = true;
        } catch {
          ok = false;
        }
      }
      if (!ok) {
        ok = legacyCopy(text);
      }

      if (!ok) {
        toast.error(t('clipboard.failed') || 'Failed to copy');
        return false;
      }

      setCopiedId(id || 'default');
      if (!opts?.silent) toast.success(t('clipboard.copied') || 'Copied to clipboard!', {
        description: opts?.description,
        // Give people time to read the next step when there is one.
        duration: opts?.description ? 5000 : 2000,
      });

      if (resetTimer.current) window.clearTimeout(resetTimer.current);
      resetTimer.current = window.setTimeout(() => {
        setCopiedId(null);
      }, timeout);

      return true;
    },
    [timeout, t]
  );

  const isCopied = useCallback(
    (id?: string): boolean => {
      return copiedId === (id || 'default');
    },
    [copiedId]
  );

  return {
    copiedId,
    copyToClipboard,
    isCopied,
  };
}

