import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { RefreshIcon } from '@/icons';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { relTime } from '@/lib/utils';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusPill } from '@/components/common/StatusPill';
import type { StatusPillVariant } from '@/components/common/StatusPill';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type EnrichmentJob = {
  id: string;
  lead_id: string;
  lead_name: string | null;
  linkedin_url: string | null;
  status: 'pending' | 'processing' | 'failed' | 'done';
  tries: number;
  last_error: string | null;
  requested_at: string;
};

type EnrichmentQueueResponse = {
  jobs: EnrichmentJob[];
  counts: {
    pending: number;
    processing: number;
    failed: number;
    done_today: number;
  };
};

const STATUS_VARIANTS: Record<string, StatusPillVariant> = {
  pending: 'info',
  processing: 'warning',
  failed: 'error',
  done: 'success',
};

const col = createColumnHelper<EnrichmentJob>();

export default function EnrichmentPage() {
  const [tab, setTab] = useState<string>('all');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<EnrichmentQueueResponse>({
    queryKey: ['enrichment-queue'],
    queryFn: () => api.get<EnrichmentQueueResponse>('/admin/enrichment-queue'),
    refetchInterval: 10_000,
  });

  const retryMutation = useMutation({
    mutationFn: (leadId: string) => api.post(`/leads/${leadId}/enrich`),
    onSuccess: () => {
      toast.success('Retry queued');
      queryClient.invalidateQueries({ queryKey: ['enrichment-queue'] });
    },
    onError: () => toast.error('Retry failed'),
  });

  const retryAllMutation = useMutation({
    mutationFn: () => api.post('/admin/enrichment-queue/retry-failed'),
    onSuccess: () => {
      toast.success('All failed jobs retried');
      queryClient.invalidateQueries({ queryKey: ['enrichment-queue'] });
    },
    onError: () => toast.error('Retry all failed'),
  });

  const counts = data?.counts;
  const allJobs = data?.jobs ?? [];
  const jobs = tab === 'all' ? allJobs : allJobs.filter((j) => j.status === tab);

  const columns = [
    col.accessor('lead_name', {
      header: 'Lead',
      cell: ({ getValue }) => (
        <span className="font-medium text-sm">{getValue() ?? '—'}</span>
      ),
    }),
    col.accessor('linkedin_url', {
      header: 'LinkedIn URL',
      cell: ({ getValue }) => {
        const url = getValue();
        if (!url) return <span className="text-muted-foreground text-sm">—</span>;
        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-500 hover:underline truncate max-w-[200px] block"
            onClick={(e) => e.stopPropagation()}
          >
            {url.replace('https://www.linkedin.com/in/', '')}
          </a>
        );
      },
    }),
    col.accessor('status', {
      header: 'Status',
      cell: ({ getValue }) => {
        const s = getValue();
        return <StatusPill label={s} variant={STATUS_VARIANTS[s] ?? 'default'} />;
      },
    }),
    col.accessor('requested_at', {
      header: 'Requested',
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">{relTime(new Date(getValue()))}</span>
      ),
    }),
    col.accessor('tries', {
      header: 'Tries',
      cell: ({ getValue }) => <span className="tabular-nums text-sm">{getValue()}</span>,
      size: 70,
    }),
    col.accessor('last_error', {
      header: 'Last error',
      cell: ({ getValue }) => {
        const err = getValue();
        if (!err) return <span className="text-muted-foreground text-sm">—</span>;
        return (
          <span className="text-xs text-red-500 font-mono truncate max-w-[200px] block">{err}</span>
        );
      },
    }),
    col.display({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          disabled={retryMutation.isPending}
          onClick={() => retryMutation.mutate(row.original.lead_id)}
        >
          <RefreshIcon size={12} className="mr-1" />
          Retry
        </Button>
      ),
      size: 90,
    }),
  ];

  const table = useReactTable({
    data: jobs,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div>
      <PageHeader
        title="Enrichment Queue"
        subtitle="Monitor and retry lead enrichment jobs"
        actions={
          <Button
            variant="outline"
            size="sm"
            disabled={retryAllMutation.isPending}
            onClick={() => retryAllMutation.mutate()}
          >
            <RefreshIcon size={16} className="mr-1" />
            Retry all failed
          </Button>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Pending', count: counts?.pending, colorClass: 'text-blue-500' },
          { label: 'Processing', count: counts?.processing, colorClass: 'text-amber-500' },
          { label: 'Failed', count: counts?.failed, colorClass: 'text-red-500' },
          { label: 'Enriched today', count: counts?.done_today, colorClass: 'text-green-500' },
        ].map(({ label, count, colorClass }) => (
          <div key={label} className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            {isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <p className={`text-2xl font-semibold tabular-nums ${colorClass}`}>{count ?? 0}</p>
            )}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="processing">Processing</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
          <TabsTrigger value="done">Done</TabsTrigger>
        </TabsList>
      </Tabs>

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
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
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
                  No jobs in this state
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
    </div>
  );
}
