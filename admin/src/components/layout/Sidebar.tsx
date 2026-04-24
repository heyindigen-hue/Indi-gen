import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  UsersIcon,
  LeadIcon,
  ScraperIcon,
  AiIcon,
  LinkIcon,
  CreditCardIcon,
  VibrateIcon,
  SettingsIcon,
  ShieldIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  LogOutIcon,
  FilterIcon,
  GlobeIcon,
  ChartIcon,
  TagIcon,
  ZapIcon,
  FileTextIcon,
  AlertCircleIcon,
  ArrowRightIcon,
  EditIcon,
  SparkleIcon,
  BellIcon,
  SendIcon,
  CheckIcon,
  ChevronUpIcon,
  SearchIcon,
  StarIcon,
  CashIcon,
} from '@/icons';
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

const SIDEBAR_KEY = 'leadhangover_sidebar_collapsed';
const EXPANDED_GROUPS_KEY = 'leadhangover_sidebar_groups';

interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
  color?: string;
}

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<IconProps>;
};

type NavGroup = {
  label: string;
  icon: React.ComponentType<IconProps>;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Users',
    icon: UsersIcon,
    items: [
      { label: 'All Users', href: '/users', icon: UsersIcon },
      { label: 'Verification', href: '/users/verification', icon: CheckIcon },
      { label: 'Activity', href: '/users/activity', icon: ChartIcon },
      { label: 'Roles', href: '/users/roles', icon: ShieldIcon },
    ],
  },
  {
    label: 'Leads',
    icon: LeadIcon,
    items: [
      { label: 'All Leads', href: '/leads', icon: FilterIcon },
      { label: 'Scoring', href: '/leads/scoring', icon: ChartIcon },
      { label: 'Export', href: '/leads/export', icon: FileTextIcon },
    ],
  },
  {
    label: 'Scrapers',
    icon: ScraperIcon,
    items: [
      { label: 'Jobs', href: '/scrapers', icon: ChartIcon },
      { label: 'Sources', href: '/scrapers/sources', icon: GlobeIcon },
      { label: 'Schedules', href: '/scrapers/schedules', icon: ZapIcon },
      { label: 'Logs', href: '/scrapers/logs', icon: FileTextIcon },
    ],
  },
  {
    label: 'AI',
    icon: AiIcon,
    items: [
      { label: 'Prompts', href: '/ai/prompts', icon: SendIcon },
      { label: 'Context', href: '/ai/context', icon: FileTextIcon },
      { label: 'Usage', href: '/ai/usage', icon: ChartIcon },
    ],
  },
  {
    label: 'Integrations',
    icon: LinkIcon,
    items: [
      { label: 'Cashfree', href: '/integrations/cashfree', icon: CashIcon },
      { label: 'Anthropic', href: '/integrations/anthropic', icon: SparkleIcon },
      { label: 'SignalHire', href: '/integrations/signalhire', icon: ZapIcon },
      { label: 'LinkedIn', href: '/integrations/linkedin', icon: GlobeIcon },
      { label: 'Proxies', href: '/integrations/proxies', icon: ArrowRightIcon },
      { label: 'Email', href: '/integrations/email', icon: BellIcon },
      { label: 'WhatsApp', href: '/integrations/whatsapp', icon: SendIcon },
    ],
  },
  {
    label: 'Billing',
    icon: CreditCardIcon,
    items: [
      { label: 'Plans', href: '/billing/plans', icon: TagIcon },
      { label: 'Subscriptions', href: '/billing/subscriptions', icon: StarIcon },
      { label: 'Invoices', href: '/billing/invoices', icon: FileTextIcon },
      { label: 'Refunds', href: '/billing/refunds', icon: AlertCircleIcon },
      { label: 'Coupons', href: '/billing/coupons', icon: StarIcon },
    ],
  },
  {
    label: 'Mobile UI',
    icon: VibrateIcon,
    items: [
      { label: 'Screens', href: '/mobile-ui', icon: FilterIcon },
      { label: 'Navigation', href: '/mobile-ui/navigation', icon: ArrowRightIcon },
      { label: 'Components', href: '/mobile-ui/components', icon: SparkleIcon },
      { label: 'Themes', href: '/mobile-ui/themes', icon: StarIcon },
      { label: 'Assets', href: '/mobile-ui/assets', icon: EyeIconPlaceholder },
      { label: 'Announcements', href: '/mobile-ui/announcements', icon: BellIcon },
    ],
  },
  {
    label: 'Settings',
    icon: SettingsIcon,
    items: [
      { label: 'Brand', href: '/settings/brand', icon: StarIcon },
      { label: 'Company', href: '/settings/company', icon: FileTextIcon },
      { label: 'Legal', href: '/settings/legal', icon: EditIcon },
      { label: 'Templates', href: '/settings/templates', icon: SparkleIcon },
      { label: 'Feature Flags', href: '/settings/flags', icon: ZapIcon },
      { label: 'Maintenance', href: '/settings/maintenance', icon: AlertCircleIcon },
    ],
  },
  {
    label: 'Security',
    icon: ShieldIcon,
    items: [
      { label: 'Admins', href: '/security/admins', icon: UsersIcon },
      { label: 'Sessions', href: '/security/sessions', icon: SearchIcon },
      { label: 'API Keys', href: '/security/api-keys', icon: ShieldIcon },
      { label: 'Audit Log', href: '/security/audit', icon: ChartIcon },
      { label: 'DPDP / Privacy', href: '/security/dpdp', icon: ShieldIcon },
    ],
  },
];

// Simple placeholder for image/eye icon usage
function EyeIconPlaceholder(props: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size ?? 24}
      height={props.size ?? 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke={props.color || 'currentColor'}
      strokeWidth={props.strokeWidth ?? 2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="M1 12S5 5 12 5 23 12 23 12 19 19 12 19 1 12 1 12Z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

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
          <>
            <img src="/brand/logo-dark-256.png" alt="LeadHangover" className="h-8 w-8" />
            <span className="flex-1 font-semibold text-foreground text-sm tracking-tight">LeadHangover</span>
          </>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors ml-auto"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ArrowRightIcon size={16} /> : <FilterIcon size={16} />}
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
            <HomeIcon size={16} className="shrink-0" />
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
                  <GroupIcon size={16} className="shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{group.label}</span>
                      {isExpanded ? (
                        <ChevronDownIcon size={14} className="opacity-50" />
                      ) : (
                        <ChevronRightIcon size={14} className="opacity-50" />
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
                          <ItemIcon size={14} className="shrink-0" />
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

        {/* Platform footer group */}
        <div className="px-2 mt-2">
          <button
            onClick={() => !collapsed && toggleGroup('Platform')}
            className={cn(
              'w-full flex items-center gap-2.5 px-2 rounded-md h-8 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors',
              collapsed && 'justify-center px-0',
            )}
          >
            <ChartIcon size={16} className="shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">Platform</span>
                {expandedGroups.has('Platform') ? (
                  <ChevronDownIcon size={14} className="opacity-50" />
                ) : (
                  <ChevronRightIcon size={14} className="opacity-50" />
                )}
              </>
            )}
          </button>
          {!collapsed && expandedGroups.has('Platform') && (
            <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border pl-2">
              {[
                { label: 'Logs', href: '/platform/logs', icon: FileTextIcon },
                { label: 'Errors', href: '/platform/errors', icon: AlertCircleIcon },
                { label: 'Webhooks', href: '/platform/webhooks', icon: ZapIcon },
              ].map((item) => {
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
                    <ItemIcon size={14} className="shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          )}
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
              {!collapsed && <ChevronUpIcon size={14} className="text-muted-foreground shrink-0" />}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-52">
            <div className="px-2 py-1.5">
              <div className="text-xs font-medium">{user?.name ?? 'Admin'}</div>
              <div className="text-xs text-muted-foreground">{user?.email}</div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <SettingsIcon size={16} className="mr-2" />
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
              <LogOutIcon size={16} className="mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
