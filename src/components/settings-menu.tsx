import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import { Settings2 } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const LANGUAGES = [
  { code: 'fa', label: 'فارسی' },
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'zh', label: '简体中文' },
] as const;

/**
 * Phones only: language and theme share one menu, so the header has room
 * for a labelled support button. Wider screens keep the two separate buttons.
 */
export function SettingsMenu({ className }: { className?: string }) {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const current = LANGUAGES.find(l => i18n.language?.startsWith(l.code))?.code ?? 'en';

  const changeLanguage = async (lang: string) => {
    await i18n.changeLanguage(lang);
    document.documentElement.lang = lang;
    document.documentElement.setAttribute('dir', i18n.dir());
  };

  return (
    <DropdownMenu dir={i18n.dir()} modal={false}>
      {/* Styled directly: Button has no forwardRef on React 18 */}
      <DropdownMenuTrigger
        className={cn(buttonVariants({ variant: 'outline', size: 'icon' }), 'size-11 rounded-full', className)}
        aria-label={t('settings.title')}
        title={t('settings.title')}
      >
        <Settings2 className="size-4" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuLabel className="text-muted-foreground">{t('settings.language')}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={current} onValueChange={changeLanguage}>
          {LANGUAGES.map(lang => (
            <DropdownMenuRadioItem key={lang.code} value={lang.code} lang={lang.code} className="py-2.5">
              {lang.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-muted-foreground">{t('settings.theme')}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={theme ?? 'system'} onValueChange={setTheme}>
          <DropdownMenuRadioItem value="light" className="py-2.5">{t('theme.light')}</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark" className="py-2.5">{t('theme.dark')}</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system" className="py-2.5">{t('theme.system')}</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
