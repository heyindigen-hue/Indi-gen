import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { LinkIcon, TrashIcon } from '@/icons';

// --- Types ---
type LinkedInStatus = { connected: boolean; username?: string; connected_at?: string };
type Webhook = { id: string; endpoint_url: string; events: string[] };
const WEBHOOK_EVENTS = ['lead.created', 'reply.received', 'scrape.completed'] as const;
type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

// --- LinkedIn section ---
function LinkedInSection() {
  const qc = useQueryClient();
  const [cookieOpen, setCookieOpen] = useState(false);
  const [cookieJson, setCookieJson] = useState('');

  const { data, isLoading } = useQuery<LinkedInStatus>({
    queryKey: ['linkedin-status'],
    queryFn: () => api.get('/users/me/integrations/linkedin'),
  });

  const disconnectMutation = useMutation({
    mutationFn: () => api.delete('/integrations/linkedin'),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['linkedin-status'] }); toast.success('LinkedIn disconnected'); },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Disconnect failed'),
  });

  const cookieMutation = useMutation({
    mutationFn: (cookies_json: string) => api.post('/integrations/linkedin/cookies', { cookies_json }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['linkedin-status'] }); setCookieOpen(false); setCookieJson(''); toast.success('LinkedIn connected'); },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Cookie import failed'),
  });

  if (isLoading) return <Skeleton className="h-20 w-full rounded-lg" />;

  return (
    <div className="p-4 rounded-xl border border-border bg-card space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LinkIcon size={16} />
          <span className="font-medium text-sm">LinkedIn</span>
          {data?.connected
            ? <Badge className="bg-green-50 text-green-700 border-0 text-xs">Connected</Badge>
            : <Badge variant="outline" className="text-xs">Not connected</Badge>}
        </div>
        <div className="flex gap-2">
          {data?.connected ? (
            <Button size="sm" variant="destructive" onClick={() => disconnectMutation.mutate()} disabled={disconnectMutation.isPending}>
              Disconnect
            </Button>
          ) : (
            <>
              <Button size="sm" asChild>
                <a href="/api/integrations/linkedin/oauth">Connect via OAuth</a>
              </Button>
              <Button size="sm" variant="outline" onClick={() => setCookieOpen(true)}>
                Paste cookies
              </Button>
            </>
          )}
        </div>
      </div>
      {data?.connected && data.username && (
        <p className="text-xs text-muted-foreground">Connected as {data.username}</p>
      )}

      <Dialog open={cookieOpen} onOpenChange={setCookieOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Paste LinkedIn Cookies</DialogTitle>
            <DialogDescription>
              Export your LinkedIn cookies as JSON from your browser and paste them here.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="cookie-json">Cookie JSON</Label>
            <textarea id="cookie-json" value={cookieJson} onChange={(e) => setCookieJson(e.target.value)}
              rows={6} placeholder='[{"name": "li_at", "value": "..."}]'
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCookieOpen(false)}>Cancel</Button>
            <Button disabled={!cookieJson.trim() || cookieMutation.isPending}
              onClick={() => cookieMutation.mutate(cookieJson.trim())}>
              {cookieMutation.isPending ? 'Importing…' : 'Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- Coming-soon card ---
function ComingSoonCard({ name }: { name: string }) {
  return (
    <div className="p-4 rounded-xl border border-border bg-card/50 opacity-60 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <LinkIcon size={16} />
        <span className="font-medium text-sm">{name}</span>
      </div>
      <Badge variant="outline" className="text-xs">Coming soon</Badge>
    </div>
  );
}

// --- Webhooks section ---
function WebhooksSection() {
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<WebhookEvent[]>([]);

  const { data: webhooks, isLoading } = useQuery<Webhook[]>({
    queryKey: ['webhooks'],
    queryFn: () => api.get('/users/me/webhooks'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/webhooks/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['webhooks'] }); toast.success('Webhook deleted'); },
    onError: () => toast.error('Delete failed'),
  });

  const addMutation = useMutation({
    mutationFn: () => api.post('/webhooks', { endpoint_url: url, events: selectedEvents }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['webhooks'] });
      setAddOpen(false); setUrl(''); setSelectedEvents([]);
      toast.success('Webhook added');
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Add failed'),
  });

  const toggleEvent = (event: WebhookEvent) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Webhooks</h3>
        <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>Add webhook</Button>
      </div>

      {isLoading && <Skeleton className="h-16 w-full rounded-md" />}
      {webhooks?.map((wh) => (
        <div key={wh.id} className="flex items-start justify-between p-3 rounded-lg border border-border bg-card text-sm">
          <div className="space-y-1">
            <p className="font-mono text-xs break-all">{wh.endpoint_url}</p>
            <div className="flex flex-wrap gap-1">
              {wh.events.map((ev) => (
                <span key={ev} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{ev}</span>
              ))}
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive shrink-0"
            onClick={() => deleteMutation.mutate(wh.id)} disabled={deleteMutation.isPending}>
            <TrashIcon size={14} />
          </Button>
        </div>
      ))}
      {webhooks?.length === 0 && !isLoading && (
        <p className="text-xs text-muted-foreground">No webhooks configured.</p>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Webhook</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Endpoint URL</Label>
              <Input id="webhook-url" value={url} onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/webhook" />
            </div>
            <div className="space-y-2">
              <Label>Events</Label>
              <div className="space-y-2">
                {WEBHOOK_EVENTS.map((ev) => (
                  <label key={ev} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={selectedEvents.includes(ev)}
                      onChange={() => toggleEvent(ev)}
                      className="rounded border-input accent-primary" />
                    <span className="text-sm font-mono">{ev}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button disabled={!url.trim() || selectedEvents.length === 0 || addMutation.isPending}
              onClick={() => addMutation.mutate()}>
              {addMutation.isPending ? 'Adding…' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Integrations() {
  return (
    <div className="space-y-8 max-w-lg">
      <h2 className="text-2xl font-semibold" style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic' }}>
        Integrations
      </h2>

      <LinkedInSection />

      <Separator />

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Coming Soon</h3>
        <ComingSoonCard name="Calendar" />
        <ComingSoonCard name="Email" />
      </div>

      <Separator />

      <WebhooksSection />
    </div>
  );
}
