import { useState, memo, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Check, ScanQrCode, Files } from 'lucide-react';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { parseLinks, type ParsedLink } from '@/lib/linkParser';
import { QRModal } from '@/components/qr-modal';
import { cn } from '@/lib/utils';
import { localizeDigits } from '@/lib/numerals';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface ConnectionLinksProps {
  links: string[];
  className?: string;
}

export const ConnectionLinks = memo(({ links, className }: ConnectionLinksProps) => {
  const { t } = useTranslation();
  const { copyToClipboard, isCopied } = useCopyToClipboard();
  const [selectedLink, setSelectedLink] = useState<ParsedLink | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [copyAllSuccess, setCopyAllSuccess] = useState(false);
  const [showAllLinks, setShowAllLinks] = useState(false);
  const copyAllTimeoutRef = useRef<number | null>(null);

  // Memoize parsed links to avoid re-parsing on every render
  const parsedLinks = useMemo(() => parseLinks(links), [links]);

  // Memoize all configs text to avoid recalculating on every render
  const allConfigsText = useMemo(() => {
    const allConfigs = parsedLinks.map(link => link.raw);
    return allConfigs.join('\n\n');
  }, [parsedLinks]);

  // Limit visible links to prevent memory issues with large lists
  const visibleLinks = useMemo(() => {
    const maxVisible = 20; // Show max 20 links initially
    return showAllLinks ? parsedLinks : parsedLinks.slice(0, maxVisible);
  }, [parsedLinks, showAllLinks]);

  const hasMoreLinks = parsedLinks.length > 20;

  const handleCopy = useCallback((link: ParsedLink) => {
    copyToClipboard(link.raw, link.raw, { description: t('config.nextAfterCopy') });
  }, [copyToClipboard, t]);

  const handleShowQR = useCallback((link: ParsedLink) => {
    setSelectedLink(link);
    setQrModalOpen(true);
  }, []);

  const handleCopyAll = useCallback(async () => {
    if (copyAllTimeoutRef.current) {
      clearTimeout(copyAllTimeoutRef.current);
    }

    const ok = await copyToClipboard(allConfigsText, allConfigsText, { description: t('config.nextAfterCopy') });
    setCopyAllSuccess(ok);
    if (!ok) return;

    copyAllTimeoutRef.current = window.setTimeout(() => {
      setCopyAllSuccess(false);
    }, 2000);
  }, [copyToClipboard, allConfigsText, t]);

  // Square icon buttons: 44px on touch screens, 36px from sm up.
  const iconBtn =
    'inline-flex size-11 sm:size-9 shrink-0 items-center justify-center rounded-full transition-colors cursor-pointer';

  // Individual configs are an advanced, manual path (most people use the
  // subscription link in the Connect panel), so the list starts collapsed.
  return (
    <section
      className={cn(
        className
      )}
    >
      <Accordion type="single" collapsible>
        <AccordionItem value="configs">
          {/* For people who pick servers by hand: a quiet text row, not a card */}
          <AccordionTrigger className="items-center min-h-14 px-1 py-4 hover:no-underline">
            <span className="flex flex-col gap-0.5 text-start">
              <span className="text-base font-bold text-foreground">{t('config.advanced')}</span>
              <span className="text-sm font-normal text-muted-foreground">
                {t('config.title')} <span className="tabular-nums">({localizeDigits(String(parsedLinks.length))})</span>
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-3 px-1 pb-4">
            <button
              type="button"
              onClick={handleCopyAll}
              className={cn(
                'inline-flex h-11 sm:h-9 items-center justify-center gap-2 self-start rounded-full border px-4 text-sm font-medium transition-colors',
                copyAllSuccess
                  ? 'border-transparent bg-success text-success-foreground'
                  : 'border-border bg-background hover:bg-accent'
              )}
            >
              {copyAllSuccess ? <Check className="size-4" /> : <Files className="size-4" />}
              {copyAllSuccess ? t('apps.copyAllSuccess') : t('apps.copyAll')}
            </button>

            <ul className="flex max-h-[420px] flex-col gap-2 overflow-y-auto">
              {visibleLinks.map((link, index) => {
                const copied = isCopied(link.raw);
                const label = link.name || link.protocol;
                return (
                  <li
                    key={index}
                    className="flex items-center gap-2 rounded-xl bg-muted/40 py-1.5 ps-3 pe-1.5"
                  >
                    {link.emoji && <span className="text-sm">{link.emoji}</span>}
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                      {link.name}
                    </span>
                    {/* The protocol matters only to people who pick configs by hand */}
                    <span dir="ltr" className="shrink-0 text-xs uppercase text-muted-foreground">
                      {link.protocol}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(link)}
                      className={cn(
                        iconBtn,
                        copied ? 'bg-success text-success-foreground' : 'hover:bg-primary hover:text-primary-foreground'
                      )}
                      title={t('qr.copy')}
                      aria-label={`${t('qr.copy')}: ${label}`}
                    >
                      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShowQR(link)}
                      className={cn(iconBtn, 'hover:bg-secondary')}
                      title={t('qr.show')}
                      aria-label={`${t('qr.show')}: ${label}`}
                    >
                      <ScanQrCode className="size-4" />
                    </button>
                  </li>
                );
              })}
            </ul>

            {hasMoreLinks && (
              <button
                type="button"
                onClick={() => setShowAllLinks(!showAllLinks)}
                className="self-center inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
              >
                {showAllLinks
                  ? `${t('config.showLess')} (${localizeDigits(String(parsedLinks.length - 20))} ${t('config.hidden')})`
                  : `${t('config.showMore')} (${localizeDigits(String(parsedLinks.length - 20))} ${t('config.more')})`}
              </button>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* QR Modal: mounted once a link is picked, so focus returns to its button on close */}
      {selectedLink && (
        <QRModal
          link={selectedLink}
          open={qrModalOpen}
          onOpenChange={setQrModalOpen}
        />
      )}
    </section>
  );
});


