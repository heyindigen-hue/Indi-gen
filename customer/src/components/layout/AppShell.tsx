import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/store/auth';
import { BellIcon } from '@/icons/BellIcon';
import { SearchIcon } from '@/icons/SearchIcon';
import { LogOutIcon } from '@/icons/LogOutIcon';
import { SettingsIcon } from '@/icons/SettingsIcon';
import { ZapIcon } from '@/icons/ZapIcon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const NAV_ITEMS = [
  { to: '/', label: 'Home', exact: true },
  { to: '/leads', label: 'Leads' },
  { to: '/outreach', label: 'Outreach' },
  { to: '/proposals', label: 'Proposals' },
  { to: '/insights', label: 'Insights' },
  { to: '/scrape', label: 'Scrape' },
];

function FlowerLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="38" fill="#f3eeff" />
      <ellipse cx="40" cy="18" rx="7" ry="14" fill="#552f83" opacity="0.9" />
      <ellipse cx="40" cy="18" rx="7" ry="14" fill="#552f83" opacity="0.9" transform="rotate(45 40 40)" />
      <ellipse cx="40" cy="18" rx="7" ry="14" fill="#552f83" opacity="0.9" transform="rotate(90 40 40)" />
      <ellipse cx="40" cy="18" rx="7" ry="14" fill="#552f83" opacity="0.9" transform="rotate(135 40 40)" />
      <ellipse cx="40" cy="18" rx="7" ry="14" fill="#7c4db8" opacity="0.7" transform="rotate(22.5 40 40)" />
      <ellipse cx="40" cy="18" rx="7" ry="14" fill="#7c4db8" opacity="0.7" transform="rotate(67.5 40 40)" />
      <ellipse cx="40" cy="18" rx="7" ry="14" fill="#7c4db8" opacity="0.7" transform="rotate(112.5 40 40)" />
      <ellipse cx="40" cy="18" rx="7" ry="14" fill="#7c4db8" opacity="0.7" transform="rotate(157.5 40 40)" />
      <circle cx="40" cy="40" r="9" fill="#f97316" />
      <circle cx="40" cy="40" r="5" fill="#fff3e0" />
    </svg>
  );
}

export function AppShell() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const navigate = useNavigate();

  const initials = user?.name
    ? user.name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? '?';

  const tokenBalance = user?.token_balance ?? 0;

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col bg-background">
        {/* Top nav */}
        <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
          <div className="mx-auto max-w-[1280px] px-6 h-14 flex items-center gap-4">
            {/* Logo */}
            <NavLink to="/" className="flex items-center gap-2 shrink-0">
              <FlowerLogo />
              <span
                className="text-lg font-semibold text-foreground hidden sm:block"
                style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic' }}
              >
                LeadHangover
              </span>
            </NavLink>

            {/* Center nav (tabs) */}
            <nav className="flex-1 flex items-center justify-center gap-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Tokens balance */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <NavLink
                    to="/settings/billing"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
                  >
                    <ZapIcon size={13} />
                    {tokenBalance.toLocaleString('en-IN')}
                  </NavLink>
                </TooltipTrigger>
                <TooltipContent>Token balance</TooltipContent>
              </Tooltip>

              {/* Search */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                    <SearchIcon size={18} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Search</TooltipContent>
              </Tooltip>

              {/* Notifications */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                    <BellIcon size={18} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Notifications</TooltipContent>
              </Tooltip>

              {/* Avatar menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full ring-2 ring-transparent hover:ring-primary/30 transition-all">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar_url ?? undefined} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user?.name || 'My Account'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/settings/account')}>
                    <SettingsIcon size={15} className="mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOutIcon size={15} className="mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          <div className="mx-auto max-w-[1280px] px-6 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
