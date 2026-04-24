import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Plus, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { cn, relTime } from '@/lib/utils';
import { PageHeader } from '@/components/common/PageHeader';
import { CouponForm, type Coupon } from '@/components/billing/CouponForm';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRegisterCommand } from '@/store/commands';

type CouponsResponse = {
  coupons: Coupon[];
  total: number;
};

const col = createColumnHelper<Coupon>();

const DISCOUNT_LABELS: Record<string, string> = {
  percent: 'Percent',
  flat: 'Flat',
  tokens: 'Tokens',
};

export default function CouponsPage() {
  const [params, setParams] = useSearchParams();
  const qc = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editCoupon, setEditCoupon] = useState<Coupon | null>(null);

  const filter = (params.get('filter') ?? 'all') as 'all' | 'active' | 'expired';

  const { data, isLoading } = useQuery<CouponsResponse>({
    queryKey: ['admin-coupons', filter],
    queryFn: () => {
      const ps = new URLSearchParams();
      if (filter === 'active') ps.set('enabled', 'true');
      if (filter === 'expired') ps.set('expired', 'true');
      return api.get<CouponsResponse>(`/admin/coupons?${ps.toString()}`);
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Coupon>) => api.post('/admin/coupons', data),
    onSuccess: () => {
      toast.success('Coupon created');
      qc.invalidateQueries({ queryKey: ['admin-coupons'] });
      setFormOpen(false);
    },
    onError: () => toast.error('Failed to create coupon'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ code, data }: { code: string; data: Partial<Coupon> }) =>
      api.patch(`/admin/coupons/${code}`, data),
    onSuccess: () => {
      toast.success('Coupon updated');
      qc.invalidateQueries({ queryKey: ['admin-coupons'] });
      setFormOpen(false);
      setEditCoupon(null);
    },
    onError: () => toast.error('Failed to update coupon'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ code, enabled }: { code: string; enabled: boolean }) =>
      api.patch(`/admin/coupons/${code}`, { enabled }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-coupons'] });
    },
    onError: () => toast.error('Failed to toggle coupon'),
  });

  const openCreate = () => {
    setEditCoupon(null);
    setFormOpen(true);
  };

  const openEdit = (coupon: Coupon) => {
    setEditCoupon(coupon);
    setFormOpen(true);
  };

  const handleSave = (data: Partial<Coupon>) => {
    if (editCoupon) {
      updateMutation.mutate({ code: editCoupon.code, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns = useMemo(
    () => [
      col.accessor('code', {
        header: 'Code',
        cell: ({ getValue }) => (
          <span className="font-mono text-sm font-semibold">{getValue()}</span>
        ),
      }),
      col.accessor('description', {
        header: 'Description',
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">{getValue()}</span>
        ),
        size: 200,
      }),
      col.accessor('discount_type', {
        header: 'Type',
        cell: ({ getValue }) => (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
            {DISCOUNT_LABELS[getValue()] ?? getValue()}
          </span>
        ),
      }),
      col.accessor('value', {
        header: 'Value',
        cell: ({ row }) => {
          const { value, discount_type } = row.original;
          const suffix =
            discount_type === 'percent' ? '%' : discount_type === 'flat' ? ' &#8377;' : ' tokens';
          return (
            <span
              className="text-sm font-medium"
              dangerouslySetInnerHTML={{ __html: `${value}${suffix}` }}
            />
          );
        },
      }),
      col.display({
        id: 'redemptions',
        header: 'Redemptions',
        cell: ({ row }) => {
          const { redemptions, max_redemptions } = row.original;
          return (
            <span className="text-sm text-muted-foreground">
              {redemptions}
              {max_redemptions != null ? ` / ${max_redemptions}` : ''}
            </span>
          );
        },
      }),
      col.accessor('expires_at', {
        header: 'Expires',
        cell: ({ getValue }) => {
          const v = getValue();
          if (!v) return <span className="text-sm text-muted-foreground">Never</span>;
          const expired = new Date(v) < new Date();
          return (
            <span className={cn('text-sm', expired ? 'text-destructive' : 'text-muted-foreground')}>
              {relTime(v)}
            </span>
          );
        },
      }),
      col.accessor('enabled', {
        header: 'Enabled',
        cell: ({ row }) => (
          <Switch
            checked={row.original.enabled}
            onCheckedChange={(v) =>
              toggleMutation.mutate({ code: row.original.code, enabled: v })
            }
            onClick={(e) => e.stopPropagation()}
          />
        ),
        size: 70,
      }),
      col.display({
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEdit(row.original)}>Edit</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        size: 48,
      }),
    ],
    [toggleMutation],
  );

  const coupons = data?.coupons ?? [];
  const total = data?.total ?? 0;

  const table = useReactTable({
    data: coupons,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  useRegisterCommand(
    {
      id: 'billing.new-coupon',
      label: 'New coupon',
      group: 'Billing',
      action: openCreate,
    },
    [],
  );

  const setFilter = (f: string) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('filter', f);
      return next;
    });

  return (
    <div>
      <PageHeader
        title="Coupons"
        subtitle={`${total} coupon${total !== 1 ? 's' : ''}`}
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" />
            Create Coupon
          </Button>
        }
      />

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 border-b border-border">
        {(['all', 'active', 'expired'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors capitalize',
              filter === f
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {f}
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
                  No coupons found
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

      <CouponForm
        coupon={editCoupon}
        open={formOpen}
        onOpenChange={(v) => {
          setFormOpen(v);
          if (!v) setEditCoupon(null);
        }}
        onSave={handleSave}
        isPending={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
