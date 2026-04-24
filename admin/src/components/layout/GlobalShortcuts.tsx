import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHotkeys } from 'react-hotkeys-hook';
import { useRegisterCommand } from '@/store/commands';
import { useCommands } from '@/store/commands';

const NAV_ITEMS = [
  { key: 'd', label: 'Go to Dashboard', path: '/' },
  { key: 'u', label: 'Go to Users', path: '/users' },
  { key: 'l', label: 'Go to Leads', path: '/leads' },
  { key: 's', label: 'Go to Scrapers', path: '/scrapers' },
  { key: ',', label: 'Open Settings', path: '/settings' },
] as const;

export function GlobalShortcuts() {
  const navigate = useNavigate();
  const setOpen = useCommands((s) => s.setOpen);
  const gPressedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetG = useCallback(() => {
    gPressedRef.current = false;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Listen for 'g' to start a sequence
  useHotkeys(
    'g',
    () => {
      gPressedRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(resetG, 1000);
    },
    { preventDefault: false },
  );

  // Listen for sequence second keys
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!gPressedRef.current) return;
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || (e.target as HTMLElement).isContentEditable) return;

      const item = NAV_ITEMS.find((n) => n.key === e.key);
      if (item) {
        resetG();
        navigate(item.path);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [navigate, resetG]);

  // Register nav commands in the command palette
  useRegisterCommand({ id: 'nav:dashboard', label: 'Go to Dashboard', group: 'Navigate', shortcut: 'g d', action: () => navigate('/') }, []);
  useRegisterCommand({ id: 'nav:users', label: 'Go to Users', group: 'Navigate', shortcut: 'g u', action: () => navigate('/users') }, []);
  useRegisterCommand({ id: 'nav:leads', label: 'Go to Leads', group: 'Navigate', shortcut: 'g l', action: () => navigate('/leads') }, []);
  useRegisterCommand({ id: 'nav:scrapers', label: 'Go to Scrapers', group: 'Navigate', shortcut: 'g s', action: () => navigate('/scrapers') }, []);
  useRegisterCommand({ id: 'nav:settings', label: 'Open Settings', group: 'Navigate', shortcut: 'g ,', action: () => navigate('/settings') }, []);

  // Command palette shortcut
  useHotkeys('mod+k', (e) => { e.preventDefault(); setOpen(true); });

  return null;
}
