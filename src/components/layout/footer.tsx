import { STATUS_URL, RENEW_BOT_URL } from '@/constants/project';
import { useSupportUrl } from '@/hooks/useUserData';
import { sanitizeNetworkUrl } from '@/lib/urlSafety';
import { useTranslation } from 'react-i18next';
import { Separator } from '@/components/ui/separator';
import type { FC } from 'react';

const FooterContent = () => {
  const { t } = useTranslation();
  const { supportUrl } = useSupportUrl();
  const safeSupportUrl = sanitizeNetworkUrl(supportUrl);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex flex-row flex-wrap items-center justify-center gap-x-4">
        {safeSupportUrl !== '#' && (
          <p className="inline-flex min-h-11 items-center gap-1.5 text-sm text-foreground">
            {t('footer.question')}
            <a href={safeSupportUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center font-medium text-primary hover:underline underline-offset-4">
              {t('footer.support')}
            </a>
          </p>
        )}
        <a href={RENEW_BOT_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline underline-offset-4">
          {t('footer.renewBot')}
        </a>
        {STATUS_URL && (
          <a
            href={STATUS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
          >
            <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
              <path d="M8 12l2 2 4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {t('statusMonitor', 'Server Status')}
          </a>
        )}
      </div>
      {STATUS_URL && <Separator className="w-16" />}
      <p className="text-center text-sm text-muted-foreground lg:px-4">
        © Roopsida
      </p>
    </div>
  );
};

export const Footer: FC = ({ ...props }) => {
  return (
    <div className="relative w-full pb-8 pt-6 px-6 border-t border-border/50" {...props}>
      <div className="container mx-auto max-w-5xl flex justify-center">
        <FooterContent />
      </div>
    </div>
  );
};
