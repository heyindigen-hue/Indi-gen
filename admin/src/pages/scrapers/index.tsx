import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ChartIcon, CheckIcon, ShieldIcon, UsersIcon, XIcon, ZapIcon } from '@/icons';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { relTime } from '@/lib/utils';
import { PageHeader } from '@/components/common/PageHeader';
import { KpiCard } from '@/components/common/KpiCard';
import { StatusPill } from '@/components/common/StatusPill';
import type { StatusPillVariant } from '@/components/common/StatusPill';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type ScraperAccount = {
  id: string;
  email: string;
  cookie_valid: boolean;
  last_validated: string | null;
  last_run: string | null;
  jobs_today: number;
  ban_risk_pct: number;
  status: 'active' | 'paused' | 'quarantined';
};

type RecentRun = {
  id: string;
  started_at: string;
  account_email: string;
  leads_kept: number;
  status: 'completed' | 'failed' | 'running';
};

type ScraperFleetResponse = {
  accounts: ScraperAccount[];
  stats: {
    accounts_healthy: number;
    jobs_running: number;
    leads_today: number;
    avg_ban_risk_pct: number;
  };
  recent_runs: RecentRun[];
};

const ACCOUNT_STATUS_VARIANTS: Record<string, StatusPillVariant> = {
  active: 'success',
  paused: 'muted',
  quarantined: 'error',
};

const RUN_STATUS_VARIANTS: Record<string, StatusPillVariant> = {
  completed: 'success',
  failed: 'error',
  running: 'warning',
};

const col = createColumnHelper<ScraperAccount>();

function BanRiskBar({ pct }: { pct: number }) {
  const color = pct > 70 ? 'bg-red-500' : pct > 40 ? 'bg-amber-500' : 'bg-green-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">{pct.toFixed(0)}%</span>
    </div>
  );
}

export default function ScrapersPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<ScraperFleetResponse>({
    queryKey: ['scraper-fleet'],
    queryFn: () => api.get<ScraperFleetResponse>('/admin/scraper-accounts'),
    refetchInterval: 15_000,
  });

  const runNowMutation = useMutation({
    mutationFn: (accountId: string) => api.post('/scrape', { account_id: accountId }),
    onSuccess: () => {
      toast.success('Scrape job started');
      queryClient.invalidateQueries({ queryKey: ['scraper-fleet'] });
    },
    onError: () => toast.error('Failed to start job'),
  });

  const validateMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/scraper-accounts/${id}/validate`),
    onSuccess: () => {
      toast.success('Validation started');
      queryClient.invalidateQueries({ queryKey: ['scraper-fleet'] });
    },
    onError: () => toast.error('Validation failed'),
  });

  const stats = data?.stats;
  const accounts = data?.accounts ?? [];
  const recentRuns = data?.recent_runs ?? [];

  const columns = [
    col.accessor('email', {
      header: 'Account',
      cell: ({ getValue }) => (
        <span className="font-mono text-sm">
          {getValue().replace(/(?<=.{4}).+(?=.{4}@)/, '***')}
        </span>
      ),
    }),
    col.accessor('cookie_valid', {
      header: 'Cookie',
      cell: ({ getValue }) =>
        getValue() ? (
          <span className="flex items-center gap-1 text-green-500 text-sm">
            <CheckIcon size={14} /> Valid
          </span>
        ) : (
          <span className="flex items-center gap-1 text-red-500 text-sm">
            <XIcon size={14} /> Invalid
          </span>
        ),
      size: 100,
    }),
    col.accessor('last_validated', {
      header: 'Last validated',
      cell: ({ getValue }) => {
        const v = getValue();
        return (
          <span className="text-sm text-muted-foreground">{v ? relTime(new Date(v)) : '—'}</span>
        );
      },
    }),
    col.accessor('last_run', {
      header: 'Last run',
      cell: ({ getValue }) => {
        const v = getValue();
        return (
          <span className="text-sm text-muted-foreground">{v ? relTime(new Date(v)) : '—'}</span>
        );
      },
    }),
    col.accessor('jobs_today', {
      header: 'Jobs today',
      cell: ({ getValue }) => <span className="tabular-nums text-sm">{getValue()}</span>,
      size: 90,
    }),
    col.accessor('ban_risk_pct', {
      header: 'Ban risk',
      cell: ({ getValue }) => <BanRiskBar pct={getValue()} />,
      size: 140,
    }),
    col.accessor('status', {
      header: 'Status',
      cell: ({ getValue }) => {
        const s = getValue();
        return <StatusPill label={s} variant={ACCOUNT_STATUS_VARIANTS[s] ?? 'default'} />;
      },
      size: 110,
    }),
    col.display({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            disabled={runNowMutation.isPending}
            onClick={() => runNowMutation.mutate(row.original.id)}
          >
            Run
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            disabled={validateMutation.isPending}
            onClick={() => validateMutation.mutate(row.original.id)}
          >
            Validate
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs text-amber-600 hover:text-amber-600"
            onClick={() => toast.info('Quarantine coming soon')}
          >
            Quarantine
          </Button>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: accounts,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div>
      <PageHeader
        title="Scrapers"
        subtitle={
          isLoading
            ? 'Loading...'
            : `${accounts.length} accounts · ${stats?.jobs_running ?? 0} jobs running`
        }
        actions={
          <Button variant="outline" size="sm" onClick={() => (window.location.href = '/scrapers/accounts')}>
            Manage accounts
          </Button>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <KpiCard
          title="Accounts healthy"
          value={isLoading ? '—' : (stats?.accounts_healthy ?? 0)}
          icon={UsersIcon}
          loading={isLoading}
        />
        <KpiCard
          title="Jobs running"
          value={isLoading ? '—' : (stats?.jobs_running ?? 0)}
          icon={ChartIcon}
          loading={isLoading}
        />
        <KpiCard
          title="Leads today"
          value={isLoading ? '—' : (stats?.leads_today ?? 0)}
          icon={ZapIcon}
          loading={isLoading}
        />
        <KpiCard
          title="Avg ban risk"
          value={isLoading ? '—' : `${(stats?.avg_ban_risk_pct ?? 0).toFixed(0)}%`}
          icon={ShieldIcon}
          loading={isLoading}
        />
      </div>

      {/* Account health table */}
      <h2 className="text-sm font-semibold text-foreground mb-3">Account Health</h2>
      <div className="rounded-md border mb-6">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={header.getSize() !== 150 ? { width: header.getSize() } : undefined}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground text-sm"
                >
                  No accounts configured
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Recent runs timeline */}
      <h2 className="text-sm font-semibold text-foreground mb-3">Last 10 Runs</h2>
      <div className="space-y-1">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
        ) : recentRuns.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent runs</p>
        ) : (
          recentRuns.slice(0, 10).map((run) => (
            <div
              key={run.id}
              className="flex items-center gap-3 px-3 py-2 rounded-md border border-border text-sm"
            >
              <StatusPill
                label={run.status}
                variant={RUN_STATUS_VARIANTS[run.status] ?? 'default'}
              />
              <span className="text-muted-foreground font-mono text-xs shrink-0">
                {relTime(new Date(run.started_at))}
              </span>
              <span className="text-muted-foreground truncate">{run.account_email}</span>
              <span className="ml-auto text-muted-foreground shrink-0">
                {run.leads_kept} leads
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
