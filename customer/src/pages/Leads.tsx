import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { relTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  PlusIcon,
  SearchIcon,
  DownloadIcon,
  TrashIcon,
  EyeIcon,
  ChevronRightIcon,
} from '@/icons';

type Lead = {
  id: string;
  name: string;
  company: string;
  title: string;
  score: number;
  status: string;
  source: string;
  last_enriched: string | null;
};

type LeadsResponse = {
  data: Lead[];
  total: number;
  page: number;
  limit: number;
};

type AddLeadForm = {
  name: string;
  company: string;
  linkedin_url: string;
};

type ScoreFilter = 'all' | 'high' | 'medium' | 'low';
type StatusFilter = 'all' | 'new' | 'contacted' | 'replied' | 'not_interested';

function getScoreVariant(score: number): 'success' | 'warning' | 'destructive' {
  if (score >= 70) return 'success';
  if (score >= 40) return 'warning';
  return 'destructive';
}

function getScoreLabel(score: number): string {
  if (score >= 70) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
}

function buildLeadsUrl(
  page: number,
  search: string,
  scoreFilter: ScoreFilter,
  statusFilter: StatusFilter,
): string {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', '50');
  if (search) params.set('search', search);
  if (scoreFilter === 'high') params.set('score_min', '70');
  else if (scoreFilter === 'medium') params.set('score_min', '40');
  else if (scoreFilter === 'low') params.set('score_min', '0');
  if (statusFilter !== 'all') params.set('status', statusFilter);
  return `/leads?${params.toString()}`;
}

export default function Leads() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [addOpen, setAddOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [addForm, setAddForm] = useState<AddLeadForm>({
    name: '',
    company: '',
    linkedin_url: '',
  });

  const { data, isLoading } = useQuery<LeadsResponse>({
    queryKey: ['leads', page, search, scoreFilter, statusFilter],
    queryFn: () =>
      api.get<LeadsResponse>(buildLeadsUrl(page, search, scoreFilter, statusFilter)),
  });

  const leads = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 50);

  const addMutation = useMutation({
    mutationFn: (body: AddLeadForm) => api.post('/leads', body),
    onSuccess: () => {
      toast.success('Lead added');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setAddOpen(false);
      setAddForm({ name: '', company: '', linkedin_url: '' });
    },
    onError: () => toast.error('Failed to add lead'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => api.delete(`/leads/${id}`)));
    },
    onSuccess: () => {
      toast.success('Leads deleted');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setRowSelection({});
      setDeleteOpen(false);
    },
    onError: () => toast.error('Failed to delete leads'),
  });

  const selectedIds = Object.keys(rowSelection).filter((k) => rowSelection[k]);

  const columns: ColumnDef<Lead>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          className="h-4 w-4 rounded border border-input"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          className="h-4 w-4 rounded border border-input"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    { accessorKey: 'company', header: 'Company' },
    { accessorKey: 'title', header: 'Title' },
    {
      accessorKey: 'score',
      header: 'Score',
      cell: ({ row }) => (
        <Badge variant={getScoreVariant(row.original.score)}>
          {getScoreLabel(row.original.score)} ({row.original.score})
        </Badge>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.original.status.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    { accessorKey: 'source', header: 'Source' },
    {
      accessorKey: 'last_enriched',
      header: 'Last Enriched',
      cell: ({ row }) =>
        row.original.last_enriched ? (
          <span className="text-muted-foreground">
            {relTime(row.original.last_enriched)}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/leads/${row.original.id}`)}
          >
            <EyeIcon size={15} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setRowSelection({ [row.original.id]: true });
              setDeleteOpen(true);
            }}
          >
            <TrashIcon size={15} className="text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: leads,
    columns,
    getRowId: (row) => row.id,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
  });

  function handleExportCsv() {
    const url = `/api/leads/export?format=csv`;
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads.csv';
    a.click();
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="font-['Fraunces'] italic text-2xl font-bold">Leads</h1>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteOpen(true)}
            >
              <TrashIcon size={15} />
              Delete ({selectedIds.length})
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            <DownloadIcon size={15} />
            Export CSV
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <PlusIcon size={15} />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <SearchIcon
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search leads..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-8"
          />
        </div>

        <Select
          value={scoreFilter}
          onValueChange={(v) => {
            setScoreFilter(v as ScoreFilter);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Score" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Scores</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v as StatusFilter);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="replied">Replied</SelectItem>
            <SelectItem value="not_interested">Not Interested</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <LeadsEmptyIcon />
            </div>
            <p className="text-sm font-medium">No leads yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Run a scrape or add one manually to get started.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  data-state={row.getIsSelected() ? 'selected' : undefined}
                  onClick={() => navigate(`/leads/${row.original.id}`)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {page} of {totalPages} ({total} leads)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRightIcon size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* Add Lead dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Lead</DialogTitle>
            <DialogDescription>
              Fill in the lead's details. LinkedIn URL is optional.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="lead-name">Name</Label>
              <Input
                id="lead-name"
                placeholder="Jane Smith"
                value={addForm.name}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-company">Company</Label>
              <Input
                id="lead-company"
                placeholder="Acme Corp"
                value={addForm.company}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, company: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-linkedin">LinkedIn URL</Label>
              <Input
                id="lead-linkedin"
                placeholder="https://linkedin.com/in/janesmith"
                value={addForm.linkedin_url}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, linkedin_url: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!addForm.name || !addForm.company || addMutation.isPending}
              onClick={() => addMutation.mutate(addForm)}
            >
              {addMutation.isPending ? 'Adding...' : 'Add Lead'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk delete confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Leads</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedIds.length} lead
              {selectedIds.length !== 1 ? 's' : ''}? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(selectedIds)}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LeadsEmptyIcon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      className="text-muted-foreground"
    >
      <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 16h12M16 10v12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
