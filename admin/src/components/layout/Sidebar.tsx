import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Target,
  Bot,
  Plug,
  CreditCard,
  Smartphone,
  Settings,
  Shield,
  ChevronDown,
  ChevronRight,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  Globe,
  Cpu,
  BarChart3,
  Database,
  Webhook,
  Key,
  Bell,
  Sliders,
  Server,
  Lock,
  FileText,
  Activity,
  UserCheck,
  List,
  Layers,
  Zap,
  Package,
  DollarSign,
  Receipt,
  Gift,
  AlertCircle,
  Layout,
  Navigation,
  Palette,
  Image,
  MessageSquare,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/store/auth';

const SIDEBAR_KEY = 'indigen_sidebar_collapsed';
const EXPANDED_GROUPS_KEY = 'indigen_sidebar_groups';

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavGroup = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Users',
    icon: Users,
    items: [
      { label: 'All Users', href: '/users', icon: Users },
      { label: 'Verification', href: '/users/verification', icon: UserCheck },
      { label: 'Activity', href: '/users/activity', icon: Activity },
      { label: 'Roles', href: '/users/roles', icon: Lock },
    ],
  },
  {
    label: 'Leads',
    icon: Target,
    items: [
      { label: 'All Leads', href: '/leads', icon: List },
      { label: 'Scoring', href: '/leads/scoring', icon: BarChart3 },
      { label: 'Export', href: '/leads/export', icon: FileText },
    ],
  },
  {
    label: 'Scrapers',
    icon: Globe,
    items: [
      { label: 'Jobs', href: '/scrapers', icon: Activity },
      { label: 'Sources', href: '/scrapers/sources', icon: Database },
      { label: 'Schedules', href: '/scrapers/schedules', icon: Zap },
      { label: 'Logs', href: '/scrapers/logs', icon: FileText },
    ],
  },
  {
    label: 'AI',
    icon: Bot,
    items: [
      { label: 'Models', href: '/ai', icon: Cpu },
      { label: 'Prompts', href: '/ai/prompts', icon: MessageSquare },
      { label: 'Usage', href: '/ai/usage', icon: BarChart3 },
    ],
  },
  {
    label: 'Integrations',
    icon: Plug,
    items: [
      { label: 'Overview', href: '/integrations', icon: Plug },
      { label: 'Webhooks', href: '/integrations/webhooks', icon: Webhook },
      { label: 'API Keys', href: '/integrations/api-keys', icon: Key },
      { label: 'OAuth', href: '/integrations/oauth', icon: Lock },
      { label: 'LinkedIn', href: '/integrations/linkedin', icon: Globe },
      { label: 'CRM', href: '/integrations/crm', icon: Database },
      { label: 'Notifications', href: '/integrations/notifications', icon: Bell },
    ],
  },
  {
    label: 'Billing',
    icon: CreditCard,
    items: [
      { label: 'Overview', href: '/billing', icon: DollarSign },
      { label: 'Plans', href: '/billing/plans', icon: Package },
      { label: 'Transactions', href: '/billing/transactions', icon: Receipt },
      { label: 'Credits', href: '/billing/credits', icon: Gift },
      { label: 'GST', href: '/billing/gst', icon: FileText },
    ],
  },
  {
    label: 'Mobile UI',
    icon: Smartphone,
    items: [
      { label: 'Screens', href: '/mobile-ui', icon: Layout },
      { label: 'Navigation', href: '/mobile-ui/navigation', icon: Navigation },
      { label: 'Components', href: '/mobile-ui/components', icon: Layers },
      { label: 'Themes', href: '/mobile-ui/themes', icon: Palette },
      { label: 'Assets', href: '/mobile-ui/assets', icon: Image },
      { label: 'Announcements', href: '/mobile-ui/announcements', icon: Bell },
    ],
  },
  {
    label: 'Settings',
    icon: Settings,
    items: [
      { label: 'General', href: '/settings', icon: Sliders },
      { label: 'Emails', href: '/settings/emails', icon: MessageSquare },
      { label: 'Maintenance', href: '/settings/maintenance', icon: AlertCircle },
      { label: 'Features', href: '/settings/features', icon: Zap },
      { label: 'DPDP', href: '/settings/dpdp', icon: FileText },
      { label: 'Audit Log', href: '/settings/audit', icon: Activity },
    ],
  },
  {
    label: 'Security',
    icon: Shield,
    items: [
      { label: 'Overview', href: '/security', icon: Shield },
      { label: 'Sessions', href: '/security/sessions', icon: Key },
      { label: 'IP Allowlist', href: '/security/ip-allowlist', icon: Lock },
      { label: 'Rate Limits', href: '/security/rate-limits', icon: Activity },
      { label: 'Alerts', href: '/security/alerts', icon: AlertCircle },
    ],
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(SIDEBAR_KEY) === 'true');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(EXPANDED_GROUPS_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    localStorage.setItem(EXPANDED_GROUPS_KEY, JSON.stringify([...expandedGroups]));
  }, [expandedGroups]);

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
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
    <aside
      className={cn(
        'flex flex-col bg-card border-r border-border transition-all duration-200 shrink-0',
        collapsed ? 'w-14' : 'w-60',
      )}
    >
      {/* Logo + toggle */}
      <div className="flex items-center h-topbar px-3 border-b border-border shrink-0">
        {!collapsed && (
          <span className="flex-1 font-semibold text-foreground text-sm tracking-tight">Indi-gen</span>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors ml-auto"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      <ScrollArea className="flex-1 py-2">
        {/* Dashboard */}
        <div className="px-2 mb-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 px-2 rounded-md h-8 text-sm transition-colors',
                isActive
                  ? 'bg-accent text-foreground border-l-2 border-primary pl-[6px]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/60',
                collapsed && 'justify-center px-0',
              )
            }
          >
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Dashboard</span>}
          </NavLink>
        </div>

        {/* Groups */}
        <div className="px-2 space-y-0.5">
          {NAV_GROUPS.map((group) => {
            const isExpanded = expandedGroups.has(group.label);
            const GroupIcon = group.icon;
            return (
              <div key={group.label}>
                <button
                  onClick={() => !collapsed && toggleGroup(group.label)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-2 rounded-md h-8 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors',
                    collapsed && 'justify-center px-0',
                  )}
                >
                  <GroupIcon className="h-4 w-4 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{group.label}</span>
                      {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                      )}
                    </>
                  )}
                </button>
                {!collapsed && isExpanded && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border pl-2">
                    {group.items.map((item) => {
                      const ItemIcon = item.icon;
                      return (
                        <NavLink
                          key={item.href}
                          to={item.href}
                          end
                          className={({ isActive }) =>
                            cn(
                              'flex items-center gap-2 px-2 rounded-md h-8 text-sm transition-colors',
                              isActive
                                ? 'bg-accent text-foreground'
                                : 'text-muted-foreground hover:text-foreground hover:bg-accent/60',
                            )
                          }
                        >
                          <ItemIcon className="h-3.5 w-3.5 shrink-0" />
                          <span>{item.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Platform (hidden under more) */}
        <div className="px-2 mt-2">
          <NavLink
            to="/platform"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 px-2 rounded-md h-8 text-sm transition-colors',
                isActive
                  ? 'bg-accent text-foreground border-l-2 border-primary pl-[6px]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/60',
                collapsed && 'justify-center px-0',
              )
            }
          >
            <Server className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Platform</span>}
          </NavLink>
        </div>
      </ScrollArea>

      {/* User profile row */}
      <div className="shrink-0 border-t border-border p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-accent transition-colors text-left',
                collapsed && 'justify-center px-0',
              )}
            >
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarImage src={user?.avatar_url ?? undefined} />
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground truncate">{user?.name ?? user?.email}</div>
                  <div className="text-xs text-muted-foreground capitalize truncate">{user?.role}</div>
                </div>
              )}
              {!collapsed && <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-52">
            <div className="px-2 py-1.5">
              <div className="text-xs font-medium">{user?.name ?? 'Admin'}</div>
              <div className="text-xs text-muted-foreground">{user?.email}</div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
