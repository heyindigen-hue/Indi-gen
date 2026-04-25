import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Textarea } from '../../components/ui/textarea';
import { Input } from '../../components/ui/input';
import { PageHeader } from '../../components/common/PageHeader';

type Proposal = {
  id: string;
  lead_id: string;
  lead_name?: string;
  lead_company?: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  title?: string;
  content_md?: string;
  pdf_url?: string;
  sent_at?: string;
  viewed_at?: string;
  accepted_at?: string;
  created_at: string;
  updated_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'secondary',
  sent: 'default',
  accepted: 'success',
  rejected: 'destructive',
};

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── All Proposals List View ────────────────────────────────────────────────────

export function ProposalsListPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('');

  const { data: proposals = [], isLoading } = useQuery<Proposal[]>({
    queryKey: ['proposals', statusFilter],
    queryFn: () =>
      apiClient.get(`/admin/proposals${statusFilter ? `?status=${statusFilter}` : ''}`).then((r) => r.data),
  });

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Proposals"
        subtitle={`${proposals.length} proposals across all leads`}
      />

      <div className="flex gap-2 flex-wrap">
        {['', 'draft', 'sent', 'accepted', 'rejected'].map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(s)}
          >
            {s || 'All'}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading…</div>
      ) : proposals.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">No proposals yet</p>
          <p className="text-sm mt-1">Open a lead and click "Generate Proposal" to create one.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Lead</th>
                <th className="text-left px-4 py-3 font-medium">Title</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Sent</th>
                <th className="text-left px-4 py-3 font-medium">Viewed</th>
                <th className="text-left px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {proposals.map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer" onClick={() => navigate(`/leads/proposals/${p.id}`)}>
                  <td className="px-4 py-3 font-medium">{p.lead_company || p.lead_name || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.title || 'Untitled'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_COLORS[p.status] as any}>{p.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(p.sent_at)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(p.viewed_at)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(p.created_at)}</td>
                  <td className="px-4 py-3">
                    {p.pdf_url && (
                      <a
                        href={p.pdf_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        PDF
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Lead Proposals Tab (used inside lead detail) ──────────────────────────────

export function LeadProposalsTab({ leadId }: { leadId: string }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: proposals = [], isLoading } = useQuery<Proposal[]>({
    queryKey: ['lead-proposals', leadId],
    queryFn: () => apiClient.get(`/admin/leads/${leadId}/proposals`).then((r) => r.data),
  });

  const generateMutation = useMutation({
    mutationFn: () => apiClient.post(`/admin/leads/${leadId}/proposals/generate`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lead-proposals', leadId] }),
  });

  const selected = proposals.find((p) => p.id === selectedId) ?? proposals[0];

  return (
    <div className="grid grid-cols-3 gap-4 h-full min-h-96">
      {/* List */}
      <div className="col-span-1 space-y-2">
        <Button
          size="sm"
          className="w-full"
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
        >
          {generateMutation.isPending ? 'Generating…' : '✨ Generate with AI'}
        </Button>

        {isLoading ? (
          <div className="text-muted-foreground text-sm">Loading…</div>
        ) : proposals.length === 0 ? (
          <div className="text-muted-foreground text-sm text-center py-8">
            No proposals yet. Click "Generate with AI" to create one.
          </div>
        ) : (
          proposals.map((p) => (
            <div
              key={p.id}
              className={`border rounded-lg p-3 cursor-pointer transition-colors ${selectedId === p.id || (!selectedId && proposals[0]?.id === p.id) ? 'bg-primary/5 border-primary' : 'hover:bg-muted/30'}`}
              onClick={() => setSelectedId(p.id)}
            >
              <div className="flex justify-between items-start gap-2">
                <span className="text-sm font-medium truncate">{p.title || 'Untitled'}</span>
                <Badge variant={STATUS_COLORS[p.status] as any} className="text-xs shrink-0">{p.status}</Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-1">{formatDate(p.created_at)}</div>
            </div>
          ))
        )}
      </div>

      {/* Editor */}
      <div className="col-span-2">
        {selected ? (
          <ProposalEditor proposal={selected} onUpdate={() => queryClient.invalidateQueries({ queryKey: ['lead-proposals', leadId] })} />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            Select a proposal to edit
          </div>
        )}
      </div>
    </div>
  );
}

// ── Proposal Editor ────────────────────────────────────────────────────────────

function ProposalEditor({ proposal, onUpdate }: { proposal: Proposal; onUpdate: () => void }) {
  const [title, setTitle] = useState(proposal.title || '');
  const [content, setContent] = useState(proposal.content_md || '');
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.patch(`/admin/proposals/${proposal.id}`, { title, content_md: content });
      onUpdate();
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    setSending(true);
    try {
      await apiClient.post(`/admin/proposals/${proposal.id}/send`, {});
      onUpdate();
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Proposal title"
            className="font-medium"
          />
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => setPreview(!preview)}>
              {preview ? 'Edit' : 'Preview'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
            {proposal.status === 'draft' && (
              <Button size="sm" onClick={handleSend} disabled={sending}>
                {sending ? 'Sending…' : 'Send'}
              </Button>
            )}
            {proposal.pdf_url && (
              <Button variant="ghost" size="sm" asChild>
                <a href={proposal.pdf_url} target="_blank" rel="noreferrer">PDF ↗</a>
              </Button>
            )}
          </div>
        </div>

        {/* Activity timeline */}
        <div className="flex gap-4 text-xs text-muted-foreground mt-2">
          <span>Created {formatDate(proposal.created_at)}</span>
          {proposal.sent_at && <span>Sent {formatDate(proposal.sent_at)}</span>}
          {proposal.viewed_at && <span>Viewed {formatDate(proposal.viewed_at)}</span>}
          {proposal.accepted_at && <span>Accepted {formatDate(proposal.accepted_at)}</span>}
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden">
        {preview ? (
          <div className="h-full overflow-auto p-4 prose prose-sm max-w-none">
            <MarkdownPreview content={content} />
          </div>
        ) : (
          <Textarea
            value={content}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
            className="h-full rounded-none border-0 resize-none font-mono text-xs focus-visible:ring-0"
            placeholder="Proposal content in Markdown…"
          />
        )}
      </CardContent>
    </Card>
  );
}

// Simple markdown→HTML renderer (no external dep)
function MarkdownPreview({ content }: { content: string }) {
  const html = content
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hul])/gm, '<p>')
    .replace(/^(.+)(?!<\/[hul])/gm, '$1</p>');
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

// ── Detail page (standalone route) ───────────────────────────────────────────

export default function ProposalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: proposal, isLoading } = useQuery<Proposal>({
    queryKey: ['proposal', id],
    queryFn: () => apiClient.get(`/admin/proposals/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  if (isLoading) return <div className="p-6 text-muted-foreground">Loading…</div>;
  if (!proposal) return <div className="p-6 text-muted-foreground">Proposal not found.</div>;

  return (
    <div className="p-6 h-full flex flex-col gap-4">
      <PageHeader
        title={proposal.title || 'Proposal'}
        subtitle={`${proposal.lead_company || proposal.lead_name} · ${proposal.status}`}
      />
      <div className="flex-1 min-h-0">
        <ProposalEditor
          proposal={proposal}
          onUpdate={() => queryClient.invalidateQueries({ queryKey: ['proposal', id] })}
        />
      </div>
    </div>
  );
}
