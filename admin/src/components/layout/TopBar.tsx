import { useLocation, Link } from 'react-router-dom';
import { SearchIcon, BellIcon, ChevronRightIcon } from '@/icons';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/common/ThemeToggle';
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

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? 'U';

  return (
    <header className="h-topbar border-b border-border bg-card flex items-center px-4 gap-3 shrink-0">
      <nav className="flex items-center gap-1 flex-1 min-w-0 text-sm">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1">
            {i > 0 && <ChevronRightIcon size={14} className="text-muted-foreground shrink-0" />}
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

      <button
        onClick={() => setOpen(true)}
        className={cn(
          'hidden md:flex items-center gap-2 px-3 h-8 rounded-md border border-border bg-muted/40 text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors text-sm',
        )}
      >
        <SearchIcon size={14} />
        <span>Search or run...</span>
        <kbd className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
      </button>

      <div className="flex items-center gap-1">
        <ThemeToggle />

        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <BellIcon size={16} className="text-muted-foreground" />
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
