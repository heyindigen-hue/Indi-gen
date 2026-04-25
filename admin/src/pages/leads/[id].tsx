import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { relTime } from '@/lib/utils';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusPill } from '@/components/common/StatusPill';
import { ScoreBadge } from '@/components/common/ScoreBadge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ---- Types ----

type Contact = {
  id: string;
  type: string;
  value: string;
  verified: boolean;
};

type Lead = {
  id: string;
  name: string | null;
  headline: string | null;
  company: string | null;
  linkedin_url: string | null;
  score: number;
  status: string;
  icp_type: string | null;
  intent_label: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  contacts: Contact[];
};

type OutreachLog = {
  id: string;
  channel: string;
  message: string | null;
  subject: string | null;
  sent_at: string;
};

// ---- Helpers ----

function statusVariant(status: string) {
  switch (status.toLowerCase()) {
    case 'active':
    case 'qualified':
      return 'success' as const;
    case 'contacted':
      return 'info' as const;
    case 'unqualified':
    case 'dead':
      return 'error' as const;
    case 'nurturing':
      return 'warning' as const;
    default:
      return 'default' as const;
  }
}

function getInitials(name: string | null): string {
  if (!name) return 'LD';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function channelColor(channel: string): string {
  switch (channel.toLowerCase()) {
    case 'email':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
    case 'linkedin':
      return 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300';
    case 'whatsapp':
      return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
    case 'sms':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
    default:
      return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300';
  }
}

// ---- Sub-components ----

function OverviewTab({ lead }: { lead: Lead }) {
  return (
    <div className="space-y-4">
      <div className="rounded-md border p-4 space-y-3">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 shrink-0">
            <AvatarFallback className="text-lg">{getInitials(lead.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-base truncate">{lead.name ?? '—'}</p>
            {lead.headline && (
              <p className="text-sm text-muted-foreground truncate">{lead.headline}</p>
            )}
            {lead.company && (
              <p className="text-sm text-muted-foreground">{lead.company}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ScoreBadge score={lead.score} />
            <StatusPill label={lead.status} variant={statusVariant(lead.status)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm pt-1">
          {lead.linkedin_url && (
            <div>
              <span className="text-muted-foreground">LinkedIn</span>
              <a
                href={lead.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-primary hover:underline truncate"
              >
                {lead.linkedin_url.replace('https://www.linkedin.com/', '')}
              </a>
            </div>
          )}
          {lead.icp_type && (
            <div>
              <span className="text-muted-foreground block">ICP Type</span>
              <Badge variant="outline" className="text-xs capitalize mt-0.5">
                {lead.icp_type}
              </Badge>
            </div>
          )}
          {lead.intent_label && (
            <div>
              <span className="text-muted-foreground block">Intent</span>
              <Badge variant="outline" className="text-xs capitalize mt-0.5">
                {lead.intent_label}
              </Badge>
            </div>
          )}
          <div>
            <span className="text-muted-foreground block">Added</span>
            <span className="font-medium">{relTime(lead.created_at)}</span>
          </div>
        </div>
      </div>

      {lead.contacts.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Contacts
          </p>
          <div className="divide-y divide-border rounded-md border">
            {lead.contacts.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="capitalize text-muted-foreground text-xs w-16 shrink-0">
                    {c.type}
                  </span>
                  <span className="font-medium truncate">{c.value}</span>
                </div>
                {c.verified && (
                  <span className="text-xs text-green-600 font-medium shrink-0 ml-2">Verified</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OutreachTab({ leadId }: { leadId: string }) {
  const { data, isLoading } = useQuery<OutreachLog[]>({
    queryKey: ['lead-outreach', leadId],
    queryFn: () => api.get<OutreachLog[]>(`/leads/${leadId}/outreach`),
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground">No outreach activity yet.</p>;
  }

  return (
    <div className="space-y-3">
      {data.map((entry, idx) => (
        <div key={entry.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-2 h-2 rounded-full bg-border mt-1.5 shrink-0" />
            {idx < data.length - 1 && (
              <div className="w-px flex-1 bg-border mt-1" />
            )}
          </div>
          <div className="pb-4 min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${channelColor(entry.channel)}`}
              >
                {entry.channel}
              </span>
              <span className="text-xs text-muted-foreground">{relTime(entry.sent_at)}</span>
            </div>
            {entry.subject && (
              <p className="text-sm font-medium truncate">{entry.subject}</p>
            )}
            {entry.message && (
              <p className="text-sm text-muted-foreground line-clamp-2">{entry.message}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function NotesTab({ lead }: { lead: Lead }) {
  const qc = useQueryClient();
  const [notes, setNotes] = useState(lead.notes ?? '');
  const lastSaved = useRef(notes);

  const save = useMutation({
    mutationFn: (value: string) => api.patch(`/leads/${lead.id}/notes`, { notes: value }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-lead', lead.id] });
      toast.success('Notes saved');
    },
    onError: () => toast.error('Failed to save notes'),
  });

  const handleBlur = () => {
    if (notes === lastSaved.current) return;
    lastSaved.current = notes;
    save.mutate(notes);
  };

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-2">
        Admin-only notes. Auto-saved on blur.
      </p>
      <textarea
        className="w-full min-h-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-ring"
        placeholder="Add internal notes about this lead..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={handleBlur}
      />
    </div>
  );
}

// ---- Main page ----

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: lead, isLoading, error } = useQuery<Lead>({
    queryKey: ['admin-lead', id],
    queryFn: () => api.get<Lead>(`/leads/${id}`),
    enabled: !!id,
    retry: (failureCount, err) => {
      const status = (err as { status?: number })?.status;
      if (status === 404) return false;
      return failureCount < 2;
    },
  });

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Lead" />
        <div className="flex gap-6">
          <Skeleton className="w-[280px] h-64 shrink-0" />
          <Skeleton className="flex-1 h-64" />
        </div>
      </div>
    );
  }

  const is404 = (error as { status?: number })?.status === 404;
  if (!lead || is404) {
    return (
      <div>
        <PageHeader title="Lead not found" />
        <p className="text-sm text-muted-foreground mb-4">
          This lead does not exist or has been deleted.
        </p>
        <Button variant="outline" size="sm" onClick={() => navigate('/leads')}>
          Back to leads
        </Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={lead.name ?? 'Unknown lead'}
        subtitle={lead.company ?? lead.headline ?? undefined}
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate('/leads')}>
            All leads
          </Button>
        }
      />

      <div className="flex gap-6 items-start">
        {/* Left rail */}
        <div className="w-[260px] shrink-0 sticky top-6 space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="text-base">{getInitials(lead.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-semibold truncate">{lead.name ?? '—'}</p>
              {lead.company && (
                <p className="text-sm text-muted-foreground truncate">{lead.company}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <ScoreBadge score={lead.score} />
            <StatusPill label={lead.status} variant={statusVariant(lead.status)} />
          </div>

          <div className="space-y-2 rounded-md border p-3 text-sm">
            {lead.icp_type && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">ICP</span>
                <span className="font-medium capitalize">{lead.icp_type}</span>
              </div>
            )}
            {lead.intent_label && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Intent</span>
                <span className="font-medium capitalize">{lead.intent_label}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Added</span>
              <span className="font-medium">{relTime(lead.created_at)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Updated</span>
              <span className="font-medium">{relTime(lead.updated_at)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Contacts</span>
              <span className="font-medium">{lead.contacts.length}</span>
            </div>
          </div>

          {lead.linkedin_url && (
            <a
              href={lead.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full"
            >
              <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-sm">
                View LinkedIn
              </Button>
            </a>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <Tabs defaultValue="overview">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="outreach">Outreach</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <OverviewTab lead={lead} />
            </TabsContent>
            <TabsContent value="outreach">
              <OutreachTab leadId={lead.id} />
            </TabsContent>
            <TabsContent value="notes">
              <NotesTab lead={lead} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
