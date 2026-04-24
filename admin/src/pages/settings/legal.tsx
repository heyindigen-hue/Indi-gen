import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useRegisterCommand } from '@/store/commands';

type LegalType = 'tos' | 'privacy' | 'dpdp' | 'refund';

type LegalDoc = {
  content: string;
  version: number;
  updated_at: string;
};

const TAB_LABELS: Record<LegalType, string> = {
  tos: 'Terms of Service',
  privacy: 'Privacy Policy',
  dpdp: 'DPDP Notice',
  refund: 'Refund Policy',
};

const TAB_KEYS: LegalType[] = ['tos', 'privacy', 'dpdp', 'refund'];

function relTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

type DocEditorProps = {
  type: LegalType;
};

function DocEditor({ type }: DocEditorProps) {
  const qc = useQueryClient();
  const [preview, setPreview] = useState(false);
  const [content, setContent] = useState<string | null>(null);

  const { data, isLoading } = useQuery<LegalDoc>({
    queryKey: ['settings-legal', type],
    queryFn: () => api.get<LegalDoc>(`/api/admin/settings/legal?type=${type}`),
  });

  const currentContent = content ?? data?.content ?? '';

  const mutation = useMutation({
    mutationFn: () =>
      api.post('/api/admin/settings/legal', { type, content: currentContent }),
    onSuccess: () => {
      toast.success('Saved. Users will be re-prompted to consent.');
      qc.invalidateQueries({ queryKey: ['settings-legal', type] });
      setContent(null);
    },
    onError: () => {
      toast.error('Failed to save document');
    },
  });

  if (isLoading) {
    return <div className="h-40 rounded bg-muted animate-pulse" />;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPreview((p) => !p)}
        >
          {preview ? 'Edit' : 'Preview'}
        </Button>
        <Button
          size="sm"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || (content === null)}
        >
          {mutation.isPending ? 'Saving...' : 'Save version'}
        </Button>
      </div>

      {preview ? (
        <div className="prose prose-sm max-w-none rounded-md border border-border bg-background p-4">
          <pre className="whitespace-pre-wrap text-sm">{currentContent}</pre>
        </div>
      ) : (
        <textarea
          value={currentContent}
          onChange={(e) => setContent(e.target.value)}
          className={cn(
            'w-full min-h-[400px] font-mono text-sm p-3 border rounded-md bg-background resize-y',
            'border-input focus:outline-none focus:ring-2 focus:ring-ring',
          )}
        />
      )}

      {data && (
        <p className="text-xs text-muted-foreground">
          Version {data.version} — Last updated {relTime(data.updated_at)}
        </p>
      )}
    </div>
  );
}

export default function LegalPage() {
  const navigate = useNavigate();

  useRegisterCommand(
    {
      id: 'settings.legal',
      label: 'Legal documents',
      group: 'Settings',
      action: () => navigate('/settings/legal'),
    },
    [navigate],
  );

  return (
    <div>
      <PageHeader
        title="Legal documents"
        subtitle="Manage Terms of Service, Privacy Policy, DPDP Notice and Refund Policy"
      />

      <Tabs defaultValue="tos">
        <TabsList className="mb-6">
          {TAB_KEYS.map((key) => (
            <TabsTrigger key={key} value={key}>
              {TAB_LABELS[key]}
            </TabsTrigger>
          ))}
        </TabsList>

        {TAB_KEYS.map((key) => (
          <TabsContent key={key} value={key}>
            <DocEditor type={key} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
