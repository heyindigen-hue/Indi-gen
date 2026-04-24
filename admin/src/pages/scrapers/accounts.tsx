import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Check, Info, Loader2, Plus, Trash2, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { relTime } from '@/lib/utils';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusPill } from '@/components/common/StatusPill';
import type { StatusPillVariant } from '@/components/common/StatusPill';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type ScraperAccount = {
  id: string;
  email: string;
  cookie_valid: boolean;
  last_validated: string | null;
  jobs_today: number;
  ban_risk_pct: number;
  status: 'active' | 'paused' | 'quarantined';
};

type AccountsResponse = {
  accounts: ScraperAccount[];
};

const addSchema = z.object({
  email: z.string().email('Must be a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type AddFormData = z.infer<typeof addSchema>;

const STATUS_VARIANTS: Record<string, StatusPillVariant> = {
  active: 'success',
  paused: 'muted',
  quarantined: 'error',
};

const col = createColumnHelper<ScraperAccount>();

export default function ScraperAccountsPage() {
  const [addOpen, setAddOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<AccountsResponse>({
    queryKey: ['scraper-accounts'],
    queryFn: () => api.get<AccountsResponse>('/admin/scraper-accounts'),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddFormData>({ resolver: zodResolver(addSchema) });

  const addMutation = useMutation({
    mutationFn: (d: AddFormData) => api.post('/admin/scraper-accounts', d),
    onSuccess: () => {
      toast.success('Account added');
      queryClient.invalidateQueries({ queryKey: ['scraper-accounts'] });
      setAddOpen(false);
      reset();
    },
    onError: () => toast.error('Failed to add account'),
  });

  const validateMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/scraper-accounts/${id}/validate`),
    onSuccess: () => {
      toast.success('Validation started');
      queryClient.invalidateQueries({ queryKey: ['scraper-accounts'] });
    },
    onError: () => toast.error('Validation failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/scraper-accounts/${id}`),
    onSuccess: () => {
      toast.success('Account deleted');
      queryClient.invalidateQueries({ queryKey: ['scraper-accounts'] });
    },
    onError: () => toast.error('Delete failed'),
  });

  const accounts = data?.accounts ?? [];

  const columns = [
    col.accessor('email', {
      header: 'Email',
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
            <Check className="h-3.5 w-3.5" /> Valid
          </span>
        ) : (
          <span className="flex items-center gap-1 text-red-500 text-sm">
            <X className="h-3.5 w-3.5" /> Invalid
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
    col.accessor('jobs_today', {
      header: 'Jobs today',
      cell: ({ getValue }) => <span className="tabular-nums text-sm">{getValue()}</span>,
      size: 90,
    }),
    col.accessor('ban_risk_pct', {
      header: 'Ban risk',
      cell: ({ getValue }) => {
        const pct = getValue();
        const colorClass =
          pct > 70 ? 'text-red-500' : pct > 40 ? 'text-amber-500' : 'text-green-500';
        return (
          <span className={`tabular-nums text-sm font-medium ${colorClass}`}>
            {pct.toFixed(0)}%
          </span>
        );
      },
      size: 90,
    }),
    col.accessor('status', {
      header: 'Status',
      cell: ({ getValue }) => {
        const s = getValue();
        return <StatusPill label={s} variant={STATUS_VARIANTS[s] ?? 'default'} />;
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
            disabled={validateMutation.isPending}
            onClick={() => validateMutation.mutate(row.original.id)}
          >
            Validate
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => toast.info('Rotate cookie coming soon')}
          >
            Rotate
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => toast.info('Pause coming soon')}
          >
            Pause
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0 text-red-600 hover:text-red-600"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate(row.original.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
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
        title="LinkedIn Accounts"
        subtitle="Manage scraper LinkedIn accounts"
        actions={
          <Dialog
            open={addOpen}
            onOpenChange={(open) => {
              setAddOpen(open);
              if (!open) reset();
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add LinkedIn Account</DialogTitle>
                <DialogDescription>
                  Credentials are encrypted at rest and never logged.
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={handleSubmit((d) => addMutation.mutate(d))}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="acc-email">LinkedIn Email</Label>
                  <Input
                    id="acc-email"
                    type="email"
                    {...register('email')}
                    className="mt-1.5"
                    placeholder="you@example.com"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="acc-password">Password</Label>
                  <Input
                    id="acc-password"
                    type="password"
                    {...register('password')}
                    className="mt-1.5"
                    placeholder="••••••••"
                  />
                  {errors.password && (
                    <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setAddOpen(false);
                      reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addMutation.isPending}>
                    {addMutation.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    )}
                    Add account
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Security callout */}
      <div className="flex items-start gap-2 p-3 mb-5 rounded-lg border border-border bg-muted/50 text-sm">
        <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <span className="text-muted-foreground">
          Credentials are encrypted at rest. Passwords are never stored in plain text or logged.
        </span>
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
                  No accounts configured. Add a LinkedIn account to get started.
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
