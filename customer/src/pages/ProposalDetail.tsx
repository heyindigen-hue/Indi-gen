import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import TextareaAutosize from 'react-textarea-autosize';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRightIcon, SparkleIcon, DownloadIcon, SendIcon } from '@/icons';

type ProposalData = {
  id: string;
  lead_id: string;
  lead_name: string;
  lead_company: string;
  content: string;
  status: string;
  created_at: string;
};

type StatusVariant = 'secondary' | 'default' | 'warning' | 'success' | 'destructive' | 'outline';

function getStatusVariant(status: string): StatusVariant {
  const map: Record<string, StatusVariant> = {
    draft: 'secondary',
    sent: 'default',
    viewed: 'warning',
    accepted: 'success',
    rejected: 'destructive',
  };
  return map[status] ?? 'outline';
}

/**
 * Minimal markdown-to-HTML: handles ##/###, **bold**, *italic*, blank-line paragraphs.
 * No external lib needed per spec.
 */
function markdownToHtml(md: string): string {
  const escaped = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const lines = escaped.split('\n');
  const outputLines: string[] = [];
  let inParagraph = false;

  for (const raw of lines) {
    const line = raw;

    if (line.startsWith('### ')) {
      if (inParagraph) { outputLines.push('</p>'); inParagraph = false; }
      outputLines.push(`<h3 class="text-base font-semibold mt-4 mb-1">${applyInline(line.slice(4))}</h3>`);
      continue;
    }
    if (line.startsWith('## ')) {
      if (inParagraph) { outputLines.push('</p>'); inParagraph = false; }
      outputLines.push(`<h2 class="text-lg font-bold mt-5 mb-2">${applyInline(line.slice(3))}</h2>`);
      continue;
    }
    if (line.trim() === '') {
      if (inParagraph) { outputLines.push('</p>'); inParagraph = false; }
      continue;
    }

    const inlined = applyInline(line);
    if (!inParagraph) {
      outputLines.push('<p class="mb-3">');
      inParagraph = true;
    } else {
      outputLines.push('<br />');
    }
    outputLines.push(inlined);
  }

  if (inParagraph) outputLines.push('</p>');

  return outputLines.join('');
}

function applyInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

export default function ProposalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [content, setContent] = useState<string | null>(null);

  const { data: proposal, isLoading } = useQuery<ProposalData>({
    queryKey: ['proposal', id],
    queryFn: () => api.get<ProposalData>(`/proposals/${id}`),
    enabled: !!id,
  });

  // Seed editor content on first load only
  useEffect(() => {
    if (proposal && content === null) {
      setContent(proposal.content ?? '');
    }
  }, [proposal, content]);

  const saveMutation = useMutation({
    mutationFn: (body: { content?: string; status?: string }) =>
      api.patch(`/proposals/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal', id] });
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      toast.success('Saved');
    },
    onError: () => toast.error('Failed to save'),
  });

  const generateMutation = useMutation({
    mutationFn: () => api.post<{ content: string }>(`/proposals/${id}/generate`),
    onSuccess: (data) => {
      setContent(data.content);
      queryClient.invalidateQueries({ queryKey: ['proposal', id] });
      toast.success('AI content generated');
    },
    onError: () => toast.error('AI generation failed'),
  });

  const editorContent = content ?? proposal?.content ?? '';

  const handleSaveDraft = useCallback(() => {
    saveMutation.mutate({ content: editorContent });
  }, [editorContent, saveMutation]);

  const handleSend = useCallback(() => {
    saveMutation.mutate({ status: 'sent' });
  }, [saveMutation]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid h-[60vh] gap-4 lg:grid-cols-2">
          <Skeleton className="h-full w-full" />
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground">
        Proposal not found.
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowRightIcon size={15} className="rotate-180" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-['Fraunces'] italic font-bold">
                {proposal.lead_name}
              </span>
              <span className="text-muted-foreground">—</span>
              <span className="text-sm text-muted-foreground">
                {proposal.lead_company}
              </span>
              <Badge variant={getStatusVariant(proposal.status)} className="capitalize">
                {proposal.status}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={generateMutation.isPending}
            onClick={() => generateMutation.mutate()}
          >
            <SparkleIcon size={14} />
            {generateMutation.isPending ? 'Generating...' : 'AI Generate'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={saveMutation.isPending}
            onClick={handleSaveDraft}
          >
            {saveMutation.isPending ? 'Saving...' : 'Save Draft'}
          </Button>
          <Button
            size="sm"
            disabled={saveMutation.isPending}
            onClick={handleSend}
          >
            <SendIcon size={14} />
            Send
          </Button>
          <a
            href={`/api/proposals/${id}/pdf`}
            download
            className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-transparent px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <DownloadIcon size={14} />
            PDF
          </a>
        </div>
      </div>

      {/* Editor + Preview */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor panel */}
        <div className="flex flex-1 flex-col overflow-auto border-r">
          <div className="border-b px-4 py-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Markdown Editor
            </span>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <TextareaAutosize
              className="w-full resize-none border-none bg-transparent font-mono text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground focus:ring-0"
              placeholder="Write your proposal in Markdown..."
              value={editorContent}
              onChange={(e) => setContent(e.target.value)}
              minRows={20}
            />
          </div>
        </div>

        {/* Preview panel */}
        <div className="flex flex-1 flex-col overflow-auto">
          <div className="border-b px-4 py-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Preview
            </span>
          </div>
          <div className="flex-1 overflow-auto p-6">
            {editorContent.trim() ? (
              <div
                className="prose prose-sm max-w-none text-foreground [&_h2]:font-bold [&_h3]:font-semibold [&_p]:text-sm [&_p]:leading-relaxed"
                // safe: we generate this HTML from escaped markdown, no user-supplied HTML
                dangerouslySetInnerHTML={{ __html: markdownToHtml(editorContent) }}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Start typing in the editor to see a preview.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
