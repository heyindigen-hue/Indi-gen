import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { CheckCircle, XCircle, ChevronLeft, ChevronRight, Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { cn, relTime } from '@/lib/utils';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useRegisterCommand } from '@/store/commands';
import { useNavigate } from 'react-router-dom';

type WebhookAttempt = {
  id: string;
  attempted_at: string;
  status_code: number;
  success: boolean;
  response_body: string;
  duration_ms: number;
};

type WebhookEvent = {
  id: string;
  provider: string;
  event_type: string;
  received_at: string;
  signature_valid: boolean;
  payload: Record<string, unknown>;
  attempts: WebhookAttempt[];
};

type WebhookEventsResponse = {
  events: WebhookEvent[];
  total: number;
};

const LIMIT = 50;

function statusCodeClass(code: number): string {
  if (code >= 200 && code < 300) return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300';
  if (code >= 400 && code < 500) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300';
  return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300';
}

function StatusCodeBadge({ code }: { code: number }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium',
        statusCodeClass(code),
      )}
    >
      {code}
    </span>
  );
}

function ProviderBadge({ provider }: { provider: string }) {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
      {provider}
    </span>
  );
}

export default function WebhooksPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [providerFilter, setProviderFilter] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [signatureFilter, setSignatureFilter] = useState<'all' | 'valid' | 'invalid'>('all');
  const [page, setPage] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<WebhookEvent | null>(null);

  const params = new URLSearchParams({
    provider: providerFilter,
    event_type: eventTypeFilter,
    signature_valid:
      signatureFilter === 'all' ? '' : signatureFilter === 'valid' ? 'true' : 'false',
    page: String(page),
  });

  const { data, isLoading } = useQuery<WebhookEventsResponse>({
    queryKey: ['admin-webhooks', providerFilter, eventTypeFilter, signatureFilter, page],
    queryFn: () => api.get<WebhookEventsResponse>(`/admin/webhooks?${params.toString()}`),
  });

  const events = data?.events ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / LIMIT));

  const replayMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/webhooks/${id}/replay`),
    onSuccess: () => {
      toast.success('Webhook replayed successfully');
      qc.invalidateQueries({ queryKey: ['admin-webhooks'] });
    },
    onError: () => toast.error('Failed to replay webhook'),
  });

  const handleCopyCurl = useCallback(() => {
    if (!selectedEvent) return;
    const payloadJson = JSON.stringify(selectedEvent.payload);
    const curl = `curl -X POST https://your-endpoint.com/webhooks \\\n  -H "Content-Type: application/json" \\\n  -d '${payloadJson}'`;
    navigator.clipboard.writeText(curl).then(
      () => toast.success('cURL command copied to clipboard'),
      () => toast.error('Failed to copy to clipboard'),
    );
  }, [selectedEvent]);

  // Virtualizer for left pane event list
  const leftPaneRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: events.length,
    getScrollElement: () => leftPaneRef.current,
    estimateSize: () => 60,
    overscan: 10,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  // Sort attempts newest first
  const sortedAttempts = selectedEvent
    ? [...selectedEvent.attempts].sort(
        (a, b) => new Date(b.attempted_at).getTime() - new Date(a.attempted_at).getTime(),
      )
    : [];

  useRegisterCommand(
    {
      id: 'platform.webhooks',
      label: 'View webhooks',
      group: 'Platform',
      action: () => navigate('/platform/webhooks'),
    },
    [],
  );

  return (
    <div>
      <PageHeader
        title="Webhooks"
        subtitle="Incoming webhook event viewer and delivery history"
      />

      <div
        className="grid gap-0 border rounded-md overflow-hidden"
        style={{
          gridTemplateColumns: '280px 1fr 280px',
          height: 'calc(100vh - 180px)',
        }}
      >
        {/* Left pane — event list */}
        <div className="flex flex-col border-r overflow-hidden">
          {/* Filters */}
          <div className="p-2 space-y-2 border-b shrink-0">
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Provider</Label>
              <Input
                className="h-7 text-xs"
                placeholder="stripe, github..."
                value={providerFilter}
                onChange={(e) => {
                  setProviderFilter(e.target.value);
                  setPage(0);
                }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Event type</Label>
              <Input
                className="h-7 text-xs"
                placeholder="payment.succeeded..."
                value={eventTypeFilter}
                onChange={(e) => {
                  setEventTypeFilter(e.target.value);
                  setPage(0);
                }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Signature</Label>
              <Select
                value={signatureFilter}
                onValueChange={(v) => {
                  setSignatureFilter(v as 'all' | 'valid' | 'invalid');
                  setPage(0);
                }}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="valid">Valid</SelectItem>
                  <SelectItem value="invalid">Invalid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Event list */}
          <div ref={leftPaneRef} className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-2 space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-xs p-4 text-center">
                No webhook events found
              </div>
            ) : (
              <div style={{ height: `${totalSize}px`, position: 'relative' }}>
                {virtualItems.map((vItem) => {
                  const event = events[vItem.index];
                  const isSelected = selectedEvent?.id === event.id;
                  return (
                    <div
                      key={event.id}
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
                        'px-3 py-2 border-b cursor-pointer hover:bg-muted/50 transition-colors',
                        isSelected && 'bg-accent',
                      )}
                      onClick={() => setSelectedEvent(event)}
                    >
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <ProviderBadge provider={event.provider} />
                        {event.signature_valid ? (
                          <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs font-medium truncate">{event.event_type}</p>
                      <p className="text-xs text-muted-foreground">{relTime(event.received_at)}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-2 border-t shrink-0">
            <span className="text-xs text-muted-foreground">
              {page + 1}/{pageCount}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-6 w-6 p-0"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-6 w-6 p-0"
                disabled={page >= pageCount - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Middle pane — payload */}
        <div className="overflow-y-auto">
          {selectedEvent === null ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Select an event to view payload
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Header */}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <ProviderBadge provider={selectedEvent.provider} />
                  <span className="font-semibold text-sm">{selectedEvent.event_type}</span>
                  {selectedEvent.signature_valid ? (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Valid signature
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-red-500">
                      <XCircle className="h-3.5 w-3.5" />
                      Invalid signature
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {relTime(selectedEvent.received_at)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyCurl}>
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                  Copy as cURL
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={replayMutation.isPending}
                  onClick={() => replayMutation.mutate(selectedEvent.id)}
                >
                  <RefreshCw
                    className={cn(
                      'h-3.5 w-3.5 mr-1.5',
                      replayMutation.isPending && 'animate-spin',
                    )}
                  />
                  Replay
                </Button>
              </div>

              {/* Payload */}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">
                  Payload
                </p>
                <pre className="font-mono text-xs bg-muted p-3 rounded overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(selectedEvent.payload, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Right pane — delivery attempts */}
        <div className="overflow-y-auto border-l">
          <div className="p-3 border-b">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Delivery attempts
            </p>
          </div>

          {selectedEvent === null ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-xs p-3 text-center">
              Select an event to view attempts
            </div>
          ) : sortedAttempts.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-xs p-3 text-center">
              No delivery attempts recorded
            </div>
          ) : (
            <div className="divide-y">
              {sortedAttempts.map((attempt) => (
                <div key={attempt.id} className="p-3 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <StatusCodeBadge code={attempt.status_code} />
                    <span className="text-xs text-muted-foreground">{attempt.duration_ms}ms</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{relTime(attempt.attempted_at)}</p>
                  {attempt.response_body && (
                    <p className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded truncate max-w-full">
                      {attempt.response_body.slice(0, 100)}
                      {attempt.response_body.length > 100 && '…'}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
