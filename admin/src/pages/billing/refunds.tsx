import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { AlertTriangle, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { cn, formatINR, relTime } from '@/lib/utils';
import { useAuth } from '@/store/auth';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusPill } from '@/components/common/StatusPill';
import type { StatusPillVariant } from '@/components/common/StatusPill';
import { RefundDialog, type RefundRequest } from '@/components/billing/RefundDialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRegisterCommand } from '@/store/commands';

type RefundResponse = {
  refunds: RefundRequest[];
  total: number;
};

const STATUS_VARIANTS: Record<string, StatusPillVariant> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'muted',
};

type TabKey = 'pending' | 'history';

const col = createColumnHelper<RefundRequest>();

export default function RefundsPage() {
  const navigate = useNavigate();
  const currentUser = useAuth((s) => s.user);
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabKey>('pending');
  const [dialog, setDialog] = useState<{
    request: RefundRequest | null;
    action: 'approve' | 'reject';
    open: boolean;
  }>({ request: null, action: 'approve', open: false });

  const { data, isLoading } = useQuery<RefundResponse>({
    queryKey: ['admin-refunds', tab],
    queryFn: () => {
      const ps = new URLSearchParams();
      if (tab === 'pending') ps.set('status', 'pending');
      return api.get<RefundResponse>(`/admin/refund-requests?${ps.toString()}`);
    },
  });

  const actionMutation = useMutation({
    mutationFn: ({
      id,
      action,
      note,
    }: {
      id: string;
      action: 'approve' | 'reject';
      note: string;
    }) => {
      const endpoint = action === 'approve' ? 'approve' : 'reject';
      return api.post(`/admin/refund-requests/${id}/${endpoint}`, { note });
    },
    onSuccess: (_, vars) => {
      toast.success(`Refund ${vars.action === 'approve' ? 'approved' : 'rejected'}`);
      qc.invalidateQueries({ queryKey: ['admin-refunds'] });
      setDialog((d) => ({ ...d, open: false }));
    },
    onError: () => toast.error('Action failed'),
  });

  const pendingColumns = useMemo(
    () => [
      col.accessor('user_name', {
        header: 'User',
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-sm">{row.original.user_name}</div>
            <div className="text-xs text-muted-foreground">{row.original.user_email}</div>
          </div>
        ),
        size: 180,
      }),
      col.accessor('invoice_number', {
        header: 'Invoice',
        cell: ({ getValue }) => (
          <span className="font-mono text-xs">{getValue()}</span>
        ),
      }),
      col.accessor('amount', {
        header: 'Amount',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-sm">{formatINR(row.original.amount)}</span>
            {row.original.amount > 5000 && (
              <span
                title="Requires second admin approval"
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
              >
                <AlertTriangle className="h-3 w-3" />
                2FA
              </span>
            )}
          </div>
        ),
      }),
      col.accessor('reason', {
        header: 'Reason',
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground line-clamp-2">{getValue()}</span>
        ),
        size: 200,
      }),
      col.accessor('requested_by', {
        header: 'Requested by',
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">{getValue()}</span>
        ),
      }),
      col.accessor('requested_at', {
        header: 'When',
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">{relTime(getValue())}</span>
        ),
      }),
      col.display({
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const req = row.original;
          const isSelf = currentUser?.email === req.requested_by_email;
          return (
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                disabled={isSelf}
                title={isSelf ? 'Cannot approve your own request' : undefined}
                onClick={(e) => {
                  e.stopPropagation();
                  setDialog({ request: req, action: 'approve', open: true });
                }}
              >
                <Check className="h-3 w-3 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  setDialog({ request: req, action: 'reject', open: true });
                }}
              >
                <X className="h-3 w-3 mr-1" />
                Reject
              </Button>
            </div>
          );
        },
        size: 160,
      }),
    ],
    [currentUser],
  );

  const historyColumns = useMemo(
    () => [
      col.accessor('user_name', {
        header: 'User',
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-sm">{row.original.user_name}</div>
            <div className="text-xs text-muted-foreground">{row.original.user_email}</div>
          </div>
        ),
        size: 180,
      }),
      col.accessor('invoice_number', {
        header: 'Invoice',
        cell: ({ getValue }) => (
          <span className="font-mono text-xs">{getValue()}</span>
        ),
      }),
      col.accessor('amount', {
        header: 'Amount',
        cell: ({ getValue }) => (
          <span className="font-medium text-sm">{formatINR(getValue())}</span>
        ),
      }),
      col.accessor('reason', {
        header: 'Reason',
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">{getValue()}</span>
        ),
        size: 180,
      }),
      col.accessor('status', {
        header: 'Status',
        cell: ({ getValue }) => {
          const s = getValue();
          return <StatusPill label={s} variant={STATUS_VARIANTS[s] ?? 'default'} />;
        },
      }),
      col.accessor('processed_at', {
        header: 'Processed',
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">
            {getValue() ? relTime(getValue()!) : '—'}
          </span>
        ),
      }),
      col.accessor('processed_by', {
        header: 'By',
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">{getValue() ?? '—'}</span>
        ),
      }),
    ],
    [],
  );

  const refunds = data?.refunds ?? [];
  const columns = tab === 'pending' ? pendingColumns : historyColumns;

  const table = useReactTable({
    data: refunds,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  useRegisterCommand(
    {
      id: 'billing.pending-refunds',
      label: 'Pending refunds',
      group: 'Billing',
      action: () => navigate('/billing/refunds'),
    },
    [navigate],
  );

  return (
    <div>
      <PageHeader
        title="Refunds"
        subtitle="Review and process customer refund requests"
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-border">
        {(['pending', 'history'] as TabKey[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors capitalize',
              tab === t
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t === 'pending' ? 'Pending approval' : 'History'}
            {t === 'pending' && refunds.length > 0 && tab === 'pending' && (
              <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs px-1.5 min-w-[18px] h-[18px]">
                {refunds.length}
              </span>
            )}
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
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
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
                  {tab === 'pending' ? 'No pending refund requests' : 'No refund history'}
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

      <RefundDialog
        request={dialog.request}
        action={dialog.action}
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        onConfirm={(id, action, note) => actionMutation.mutate({ id, action, note })}
        isPending={actionMutation.isPending}
      />
    </div>
  );
}
