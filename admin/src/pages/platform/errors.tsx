import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { cn, relTime } from '@/lib/utils';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useRegisterCommand } from '@/store/commands';
import { useNavigate } from 'react-router-dom';

type ErrorStatus = 'unresolved' | 'resolved' | 'muted';

type ErrorGroup = {
  id: string;
  fingerprint: string;
  title: string;
  severity: 'error' | 'warning' | 'fatal';
  event_count: number;
  users_affected: number;
  last_seen_at: string;
  first_seen_at: string;
  status: ErrorStatus;
  assignee: string | null;
  sparkline: number[];
};

type ErrorGroupsResponse = {
  groups: ErrorGroup[];
  total: number;
};

type AffectedUsersResponse = {
  users: { email: string; last_seen_at: string }[];
};

const LIMIT = 50;

const SEVERITY_CLASS: Record<ErrorGroup['severity'], string> = {
  fatal: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
  error: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
};

const STATUS_CLASS: Record<ErrorStatus, string> = {
  unresolved: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
  resolved: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  muted: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
};

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const w = 80;
  const h = 24;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`)
    .join(' ');
  return (
    <svg width={w} height={h} className="text-primary opacity-70">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function Badge({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize',
        className,
      )}
    >
      {label}
    </span>
  );
}

function ErrorDetailSheet({
  group,
  onClose,
}: {
  group: ErrorGroup;
  onClose: () => void;
}) {
  const qc = useQueryClient();

  const { data: usersData, isLoading: usersLoading } = useQuery<AffectedUsersResponse>({
    queryKey: ['error-group-users', group.id],
    queryFn: () => api.get<AffectedUsersResponse>(`/admin/errors/groups/${group.id}/users`),
  });

  const resolveMutation = useMutation({
    mutationFn: () => api.post(`/admin/errors/groups/${group.id}/resolve`),
    onSuccess: () => {
      toast.success('Error group resolved');
      qc.invalidateQueries({ queryKey: ['admin-error-groups'] });
      onClose();
    },
    onError: () => toast.error('Failed to resolve error group'),
  });

  const muteMutation = useMutation({
    mutationFn: () => api.post(`/admin/errors/groups/${group.id}/mute`),
    onSuccess: () => {
      toast.success('Error group muted');
      qc.invalidateQueries({ queryKey: ['admin-error-groups'] });
      onClose();
    },
    onError: () => toast.error('Failed to mute error group'),
  });

  const unresolveMutation = useMutation({
    mutationFn: () => api.post(`/admin/errors/groups/${group.id}/unresolve`),
    onSuccess: () => {
      toast.success('Error group unresolved');
      qc.invalidateQueries({ queryKey: ['admin-error-groups'] });
      onClose();
    },
    onError: () => toast.error('Failed to unresolve error group'),
  });

  const isPending =
    resolveMutation.isPending || muteMutation.isPending || unresolveMutation.isPending;

  return (
    <div className="mt-4 space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Badge label={group.severity} className={SEVERITY_CLASS[group.severity]} />
        <div className="min-w-0">
          <p className="font-semibold text-sm leading-tight">{group.title}</p>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">{group.fingerprint}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">First seen</p>
          <p>{relTime(group.first_seen_at)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Last seen</p>
          <p>{relTime(group.last_seen_at)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Event count</p>
          <p>{group.event_count.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Users affected</p>
          <p>{group.users_affected.toLocaleString()}</p>
        </div>
      </div>

      {/* Stack trace */}
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Stack trace</p>
        <pre className="font-mono text-xs bg-muted p-3 rounded overflow-x-auto max-h-60">
          Stack trace not available in mock
        </pre>
      </div>

      {/* Affected users */}
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">
          Affected users
        </p>
        {usersLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : (usersData?.users ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No user data available</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Email</TableHead>
                <TableHead className="text-xs">Last seen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(usersData?.users ?? []).map((u) => (
                <TableRow key={u.email}>
                  <TableCell className="text-xs">{u.email}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {relTime(u.last_seen_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        {group.status !== 'resolved' && (
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => resolveMutation.mutate()}
          >
            Resolve
          </Button>
        )}
        {group.status !== 'muted' && (
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => muteMutation.mutate()}
          >
            Mute
          </Button>
        )}
        {group.status === 'resolved' && (
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => unresolveMutation.mutate()}
          >
            Unresolve
          </Button>
        )}
      </div>
    </div>
  );
}

export default function ErrorsPage() {
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState<ErrorStatus | 'all'>('unresolved');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selectedGroup, setSelectedGroup] = useState<ErrorGroup | null>(null);

  const params = new URLSearchParams({
    status: statusFilter === 'all' ? '' : statusFilter,
    page: String(page),
  });

  const { data, isLoading } = useQuery<ErrorGroupsResponse>({
    queryKey: ['admin-error-groups', statusFilter, page],
    queryFn: () => api.get<ErrorGroupsResponse>(`/admin/errors/groups?${params.toString()}`),
  });

  const groups = data?.groups ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / LIMIT));

  const filteredGroups = search.trim()
    ? groups.filter(
        (g) =>
          g.title.toLowerCase().includes(search.toLowerCase()) ||
          g.fingerprint.toLowerCase().includes(search.toLowerCase()),
      )
    : groups;

  useRegisterCommand(
    {
      id: 'platform.errors',
      label: 'View errors',
      group: 'Platform',
      action: () => navigate('/platform/errors'),
    },
    [],
  );

  useRegisterCommand(
    {
      id: 'platform.errors.unresolved',
      label: 'View unresolved errors',
      group: 'Platform',
      action: () => {
        navigate('/platform/errors');
        setStatusFilter('unresolved');
      },
    },
    [],
  );

  return (
    <div>
      <PageHeader
        title="Errors"
        subtitle="Error groups and event tracking"
      />

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Status</label>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as ErrorStatus | 'all');
              setPage(0);
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unresolved">Unresolved</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="muted">Muted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Search</label>
          <Input
            className="w-64"
            placeholder="Search error title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Severity</TableHead>
              <TableHead>Error</TableHead>
              <TableHead className="w-40">Events</TableHead>
              <TableHead className="w-28">Users</TableHead>
              <TableHead className="w-32">Last seen</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-28">Assignee</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredGroups.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground text-sm"
                >
                  No error groups found
                </TableCell>
              </TableRow>
            ) : (
              filteredGroups.map((group) => (
                <TableRow
                  key={group.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedGroup(group)}
                >
                  <TableCell>
                    <Badge
                      label={group.severity}
                      className={SEVERITY_CLASS[group.severity]}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate max-w-xs">{group.title}</p>
                      <p className="text-xs text-muted-foreground font-mono truncate max-w-xs mt-0.5">
                        {group.fingerprint}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium tabular-nums">
                        {group.event_count.toLocaleString()}
                      </span>
                      <Sparkline data={group.sparkline} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm tabular-nums">
                      {group.users_affected.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {relTime(group.last_seen_at)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      label={group.status}
                      className={STATUS_CLASS[group.status]}
                    />
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {group.assignee ?? '—'}
                    </span>
                  </TableCell>
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
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            disabled={page >= pageCount - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Detail Sheet */}
      <Sheet
        open={selectedGroup !== null}
        onOpenChange={(open) => !open && setSelectedGroup(null)}
      >
        <SheetContent className="w-[480px] sm:max-w-[480px] overflow-y-auto">
          {selectedGroup && (
            <>
              <SheetHeader>
                <SheetTitle>Error Details</SheetTitle>
              </SheetHeader>
              <ErrorDetailSheet
                group={selectedGroup}
                onClose={() => setSelectedGroup(null)}
              />
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
