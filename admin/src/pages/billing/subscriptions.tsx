import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type SortingState,
  getSortedRowModel,
} from '@tanstack/react-table';
import { ArrowRightIcon, ChevronRightIcon, FilterIcon, UsersIcon, ClockIcon, AlertCircleIcon, XIcon } from '@/icons';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { cn, formatINR, relTime } from '@/lib/utils';
import { PageHeader } from '@/components/common/PageHeader';
import { KpiCard } from '@/components/common/KpiCard';
import { StatusPill } from '@/components/common/StatusPill';
import type { StatusPillVariant } from '@/components/common/StatusPill';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Subscription = {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  plan: string;
  status: 'active' | 'pending' | 'past_due' | 'cancelled' | 'trialing';
  current_period_end: string;
  amount_inr: number;
  mrr: number;
};

type SubsResponse = {
  subscriptions: Subscription[];
  total: number;
  stats: {
    active: number;
    trial_ending_7d: number;
    past_due: number;
    cancelled_this_month: number;
  };
};

const LIMIT = 50;

const STATUS_VARIANTS: Record<string, StatusPillVariant> = {
  active: 'success',
  pending: 'warning',
  past_due: 'error',
  cancelled: 'muted',
  trialing: 'info',
};

type TabKey = 'all' | 'active' | 'trialing' | 'cancelled' | 'past_due';

const TABS: { id: TabKey; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'trialing', label: 'Trials' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'past_due', label: 'Past due' },
];

const col = createColumnHelper<Subscription>();

export default function SubscriptionsPage() {
  const [params, setParams] = useSearchParams();
  const [sorting, setSorting] = useState<SortingState>([]);
  const qc = useQueryClient();

  const tab = (params.get('tab') ?? 'all') as TabKey;
  const page = Number(params.get('page') ?? '0');

  const { data, isLoading } = useQuery<SubsResponse>({
    queryKey: ['admin-subscriptions', tab, page],
    queryFn: () => {
      const ps = new URLSearchParams({ limit: String(LIMIT), offset: String(page * LIMIT) });
      if (tab !== 'all') ps.set('status', tab);
      if (tab === 'trialing') {
        ps.delete('status');
        ps.set('trial_ending', '');
      }
      return api.get<SubsResponse>(`/admin/subscriptions?${ps.toString()}`);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) =>
      api.post(`/admin/subscriptions/${id}/cancel-at-period-end`),
    onSuccess: () => {
      toast.success('Subscription will cancel at period end');
      qc.invalidateQueries({ queryKey: ['admin-subscriptions'] });
    },
    onError: () => toast.error('Failed to cancel subscription'),
  });

  const columns = useMemo(
    () => [
      col.accessor('user_name', {
        header: 'User',
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-sm">{row.original.user_name}</div>
            <div className="text-xs text-muted-foreground">{row.original.user_email}</div>
          </div>
        ),
        enableSorting: true,
        size: 220,
      }),
      col.accessor('plan', {
        header: 'Plan',
        cell: ({ getValue }) => (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 capitalize">
            {getValue()}
          </span>
        ),
        enableSorting: true,
      }),
      col.accessor('status', {
        header: 'Status',
        cell: ({ getValue }) => {
          const s = getValue();
          return (
            <StatusPill
              label={s.replace('_', ' ')}
              variant={STATUS_VARIANTS[s] ?? 'default'}
            />
          );
        },
        enableSorting: true,
      }),
      col.accessor('current_period_end', {
        header: 'Period ends',
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">{relTime(getValue())}</span>
        ),
        enableSorting: true,
      }),
      col.accessor('amount_inr', {
        header: 'Amount',
        cell: ({ getValue }) => (
          <span className="text-sm font-medium">{formatINR(getValue())}/mo</span>
        ),
        enableSorting: true,
      }),
      col.accessor('mrr', {
        header: 'MRR',
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">{formatINR(getValue())}</span>
        ),
        enableSorting: true,
      }),
      col.display({
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <FilterIcon size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => toast.info(`Viewing user ${row.original.user_id}`)}
              >
                View user
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => cancelMutation.mutate(row.original.id)}
              >
                Cancel at period end
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        size: 48,
      }),
    ],
    [cancelMutation],
  );

  const subs = data?.subscriptions ?? [];
  const total = data?.total ?? 0;
  const stats = data?.stats;
  const pageCount = Math.max(1, Math.ceil(total / LIMIT));

  const table = useReactTable({
    data: subs,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount,
  });

  const setTab = (t: TabKey) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', t);
      next.delete('page');
      return next;
    });

  const setPageParam = (p: number) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(p));
      return next;
    });

  return (
    <div>
      <PageHeader title="Subscriptions" subtitle="Manage customer subscriptions and billing" />

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          title="Active"
          value={stats?.active ?? (isLoading ? '—' : 0)}
          icon={UsersIcon}
          loading={isLoading && !stats}
        />
        <KpiCard
          title="Trials ending 7d"
          value={stats?.trial_ending_7d ?? (isLoading ? '—' : 0)}
          icon={ClockIcon}
          loading={isLoading && !stats}
        />
        <KpiCard
          title="Past due"
          value={stats?.past_due ?? (isLoading ? '—' : 0)}
          icon={AlertCircleIcon}
          loading={isLoading && !stats}
        />
        <KpiCard
          title="Cancelled this month"
          value={stats?.cancelled_this_month ?? (isLoading ? '—' : 0)}
          icon={XIcon}
          loading={isLoading && !stats}
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t.id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={header.getSize() !== 150 ? { width: header.getSize() } : undefined}
                    className={cn(header.column.getCanSort() && 'cursor-pointer select-none')}
                    onClick={() => header.column.getCanSort() && header.column.toggleSorting()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
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
                  No subscriptions found
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/50">
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

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
        <span>
          Page {page + 1} of {pageCount} — {total.toLocaleString()} total
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            disabled={page === 0}
            onClick={() => setPageParam(page - 1)}
          >
            <ArrowRightIcon size={16} className="rotate-180" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            disabled={page >= pageCount - 1}
            onClick={() => setPageParam(page + 1)}
          >
            <ChevronRightIcon size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
