import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'fa', label: 'فارسی' },
  { code: 'zh', label: '简体中文' },
  { code: 'ru', label: 'Русский' },
] as const;

export const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation();
  const dir = i18n.dir();
  const current =
    LANGUAGES.find(l => i18n.language?.startsWith(l.code))?.code ?? 'en';

  const changeLanguage = async (lang: string) => {
    await i18n.changeLanguage(lang);
    document.documentElement.lang = lang;
    document.documentElement.setAttribute('dir', i18n.dir());
  };

  return (
    <DropdownMenu dir={dir} modal={false}>
      {/* Styled directly: Button has no forwardRef on React 18, and the
          menu needs a ref on its trigger to position itself. */}
      <DropdownMenuTrigger
        className={cn(buttonVariants({ variant: 'outline', size: 'icon' }), 'size-11 sm:size-9 rounded-full')}
        aria-label={t('language.change', 'Change language')}
        title={t('language.change', 'Change language')}
      >
        <Languages className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={current} onValueChange={changeLanguage}>
          {LANGUAGES.map(lang => (
            <DropdownMenuRadioItem
              key={lang.code}
              value={lang.code}
              lang={lang.code}
              className="py-2"
            >
              {lang.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
