import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { formatINR } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ZapIcon, DownloadIcon } from '@/icons';

// --- Types ---
type Subscription = { plan: string; status: string; renewal_date: string; token_balance: number; token_limit: number };
type TokenHistoryItem = { date: string; description: string; amount: number; balance_after: number };
type Invoice = { invoice_id: string; date: string; amount: number; status: string };

const BUNDLES = [
  { id: 'bundle_500', label: '500 tokens', price: 499 },
  { id: 'bundle_1200', label: '1,200 tokens', price: 999 },
  { id: 'bundle_3000', label: '3,000 tokens', price: 1999 },
];

// --- Billing info schema ---
const billingSchema = z.object({
  gstin: z.string().optional(),
  billing_address: z.string().optional(),
});
type BillingValues = z.infer<typeof billingSchema>;

// --- Sub-sections ---
function PlanCard({ sub }: { sub: Subscription }) {
  const statusColor = sub.status === 'active' ? 'text-green-600 bg-green-50' : 'text-yellow-600 bg-yellow-50';
  return (
    <div className="p-4 rounded-xl border border-border bg-card space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge className="capitalize bg-primary/10 text-primary border-0">{sub.plan}</Badge>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor}`}>{sub.status}</span>
        </div>
        <div className="flex gap-2">
          {sub.plan === 'free' ? (
            <Button size="sm" style={{ backgroundColor: '#f97316' }} className="text-white hover:opacity-90">Upgrade</Button>
          ) : (
            <Button size="sm" variant="outline">Manage</Button>
          )}
        </div>
      </div>
      {sub.renewal_date && (
        <p className="text-xs text-muted-foreground">Renews on {new Date(sub.renewal_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
      )}
    </div>
  );
}

function TokenSection({ sub, onTopUp }: { sub: Subscription; onTopUp: () => void }) {
  const pct = sub.token_limit > 0 ? Math.min(100, Math.round((sub.token_balance / sub.token_limit) * 100)) : 0;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Tokens</h3>
        <Button size="sm" variant="outline" onClick={onTopUp}>
          <ZapIcon size={13} className="mr-1.5" /> Top Up
        </Button>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{sub.token_balance.toLocaleString('en-IN')}</span>
        <span className="text-muted-foreground">/ {sub.token_limit.toLocaleString('en-IN')}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function TopUpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const topUpMutation = useMutation({
    mutationFn: (bundle_id: string) => api.post('/payments/topup', { bundle_id }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['subscription'] }); toast.success('Top-up successful'); onClose(); },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Top-up failed'),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Top Up Tokens</DialogTitle></DialogHeader>
        <div className="space-y-2">
          {BUNDLES.map((b) => (
            <button key={b.id} type="button" onClick={() => topUpMutation.mutate(b.id)}
              disabled={topUpMutation.isPending}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-sm">
              <span className="font-medium">{b.label}</span>
              <span className="text-primary font-semibold">{formatINR(b.price)}</span>
            </button>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TokenHistory() {
  const { data, isLoading } = useQuery<TokenHistoryItem[]>({
    queryKey: ['token-history'],
    queryFn: () => api.get('/users/me/tokens/history'),
  });

  if (isLoading) return <Skeleton className="h-24 w-full rounded-md" />;
  if (!data?.length) return <p className="text-xs text-muted-foreground">No token history yet.</p>;

  return (
    <div className="rounded-lg border border-border overflow-hidden text-sm">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            {['Date', 'Description', 'Amount', 'Balance'].map((h) => (
              <th key={h} className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-t border-border">
              <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">{new Date(row.date).toLocaleDateString('en-IN')}</td>
              <td className="px-3 py-2">{row.description}</td>
              <td className={`px-3 py-2 font-medium ${row.amount >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                {row.amount >= 0 ? '+' : ''}{row.amount}
              </td>
              <td className="px-3 py-2">{row.balance_after.toLocaleString('en-IN')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Invoices() {
  const { data, isLoading } = useQuery<Invoice[]>({
    queryKey: ['invoices'],
    queryFn: () => api.get('/users/me/invoices'),
  });

  if (isLoading) return <Skeleton className="h-24 w-full rounded-md" />;
  if (!data?.length) return <p className="text-xs text-muted-foreground">No invoices yet.</p>;

  return (
    <div className="rounded-lg border border-border overflow-hidden text-sm">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            {['Invoice', 'Date', 'Amount', 'Status', ''].map((h, i) => (
              <th key={i} className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((inv) => (
            <tr key={inv.invoice_id} className="border-t border-border">
              <td className="px-3 py-2 font-mono text-xs">{inv.invoice_id}</td>
              <td className="px-3 py-2 text-xs text-muted-foreground">{new Date(inv.date).toLocaleDateString('en-IN')}</td>
              <td className="px-3 py-2">{formatINR(inv.amount)}</td>
              <td className="px-3 py-2">
                <Badge variant="outline" className="text-xs capitalize">{inv.status}</Badge>
              </td>
              <td className="px-3 py-2">
                <a href={`/api/invoices/${inv.invoice_id}/pdf`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline text-xs">
                  <DownloadIcon size={12} /> PDF
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TaxInfoForm() {
  const { register, handleSubmit } = useForm<BillingValues>({ resolver: zodResolver(billingSchema) });
  const mutation = useMutation({
    mutationFn: (data: BillingValues) => api.patch('/users/me/billing-info', data),
    onSuccess: () => toast.success('Billing info saved'),
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Save failed'),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <h3 className="text-sm font-semibold">Tax Information</h3>
      <div className="space-y-2">
        <Label htmlFor="gstin">GSTIN</Label>
        <Input id="gstin" {...register('gstin')} placeholder="22AAAAA0000A1Z5" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="billing_address">Billing Address</Label>
        <textarea id="billing_address" {...register('billing_address')} rows={3}
          placeholder="Street, City, State, PIN"
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none" />
      </div>
      <Button type="submit" size="sm" disabled={mutation.isPending}>
        {mutation.isPending ? 'Saving…' : 'Save'}
      </Button>
    </form>
  );
}

// --- Main ---
export default function Billing() {
  const [topUpOpen, setTopUpOpen] = useState(false);

  const { data: sub, isLoading } = useQuery<Subscription>({
    queryKey: ['subscription'],
    queryFn: () => api.get('/users/me/subscription'),
  });

  if (isLoading) return <Skeleton className="h-64 w-full rounded-lg" />;

  return (
    <div className="space-y-8 max-w-2xl">
      <h2 className="text-2xl font-semibold" style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic' }}>
        Billing
      </h2>

      {sub && <PlanCard sub={sub} />}
      <Separator />
      {sub && <TokenSection sub={sub} onTopUp={() => setTopUpOpen(true)} />}
      <Separator />
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Token History</h3>
        <TokenHistory />
      </div>
      <Separator />
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Invoices</h3>
        <Invoices />
      </div>
      <Separator />
      <TaxInfoForm />

      <TopUpDialog open={topUpOpen} onClose={() => setTopUpOpen(false)} />
    </div>
  );
}
