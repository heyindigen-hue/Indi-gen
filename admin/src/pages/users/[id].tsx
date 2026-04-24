import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { XIcon, ArrowRightIcon, ZapIcon, ExternalLinkIcon, ShieldIcon, TrashIcon } from '@/icons';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { cn, formatINR, relTime } from '@/lib/utils';
import { PageHeader } from '@/components/common/PageHeader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ---- Types ----

type UserDetail = {
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
  leads_count?: number;
  outreach_count?: number;
  notes?: string | null;
  subscription_status?: string | null;
};

type Session = {
  jti: string;
  device_ua?: string | null;
  ip?: string | null;
  country?: string | null;
  last_seen: string;
  created_at: string;
};

type Payment = {
  id: string;
  invoice_number?: string | null;
  amount: number;
  method?: string | null;
  status: string;
  created_at: string;
  pdf_url?: string | null;
};

type TokenLedgerEntry = {
  id: string;
  kind: string;
  delta: number;
  grant_source?: string | null;
  reason?: string | null;
  created_at: string;
};

type TokensResponse = {
  balance: number;
  ledger: TokenLedgerEntry[];
};

type AuditEntry = {
  id: string;
  action: string;
  actor_id?: string | null;
  actor_email?: string | null;
  target_id?: string | null;
  target_type?: string | null;
  ip?: string | null;
  created_at: string;
};

type Lead = {
  id: string;
  full_name?: string | null;
  title?: string | null;
  company?: string | null;
  status?: string | null;
  created_at: string;
};

// ---- Helpers ----

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  starter: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  pro: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  enterprise: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  banned: 'bg-red-100 text-red-700',
  deleted: 'bg-zinc-100 text-zinc-500',
};

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

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize',
        STATUS_COLORS[status] ?? 'bg-zinc-100 text-zinc-600',
      )}
    >
      {status}
    </span>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

// ---- Dialogs ----

function ImpersonateDialog({
  open,
  onClose,
  user,
}: {
  open: boolean;
  onClose: () => void;
  user: UserDetail;
}) {
  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      api.post<{ token: string; user: { name: string; email: string }; expires_at: string }>(
        `/admin/users/${user.id}/impersonate`,
      ),
    onSuccess: ({ token, user: impUser }) => {
      localStorage.setItem('leadhangover_imp_token', token);
      localStorage.setItem('leadhangover_imp_user', JSON.stringify(impUser));
      window.open(`/?imp_token=${token}`, '_blank');
      toast.success('Impersonation session started in new tab');
      onClose();
    },
    onError: () => toast.error('Failed to start impersonation'),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Impersonate user</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          You are about to impersonate <strong>{user.name ?? user.email}</strong>. All actions will
          be logged. A new tab will open with the impersonation session.
        </p>
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => mutate()} disabled={isPending}>
            {isPending ? 'Starting...' : 'Impersonate'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GrantTokensDialog({
  open,
  onClose,
  userId,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
}) {
  const qc = useQueryClient();
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      api.post(`/admin/users/${userId}/grant-tokens`, {
        amount: Number(amount),
        reason,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-user', userId] });
      void qc.invalidateQueries({ queryKey: ['user-tokens', userId] });
      toast.success(`Granted ${amount} tokens`);
      setAmount('');
      setReason('');
      onClose();
    },
    onError: () => toast.error('Failed to grant tokens'),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Grant tokens</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              placeholder="e.g. 100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="reason">Reason</Label>
            <Input
              id="reason"
              placeholder="e.g. Support credit"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => mutate()}
            disabled={isPending || !amount || Number(amount) <= 0}
          >
            {isPending ? 'Granting...' : 'Grant'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BanDialog({
  open,
  onClose,
  user,
}: {
  open: boolean;
  onClose: () => void;
  user: UserDetail;
}) {
  const qc = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      api.patch(`/admin/users/${user.id}`, { status: 'banned' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-user', user.id] });
      toast.success('User banned');
      onClose();
    },
    onError: () => toast.error('Failed to ban user'),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Ban user</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Ban <strong>{user.name ?? user.email}</strong>? They will be unable to sign in and all
          active sessions will be revoked.
        </p>
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={() => mutate()} disabled={isPending}>
            {isPending ? 'Banning...' : 'Ban user'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---- Tab content components ----

function OverviewTab({ user }: { user: UserDetail }) {
  const { data: audit } = useQuery<AuditEntry[]>({
    queryKey: ['user-audit', user.id],
    queryFn: () => api.get<AuditEntry[]>(`/admin/audit?actor_id=${user.id}&limit=20`),
  });

  const metrics = [
    { title: 'Tokens balance', value: user.tokens_balance.toLocaleString() },
    { title: 'MRR', value: user.mrr ? formatINR(user.mrr) : '—' },
    { title: 'Leads saved', value: (user.leads_count ?? 0).toLocaleString() },
    { title: 'Outreach sent', value: (user.outreach_count ?? 0).toLocaleString() },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((m) => (
          <Card key={m.title}>
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">{m.title}</CardTitle>
            </CardHeader>
            <CardContent className="pb-3 px-4">
              <span className="text-xl font-semibold">{m.value}</span>
            </CardContent>
          </Card>
        ))}
      </div>
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Recent activity
        </p>
        {!audit ? (
          <div className="space-y-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : audit.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity</p>
        ) : (
          <div className="divide-y divide-border rounded-md border">
            {audit.map((e) => (
              <div key={e.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <span className="font-mono text-xs text-muted-foreground">{e.action}</span>
                <span className="text-xs text-muted-foreground">{relTime(e.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SessionsTab({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<Session[]>({
    queryKey: ['user-sessions', userId],
    queryFn: () => api.get<Session[]>(`/admin/users/${userId}/sessions`),
  });

  const revoke = useMutation({
    mutationFn: (jti: string) => api.delete(`/admin/users/${userId}/sessions/${jti}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['user-sessions', userId] });
      toast.success('Session revoked');
    },
    onError: () => toast.error('Failed to revoke session'),
  });

  if (isLoading)
    return (
      <div className="space-y-1">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    );

  if (!data || data.length === 0)
    return <p className="text-sm text-muted-foreground">No active sessions</p>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>JTI</TableHead>
          <TableHead>Device</TableHead>
          <TableHead>IP</TableHead>
          <TableHead>Country</TableHead>
          <TableHead>Last seen</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((s) => (
          <TableRow key={s.jti}>
            <TableCell className="font-mono text-xs">{s.jti.slice(0, 12)}…</TableCell>
            <TableCell className="text-sm max-w-[180px] truncate">{s.device_ua ?? '—'}</TableCell>
            <TableCell className="text-sm">{s.ip ?? '—'}</TableCell>
            <TableCell className="text-sm">{s.country ?? '—'}</TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {relTime(s.last_seen)}
            </TableCell>
            <TableCell>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs text-red-600"
                disabled={revoke.isPending}
                onClick={() => revoke.mutate(s.jti)}
              >
                Revoke
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function LeadsTab({ userId }: { userId: string }) {
  const { data, isLoading } = useQuery<{ leads: Lead[]; total: number }>({
    queryKey: ['user-leads', userId],
    queryFn: () => api.get<{ leads: Lead[]; total: number }>(`/leads?owner_id=${userId}&limit=50`),
  });

  if (isLoading)
    return (
      <div className="space-y-1">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    );

  const leads = data?.leads ?? [];
  if (leads.length === 0)
    return <p className="text-sm text-muted-foreground">No leads saved by this user</p>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Saved</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.map((l) => (
          <TableRow key={l.id}>
            <TableCell className="font-medium text-sm">{l.full_name ?? '—'}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{l.title ?? '—'}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{l.company ?? '—'}</TableCell>
            <TableCell>
              {l.status ? (
                <Badge variant="outline" className="text-xs">
                  {l.status}
                </Badge>
              ) : (
                '—'
              )}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {relTime(l.created_at)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function PaymentsTab({ userId }: { userId: string }) {
  const { data, isLoading } = useQuery<Payment[]>({
    queryKey: ['user-payments', userId],
    queryFn: () => api.get<Payment[]>(`/admin/users/${userId}/payments`),
  });

  if (isLoading)
    return (
      <div className="space-y-1">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    );

  if (!data || data.length === 0)
    return <p className="text-sm text-muted-foreground">No payment records</p>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Method</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((p) => (
          <TableRow key={p.id}>
            <TableCell className="font-mono text-xs">{p.invoice_number ?? '—'}</TableCell>
            <TableCell className="tabular-nums text-sm">{formatINR(p.amount)}</TableCell>
            <TableCell className="text-sm capitalize">{p.method ?? '—'}</TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={cn(
                  'text-xs capitalize',
                  p.status === 'paid' && 'border-green-500 text-green-600',
                  p.status === 'failed' && 'border-red-500 text-red-600',
                )}
              >
                {p.status}
              </Badge>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {new Date(p.created_at).toLocaleDateString()}
            </TableCell>
            <TableCell>
              {p.pdf_url && (
                <a
                  href={p.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  PDF <ExternalLinkIcon size={12} />
                </a>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function TokensTab({ userId }: { userId: string }) {
  const { data, isLoading } = useQuery<TokensResponse>({
    queryKey: ['user-tokens', userId],
    queryFn: () => api.get<TokensResponse>(`/admin/users/${userId}/tokens`),
  });

  if (isLoading)
    return (
      <div className="space-y-1">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
        <ZapIcon size={20} className="text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Balance</span>
        <span className="text-lg font-semibold ml-auto tabular-nums">
          {(data?.balance ?? 0).toLocaleString()}
        </span>
      </div>
      {(!data?.ledger || data.ledger.length === 0) ? (
        <p className="text-sm text-muted-foreground">No token transactions</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kind</TableHead>
              <TableHead>Delta</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.ledger.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="text-sm capitalize">{e.kind}</TableCell>
                <TableCell
                  className={cn(
                    'tabular-nums text-sm font-medium',
                    e.delta > 0 ? 'text-green-600' : 'text-red-600',
                  )}
                >
                  {e.delta > 0 ? `+${e.delta}` : e.delta}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {e.grant_source ?? '—'}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                  {e.reason ?? '—'}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {relTime(e.created_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function AuditTab({ userId }: { userId: string }) {
  const { data, isLoading } = useQuery<AuditEntry[]>({
    queryKey: ['user-audit-full', userId],
    queryFn: () => api.get<AuditEntry[]>(`/admin/audit?actor_id=${userId}&limit=100`),
  });

  if (isLoading)
    return (
      <div className="space-y-1">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    );

  if (!data || data.length === 0)
    return <p className="text-sm text-muted-foreground">No audit events</p>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Action</TableHead>
          <TableHead>IP</TableHead>
          <TableHead>Target</TableHead>
          <TableHead>Time</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((e) => (
          <TableRow key={e.id}>
            <TableCell className="font-mono text-xs">{e.action}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{e.ip ?? '—'}</TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {e.target_type ? `${e.target_type}:${e.target_id ?? ''}` : '—'}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {relTime(e.created_at)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function NotesTab({ user }: { user: UserDetail }) {
  const qc = useQueryClient();
  const [notes, setNotes] = useState(user.notes ?? '');
  const lastSaved = useRef(notes);

  const save = () => {
    if (notes === lastSaved.current) return;
    lastSaved.current = notes;
    api
      .patch(`/admin/users/${user.id}`, { notes })
      .then(() => toast.success('Notes saved'))
      .catch(() => toast.error('Failed to save notes'));
    void qc.invalidateQueries({ queryKey: ['admin-user', user.id] });
  };

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-2">Notes are visible to admin team only. Auto-saved on blur.</p>
      <textarea
        className="w-full min-h-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-ring"
        placeholder="Add internal notes about this user..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={save}
      />
    </div>
  );
}

// ---- Main page ----

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [impOpen, setImpOpen] = useState(false);
  const [grantOpen, setGrantOpen] = useState(false);
  const [banOpen, setBanOpen] = useState(false);

  const { data: user, isLoading } = useQuery<UserDetail>({
    queryKey: ['admin-user', id],
    queryFn: () => api.get<UserDetail>(`/admin/users/${id}`),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div>
        <PageHeader title="User" />
        <div className="flex gap-6">
          <Skeleton className="w-[280px] h-96 shrink-0" />
          <Skeleton className="flex-1 h-96" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        <PageHeader title="User not found" />
        <p className="text-sm text-muted-foreground">This user does not exist or was deleted.</p>
      </div>
    );
  }

  const initials = (user.name ?? user.email).slice(0, 2).toUpperCase();

  return (
    <div>
      <PageHeader
        title={user.name ?? user.email}
        subtitle={user.email}
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate('/users')}>
            <ArrowRightIcon size={16} className="rotate-180 mr-1" />
            All users
          </Button>
        }
      />

      <div className="flex gap-6 items-start">
        {/* Left rail */}
        <div className="w-[280px] shrink-0 sticky top-6 space-y-4">
          {/* Avatar + identity */}
          <div className="flex items-center gap-3">
            <Avatar className="h-16 w-16">
              {user.avatar_url && <AvatarImage src={user.avatar_url} />}
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-semibold truncate">{user.name ?? '—'}</p>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>

          {/* Plan + status */}
          <div className="flex items-center gap-2 flex-wrap">
            <PlanChip plan={user.plan} />
            <StatusBadge status={user.status} />
            {user.subscription_status && (
              <span className="text-xs text-muted-foreground">{user.subscription_status}</span>
            )}
          </div>

          {/* Stats */}
          <div className="space-y-2 rounded-md border p-3">
            <StatRow label="Tokens" value={user.tokens_balance.toLocaleString()} />
            <StatRow label="MRR" value={user.mrr ? formatINR(user.mrr) : '—'} />
            <StatRow label="Signup" value={relTime(user.created_at)} />
            <StatRow
              label="Last seen"
              value={user.last_seen ? relTime(user.last_seen) : '—'}
            />
          </div>

          {/* Quick actions */}
          <div className="flex flex-col gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="justify-start gap-2"
              onClick={() => setImpOpen(true)}
            >
              <ArrowRightIcon size={16} />
              Impersonate
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="justify-start gap-2"
              onClick={() => setGrantOpen(true)}
            >
              <ZapIcon size={16} />
              Grant tokens
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="justify-start gap-2 text-red-600 hover:text-red-600"
              onClick={() => setBanOpen(true)}
              disabled={user.status === 'banned'}
            >
              <XIcon size={16} />
              {user.status === 'banned' ? 'Already banned' : 'Ban user'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="justify-start gap-2 text-red-600 hover:text-red-600"
              onClick={() => navigate(`/security/dpdp?request_for=${user.id}`)}
            >
              <TrashIcon size={16} />
              Delete (DPDP)
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="justify-start gap-2"
              onClick={() => navigate(`/settings/audit?target_id=${user.id}`)}
            >
              <ShieldIcon size={16} />
              Full audit trail
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <Tabs defaultValue="overview">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="sessions">Sessions</TabsTrigger>
              <TabsTrigger value="leads">Leads</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="tokens">Tokens</TabsTrigger>
              <TabsTrigger value="audit">Audit</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <OverviewTab user={user} />
            </TabsContent>
            <TabsContent value="sessions">
              <SessionsTab userId={user.id} />
            </TabsContent>
            <TabsContent value="leads">
              <LeadsTab userId={user.id} />
            </TabsContent>
            <TabsContent value="payments">
              <PaymentsTab userId={user.id} />
            </TabsContent>
            <TabsContent value="tokens">
              <TokensTab userId={user.id} />
            </TabsContent>
            <TabsContent value="audit">
              <AuditTab userId={user.id} />
            </TabsContent>
            <TabsContent value="notes">
              <NotesTab user={user} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <ImpersonateDialog open={impOpen} onClose={() => setImpOpen(false)} user={user} />
      <GrantTokensDialog open={grantOpen} onClose={() => setGrantOpen(false)} userId={user.id} />
      <BanDialog open={banOpen} onClose={() => setBanOpen(false)} user={user} />
    </div>
  );
}
