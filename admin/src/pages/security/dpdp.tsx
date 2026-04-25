import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { AlertCircleIcon, ChevronRightIcon, LinkIcon, DownloadIcon, PlusIcon } from '@/icons';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { cn, relTime } from '@/lib/utils';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

// ─── Types ────────────────────────────────────────────────────────────────────

type ConsentStats = {
  active_consents: number;
  withdrawals_this_month: number;
};

type ConsentRecord = {
  purpose: string;
  granted_at: string;
  withdrawn_at: string | null;
  version: number;
};

type ConsentTimelineResponse = {
  consents: ConsentRecord[];
};

type ErasureRequest = {
  id: string;
  user_email: string;
  status:
    | 'pending'
    | 'verifying'
    | 'previewing'
    | 'approved'
    | 'processing'
    | 'completed'
    | 'rejected';
  reason: string;
  channel: string;
  created_at: string;
  completed_at: string | null;
};

type ScopePreviewTable = { name: string; row_count: number };

type Breach = {
  id: string;
  discovered_at: string;
  occurred_at: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  data_categories: string[];
  affected_users_count: number;
  description: string;
  mitigation: string;
  status: 'open' | 'contained' | 'closed';
  notifications_sent: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ERASURE_STATUS_CLASSES: Record<ErasureRequest['status'], string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  verifying: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  previewing: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const SEVERITY_CLASSES: Record<Breach['severity'], string> = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const BREACH_STATUS_CLASSES: Record<Breach['status'], string> = {
  open: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  contained: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  closed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
};

const DATA_CATEGORIES = [
  'email',
  'name',
  'phone',
  'address',
  'financial',
  'health',
  'government_id',
] as const;

function suggestSeverity(
  userCount: number,
  categories: string[],
): Breach['severity'] {
  const hasSensitive =
    categories.includes('financial') || categories.includes('health');
  if (hasSensitive || userCount >= 10000) return 'critical';
  if (userCount >= 1000) return 'high';
  if (userCount >= 100) return 'medium';
  return 'low';
}

function compute72hCountdown(discoveredAt: string) {
  const deadline = new Date(discoveredAt).getTime() + 72 * 60 * 60 * 1000;
  const remaining = deadline - Date.now();
  if (remaining <= 0) return { label: 'Expired', colorClass: 'text-red-600' };
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const label = `${hours}h ${minutes}m`;
  if (hours > 48) return { label, colorClass: 'text-green-600' };
  if (hours > 24) return { label, colorClass: 'text-amber-600' };
  return { label, colorClass: 'text-red-600' };
}

function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        className,
      )}
    >
      {children}
    </span>
  );
}

// ─── Consent Tab ──────────────────────────────────────────────────────────────

function ConsentTab() {
  const [userSearch, setUserSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: stats, isLoading: statsLoading } = useQuery<ConsentStats>({
    queryKey: ['dpdp-consent-stats'],
    queryFn: () => api.get<ConsentStats>('/admin/dpdp/consent-stats'),
  });

  const { data: timeline, isLoading: timelineLoading } =
    useQuery<ConsentTimelineResponse>({
      queryKey: ['dpdp-consent-timeline', searchQuery],
      queryFn: () =>
        api.get<ConsentTimelineResponse>(
          `/admin/dpdp/consent-timeline?user=${encodeURIComponent(searchQuery)}`,
        ),
      enabled: searchQuery.length > 0,
    });

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            Active Consents
          </p>
          {statsLoading ? (
            <Skeleton className="h-8 w-24 mt-1" />
          ) : (
            <p className="text-2xl font-semibold mt-1">
              {stats?.active_consents?.toLocaleString() ?? '—'}
            </p>
          )}
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            Withdrawals This Month
          </p>
          {statsLoading ? (
            <Skeleton className="h-8 w-24 mt-1" />
          ) : (
            <p className="text-2xl font-semibold mt-1">
              {stats?.withdrawals_this_month?.toLocaleString() ?? '—'}
            </p>
          )}
        </div>
      </div>

      {/* User Search */}
      <div>
        <p className="text-sm font-medium mb-2">Consent Timeline Lookup</p>
        <div className="flex gap-2">
          <Input
            className="max-w-xs"
            placeholder="Search by user email or ID..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
          />
          <Button
            variant="outline"
            onClick={() => setSearchQuery(userSearch)}
            disabled={!userSearch}
          >
            Search
          </Button>
        </div>
      </div>

      {/* Timeline Table */}
      {searchQuery && (
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Purpose</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Granted At</TableHead>
                <TableHead>Withdrawn At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timelineLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 4 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (timeline?.consents ?? []).length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground py-6"
                  >
                    No consent records found
                  </TableCell>
                </TableRow>
              ) : (
                (timeline?.consents ?? []).map((record, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-sm">{record.purpose}</TableCell>
                    <TableCell className="text-sm">v{record.version}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {relTime(record.granted_at)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {record.withdrawn_at ? (
                        relTime(record.withdrawn_at)
                      ) : (
                        <span className="text-green-600">Active</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ─── Erasure Tab ──────────────────────────────────────────────────────────────

type ErasureStep = 1 | 2 | 3 | 4 | 5 | 6;

type WizardState = {
  open: boolean;
  step: ErasureStep;
  requestId: string | null;
  scopeTables: ScopePreviewTable[];
};

const INITIAL_WIZARD: WizardState = {
  open: false,
  step: 1,
  requestId: null,
  scopeTables: [],
};

const erasureCol = createColumnHelper<ErasureRequest>();

function ErasureTab() {
  const qc = useQueryClient();
  const [wizard, setWizard] = useState<WizardState>(INITIAL_WIZARD);

  // Step 1 form
  const [intakeEmail, setIntakeEmail] = useState('');
  const [intakeReason, setIntakeReason] = useState('');
  const [intakeChannel, setIntakeChannel] = useState('app');

  const { data, isLoading } = useQuery<{ requests: ErasureRequest[] }>({
    queryKey: ['admin-erasure-requests'],
    queryFn: () =>
      api.get<{ requests: ErasureRequest[] }>('/admin/erasure-requests'),
  });

  const { data: requestDetail } = useQuery<ErasureRequest>({
    queryKey: ['admin-erasure-request', wizard.requestId],
    queryFn: () =>
      api.get<ErasureRequest>(
        `/admin/erasure-requests/${wizard.requestId}`,
      ),
    enabled: wizard.step === 4 && wizard.requestId !== null,
    refetchInterval: wizard.step === 4 ? 5000 : false,
  });

  // Auto-advance from step 4 when approved
  useEffect(() => {
    if (wizard.step === 4 && requestDetail?.status === 'approved') {
      setWizard((w) => ({ ...w, step: 5 }));
    }
  }, [requestDetail?.status, wizard.step]);

  const intakeMutation = useMutation({
    mutationFn: (body: {
      user_email: string;
      reason: string;
      channel: string;
    }) =>
      api.post<{ id: string }>('/admin/erasure-requests', body),
    onSuccess: (res) => {
      setWizard((w) => ({ ...w, step: 2, requestId: res.id }));
    },
    onError: () => toast.error('Failed to submit erasure request'),
  });

  const verifyMutation = useMutation({
    mutationFn: (id: string) =>
      api.post(`/admin/erasure-requests/${id}/verify`, {}),
    onSuccess: () => setWizard((w) => ({ ...w, step: 3 })),
    onError: () => toast.error('Verification failed'),
  });

  const previewMutation = useMutation({
    mutationFn: (id: string) =>
      api.post<{ tables: ScopePreviewTable[] }>(
        `/admin/erasure-requests/${id}/preview`,
        {},
      ),
    onSuccess: (res) => {
      setWizard((w) => ({ ...w, scopeTables: res.tables, step: 4 }));
    },
    onError: () => toast.error('Failed to load scope preview'),
  });

  const queueMutation = useMutation({
    mutationFn: (id: string) =>
      api.post(`/admin/erasure-requests/${id}/queue`, {}),
    onSuccess: () => {
      setTimeout(() => {
        setWizard((w) => ({ ...w, step: 6 }));
        qc.invalidateQueries({ queryKey: ['admin-erasure-requests'] });
      }, 2000);
    },
    onError: () => toast.error('Failed to queue deletion'),
  });

  const columns = [
    erasureCol.accessor('user_email', {
      header: 'User',
      cell: (info) => (
        <span className="text-sm">{info.getValue()}</span>
      ),
    }),
    erasureCol.accessor('status', {
      header: 'Status',
      cell: (info) => (
        <Badge className={ERASURE_STATUS_CLASSES[info.getValue()]}>
          {info.getValue()}
        </Badge>
      ),
    }),
    erasureCol.accessor('reason', {
      header: 'Reason',
      cell: (info) => (
        <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
          {info.getValue()}
        </span>
      ),
    }),
    erasureCol.accessor('channel', {
      header: 'Channel',
      cell: (info) => (
        <span className="text-sm capitalize">{info.getValue()}</span>
      ),
    }),
    erasureCol.accessor('created_at', {
      header: 'Submitted',
      cell: (info) => (
        <span className="text-sm text-muted-foreground">
          {relTime(info.getValue())}
        </span>
      ),
    }),
  ];

  const table = useReactTable({
    data: data?.requests ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  function closeWizard() {
    setWizard(INITIAL_WIZARD);
    setIntakeEmail('');
    setIntakeReason('');
    setIntakeChannel('app');
  }

  function copyApprovalLink() {
    if (!wizard.requestId) return;
    const link = `${window.location.origin}/security/dpdp?approve=${wizard.requestId}`;
    navigator.clipboard.writeText(link).then(() =>
      toast.success('Link copied'),
    );
  }

  const approvalLink = wizard.requestId
    ? `${window.location.origin}/security/dpdp?approve=${wizard.requestId}`
    : '';

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => setWizard({ ...INITIAL_WIZARD, open: true })}
        >
          <PlusIcon size={16} className="mr-1.5" />
          New Erasure Request
        </Button>
      </div>

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
                  {Array.from({ length: 5 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-8"
                >
                  No erasure requests
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

      {/* Wizard Dialog */}
      <Dialog open={wizard.open} onOpenChange={(open) => !open && closeWizard()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {wizard.step === 1 && 'Step 1 — Intake'}
              {wizard.step === 2 && 'Step 2 — Verify Identity'}
              {wizard.step === 3 && 'Step 3 — Scope Preview'}
              {wizard.step === 4 && 'Step 4 — 2-Admin Approval'}
              {wizard.step === 5 && 'Step 5 — Queuing Deletion'}
              {wizard.step === 6 && 'Step 6 — Complete'}
            </DialogTitle>
          </DialogHeader>

          {/* Step indicators */}
          <div className="flex items-center gap-1 mb-2">
            {([1, 2, 3, 4, 5, 6] as ErasureStep[]).map((s) => (
              <div
                key={s}
                className={cn(
                  'h-1.5 flex-1 rounded-full transition-colors',
                  s <= wizard.step
                    ? 'bg-primary'
                    : 'bg-muted',
                )}
              />
            ))}
          </div>

          {/* Step 1 — Intake */}
          {wizard.step === 1 && (
            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label>User Email</Label>
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={intakeEmail}
                  onChange={(e) => setIntakeEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Reason</Label>
                <textarea
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px] resize-none"
                  placeholder="Describe the reason for erasure..."
                  value={intakeReason}
                  onChange={(e) => setIntakeReason(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Channel</Label>
                <Select value={intakeChannel} onValueChange={setIntakeChannel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="app">App</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="legal">Legal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 2 — Verify */}
          {wizard.step === 2 && (
            <div className="py-4 space-y-4">
              <div className="rounded-md bg-muted px-4 py-3 text-sm text-muted-foreground">
                OTP sent to user's email and phone. Waiting for
                verification...
              </div>
              <Button
                className="w-full"
                variant="outline"
                disabled={verifyMutation.isPending || !wizard.requestId}
                onClick={() => {
                  if (wizard.requestId) verifyMutation.mutate(wizard.requestId);
                }}
              >
                {verifyMutation.isPending ? 'Verifying...' : 'Pretend verified'}
              </Button>
            </div>
          )}

          {/* Step 3 — Scope Preview */}
          {wizard.step === 3 && (
            <div className="py-2 space-y-3">
              {wizard.scopeTables.length === 0 ? (
                <div className="text-center py-4">
                  <Button
                    disabled={previewMutation.isPending || !wizard.requestId}
                    onClick={() => {
                      if (wizard.requestId)
                        previewMutation.mutate(wizard.requestId);
                    }}
                  >
                    {previewMutation.isPending
                      ? 'Loading...'
                      : 'Load scope preview'}
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    The following data will be erased:
                  </p>
                  <div className="rounded-md border border-border divide-y divide-border">
                    {wizard.scopeTables.map((t) => (
                      <div
                        key={t.name}
                        className="flex items-center justify-between px-3 py-2"
                      >
                        <code className="text-xs font-mono">{t.name}</code>
                        <span className="text-sm text-muted-foreground">
                          {t.row_count.toLocaleString()} rows
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 4 — 2-Admin Approval */}
          {wizard.step === 4 && (
            <div className="py-2 space-y-3">
              <div className="rounded-md bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 px-3 py-2">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Awaiting second admin approval. You've approved.
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Share this link with another admin to approve the erasure:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono bg-muted rounded px-2 py-1.5 break-all">
                  {approvalLink}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={copyApprovalLink}
                >
                  <LinkIcon size={14} />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Polling for approval every 5 seconds...
              </p>
            </div>
          )}

          {/* Step 5 — Queue Deletion */}
          {wizard.step === 5 && (
            <div className="py-4 space-y-4">
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div className="h-full bg-primary rounded-full animate-pulse w-full" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Deletion queued. This may take a few minutes.
              </p>
              {!queueMutation.isSuccess && !queueMutation.isPending && (
                <Button
                  className="w-full"
                  disabled={!wizard.requestId}
                  onClick={() => {
                    if (wizard.requestId)
                      queueMutation.mutate(wizard.requestId);
                  }}
                >
                  Confirm & Queue
                </Button>
              )}
            </div>
          )}

          {/* Step 6 — Receipt */}
          {wizard.step === 6 && (
            <div className="py-4 space-y-4 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900 mx-auto">
                <span className="text-green-600 dark:text-green-300 text-xl">
                  ✓
                </span>
              </div>
              <p className="font-medium">Erasure completed</p>
              <p className="text-sm text-muted-foreground">
                All user data has been queued for deletion.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  if (wizard.requestId) {
                    window.open(
                      `/admin/erasure-requests/${wizard.requestId}/receipt`,
                      '_blank',
                    );
                  }
                }}
              >
                <DownloadIcon size={16} className="mr-1.5" />
                Download PDF receipt
              </Button>
            </div>
          )}

          <DialogFooter>
            {wizard.step === 1 && (
              <>
                <Button variant="outline" onClick={closeWizard}>
                  Cancel
                </Button>
                <Button
                  disabled={
                    !intakeEmail ||
                    !intakeReason ||
                    intakeMutation.isPending
                  }
                  onClick={() =>
                    intakeMutation.mutate({
                      user_email: intakeEmail,
                      reason: intakeReason,
                      channel: intakeChannel,
                    })
                  }
                >
                  {intakeMutation.isPending ? 'Submitting...' : 'Submit'}
                  <ChevronRightIcon size={16} className="ml-1" />
                </Button>
              </>
            )}
            {wizard.step === 3 && wizard.scopeTables.length > 0 && (
              <>
                <Button variant="outline" onClick={closeWizard}>
                  Cancel
                </Button>
                <Button
                  onClick={() => setWizard((w) => ({ ...w, step: 4 }))}
                >
                  Confirm scope
                  <ChevronRightIcon size={16} className="ml-1" />
                </Button>
              </>
            )}
            {wizard.step === 6 && (
              <Button onClick={closeWizard}>Close</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Breach Tab ───────────────────────────────────────────────────────────────

const breachCol = createColumnHelper<Breach>();

function BreachTab() {
  const qc = useQueryClient();
  const [newIncidentOpen, setNewIncidentOpen] = useState(false);

  // New incident form
  const [discoveredAt, setDiscoveredAt] = useState('');
  const [occurredAt, setOccurredAt] = useState('');
  const [severity, setSeverity] = useState<Breach['severity']>('low');
  const [dataCategories, setDataCategories] = useState<string[]>([]);
  const [affectedCount, setAffectedCount] = useState('');
  const [description, setDescription] = useState('');
  const [mitigation, setMitigation] = useState('');

  function fillNow() {
    const now = new Date();
    // Format for datetime-local: YYYY-MM-DDTHH:mm
    const formatted = now.toISOString().slice(0, 16);
    setDiscoveredAt(formatted);
  }

  function toggleCategory(cat: string) {
    setDataCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  }

  // Auto-suggest severity when count or categories change
  useEffect(() => {
    const count = parseInt(affectedCount, 10);
    if (!isNaN(count)) {
      setSeverity(suggestSeverity(count, dataCategories));
    }
  }, [affectedCount, dataCategories]);

  const { data, isLoading } = useQuery<{ breaches: Breach[] }>({
    queryKey: ['admin-breaches'],
    queryFn: () => api.get<{ breaches: Breach[] }>('/admin/breaches'),
  });

  const calculateMutation = useMutation({
    mutationFn: () =>
      api.post<{ count: number }>('/admin/breaches/calculate-affected', {}),
    onSuccess: (res) => setAffectedCount(String(res.count)),
    onError: () => toast.error('Calculation failed'),
  });

  const createMutation = useMutation({
    mutationFn: (body: Omit<Breach, 'id' | 'notifications_sent'>) =>
      api.post('/admin/breaches', body),
    onSuccess: () => {
      toast.success('Incident recorded');
      qc.invalidateQueries({ queryKey: ['admin-breaches'] });
      setNewIncidentOpen(false);
      setDiscoveredAt('');
      setOccurredAt('');
      setSeverity('low');
      setDataCategories([]);
      setAffectedCount('');
      setDescription('');
      setMitigation('');
    },
    onError: () => toast.error('Failed to record incident'),
  });

  const columns = [
    breachCol.accessor('discovered_at', {
      header: 'Discovered',
      cell: (info) => (
        <span className="text-sm text-muted-foreground">
          {relTime(info.getValue())}
        </span>
      ),
    }),
    breachCol.accessor('severity', {
      header: 'Severity',
      cell: (info) => (
        <Badge className={SEVERITY_CLASSES[info.getValue()]}>
          {info.getValue()}
        </Badge>
      ),
    }),
    breachCol.accessor('data_categories', {
      header: 'Data Categories',
      cell: (info) => (
        <div className="flex flex-wrap gap-1">
          {info.getValue().map((cat) => (
            <span
              key={cat}
              className="inline-flex items-center rounded px-1.5 py-0.5 text-xs bg-secondary text-secondary-foreground"
            >
              {cat}
            </span>
          ))}
        </div>
      ),
    }),
    breachCol.accessor('affected_users_count', {
      header: 'Affected',
      cell: (info) => (
        <span className="text-sm">{info.getValue().toLocaleString()}</span>
      ),
    }),
    breachCol.accessor('status', {
      header: 'Status',
      cell: (info) => (
        <Badge className={BREACH_STATUS_CLASSES[info.getValue()]}>
          {info.getValue()}
        </Badge>
      ),
    }),
    breachCol.accessor('discovered_at', {
      id: 'countdown',
      header: '72h Deadline',
      cell: (info) => {
        const { label, colorClass } = compute72hCountdown(info.getValue());
        return (
          <span className={cn('text-sm font-medium', colorClass)}>{label}</span>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: data?.breaches ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setNewIncidentOpen(true)}>
          <AlertCircleIcon size={16} className="mr-1.5" />
          New Incident
        </Button>
      </div>

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
              Array.from({ length: 3 }).map((_, i) => (
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
                  No breach incidents recorded
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

      {/* New Incident Dialog */}
      <Dialog
        open={newIncidentOpen}
        onOpenChange={(open) => !open && setNewIncidentOpen(false)}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Report Breach Incident</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Discovered At</Label>
                <div className="flex gap-1.5">
                  <input
                    type="datetime-local"
                    className="flex-1 h-9 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={discoveredAt}
                    onChange={(e) => setDiscoveredAt(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="px-2"
                    onClick={fillNow}
                  >
                    Now
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Occurred At</Label>
                <input
                  type="datetime-local"
                  className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={occurredAt}
                  onChange={(e) => setOccurredAt(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Data Categories</Label>
              <div className="grid grid-cols-2 gap-1.5">
                {DATA_CATEGORIES.map((cat) => (
                  <label
                    key={cat}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="rounded border-border"
                      checked={dataCategories.includes(cat)}
                      onChange={() => toggleCategory(cat)}
                    />
                    {cat}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Affected Users</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="0"
                  className="flex-1"
                  placeholder="0"
                  value={affectedCount}
                  onChange={(e) => setAffectedCount(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={calculateMutation.isPending}
                  onClick={() => calculateMutation.mutate()}
                >
                  {calculateMutation.isPending ? 'Calculating...' : 'Calculate'}
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Severity (auto-suggested)</Label>
              <Select
                value={severity}
                onValueChange={(v) => setSeverity(v as Breach['severity'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px] resize-none"
                placeholder="Describe what happened (markdown supported)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Mitigation</Label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px] resize-none"
                placeholder="What steps were taken to contain the breach..."
                value={mitigation}
                onChange={(e) => setMitigation(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNewIncidentOpen(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={
                !discoveredAt ||
                !occurredAt ||
                !affectedCount ||
                !description ||
                createMutation.isPending
              }
              onClick={() =>
                createMutation.mutate({
                  discovered_at: new Date(discoveredAt).toISOString(),
                  occurred_at: new Date(occurredAt).toISOString(),
                  severity,
                  data_categories: dataCategories,
                  affected_users_count: parseInt(affectedCount, 10),
                  description,
                  mitigation,
                  status: 'open',
                })
              }
            >
              {createMutation.isPending ? 'Recording...' : 'Record incident'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DpdpPage() {
  const navigate = useNavigate();

  useRegisterCommand(
    {
      id: 'security.dpdp.new_erasure',
      label: 'New erasure request',
      group: 'Security',
      action: () => navigate('/security/dpdp'),
    },
    [],
  );

  return (
    <div>
      <PageHeader
        title="DPDP Compliance"
        subtitle="Digital Personal Data Protection — consents, erasures, and breach management"
      />

      <Tabs defaultValue="consent">
        <TabsList className="mb-6">
          <TabsTrigger value="consent">Consent Manager</TabsTrigger>
          <TabsTrigger value="erasure">Erasure Requests</TabsTrigger>
          <TabsTrigger value="breach">Breach Log</TabsTrigger>
        </TabsList>

        <TabsContent value="consent">
          <ConsentTab />
        </TabsContent>

        <TabsContent value="erasure">
          <ErasureTab />
        </TabsContent>

        <TabsContent value="breach">
          <BreachTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
