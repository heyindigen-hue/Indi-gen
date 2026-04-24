import { useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table';
import {
  ChevronDownIcon,
  ArrowRightIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  DownloadIcon,
  EyeIcon,
  ChartIcon,
  CashIcon,
  CheckIcon,
} from '@/icons';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { cn, formatINR, relTime } from '@/lib/utils';
import { PageHeader } from '@/components/common/PageHeader';
import { KpiCard } from '@/components/common/KpiCard';
import { StatusPill } from '@/components/common/StatusPill';
import type { StatusPillVariant } from '@/components/common/StatusPill';
import { InvoiceSheet } from '@/components/billing/InvoiceSheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRegisterCommand } from '@/store/commands';

type Invoice = {
  id: string;
  invoice_number: string;
  user_name: string;
  user_email: string;
  issued_at: string;
  total: number;
  status: 'paid' | 'pending' | 'void';
  tds_deducted: number | null;
};

type InvoicesResponse = {
  invoices: Invoice[];
  total: number;
  stats: {
    revenue_this_month: number;
    revenue_ytd: number;
    paid_count: number;
    pending_count: number;
    void_count: number;
  };
};

const LIMIT = 50;

const STATUS_VARIANTS: Record<string, StatusPillVariant> = {
  paid: 'success',
  pending: 'warning',
  void: 'muted',
};

const col = createColumnHelper<Invoice>();

export default function InvoicesPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const q = params.get('q') ?? '';
  const status = params.get('status') ?? '';
  const page = Number(params.get('page') ?? '0');

  const { data, isLoading } = useQuery<InvoicesResponse>({
    queryKey: ['admin-invoices', q, status, page],
    queryFn: () => {
      const ps = new URLSearchParams({ limit: String(LIMIT), offset: String(page * LIMIT) });
      if (q) ps.set('q', q);
      if (status) ps.set('status', status);
      return api.get<InvoicesResponse>(`/admin/invoices?${ps.toString()}`);
    },
  });

  const openSheet = (id: string) => {
    setSelectedId(id);
    setSheetOpen(true);
  };

  const columns = useMemo(
    () => [
      col.accessor('invoice_number', {
        header: 'Invoice #',
        cell: ({ getValue }) => (
          <span className="font-mono text-xs font-medium">{getValue()}</span>
        ),
        enableSorting: true,
      }),
      col.accessor('user_name', {
        header: 'User',
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-sm">{row.original.user_name}</div>
            <div className="text-xs text-muted-foreground">{row.original.user_email}</div>
          </div>
        ),
        enableSorting: true,
        size: 200,
      }),
      col.accessor('issued_at', {
        header: 'Issued',
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">{relTime(getValue())}</span>
        ),
        enableSorting: true,
      }),
      col.accessor('total', {
        header: 'Total',
        cell: ({ getValue }) => (
          <span className="text-sm font-medium">{formatINR(getValue())}</span>
        ),
        enableSorting: true,
      }),
      col.accessor('status', {
        header: 'Status',
        cell: ({ getValue }) => {
          const s = getValue();
          return <StatusPill label={s} variant={STATUS_VARIANTS[s] ?? 'default'} />;
        },
        enableSorting: true,
      }),
      col.accessor('tds_deducted', {
        header: 'TDS',
        cell: ({ getValue }) => {
          const v = getValue();
          return v != null ? (
            <span className="text-xs text-green-600 font-medium">&#10003; {formatINR(v)}</span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          );
        },
        enableSorting: false,
      }),
      col.display({
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={(e) => {
                e.stopPropagation();
                openSheet(row.original.id);
              }}
            >
              <EyeIcon size={14} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={(e) => {
                e.stopPropagation();
                api
                  .get<{ url: string }>(`/admin/invoices/${row.original.id}/pdf`)
                  .then((res) => window.open((res as { url: string }).url, '_blank'))
                  .catch(() => toast.error('Failed to get PDF'));
              }}
            >
              <DownloadIcon size={14} />
            </Button>
          </div>
        ),
        size: 72,
      }),
    ],
    [],
  );

  const invoices = data?.invoices ?? [];
  const total = data?.total ?? 0;
  const stats = data?.stats;
  const pageCount = Math.max(1, Math.ceil(total / LIMIT));

  const table = useReactTable({
    data: invoices,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount,
  });

  useRegisterCommand(
    {
      id: 'billing.find-invoice',
      label: 'Find invoice by number',
      group: 'Billing',
      action: () => navigate('/billing/invoices'),
    },
    [navigate],
  );

  const setFilter = (key: string, value: string) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else next.delete(key);
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
      <PageHeader title="Invoices" subtitle="View and manage customer invoices" />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <KpiCard
          title="Revenue this month"
          value={stats ? formatINR(stats.revenue_this_month) : '—'}
          icon={CashIcon}
          loading={isLoading && !stats}
        />
        <KpiCard
          title="Revenue YTD"
          value={stats ? formatINR(stats.revenue_ytd) : '—'}
          icon={ChartIcon}
          loading={isLoading && !stats}
        />
        <KpiCard
          title="Paid"
          value={stats?.paid_count ?? (isLoading ? '—' : 0)}
          icon={CheckIcon}
          loading={isLoading && !stats}
        />
        <KpiCard
          title="Pending"
          value={stats?.pending_count ?? (isLoading ? '—' : 0)}
          loading={isLoading && !stats}
        />
        <KpiCard
          title="Void"
          value={stats?.void_count ?? (isLoading ? '—' : 0)}
          loading={isLoading && !stats}
        />
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Input
          placeholder="Search invoice # or user..."
          value={q}
          onChange={(e) => setFilter('q', e.target.value)}
          className="w-56 h-8 text-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1">
              {status ? `Status: ${status}` : 'All statuses'}
              <ChevronDownIcon size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setFilter('status', '')}>
              All statuses
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter('status', 'paid')}>Paid</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter('status', 'pending')}>
              Pending
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter('status', 'void')}>Void</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
                  No invoices found
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => openSheet(row.original.id)}
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

      <InvoiceSheet
        invoiceId={selectedId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}
