import { useState, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import ReactDiffViewer from 'react-diff-viewer-continued';
import { api } from '@/lib/api';
import { cn, relTime } from '@/lib/utils';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useRegisterCommand } from '@/store/commands';
import { useNavigate } from 'react-router-dom';

type AuditEntry = {
  id: string;
  timestamp: string;
  actor_id: string;
  actor_name: string;
  actor_email: string;
  actor_avatar_url: string | null;
  action: string;
  action_category: 'user' | 'billing' | 'settings' | 'security' | 'ai' | 'platform';
  target_type: string;
  target_id: string;
  target_label: string;
  ip: string;
  diff_before: Record<string, unknown> | null;
  diff_after: Record<string, unknown> | null;
};

type AuditResponse = {
  entries: AuditEntry[];
  total: number;
  page: number;
};

const CATEGORY_CLASSES: Record<AuditEntry['action_category'], string> = {
  user: 'text-blue-600 dark:text-blue-400',
  billing: 'text-purple-600 dark:text-purple-400',
  settings: 'text-gray-600 dark:text-gray-400',
  security: 'text-red-600 dark:text-red-400',
  ai: 'text-green-600 dark:text-green-400',
  platform: 'text-orange-600 dark:text-orange-400',
};

const LIMIT = 100;

type TargetTypeFilter =
  | 'all'
  | 'user'
  | 'billing'
  | 'settings'
  | 'security'
  | 'ai'
  | 'platform';

function ActorAvatar({
  url,
  email,
}: {
  url: string | null;
  email: string;
}) {
  if (url) {
    return (
      <img
        src={url}
        alt={email}
        className="h-6 w-6 rounded-full object-cover shrink-0"
      />
    );
  }
  return (
    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0">
      <span className="text-xs font-medium text-muted-foreground uppercase">
        {email[0]}
      </span>
    </div>
  );
}

export default function AuditPage() {
  const navigate = useNavigate();

  const [actorFilter, setActorFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] =
    useState<TargetTypeFilter>('all');
  const [fromFilter, setFromFilter] = useState('');
  const [toFilter, setToFilter] = useState('');
  const [page, setPage] = useState(0);
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);

  const params = new URLSearchParams({
    actor: actorFilter,
    action: actionFilter,
    target_type: targetTypeFilter === 'all' ? '' : targetTypeFilter,
    from: fromFilter,
    to: toFilter,
    page: String(page),
  });

  const { data, isLoading } = useQuery<AuditResponse>({
    queryKey: [
      'admin-audit',
      actorFilter,
      actionFilter,
      targetTypeFilter,
      fromFilter,
      toFilter,
      page,
    ],
    queryFn: () =>
      api.get<AuditResponse>(`/api/admin/audit-log?${params.toString()}`),
  });

  const entries = data?.entries ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / LIMIT));

  function clearFilters() {
    setActorFilter('');
    setActionFilter('');
    setTargetTypeFilter('all');
    setFromFilter('');
    setToFilter('');
    setPage(0);
  }

  const hasFilters =
    actorFilter ||
    actionFilter ||
    targetTypeFilter !== 'all' ||
    fromFilter ||
    toFilter;

  // Virtualized table
  const scrollRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 52,
    overscan: 10,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  const diffOldValue = useMemo(
    () =>
      selectedEntry?.diff_before != null
        ? JSON.stringify(selectedEntry.diff_before, null, 2)
        : '',
    [selectedEntry?.diff_before],
  );

  const diffNewValue = useMemo(
    () =>
      selectedEntry?.diff_after != null
        ? JSON.stringify(selectedEntry.diff_after, null, 2)
        : '',
    [selectedEntry?.diff_after],
  );

  useRegisterCommand(
    {
      id: 'security.audit',
      label: 'View audit log',
      group: 'Security',
      action: () => navigate('/security/audit'),
    },
    [],
  );

  return (
    <div>
      <PageHeader
        title="Audit Log"
        subtitle="Full history of admin actions across the platform"
      />

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Actor</label>
          <Input
            className="w-44"
            placeholder="email or name..."
            value={actorFilter}
            onChange={(e) => {
              setActorFilter(e.target.value);
              setPage(0);
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Action</label>
          <Input
            className="w-44"
            placeholder="action name..."
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(0);
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Category</label>
          <Select
            value={targetTypeFilter}
            onValueChange={(v) => {
              setTargetTypeFilter(v as TargetTypeFilter);
              setPage(0);
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="billing">Billing</SelectItem>
              <SelectItem value="settings">Settings</SelectItem>
              <SelectItem value="security">Security</SelectItem>
              <SelectItem value="ai">AI</SelectItem>
              <SelectItem value="platform">Platform</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">From</label>
          <input
            type="date"
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={fromFilter}
            onChange={(e) => {
              setFromFilter(e.target.value);
              setPage(0);
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">To</label>
          <input
            type="date"
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={toFilter}
            onChange={(e) => {
              setToFilter(e.target.value);
              setPage(0);
            }}
          />
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Table with virtualized rows */}
      <div className="rounded-md border border-border overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[140px_1fr_1fr_1fr_100px] gap-0 bg-muted/40 border-b border-border px-3">
          {['Timestamp', 'Actor', 'Action', 'Target', 'IP'].map((h) => (
            <div
              key={h}
              className="py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide"
            >
              {h}
            </div>
          ))}
        </div>

        {/* Scrollable body */}
        <div
          ref={scrollRef}
          className="h-[60vh] overflow-y-auto"
        >
          {isLoading ? (
            <div className="space-y-0">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[140px_1fr_1fr_1fr_100px] gap-0 px-3 py-3 border-b border-border"
                >
                  {Array.from({ length: 5 }).map((__, j) => (
                    <Skeleton key={j} className="h-4 w-full mr-4" />
                  ))}
                </div>
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              No audit entries found
            </div>
          ) : (
            <div
              style={{ height: `${totalSize}px`, position: 'relative' }}
            >
              {virtualItems.map((vItem) => {
                const entry = entries[vItem.index];
                return (
                  <div
                    key={entry.id}
                    data-index={vItem.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${vItem.start}px)`,
                    }}
                    className={cn(
                      'grid grid-cols-[140px_1fr_1fr_1fr_100px] gap-0 px-3 py-3 border-b border-border cursor-pointer hover:bg-muted/30 transition-colors',
                    )}
                    onClick={() => setSelectedEntry(entry)}
                  >
                    <div className="text-xs text-muted-foreground self-center">
                      {relTime(entry.timestamp)}
                    </div>
                    <div className="flex items-center gap-2 min-w-0 self-center">
                      <ActorAvatar
                        url={entry.actor_avatar_url}
                        email={entry.actor_email}
                      />
                      <span className="text-sm truncate">{entry.actor_email}</span>
                    </div>
                    <div className="self-center">
                      <span
                        className={cn(
                          'text-sm font-medium',
                          CATEGORY_CLASSES[entry.action_category],
                        )}
                      >
                        {entry.action}
                      </span>
                    </div>
                    <div className="self-center min-w-0">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        {entry.target_type}
                      </p>
                      <p className="text-sm truncate">{entry.target_label}</p>
                    </div>
                    <div className="self-center">
                      <span className="text-xs font-mono text-muted-foreground">
                        {entry.ip}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-muted-foreground">
          Page {page + 1} of {totalPages}
          {data?.total != null && (
            <span className="ml-2">({data.total} total)</span>
          )}
        </span>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Detail Sheet */}
      <Sheet
        open={selectedEntry !== null}
        onOpenChange={(open) => !open && setSelectedEntry(null)}
      >
        <SheetContent className="w-[480px] sm:max-w-[480px] overflow-y-auto">
          {selectedEntry && (
            <>
              <SheetHeader>
                <SheetTitle>
                  <span
                    className={cn(
                      'font-semibold',
                      CATEGORY_CLASSES[selectedEntry.action_category],
                    )}
                  >
                    {selectedEntry.action}
                  </span>
                </SheetTitle>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedEntry.timestamp).toLocaleString()}
                </p>
              </SheetHeader>

              <div className="mt-4 space-y-4">
                {/* Actor */}
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">
                    Actor
                  </p>
                  <div className="flex items-center gap-2.5">
                    <ActorAvatar
                      url={selectedEntry.actor_avatar_url}
                      email={selectedEntry.actor_email}
                    />
                    <div>
                      <p className="text-sm font-medium">{selectedEntry.actor_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedEntry.actor_email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Target */}
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">
                    Target
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">
                      {selectedEntry.target_type}:{' '}
                    </span>
                    {selectedEntry.target_label}
                  </p>
                </div>

                {/* IP */}
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">
                    IP Address
                  </p>
                  <code className="text-sm font-mono">{selectedEntry.ip}</code>
                </div>

                {/* Diff */}
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">
                    Changes
                  </p>
                  {selectedEntry.diff_before !== null ||
                  selectedEntry.diff_after !== null ? (
                    <div className="text-xs overflow-x-auto rounded-md border border-border">
                      <ReactDiffViewer
                        oldValue={diffOldValue}
                        newValue={diffNewValue}
                        splitView={false}
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No diff available
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
