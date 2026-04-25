import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { relTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowRightIcon,
  ExternalLinkIcon,
  GlobeIcon,
  CopyIcon,
  SendIcon,
  RefreshIcon,
  PlusIcon,
  UserIcon,
  ClockIcon,
} from '@/icons';

type LeadDetail = {
  id: string;
  name: string;
  title: string;
  company: string;
  location: string | null;
  score: number;
  status: string;
  linkedin_url: string | null;
  website: string | null;
  icp_match: boolean | null;
  budget_signals: string[];
  notes: string | null;
  drafts: DraftMessage[] | null;
  contacts: Contact[] | null;
  timeline: TimelineEvent[] | null;
  proposals: ProposalRef[] | null;
};

type DraftMessage = {
  channel: 'linkedin' | 'email' | 'whatsapp';
  content: string;
  index: number;
};

type Contact = {
  id: string;
  name: string;
  title: string;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
};

type TimelineEvent = {
  id: string;
  type: string;
  description: string;
  created_at: string;
};

type ProposalRef = {
  id: string;
  status: string;
  created_at: string;
};

function getScoreVariant(score: number): 'success' | 'warning' | 'destructive' {
  if (score >= 70) return 'success';
  if (score >= 40) return 'warning';
  return 'destructive';
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');
}

const CHANNEL_LABELS: Record<string, string> = {
  linkedin: 'LinkedIn',
  email: 'Email',
  whatsapp: 'WhatsApp',
};

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const notesRef = useRef<string>('');

  const [activeTab, setActiveTab] = useState('overview');

  const { data: lead, isLoading } = useQuery<LeadDetail>({
    queryKey: ['lead', id],
    queryFn: () => api.get<LeadDetail>(`/leads/${id}`),
    enabled: !!id,
  });

  const notesMutation = useMutation({
    mutationFn: (notes: string) =>
      api.patch(`/leads/${id}/notes`, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      toast.success('Notes saved');
    },
    onError: () => toast.error('Failed to save notes'),
  });

  const outreachMutation = useMutation({
    mutationFn: ({ channel, draft_index }: { channel: string; draft_index: number }) =>
      api.post(`/leads/${id}/outreach`, { channel, draft_index }),
    onSuccess: () => toast.success('Outreach sent'),
    onError: () => toast.error('Failed to send outreach'),
  });

  const regenerateMutation = useMutation({
    mutationFn: () => api.post(`/leads/${id}/drafts`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      toast.success('Drafts regenerated');
    },
    onError: () => toast.error('Failed to regenerate drafts'),
  });

  const newProposalMutation = useMutation({
    mutationFn: () => api.post('/proposals', { lead_id: id }),
    onSuccess: (data) => {
      const proposal = data as { id: string };
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      navigate(`/proposals/${proposal.id}`);
    },
    onError: () => toast.error('Failed to create proposal'),
  });

  function handleCopyDraft(content: string) {
    navigator.clipboard.writeText(content).then(() => toast.success('Copied'));
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground">
        Lead not found.
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowRightIcon size={15} className="rotate-180" />
          Back
        </Button>
        <h1 className="font-['Fraunces'] italic text-2xl font-bold">{lead.name}</h1>
        <Badge variant={getScoreVariant(lead.score)}>Score {lead.score}</Badge>
        <Badge variant="outline" className="capitalize">
          {lead.status.replace(/_/g, ' ')}
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="drafts">Drafts</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="proposals">Proposals</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardContent className="flex gap-4 p-5">
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 text-lg font-bold text-orange-600">
                    {getInitials(lead.name)}
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-semibold">{lead.name}</p>
                    {lead.title && (
                      <p className="text-sm text-muted-foreground">{lead.title}</p>
                    )}
                    <p className="text-sm font-medium">{lead.company}</p>
                    {lead.location && (
                      <p className="text-sm text-muted-foreground">{lead.location}</p>
                    )}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {lead.linkedin_url && (
                        <a
                          href={lead.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <ExternalLinkIcon size={12} />
                          LinkedIn
                        </a>
                      )}
                      {lead.website && (
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <GlobeIcon size={12} />
                          Website
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Signals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">ICP Match:</span>
                    {lead.icp_match === true ? (
                      <Badge variant="success">Yes</Badge>
                    ) : lead.icp_match === false ? (
                      <Badge variant="destructive">No</Badge>
                    ) : (
                      <Badge variant="outline">Unknown</Badge>
                    )}
                  </div>
                  {lead.budget_signals && lead.budget_signals.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      <span className="text-sm text-muted-foreground">Budget:</span>
                      {lead.budget_signals.map((signal) => (
                        <Badge key={signal} variant="secondary">
                          {signal}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Notes</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Textarea
                  className="min-h-[180px] resize-none"
                  placeholder="Add notes about this lead..."
                  defaultValue={lead.notes ?? ''}
                  onChange={(e) => {
                    notesRef.current = e.target.value;
                  }}
                  onBlur={() => {
                    if (notesRef.current !== (lead.notes ?? '')) {
                      notesMutation.mutate(notesRef.current);
                    }
                  }}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Auto-saves on blur
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Drafts */}
        <TabsContent value="drafts">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                disabled={regenerateMutation.isPending}
                onClick={() => regenerateMutation.mutate()}
              >
                <RefreshIcon size={14} />
                {regenerateMutation.isPending ? 'Regenerating...' : 'Regenerate Drafts'}
              </Button>
            </div>

            {!lead.drafts || lead.drafts.length === 0 ? (
              <div className="rounded-lg border py-12 text-center text-sm text-muted-foreground">
                No drafts yet. Click "Regenerate Drafts" to create them.
              </div>
            ) : (
              <div className="grid gap-4">
                {lead.drafts.map((draft) => (
                  <Card key={`${draft.channel}-${draft.index}`}>
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                      <CardTitle className="text-sm">
                        {CHANNEL_LABELS[draft.channel] ?? draft.channel}
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyDraft(draft.content)}
                        >
                          <CopyIcon size={14} />
                          Copy
                        </Button>
                        <Button
                          size="sm"
                          disabled={outreachMutation.isPending}
                          onClick={() =>
                            outreachMutation.mutate({
                              channel: draft.channel,
                              draft_index: draft.index,
                            })
                          }
                        >
                          <SendIcon size={14} />
                          Send
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="whitespace-pre-wrap text-sm">{draft.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Contacts */}
        <TabsContent value="contacts">
          {!lead.contacts || lead.contacts.length === 0 ? (
            <div className="rounded-lg border py-12 text-center text-sm text-muted-foreground">
              No contacts found for this lead.
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>LinkedIn</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lead.contacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <UserIcon size={14} className="text-muted-foreground" />
                          {contact.name}
                        </div>
                      </TableCell>
                      <TableCell>{contact.title || '—'}</TableCell>
                      <TableCell>
                        {contact.email ? (
                          <a
                            href={`mailto:${contact.email}`}
                            className="text-primary hover:underline"
                          >
                            {contact.email}
                          </a>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell>{contact.phone || '—'}</TableCell>
                      <TableCell>
                        {contact.linkedin ? (
                          <a
                            href={contact.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            <ExternalLinkIcon size={12} />
                            Profile
                          </a>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Timeline */}
        <TabsContent value="timeline">
          {!lead.timeline || lead.timeline.length === 0 ? (
            <div className="rounded-lg border py-12 text-center text-sm text-muted-foreground">
              No timeline events yet.
            </div>
          ) : (
            <div className="space-y-1">
              {lead.timeline.map((event, idx) => (
                <div
                  key={event.id}
                  className="flex gap-4 pb-4"
                >
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <ClockIcon size={14} className="text-muted-foreground" />
                    </div>
                    {idx < lead.timeline!.length - 1 && (
                      <div className="mt-1 w-px flex-1 bg-border" />
                    )}
                  </div>
                  <div className="pb-2">
                    <p className="text-sm font-medium capitalize">
                      {event.type.replace(/_/g, ' ')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {event.description}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {relTime(event.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Proposals */}
        <TabsContent value="proposals">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                size="sm"
                disabled={newProposalMutation.isPending}
                onClick={() => newProposalMutation.mutate()}
              >
                <PlusIcon size={14} />
                {newProposalMutation.isPending ? 'Creating...' : 'New Proposal'}
              </Button>
            </div>

            {!lead.proposals || lead.proposals.length === 0 ? (
              <div className="rounded-lg border py-12 text-center text-sm text-muted-foreground">
                No proposals for this lead yet.
              </div>
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lead.proposals.map((proposal) => (
                      <TableRow
                        key={proposal.id}
                        className="cursor-pointer"
                        onClick={() => navigate(`/proposals/${proposal.id}`)}
                      >
                        <TableCell className="font-mono text-xs">
                          {proposal.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <ProposalStatusBadge status={proposal.status} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {relTime(proposal.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProposalStatusBadge({ status }: { status: string }) {
  const variantMap: Record<string, 'default' | 'warning' | 'success' | 'destructive' | 'secondary' | 'outline'> = {
    draft: 'secondary',
    sent: 'default',
    viewed: 'warning',
    accepted: 'success',
    rejected: 'destructive',
  };
  return (
    <Badge variant={variantMap[status] ?? 'outline'} className="capitalize">
      {status}
    </Badge>
  );
}
