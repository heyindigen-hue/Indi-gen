import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import { useCommands } from '@/store/commands';

const RECENT_KEY = 'leadhangover_recent_pages';

const NAV_COMMANDS = [
  { id: 'go-dashboard', label: 'Dashboard', href: '/' },
  { id: 'go-users', label: 'Users', href: '/users' },
  { id: 'go-leads', label: 'Leads', href: '/leads' },
  { id: 'go-scrapers', label: 'Scrapers', href: '/scrapers' },
  { id: 'go-ai', label: 'AI', href: '/ai' },
  { id: 'go-integrations', label: 'Integrations', href: '/integrations' },
  { id: 'go-billing', label: 'Billing', href: '/billing' },
  { id: 'go-mobile-ui', label: 'Mobile UI', href: '/mobile-ui' },
  { id: 'go-settings', label: 'Settings', href: '/settings' },
  { id: 'go-security', label: 'Security', href: '/security' },
  { id: 'go-platform', label: 'Platform', href: '/platform' },
];

function getRecent(): Array<{ label: string; href: string }> {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  } catch {
    return [];
  }
}

function addRecent(label: string, href: string) {
  const recent = getRecent().filter((r) => r.href !== href);
  const next = [{ label, href }, ...recent].slice(0, 5);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

export function CommandMenu() {
  const open = useCommands((s) => s.open);
  const setOpen = useCommands((s) => s.setOpen);
  const commands = useCommands((s) => s.commands);
  const navigate = useNavigate();
  const recent = getRecent();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [setOpen]);

  const run = (href: string, label: string) => {
    addRecent(label, href);
    navigate(href);
    setOpen(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search or run a command..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {recent.length > 0 && (
          <>
            <CommandGroup heading="Recent">
              {recent.map((r) => (
                <CommandItem key={r.href} onSelect={() => run(r.href, r.label)}>
                  {r.label}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading="Go to">
          {NAV_COMMANDS.map((cmd) => (
            <CommandItem key={cmd.id} onSelect={() => run(cmd.href, cmd.label)}>
              {cmd.label}
            </CommandItem>
          ))}
        </CommandGroup>

        {commands.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Actions">
              {commands.map((cmd) => (
                <CommandItem
                  key={cmd.id}
                  keywords={cmd.keywords}
                  onSelect={() => {
                    cmd.action();
                    setOpen(false);
                  }}
                >
                  {cmd.label}
                  {cmd.shortcut && (
                    <span className="ml-auto text-xs text-muted-foreground">{cmd.shortcut}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
