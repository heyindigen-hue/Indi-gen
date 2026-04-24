import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { StatusPill } from '@/components/common/StatusPill';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface FleetSummary {
  total: number;
  active: number;
  cooling_down: number;
  banned: number;
}

interface AccountRow {
  id: string;
  email: string;
  status: 'active' | 'cooling_down' | 'banned' | 'error';
  last_scrape?: string;
}

const ACCOUNT_STATUS_VARIANT = {
  active: 'success',
  cooling_down: 'warning',
  banned: 'error',
  error: 'error',
} as const;

export default function LinkedInPage() {
  const navigate = useNavigate();

  const { data: fleet, isLoading: loadingFleet } = useQuery<FleetSummary>({
    queryKey: ['scraper-fleet-summary'],
    queryFn: (): Promise<FleetSummary> => api.get('/admin/scrapers/fleet-summary'),
  });

  const { data: accounts = [], isLoading: loadingAccounts } = useQuery<AccountRow[]>({
    queryKey: ['scraper-accounts-preview'],
    queryFn: (): Promise<AccountRow[]> => api.get('/admin/scrapers/accounts?limit=5'),
  });

  return (
    <div>
      <PageHeader
        title="LinkedIn"
        description="LinkedIn accounts are managed via the Scrapers module"
        actions={
          <Button size="sm" onClick={() => navigate('/scrapers/accounts')}>
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            Open Scraper Accounts
          </Button>
        }
      />

      <div className="max-w-2xl space-y-5">
        {/* Info card */}
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-md bg-[#0077B5]/10 flex items-center justify-center shrink-0">
              <span className="text-[#0077B5] font-bold text-sm">in</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">LinkedIn Integration</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Indi-gen accesses LinkedIn through a fleet of managed accounts using the{' '}
                <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">linkedin-api</code>{' '}
                library. No OAuth or official API key is needed. Accounts are added and managed in{' '}
                <strong>Scrapers &rarr; Accounts</strong>.
              </p>
              <ul className="mt-3 space-y-1 text-xs text-muted-foreground list-disc list-inside">
                <li>Each account automatically cools down between scrapes to avoid detection</li>
                <li>Cookies are persisted per account for session continuity</li>
                <li>Banned accounts are flagged and excluded from the scrape queue</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Fleet status */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h4 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            Fleet status
          </h4>
          {loadingFleet ? (
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : fleet ? (
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Total accounts', value: fleet.total, color: 'text-foreground' },
                { label: 'Active', value: fleet.active, color: 'text-green-500' },
                { label: 'Cooling down', value: fleet.cooling_down, color: 'text-amber-500' },
                { label: 'Banned', value: fleet.banned, color: 'text-red-500' },
              ].map((item) => (
                <div key={item.label} className="rounded-lg bg-muted/40 px-3 py-3 text-center">
                  <div className={cn('text-xl font-semibold tabular-nums', item.color)}>
                    {item.value}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{item.label}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No fleet data available</p>
          )}
        </div>

        {/* Recent accounts preview */}
        {accounts.length > 0 && (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h4 className="text-sm font-medium text-foreground">Recent accounts</h4>
              <button
                onClick={() => navigate('/scrapers/accounts')}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                View all →
              </button>
            </div>
            {loadingAccounts ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {accounts.map((a) => (
                  <div key={a.id} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-sm text-foreground">{a.email}</span>
                    <div className="flex items-center gap-3">
                      {a.last_scrape && (
                        <span className="text-xs text-muted-foreground">{a.last_scrape}</span>
                      )}
                      <StatusPill
                        label={a.status.replace('_', ' ')}
                        variant={ACCOUNT_STATUS_VARIANT[a.status]}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
