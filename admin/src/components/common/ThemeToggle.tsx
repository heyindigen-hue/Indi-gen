import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { SunIcon, MoonIcon } from '@/icons';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem('theme');
    if (stored) return stored === 'dark';
    return false;
  });

  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setIsDark((d) => !d)}
      className="h-8 w-8 transition-all duration-200"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark
        ? <SunIcon size={16} className="text-muted-foreground hover:text-foreground transition-colors" />
        : <MoonIcon size={16} className="text-muted-foreground hover:text-foreground transition-colors" />
      }
    </Button>
  );
}
