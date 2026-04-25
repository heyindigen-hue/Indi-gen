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
  ChevronDownIcon,
  ArrowRightIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  DownloadIcon,
  FilterIcon,
  PlusIcon,
  RefreshIcon,
  TrashIcon,
  UserIcon,
} from '@/icons';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { cn, relTime } from '@/lib/utils';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusPill } from '@/components/common/StatusPill';
import { ScoreBadge } from '@/components/common/ScoreBadge';
import type { StatusPillVariant } from '@/components/common/StatusPill';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { useRegisterCommand } from '@/store/commands';
import { useMediaQuery } from '@/hooks/useMediaQuery';

type Lead = {
  id: string;
  name: string | null;
  headline: string | null;
  company: string | null;
  linkedin_url?: string | null;
  icp_type: string | null;
  intent_label: string | null;
  score: number;
  status: 'new' | 'contacted' | 'qualified' | 'won' | 'lost' | 'enriching';
  owner_id: string | null;
  owner_name: string | null;
  created_at: string;
};

type LeadsResponse = {
  leads: Lead[];
  total: number;
  total_new_today: number;
  limit: number;
  offset: number;
};

const LIMIT = 50;

const LEAD_STATUS_VARIANTS: Record<string, StatusPillVariant> = {
  new: 'info',
  contacted: 'warning',
  qualified: 'success',
  won: 'success',
  lost: 'muted',
  enriching: 'warning',
};

const SAVED_VIEWS = [
  { id: 'all', label: 'All leads', params: {} as Record<string, string> },
  { id: 'high-score', label: 'High score (8+)', params: { score_min: '8' } },
  { id: 'buyer', label: 'Buyer project', params: { icp: 'buyer' } },
  { id: 'unenriched', label: 'Unenriched', params: { status: 'enriching' } },
  { id: 'no-outreach', label: 'No outreach yet', params: { status: 'new' } },
  { id: 'wins', label: 'Recent wins', params: { status: 'won' } },
];

const col = createColumnHelper<Lead>();

function IcpChip({ type }: { type: string | null }) {
  if (!type) return <span className="text-muted-foreground text-sm">—</span>;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 capitalize">
      {type}
    </span>
  );
}

function IntentChip({ label }: { label: string | null }) {
  if (!label) return <span className="text-muted-foreground text-sm">—</span>;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300 capitalize">
      {label}
    </span>
  );
}

export default function LeadsPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const isMobile = useMediaQuery('(max-width: 767px)');

  const q = params.get('q') ?? '';
  const icp = params.get('icp') ?? '';
  const status = params.get('status') ?? '';
  const scoreMin = Number(params.get('score_min') ?? '0');
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

  const { data, isLoading } = useQuery<LeadsResponse>({
    queryKey: ['admin-leads', q, icp, status, scoreMin, page],
    queryFn: () => {
      const ps = new URLSearchParams({ limit: String(LIMIT), offset: String(page * LIMIT) });
      if (q) ps.set('q', q);
      if (icp) ps.set('icp', icp);
      if (status) ps.set('status', status);
      if (scoreMin > 0) ps.set('score_min', String(scoreMin));
      return api.get<LeadsResponse>(`/leads?${ps.toString()}`);
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
          const lead = row.original;
          const initials = (lead.name ?? '?').slice(0, 2).toUpperCase();
          return (
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="font-medium text-sm truncate">{lead.name ?? '—'}</div>
                {lead.headline && (
                  <div className="text-xs text-muted-foreground truncate">{lead.headline}</div>
                )}
              </div>
            </div>
          );
        },
        enableSorting: true,
        size: 220,
      }),
      col.accessor('company', {
        header: 'Company',
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">{getValue() ?? '—'}</span>
        ),
        enableSorting: true,
      }),
      col.accessor('icp_type', {
        header: 'ICP',
        cell: ({ getValue }) => <IcpChip type={getValue()} />,
        enableSorting: false,
      }),
      col.accessor('intent_label', {
        header: 'Intent',
        cell: ({ getValue }) => <IntentChip label={getValue()} />,
        enableSorting: false,
      }),
      col.accessor('score', {
        header: 'Score',
        cell: ({ getValue }) => <ScoreBadge score={getValue()} />,
        enableSorting: true,
        size: 70,
      }),
      col.accessor('status', {
        header: 'Status',
        cell: ({ getValue }) => {
          const s = getValue();
          return <StatusPill label={s} variant={LEAD_STATUS_VARIANTS[s] ?? 'default'} />;
        },
        enableSorting: true,
      }),
      col.accessor('owner_name', {
        header: 'Owner',
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">{getValue() ?? '—'}</span>
        ),
        enableSorting: false,
      }),
      col.accessor('created_at', {
        header: 'Created',
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">{relTime(new Date(getValue()))}</span>
        ),
        enableSorting: true,
      }),
      col.display({
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <FilterIcon size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/leads/${row.original.id}`);
                }}
              >
                View
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  toast.info('Re-enriching...');
                }}
              >
                Re-enrich
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        size: 48,
      }),
    ],
    [navigate],
  );

  const leads = data?.leads ?? [];
  const total = data?.total ?? 0;
  const totalNewToday = data?.total_new_today ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / LIMIT));

  const table = useReactTable({
    data: leads,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount,
  });

  const selectedLeads = table.getSelectedRowModel().rows.map((r) => r.original);

  useRegisterCommand(
    {
      id: 'leads.add',
      label: 'Add lead manually',
      group: 'Leads',
      action: () => navigate('/leads/add'),
    },
    [navigate],
  );

  useRegisterCommand(
    {
      id: 'leads.enrichment',
      label: 'View enrichment queue',
      group: 'Leads',
      action: () => navigate('/leads/enrichment'),
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

  const applyView = (view: (typeof SAVED_VIEWS)[0]) => {
    const next: Record<string, string> = {};
    Object.entries(view.params).forEach(([k, v]) => {
      if (v) next[k] = v;
    });
    setParams(next);
    setSearchInput('');
  };

  const setPageParam = (p: number) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(p));
      return next;
    });

  return (
    <div>
      <PageHeader
        title="Leads"
        subtitle={
          isLoading
            ? 'Loading...'
            : `${total.toLocaleString()} total / ${totalNewToday} new today`
        }
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => navigate('/leads/add')}>
              <PlusIcon size={16} className="mr-1" />
              Add manual
            </Button>
            <Button variant="outline" size="sm" onClick={() => toast.info('Export started')}>
              <DownloadIcon size={16} className="mr-1" />
              Export
            </Button>
          </>
        }
      />

      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Input
          placeholder="Search name or company..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="flex-1 min-w-[160px] sm:flex-none sm:w-56 h-9 text-sm"
        />
        <Select value={icp || 'all'} onValueChange={(v) => setFilter('icp', v === 'all' ? '' : v)}>
          <SelectTrigger className="w-32 sm:w-36 h-9 text-sm">
            <SelectValue placeholder="ICP type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ICP</SelectItem>
            <SelectItem value="buyer">Buyer</SelectItem>
            <SelectItem value="champion">Champion</SelectItem>
            <SelectItem value="influencer">Influencer</SelectItem>
            <SelectItem value="blocker">Blocker</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={status || 'all'}
          onValueChange={(v) => setFilter('status', v === 'all' ? '' : v)}
        >
          <SelectTrigger className="w-32 sm:w-36 h-9 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="won">Won</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={scoreMin > 0 ? String(scoreMin) : 'all'}
          onValueChange={(v) => setFilter('score_min', v === 'all' ? '' : v)}
        >
          <SelectTrigger className="w-28 sm:w-32 h-9 text-sm">
            <SelectValue placeholder="Min score" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any score</SelectItem>
            <SelectItem value="3">3+</SelectItem>
            <SelectItem value="5">5+</SelectItem>
            <SelectItem value="7">7+</SelectItem>
            <SelectItem value="8">8+</SelectItem>
            <SelectItem value="9">9+</SelectItem>
          </SelectContent>
        </Select>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 text-sm gap-1">
              Views
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
        <Button
          variant="outline"
          size="sm"
          className="h-9 text-sm ml-auto hidden sm:inline-flex"
          onClick={() => navigate('/leads/enrichment')}
        >
          Enrichment queue
        </Button>
      </div>

      {/* Bulk actions */}
      {selectedLeads.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-3 p-2 bg-muted rounded-md text-sm">
          <span className="text-muted-foreground">{selectedLeads.length} selected</span>
          <div className="flex gap-1 ml-0 sm:ml-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => toast.info('Changing status...')}
            >
              Change status
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => toast.info('Reassigning...')}
            >
              <UserIcon size={12} className="mr-1" />
              Reassign
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => toast.info('Re-enriching...')}
            >
              <RefreshIcon size={12} className="mr-1" />
              Re-enrich
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs text-red-600 hover:text-red-600"
              onClick={() => toast.info('Delete coming soon')}
            >
              <TrashIcon size={12} className="mr-1" />
              Delete
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

      {/* Mobile card list */}
      {isMobile ? (
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-md border border-border bg-card p-4">
                <Skeleton className="h-5 w-2/3 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))
          ) : leads.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No leads found
            </div>
          ) : (
            leads.map((lead) => {
              const initials = (lead.name ?? '?').slice(0, 2).toUpperCase();
              return (
                <button
                  key={lead.id}
                  type="button"
                  onClick={() => navigate(`/leads/${lead.id}`)}
                  className="w-full text-left rounded-md border border-border bg-card p-4 active:bg-accent hover:bg-accent/50 transition-colors min-h-[88px]"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm truncate">{lead.name ?? '—'}</div>
                          {lead.headline && (
                            <div className="text-xs text-muted-foreground truncate mt-0.5">
                              {lead.headline}
                            </div>
                          )}
                          {lead.company && (
                            <div className="text-xs text-muted-foreground truncate mt-0.5">
                              {lead.company}
                            </div>
                          )}
                        </div>
                        <ScoreBadge score={lead.score} />
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <StatusPill
                          label={lead.status}
                          variant={LEAD_STATUS_VARIANTS[lead.status] ?? 'default'}
                        />
                        {lead.icp_type && <IcpChip type={lead.icp_type} />}
                        {lead.intent_label && <IntentChip label={lead.intent_label} />}
                        <span className="text-[11px] text-muted-foreground ml-auto">
                          {relTime(new Date(lead.created_at))}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      ) : (
      <div className="rounded-md border overflow-x-auto">
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
                  No leads found
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/leads/${row.original.id}`)}
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
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
        <span className="text-xs sm:text-sm">
          Page {page + 1} of {pageCount} — {total.toLocaleString()} total
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            disabled={page === 0}
            onClick={() => setPageParam(page - 1)}
          >
            <ArrowRightIcon size={16} className="rotate-180" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9"
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
