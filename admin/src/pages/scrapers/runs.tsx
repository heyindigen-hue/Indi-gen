import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table';
import { ChevronDownIcon, ChevronUpIcon, ArrowRightIcon, EyeIcon } from '@/icons';
import { api } from '@/lib/api';
import { cn, relTime } from '@/lib/utils';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusPill } from '@/components/common/StatusPill';
import { RunLogSheet } from '@/components/common/RunLogSheet';
import type { StatusPillVariant } from '@/components/common/StatusPill';
import type { LogLine } from '@/components/common/RunLogSheet';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type ScrapeRun = {
  id: string;
  started_at: string;
  trigger: 'cron' | 'manual' | 'api';
  account_email: string;
  posts_found: number;
  leads_kept: number;
  duration_secs: number;
  status: 'running' | 'completed' | 'failed';
  cost_usd: number | null;
  log_lines?: LogLine[];
};

type RunsResponse = {
  runs: ScrapeRun[];
  total: number;
};

const TRIGGER_LABELS: Record<string, string> = {
  cron: 'Cron',
  manual: 'Manual',
  api: 'API',
};

const STATUS_VARIANTS: Record<string, StatusPillVariant> = {
  running: 'warning',
  completed: 'success',
  failed: 'error',
};

const col = createColumnHelper<ScrapeRun>();

export default function ScraperRunsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'started_at', desc: true }]);
  const [selectedRun, setSelectedRun] = useState<ScrapeRun | null>(null);

  const { data, isLoading } = useQuery<RunsResponse>({
    queryKey: ['scrape-runs', statusFilter],
    queryFn: () => {
      const ps = new URLSearchParams({ limit: '100' });
      if (statusFilter) ps.set('status', statusFilter);
      return api.get<RunsResponse>(`/admin/scrape-runs?${ps.toString()}`);
    },
    refetchInterval: 15_000,
  });

  const runs = data?.runs ?? [];

  const columns = [
    col.accessor('started_at', {
      header: 'Started',
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">{relTime(new Date(getValue()))}</span>
      ),
      enableSorting: true,
    }),
    col.accessor('trigger', {
      header: 'Trigger',
      cell: ({ getValue }) => (
        <span className="text-sm capitalize">{TRIGGER_LABELS[getValue()] ?? getValue()}</span>
      ),
      enableSorting: false,
    }),
    col.accessor('account_email', {
      header: 'Account',
      cell: ({ getValue }) => (
        <span className="font-mono text-sm">
          {getValue().replace(/(?<=.{4}).+(?=.{4}@)/, '***')}
        </span>
      ),
      enableSorting: false,
    }),
    col.accessor('posts_found', {
      header: 'Posts',
      cell: ({ getValue }) => <span className="tabular-nums text-sm">{getValue()}</span>,
      enableSorting: true,
      size: 80,
    }),
    col.accessor('leads_kept', {
      header: 'Leads',
      cell: ({ getValue }) => (
        <span className="tabular-nums text-sm font-medium">{getValue()}</span>
      ),
      enableSorting: true,
      size: 80,
    }),
    col.accessor('duration_secs', {
      header: 'Duration',
      cell: ({ getValue }) => {
        const secs = getValue();
        const label =
          secs >= 60 ? `${Math.floor(secs / 60)}m ${secs % 60}s` : `${secs}s`;
        return <span className="tabular-nums text-sm text-muted-foreground">{label}</span>;
      },
      enableSorting: true,
      size: 90,
    }),
    col.accessor('status', {
      header: 'Status',
      cell: ({ getValue }) => {
        const s = getValue();
        return <StatusPill label={s} variant={STATUS_VARIANTS[s] ?? 'default'} />;
      },
      enableSorting: true,
      size: 100,
    }),
    col.accessor('cost_usd', {
      header: 'Cost',
      cell: ({ getValue }) => {
        const v = getValue();
        return (
          <span className="tabular-nums text-sm text-muted-foreground">
            {v !== null ? `$${v.toFixed(4)}` : '—'}
          </span>
        );
      },
      size: 80,
    }),
    col.display({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedRun(row.original);
          }}
        >
          <EyeIcon size={16} />
        </Button>
      ),
      size: 48,
    }),
  ];

  const table = useReactTable({
    data: runs,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div>
      <PageHeader title="Scraper Runs" subtitle="History of all scrape jobs" />

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        <Select
          value={statusFilter || 'all'}
          onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}
        >
          <SelectTrigger className="w-36 h-8 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
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
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <span className="text-muted-foreground">
                          {header.column.getIsSorted() === 'asc' ? (
                            <ChevronUpIcon size={12} />
                          ) : header.column.getIsSorted() === 'desc' ? (
                            <ChevronDownIcon size={12} />
                          ) : (
                            <ArrowRightIcon size={12} className="opacity-40 rotate-90" />
                          )}
                        </span>
                      )}
                    </div>
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
                  No runs found
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedRun(row.original)}
                >
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

      {/* Run log sheet */}
      <RunLogSheet
        open={!!selectedRun}
        onOpenChange={(open) => {
          if (!open) setSelectedRun(null);
        }}
        title={selectedRun ? `Run ${selectedRun.id.slice(0, 8)}…` : 'Run Log'}
        description={
          selectedRun
            ? `${TRIGGER_LABELS[selectedRun.trigger] ?? selectedRun.trigger} · ${selectedRun.account_email}`
            : undefined
        }
        lines={selectedRun?.log_lines ?? []}
        status={selectedRun?.status}
      />
    </div>
  );
}
