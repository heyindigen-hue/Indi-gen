import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/store/auth';
import { cn } from '@/lib/utils';

const PRO_PLANS = ['pro', 'enterprise'];

const NAV_ITEMS = [
  { to: '/settings/account', label: 'Account' },
  { to: '/settings/company', label: 'Company' },
  { to: '/settings/billing', label: 'Billing' },
  { to: '/settings/notifications', label: 'Notifications' },
  { to: '/settings/integrations', label: 'Integrations' },
  { to: '/settings/branding', label: 'Branding', proPlusOnly: true },
];

export default function SettingsLayout() {
  const user = useAuth((s) => s.user);
  const isPro = PRO_PLANS.includes(user?.plan ?? '');

  return (
    <div className="flex gap-8 min-h-[600px]">
      {/* Sidebar */}
      <aside className="w-48 shrink-0">
        <h2
          className="text-xl font-semibold text-foreground mb-4"
          style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic' }}
        >
          Settings
        </h2>
        <nav className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const dimmed = item.proPlusOnly && !isPro;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                    dimmed && 'opacity-50',
                  )
                }
              >
                <span>{item.label}</span>
                {item.proPlusOnly && (
                  <span className="text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full leading-none">
                    Pro+
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
