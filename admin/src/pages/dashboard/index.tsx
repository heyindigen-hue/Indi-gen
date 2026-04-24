import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  TrendingUp,
  Users,
  Target,
  UserPlus,
  Zap,
  DollarSign,
  CheckCircle2,
  Tag,
  Play,
  RefreshCw,
  Bell,
  List,
  CreditCard,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { KpiCard } from '@/components/common/KpiCard';
import { EventFeed } from '@/components/common/EventFeed';
import { AlertsPanel } from '@/components/common/AlertsPanel';
import { useAdminStats } from '@/hooks/useAdminStats';
import { useLiveEvents } from '@/hooks/useLiveEvents';
import { useRegisterCommand } from '@/store/commands';
import { formatINR } from '@/lib/utils';

interface QuickActionProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
}

function QuickAction({ title, description, icon: Icon, onClick }: QuickActionProps) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg border border-border bg-card p-4 text-left hover:ring-1 hover:ring-ring/30 transition-all w-full"
    >
      <Icon className="h-5 w-5 text-primary mb-3" />
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
    </button>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { events, paused, setPaused, connected, clear } = useLiveEvents();
  const [filter, setFilter] = useState('all');

  useRegisterCommand(
    {
      id: 'dashboard:refresh',
      label: 'Refresh dashboard',
      group: 'Dashboard',
      action: () => {
        void queryClient.invalidateQueries();
      },
    },
    [],
  );

  useRegisterCommand(
    {
      id: 'dashboard:toggle-feed',
      label: paused ? 'Resume live feed' : 'Pause live feed',
      group: 'Dashboard',
      action: () => setPaused(!paused),
    },
    [paused, setPaused],
  );

  const kpiCards = [
    {
      title: 'MRR',
      value: stats ? formatINR(stats.mrr) : '—',
      change: stats ? { value: stats.mrr_wow, label: 'WoW' } : undefined,
      sparkline: stats?.mrr_sparkline,
      icon: TrendingUp,
    },
    {
      title: 'Active Users (DAU)',
      value: stats ? stats.dau.toLocaleString() : '—',
      change: stats ? { value: stats.dau_wow, label: '7d' } : undefined,
      icon: Users,
    },
    {
      title: 'Leads Today',
      value: stats ? stats.leads_today.toLocaleString() : '—',
      icon: Target,
    },
    {
      title: 'New Signups',
      value: stats ? stats.signups_today.toLocaleString() : '—',
      change: stats ? { value: stats.signups_wow, label: 'WoW' } : undefined,
      icon: UserPlus,
    },
    {
      title: 'Token Burn Today',
      value: stats ? stats.token_burn_today.toLocaleString() : '—',
      icon: Zap,
    },
    {
      title: 'LLM Cost Today',
      value: stats ? formatINR(stats.llm_cost_today_inr) : '—',
      icon: DollarSign,
    },
    {
      title: 'Scrape Success (24h)',
      value: stats ? `${stats.scrape_success_rate.toFixed(1)}%` : '—',
      change: stats ? { value: stats.scrape_success_change } : undefined,
      icon: CheckCircle2,
    },
    {
      title: 'Open Tickets',
      value: stats ? stats.open_tickets.toLocaleString() : '—',
      icon: Tag,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Platform overview">
        <button
          onClick={() => {
            clear();
            void queryClient.invalidateQueries();
          }}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-3 py-1.5 transition-colors"
        >
          <RefreshCw className="h-3 w-3" />
          Refresh
        </button>
      </PageHeader>

      {/* Row 1: KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <KpiCard key={card.title} {...card} loading={statsLoading} />
        ))}
      </div>

      {/* Row 2: Live event feed + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <EventFeed
            events={events}
            filter={filter}
            onFilterChange={setFilter}
            paused={paused}
            onTogglePause={() => setPaused(!paused)}
            connected={connected}
          />
        </div>
        <div>
          <AlertsPanel />
        </div>
      </div>

      {/* Row 3: Quick actions */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickAction
            title="Run Scrape"
            description="Trigger a new scrape job"
            icon={Play}
            onClick={() => navigate('/scrapers')}
          />
          <QuickAction
            title="Send Announcement"
            description="Push message to all users"
            icon={Bell}
            onClick={() => navigate('/mobile-ui/announcements')}
          />
          <QuickAction
            title="View Queue"
            description="Check scraper job logs"
            icon={List}
            onClick={() => navigate('/scrapers/logs')}
          />
          <QuickAction
            title="Billing Overview"
            description="Revenue and subscriptions"
            icon={CreditCard}
            onClick={() => navigate('/billing')}
          />
        </div>
      </div>
    </div>
  );
}
