import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import TextareaAutosize from 'react-textarea-autosize';

interface AiContext {
  pitch: string;
  ideal_clients: string;
  style_guide: string;
}

const FIELDS: Array<{
  key: keyof AiContext;
  label: string;
  description: string;
  minRows: number;
}> = [
  {
    key: 'pitch',
    label: 'Company pitch',
    description: 'A concise description of what your company does and the value it provides.',
    minRows: 5,
  },
  {
    key: 'ideal_clients',
    label: 'Ideal clients',
    description: 'Describe your ideal customer profile — industry, role, company size, pain points.',
    minRows: 5,
  },
  {
    key: 'style_guide',
    label: 'Style guide',
    description: 'Tone of voice, messaging rules, words to avoid, and writing conventions for AI outputs.',
    minRows: 10,
  },
];

export default function AiContextPage() {
  const [form, setForm] = useState<AiContext>({ pitch: '', ideal_clients: '', style_guide: '' });

  const { data, isLoading } = useQuery<AiContext>({
    queryKey: ['admin-ai-context'],
    queryFn: (): Promise<AiContext> => api.get('/admin/ai-context'),
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () => api.post('/admin/ai-context', form),
    onSuccess: () => toast.success('AI context saved'),
    onError: () => toast.error('Failed to save AI context'),
  });

  const hasContent = Object.values(form).some((v) => v.trim().length > 0);

  return (
    <div>
      <PageHeader
        title="AI Context"
        description="Define company context that the AI uses when generating leads and drafts"
        actions={
          <Button
            size="sm"
            onClick={() => saveMutation.mutate()}
            disabled={!hasContent || saveMutation.isPending}
          >
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        }
      />

      <div className="max-w-2xl space-y-6">
        {isLoading
          ? FIELDS.map((f) => (
              <div key={f.key} className="rounded-lg border border-border bg-card p-4">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-28 w-full" />
              </div>
            ))
          : FIELDS.map((f) => (
              <div key={f.key} className="rounded-lg border border-border bg-card p-4">
                <Label className="text-sm font-medium text-foreground">{f.label}</Label>
                <p className="text-xs text-muted-foreground mt-0.5 mb-3">{f.description}</p>
                <TextareaAutosize
                  minRows={f.minRows}
                  value={form[f.key]}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setForm((prev) => ({ ...prev, [f.key]: e.target.value }))
                  }
                  className={cn(
                    'w-full resize-none rounded-md border border-input bg-transparent px-3 py-2',
                    'text-sm text-foreground placeholder:text-muted-foreground',
                    'focus:outline-none focus:ring-1 focus:ring-ring',
                  )}
                  placeholder={`Enter ${f.label.toLowerCase()}...`}
                />
              </div>
            ))}
      </div>
    </div>
  );
}
