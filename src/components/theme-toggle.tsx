import { useTheme } from 'next-themes';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { t, i18n } = useTranslation();

  return (
    <DropdownMenu dir={i18n.dir()} modal={false}>
      {/* Styled directly: Button has no forwardRef on React 18, and the
          menu needs a ref on its trigger to position itself. */}
      <DropdownMenuTrigger
        className={cn(buttonVariants({ variant: 'outline', size: 'icon' }), 'size-11 sm:size-9 rounded-full')}
        aria-label={t('theme.toggle', 'Toggle theme')}
        title={t('theme.toggle', 'Toggle theme')}
      >
        <Sun className="dark:hidden" />
        <Moon className="hidden dark:block" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={theme ?? 'system'} onValueChange={setTheme}>
          <DropdownMenuRadioItem value="light" className="py-2">
            <Sun />
            {t('theme.light', 'Light')}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark" className="py-2">
            <Moon />
            {t('theme.dark', 'Dark')}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system" className="py-2">
            <Monitor />
            {t('theme.system', 'System')}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
