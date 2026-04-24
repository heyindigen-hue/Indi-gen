import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { EditIcon, RefreshIcon, CheckIcon, ClockIcon } from '@/icons';
import TextareaAutosize from 'react-textarea-autosize';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusPill } from '@/components/common/StatusPill';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useRegisterCommand } from '@/store/commands';

interface Prompt {
  id: string;
  name: string;
  description?: string;
  current_text: string;
  version_count: number;
  updated_at: string;
}

interface PromptVersion {
  id: string;
  version: number;
  text: string;
  created_at: string;
  created_by?: string;
}

function detectVariables(text: string): string[] {
  const matches = text.matchAll(/\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g);
  const vars = new Set<string>();
  for (const m of matches) vars.add(m[1]);
  return [...vars];
}

function DiffView({ a, b }: { a: string; b: string }) {
  const aLines = a.split('\n');
  const bLines = b.split('\n');
  const maxLen = Math.max(aLines.length, bLines.length);

  return (
    <div className="rounded-md border border-border overflow-auto max-h-64 text-xs font-mono">
      {Array.from({ length: maxLen }).map((_, i) => {
        const aLine = aLines[i] ?? '';
        const bLine = bLines[i] ?? '';
        if (aLine === bLine) {
          return (
            <div key={i} className="px-3 py-0.5 text-muted-foreground">
              {aLine || ' '}
            </div>
          );
        }
        return (
          <div key={i}>
            {aLine !== '' && (
              <div className="px-3 py-0.5 bg-red-950/40 text-red-400">- {aLine}</div>
            )}
            {bLine !== '' && (
              <div className="px-3 py-0.5 bg-green-950/40 text-green-400">+ {bLine}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function PromptsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string>(searchParams.get('id') ?? '');
  const [editText, setEditText] = useState('');
  const [diffVersionId, setDiffVersionId] = useState<string | null>(null);
  const [hasEdits, setHasEdits] = useState(false);

  const { data: prompts = [], isLoading: loadingPrompts } = useQuery<Prompt[]>({
    queryKey: ['admin-prompts'],
    queryFn: (): Promise<Prompt[]> => api.get('/admin/prompts'),
  });

  useEffect(() => {
    if (prompts.length > 0 && !selectedId) {
      const idParam = searchParams.get('id');
      const first = idParam ? prompts.find((p) => p.id === idParam) ?? prompts[0] : prompts[0];
      setSelectedId(first.id);
      setEditText(first.current_text);
    }
  }, [prompts, selectedId, searchParams]);

  const selectedPrompt = prompts.find((p) => p.id === selectedId);

  const { data: versions = [], isLoading: loadingVersions } = useQuery<PromptVersion[]>({
    queryKey: ['admin-prompt-versions', selectedId],
    queryFn: (): Promise<PromptVersion[]> => api.get(`/admin/prompts/${selectedId}/versions`),
    enabled: !!selectedId,
  });

  const saveMutation = useMutation({
    mutationFn: () => api.post('/admin/prompts', { id: selectedId, text: editText }),
    onSuccess: () => {
      toast.success('Saved as new version');
      setHasEdits(false);
      queryClient.invalidateQueries({ queryKey: ['admin-prompts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-prompt-versions', selectedId] });
    },
    onError: () => toast.error('Failed to save'),
  });

  const rollbackMutation = useMutation({
    mutationFn: (versionId: string) =>
      api.post(`/admin/prompts/${selectedId}/rollback`, { version_id: versionId }),
    onSuccess: () => {
      toast.success('Rolled back successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-prompts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-prompt-versions', selectedId] });
    },
    onError: () => toast.error('Rollback failed'),
  });

  const selectPrompt = (p: Prompt) => {
    setSelectedId(p.id);
    setEditText(p.current_text);
    setHasEdits(false);
    setDiffVersionId(null);
  };

  const vars = detectVariables(editText);
  const diffVersion = versions.find((v) => v.id === diffVersionId);

  useRegisterCommand(
    {
      id: 'ai-edit-filter-prompt',
      label: 'Edit filter prompt',
      group: 'AI',
      action: () => navigate('/ai/prompts?id=filter'),
    },
    [navigate],
  );

  useRegisterCommand(
    {
      id: 'ai-edit-draft-prompt',
      label: 'Edit draft prompt',
      group: 'AI',
      action: () => navigate('/ai/prompts?id=drafts'),
    },
    [navigate],
  );

  return (
    <div>
      <PageHeader
        title="Prompt Editor"
        description="Manage AI prompts and version history"
        actions={
          <Button size="sm" onClick={() => saveMutation.mutate()} disabled={!hasEdits || saveMutation.isPending}>
            <CheckIcon size={14} className="mr-1.5" />
            {saveMutation.isPending ? 'Saving...' : 'Save as new version'}
          </Button>
        }
      />

      <div className="flex gap-5 h-[calc(100vh-12rem)]">
        {/* Sidebar list */}
        <div className="w-56 shrink-0 rounded-lg border border-border bg-card overflow-y-auto">
          {loadingPrompts
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-3 border-b border-border">
                  <Skeleton className="h-3.5 w-24 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))
            : prompts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => selectPrompt(p)}
                  className={cn(
                    'w-full text-left p-3 border-b border-border last:border-b-0 hover:bg-accent/60 transition-colors',
                    selectedId === p.id && 'bg-accent',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground truncate">{p.name}</span>
                    <EditIcon size={14} className="text-muted-foreground shrink-0 ml-1" />
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {p.version_count} version{p.version_count !== 1 ? 's' : ''}
                  </div>
                </button>
              ))}
        </div>

        {/* Main editor area */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {selectedPrompt ? (
            <>
              {/* Editor */}
              <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-foreground">{selectedPrompt.name}</h3>
                  {hasEdits && <StatusPill label="unsaved" variant="warning" />}
                </div>

                <TextareaAutosize
                  value={editText}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                    setEditText(e.target.value);
                    setHasEdits(true);
                  }}
                  minRows={8}
                  className={cn(
                    'w-full resize-none rounded-md border border-input bg-transparent px-3 py-2',
                    'text-sm font-mono text-foreground placeholder:text-muted-foreground',
                    'focus:outline-none focus:ring-1 focus:ring-ring',
                  )}
                  placeholder="Enter prompt text. Use {{variable_name}} for dynamic values."
                />

                {/* Variable chips */}
                {vars.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-xs text-muted-foreground self-center">Variables:</span>
                    {vars.map((v) => (
                      <span
                        key={v}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                      >
                        {`{{${v}}}`}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Version history */}
              <div className="rounded-lg border border-border bg-card p-4 flex-1 overflow-y-auto">
                <h4 className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
                  <ClockIcon size={14} />
                  Version history
                </h4>
                {loadingVersions ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : versions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No versions yet</p>
                ) : (
                  <div className="space-y-2">
                    {versions.map((v) => (
                      <div key={v.id} className="rounded-md border border-border">
                        <div
                          className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-accent/60"
                          onClick={() => setDiffVersionId(diffVersionId === v.id ? null : v.id)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-foreground">v{v.version}</span>
                            <span className="text-xs text-muted-foreground">{v.created_at}</span>
                            {v.created_by && (
                              <span className="text-xs text-muted-foreground">by {v.created_by}</span>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              rollbackMutation.mutate(v.id);
                            }}
                            disabled={rollbackMutation.isPending}
                          >
                            <RefreshIcon size={12} className="mr-1" />
                            Rollback
                          </Button>
                        </div>
                        {diffVersionId === v.id && diffVersion && (
                          <div className="px-3 pb-3 pt-1">
                            <p className="text-xs text-muted-foreground mb-1.5">Diff vs current</p>
                            <DiffView a={diffVersion.text} b={editText} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center border border-dashed border-border rounded-lg">
              <p className="text-sm text-muted-foreground">Select a prompt to edit</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
