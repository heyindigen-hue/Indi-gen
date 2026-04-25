import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowRightIcon, ChevronRightIcon, TrashIcon } from '@/icons';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { cn, relTime } from '@/lib/utils';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRegisterCommand } from '@/store/commands';
import { useNavigate } from 'react-router-dom';

type Session = {
  id: string;
  user_email: string;
  user_id: string;
  user_agent: string;
  ip: string;
  country: string;
  country_code: string;
  last_seen_at: string;
  created_at: string;
};

type SessionsResponse = {
  sessions: Session[];
  total: number;
};

type DeviceFilter = 'all' | 'desktop' | 'mobile';

function detectDevice(ua: string): 'mobile' | 'desktop' {
  if (/Mobile|Android|iPhone/i.test(ua)) return 'mobile';
  return 'desktop';
}

const LIMIT = 50;

const col = createColumnHelper<Session & { selected: boolean }>();

export default function SessionsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [userFilter, setUserFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [deviceFilter, setDeviceFilter] = useState<DeviceFilter>('all');
  const [page, setPage] = useState(0);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const params = new URLSearchParams({
    user: userFilter,
    country: countryFilter,
    page: String(page),
  });

  const { data, isLoading } = useQuery<SessionsResponse>({
    queryKey: ['admin-sessions', userFilter, countryFilter, page],
    queryFn: () =>
      api.get<SessionsResponse>(`/admin/sessions?${params.toString()}`),
  });

  const filteredSessions = useMemo(() => {
    const sessions = data?.sessions ?? [];
    if (deviceFilter === 'all') return sessions;
    return sessions.filter((s) => detectDevice(s.user_agent) === deviceFilter);
  }, [data?.sessions, deviceFilter]);

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / LIMIT));

  const revokeMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/sessions/${id}`),
    onSuccess: () => {
      toast.success('Session revoked');
      qc.invalidateQueries({ queryKey: ['admin-sessions'] });
    },
    onError: () => toast.error('Failed to revoke session'),
  });

  const revokeAllMutation = useMutation({
    mutationFn: (userId: string) =>
      api.delete(`/admin/sessions?user_id=${userId}`),
    onSuccess: () => {
      toast.success('All sessions revoked for user');
      setSelectedRows(new Set());
      qc.invalidateQueries({ queryKey: ['admin-sessions'] });
    },
    onError: () => toast.error('Failed to revoke sessions'),
  });

  const firstSelectedUserId = useMemo(() => {
    if (selectedRows.size === 0) return null;
    const firstId = [...selectedRows][0];
    const session = filteredSessions.find((s) => s.id === firstId);
    return session?.user_id ?? null;
  }, [selectedRows, filteredSessions]);

  const firstSelectedUserEmail = useMemo(() => {
    if (selectedRows.size === 0) return null;
    const firstId = [...selectedRows][0];
    const session = filteredSessions.find((s) => s.id === firstId);
    return session?.user_email ?? null;
  }, [selectedRows, filteredSessions]);

  const columns = [
    col.display({
      id: 'select',
      header: () => null,
      cell: ({ row }) => (
        <input
          type="checkbox"
          className="rounded border-border"
          checked={selectedRows.has(row.original.id)}
          onChange={(e) => {
            setSelectedRows((prev) => {
              const next = new Set(prev);
              if (e.target.checked) {
                next.add(row.original.id);
              } else {
                next.delete(row.original.id);
              }
              return next;
            });
          }}
        />
      ),
    }),
    col.accessor('user_email', {
      header: 'User',
      cell: (info) => (
        <div>
          <p className="text-sm font-medium">{info.getValue()}</p>
          <p className="text-xs text-muted-foreground truncate max-w-[240px]">
            {info.row.original.user_agent.slice(0, 40)}
            {info.row.original.user_agent.length > 40 ? '...' : ''}
          </p>
        </div>
      ),
    }),
    col.accessor('ip', {
      header: 'IP',
      cell: (info) => (
        <span className="text-sm font-mono">{info.getValue()}</span>
      ),
    }),
    col.accessor('country', {
      header: 'Country',
      cell: (info) => (
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{info.getValue()}</span>
          <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
            {info.row.original.country_code}
          </span>
        </div>
      ),
    }),
    col.accessor('last_seen_at', {
      header: 'Last Seen',
      cell: (info) => (
        <span className="text-sm text-muted-foreground">
          {relTime(info.getValue())}
        </span>
      ),
    }),
    col.display({
      id: 'revoke',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => revokeMutation.mutate(row.original.id)}
          disabled={revokeMutation.isPending}
        >
          <TrashIcon size={14} className="mr-1" />
          Revoke
        </Button>
      ),
    }),
  ];

  const table = useReactTable({
    data: filteredSessions as (Session & { selected: boolean })[],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  useRegisterCommand(
    {
      id: 'security.sessions',
      label: 'Active sessions',
      group: 'Security',
      action: () => navigate('/security/sessions'),
    },
    [],
  );

  return (
    <div>
      <PageHeader
        title="Active Sessions"
        subtitle="All active JWT sessions across users"
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <Input
          className="w-56"
          placeholder="Filter by user email..."
          value={userFilter}
          onChange={(e) => {
            setUserFilter(e.target.value);
            setPage(0);
          }}
        />
        <Input
          className="w-40"
          placeholder="Country..."
          value={countryFilter}
          onChange={(e) => {
            setCountryFilter(e.target.value);
            setPage(0);
          }}
        />
        <Select
          value={deviceFilter}
          onValueChange={(v) => setDeviceFilter(v as DeviceFilter)}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All devices</SelectItem>
            <SelectItem value="desktop">Desktop</SelectItem>
            <SelectItem value="mobile">Mobile</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk action bar */}
      {selectedRows.size > 0 && firstSelectedUserId && (
        <div className="flex items-center gap-3 mb-3 px-3 py-2 rounded-md bg-muted border border-border">
          <span className="text-sm text-muted-foreground">
            {selectedRows.size} session(s) selected for{' '}
            <strong>{firstSelectedUserEmail}</strong>
          </span>
          <Button
            size="sm"
            variant="destructive"
            disabled={revokeAllMutation.isPending}
            onClick={() => {
              if (firstSelectedUserId) {
                revokeAllMutation.mutate(firstSelectedUserId);
              }
            }}
          >
            {revokeAllMutation.isPending
              ? 'Revoking...'
              : `Revoke all sessions for this user`}
          </Button>
        </div>
      )}

      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-8"
                >
                  No sessions found
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(
                    selectedRows.has(row.original.id) && 'bg-muted/50',
                  )}
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
      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-muted-foreground">
          Page {page + 1} of {totalPages}
        </span>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            <ArrowRightIcon size={16} className="rotate-180" />
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
            <ChevronRightIcon size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
