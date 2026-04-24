import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/react-table';
import {
  XIcon,
  ChevronDownIcon,
  ArrowRightIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  DownloadIcon,
  StarIcon,
  SendIcon,
  UserIcon,
} from '@/icons';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { cn, formatINR, relTime } from '@/lib/utils';
import { PageHeader } from '@/components/common/PageHeader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCommands, useRegisterCommand } from '@/store/commands';

type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  avatar_url?: string | null;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  status: 'active' | 'banned' | 'deleted';
  country?: string | null;
  country_code?: string | null;
  tokens_balance: number;
  mrr?: number | null;
  last_seen?: string | null;
  created_at: string;
};

type UsersResponse = {
  users: AdminUser[];
  total: number;
  limit: number;
  offset: number;
};

const LIMIT = 50;

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  starter: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  pro: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  enterprise: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
};

const SAVED_VIEWS = [
  { id: 'all', label: 'All users', q: '', plan: '', status: '' },
  { id: 'power', label: 'Power users (>100 tokens burn/week)', q: '', plan: '', status: 'active' },
  { id: 'at-risk', label: 'At-risk (last seen > 14d)', q: '', plan: '', status: 'active' },
  { id: 'churned', label: 'Churned (cancelled)', q: '', plan: '', status: 'deleted' },
];

function flagEmoji(code: string) {
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

function PlanChip({ plan }: { plan: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize',
        PLAN_COLORS[plan] ?? PLAN_COLORS.free,
      )}
    >
      {plan}
    </span>
  );
}

const col = createColumnHelper<AdminUser>();

export default function UsersPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const setOpen = useCommands((s) => s.setOpen);

  const q = params.get('q') ?? '';
  const plan = params.get('plan') ?? '';
  const status = params.get('status') ?? '';
  const page = Number(params.get('page') ?? '0');

  const [searchInput, setSearchInput] = useState(q);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        if (searchInput) next.set('q', searchInput);
        else next.delete('q');
        next.delete('page');
        return next;
      });
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput, setParams]);

  const { data, isLoading } = useQuery<UsersResponse>({
    queryKey: ['admin-users', q, plan, status, page],
    queryFn: () => {
      const ps = new URLSearchParams({ limit: String(LIMIT), offset: String(page * LIMIT) });
      if (q) ps.set('q', q);
      if (plan) ps.set('plan', plan);
      if (status) ps.set('status', status);
      return api.get<UsersResponse>(`/admin/users?${ps.toString()}`);
    },
  });

  const columns = useMemo(
    () => [
      col.display({
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-border cursor-pointer"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-border cursor-pointer"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            onClick={(e) => e.stopPropagation()}
          />
        ),
        size: 40,
      }),
      col.accessor('name', {
        header: 'Name',
        cell: ({ row }) => {
          const u = row.original;
          const initials = (u.name ?? u.email).slice(0, 2).toUpperCase();
          return (
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="h-7 w-7 shrink-0">
                {u.avatar_url && <AvatarImage src={u.avatar_url} />}
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <span className="font-medium text-sm truncate">{u.name ?? '—'}</span>
            </div>
          );
        },
        enableSorting: true,
      }),
      col.accessor('email', {
        header: 'Email',
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">{getValue()}</span>
        ),
        enableSorting: true,
      }),
      col.accessor('plan', {
        header: 'Plan',
        cell: ({ getValue }) => <PlanChip plan={getValue()} />,
        enableSorting: true,
      }),
      col.accessor('tokens_balance', {
        header: 'Tokens',
        cell: ({ getValue }) => (
          <span className="tabular-nums text-sm">{getValue().toLocaleString()}</span>
        ),
        enableSorting: true,
      }),
      col.accessor('country_code', {
        header: 'Country',
        cell: ({ getValue }) => {
          const code = getValue();
          if (!code) return <span className="text-muted-foreground text-sm">—</span>;
          return (
            <span className="flex items-center gap-1.5 text-sm">
              <span>{flagEmoji(code)}</span>
              <span className="text-muted-foreground">{code}</span>
            </span>
          );
        },
        enableSorting: false,
      }),
      col.accessor('last_seen', {
        header: 'Last Seen',
        cell: ({ getValue }) => {
          const v = getValue();
          return (
            <span className="text-sm text-muted-foreground">{v ? relTime(new Date(v)) : '—'}</span>
          );
        },
        enableSorting: true,
      }),
      col.accessor('mrr', {
        header: 'MRR',
        cell: ({ getValue }) => {
          const v = getValue();
          return <span className="tabular-nums text-sm">{v ? formatINR(v) : '—'}</span>;
        },
        enableSorting: false,
      }),
    ],
    [],
  );

  const users = data?.users ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / LIMIT));

  const table = useReactTable({
    data: users,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount,
  });

  const selectedUsers = table.getSelectedRowModel().rows.map((r) => r.original);

  useRegisterCommand(
    {
      id: 'users.new_invite',
      label: 'Invite user',
      group: 'Users',
      action: () => navigate('/users/invites'),
    },
    [navigate],
  );

  useRegisterCommand(
    {
      id: 'users.find',
      label: 'Find user by email',
      group: 'Users',
      shortcut: 'f u',
      action: () => setOpen(true),
    },
    [setOpen],
  );

  const applyView = (view: (typeof SAVED_VIEWS)[0]) => {
    const next: Record<string, string> = {};
    if (view.q) next.q = view.q;
    if (view.plan) next.plan = view.plan;
    if (view.status) next.status = view.status;
    setParams(next);
    setSearchInput(view.q);
  };

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
      <PageHeader
        title="Users"
        subtitle={isLoading ? 'Loading...' : `${total.toLocaleString()} total`}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => navigate('/users/invites')}>
              <UserIcon size={16} className="mr-1" />
              Invite
            </Button>
            <Button variant="outline" size="sm" onClick={() => toast.info('Export started')}>
              <DownloadIcon size={16} className="mr-1" />
              Export CSV
            </Button>
          </>
        }
      />

      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Input
          placeholder="Search email or name..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-64 h-8 text-sm"
        />

        <Select
          value={plan || 'all'}
          onValueChange={(v) => setFilter('plan', v === 'all' ? '' : v)}
        >
          <SelectTrigger className="w-36 h-8 text-sm">
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All plans</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="starter">Starter</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={status || 'all'}
          onValueChange={(v) => setFilter('status', v === 'all' ? '' : v)}
        >
          <SelectTrigger className="w-36 h-8 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
            <SelectItem value="deleted">Deleted</SelectItem>
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-sm gap-1">
              Saved views
              <ChevronDownIcon size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {SAVED_VIEWS.map((v) => (
              <DropdownMenuItem key={v.id} onClick={() => applyView(v)}>
                {v.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Bulk action bar */}
      {selectedUsers.length > 0 && (
        <div className="flex items-center gap-2 mb-3 p-2 bg-muted rounded-md text-sm">
          <span className="text-muted-foreground">{selectedUsers.length} selected</span>
          <div className="flex gap-1 ml-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => toast.info('Navigate to a user to grant tokens')}
            >
              <StarIcon size={12} className="mr-1" />
              Grant tokens
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => toast.info('Bulk message coming soon')}
            >
              <SendIcon size={12} className="mr-1" />
              Message
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs text-red-600 hover:text-red-600"
              onClick={() => toast.info('Bulk ban coming soon')}
            >
              <XIcon size={12} className="mr-1" />
              Ban
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => toast.info('Exporting selected users')}
            >
              <DownloadIcon size={12} className="mr-1" />
              Export
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs ml-auto"
            onClick={() => setRowSelection({})}
          >
            Clear
          </Button>
        </div>
      )}

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
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/users/${row.original.id}`)}
                  data-state={row.getIsSelected() ? 'selected' : undefined}
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
    </div>
  );
}
