import { useLocation, Link } from 'react-router-dom';
import { Bell, Sun, Moon, Search, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/store/auth';
import { useCommands } from '@/store/commands';
import { cn } from '@/lib/utils';

function useBreadcrumbs() {
  const { pathname } = useLocation();
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return [{ label: 'Dashboard', href: '/' }];
  return [
    { label: 'Dashboard', href: '/' },
    ...parts.map((part, i) => ({
      label: part.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      href: '/' + parts.slice(0, i + 1).join('/'),
    })),
  ];
}

export function TopBar() {
  const breadcrumbs = useBreadcrumbs();
  const { user, logout } = useAuth();
  const setOpen = useCommands((s) => s.setOpen);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggleTheme = () => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      setIsDark(false);
    } else {
      html.classList.add('dark');
      setIsDark(true);
    }
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? 'U';

  return (
    <header className="h-topbar border-b border-border bg-card flex items-center px-4 gap-3 shrink-0">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 flex-1 min-w-0 text-sm">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
            {i === breadcrumbs.length - 1 ? (
              <span className="font-medium text-foreground truncate">{crumb.label}</span>
            ) : (
              <Link to={crumb.href} className="text-muted-foreground hover:text-foreground transition-colors">
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* Command palette trigger */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'hidden md:flex items-center gap-2 px-3 h-8 rounded-md border border-border bg-muted/40 text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors text-sm',
        )}
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search or run...</span>
        <kbd className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
      </button>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8">
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Bell className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1">
              <Avatar className="h-7 w-7">
                <AvatarImage src={user?.avatar_url ?? undefined} />
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <div className="text-xs font-medium">{user?.name ?? 'Admin'}</div>
              <div className="text-xs text-muted-foreground">{user?.email}</div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => logout()}
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
