import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { PlusIcon, LinkIcon, CheckIcon, TrashIcon } from '@/icons';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { relTime } from '@/lib/utils';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRegisterCommand } from '@/store/commands';
import { useNavigate } from 'react-router-dom';

type ApiKey = {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
  revoked: boolean;
};

type ApiKeysResponse = {
  keys: ApiKey[];
};

type CreateKeyResponse = ApiKey & { full_key: string };

const ALL_SCOPES = [
  'read:users',
  'write:users',
  'read:leads',
  'write:leads',
  'admin:billing',
  'admin:settings',
] as const;

const EXPIRY_OPTIONS = [
  { label: '30 days', value: '30d' },
  { label: '90 days', value: '90d' },
  { label: '1 year', value: '365d' },
  { label: 'Never', value: 'never' },
];

type DialogState =
  | { kind: 'none' }
  | { kind: 'create' }
  | { kind: 'reveal'; fullKey: string };

const col = createColumnHelper<ApiKey>();

export default function ApiKeysPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [dialog, setDialog] = useState<DialogState>({ kind: 'none' });
  const [copied, setCopied] = useState(false);

  // Create form state
  const [newName, setNewName] = useState('');
  const [newScopes, setNewScopes] = useState<string[]>([]);
  const [newExpiry, setNewExpiry] = useState('90d');

  const { data, isLoading } = useQuery<ApiKeysResponse>({
    queryKey: ['admin-api-keys'],
    queryFn: () => api.get<ApiKeysResponse>('/api/admin/api-keys'),
  });

  const createMutation = useMutation({
    mutationFn: (body: { name: string; scopes: string[]; expiry: string }) =>
      api.post<CreateKeyResponse>('/api/admin/api-keys', body),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['admin-api-keys'] });
      setNewName('');
      setNewScopes([]);
      setNewExpiry('90d');
      setDialog({ kind: 'reveal', fullKey: res.full_key });
    },
    onError: () => toast.error('Failed to create API key'),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/api-keys/${id}`),
    onSuccess: () => {
      toast.success('API key revoked');
      qc.invalidateQueries({ queryKey: ['admin-api-keys'] });
    },
    onError: () => toast.error('Failed to revoke API key'),
  });

  function handleCopy(key: string) {
    navigator.clipboard.writeText(key).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function toggleScope(scope: string) {
    setNewScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope],
    );
  }

  const columns = [
    col.accessor('name', {
      header: 'Name',
      cell: (info) => (
        <span className="text-sm font-medium">{info.getValue()}</span>
      ),
    }),
    col.accessor('key_prefix', {
      header: 'Key',
      cell: (info) => (
        <code className="text-xs font-mono bg-muted rounded px-1.5 py-0.5">
          {info.getValue()}***
        </code>
      ),
    }),
    col.accessor('scopes', {
      header: 'Scopes',
      cell: (info) => (
        <div className="flex flex-wrap gap-1">
          {info.getValue().map((scope) => (
            <span
              key={scope}
              className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground"
            >
              {scope}
            </span>
          ))}
        </div>
      ),
    }),
    col.accessor('last_used_at', {
      header: 'Last Used',
      cell: (info) => {
        const v = info.getValue();
        return (
          <span className="text-sm text-muted-foreground">
            {v ? relTime(v) : 'Never'}
          </span>
        );
      },
    }),
    col.accessor('expires_at', {
      header: 'Expires',
      cell: (info) => {
        const v = info.getValue();
        if (!v) return <span className="text-sm text-muted-foreground">Never</span>;
        return (
          <span className="text-sm text-muted-foreground">
            {new Date(v).toLocaleDateString()}
          </span>
        );
      },
    }),
    col.accessor('revoked', {
      header: 'Status',
      cell: (info) =>
        info.getValue() ? (
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
            Revoked
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            Active
          </span>
        ),
    }),
    col.display({
      id: 'actions',
      header: '',
      cell: ({ row }) =>
        !row.original.revoked ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-destructive hover:text-destructive hover:bg-destructive/10"
            disabled={revokeMutation.isPending}
            onClick={() => revokeMutation.mutate(row.original.id)}
          >
            <TrashIcon size={14} className="mr-1" />
            Revoke
          </Button>
        ) : null,
    }),
  ];

  const table = useReactTable({
    data: data?.keys ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  useRegisterCommand(
    {
      id: 'security.api_keys',
      label: 'API keys',
      group: 'Security',
      action: () => navigate('/security/api-keys'),
    },
    [],
  );

  return (
    <div>
      <PageHeader
        title="API Keys"
        subtitle="Manage programmatic access keys"
        actions={
          <Button size="sm" onClick={() => setDialog({ kind: 'create' })}>
            <PlusIcon size={16} className="mr-1.5" />
            Create API Key
          </Button>
        }
      />

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
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground py-8"
                >
                  No API keys found
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

      {/* Create Dialog */}
      <Dialog
        open={dialog.kind === 'create'}
        onOpenChange={(open) => !open && setDialog({ kind: 'none' })}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                placeholder="e.g. CI/CD pipeline key"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Scopes</Label>
              <div className="grid grid-cols-2 gap-1.5">
                {ALL_SCOPES.map((scope) => (
                  <label
                    key={scope}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="rounded border-border"
                      checked={newScopes.includes(scope)}
                      onChange={() => toggleScope(scope)}
                    />
                    <code className="text-xs">{scope}</code>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Expiry</Label>
              <Select value={newExpiry} onValueChange={setNewExpiry}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPIRY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog({ kind: 'none' })}>
              Cancel
            </Button>
            <Button
              disabled={!newName || newScopes.length === 0 || createMutation.isPending}
              onClick={() =>
                createMutation.mutate({
                  name: newName,
                  scopes: newScopes,
                  expiry: newExpiry,
                })
              }
            >
              {createMutation.isPending ? 'Creating...' : 'Create key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reveal Key Dialog */}
      <Dialog
        open={dialog.kind === 'reveal'}
        onOpenChange={(open) => !open && setDialog({ kind: 'none' })}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>API Key Created</DialogTitle>
          </DialogHeader>
          {dialog.kind === 'reveal' && (
            <div className="space-y-3 py-2">
              <div className="rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-3 py-2">
                <p className="text-xs font-medium text-red-700 dark:text-red-300">
                  Save this key — you won't see it again.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono bg-muted rounded px-2 py-2 break-all">
                  {dialog.fullKey}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => {
                    if (dialog.kind === 'reveal') handleCopy(dialog.fullKey);
                  }}
                >
                  {copied ? (
                    <CheckIcon size={16} className="text-green-600" />
                  ) : (
                    <LinkIcon size={16} />
                  )}
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDialog({ kind: 'none' })}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
