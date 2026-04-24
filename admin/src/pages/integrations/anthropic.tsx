import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { setSetting, getSettingsByCategory, SettingEntry } from '@/lib/settings';
import { PageHeader } from '@/components/common/PageHeader';
import { IntegrationCard } from '@/components/common/IntegrationCard';
import { KpiCard } from '@/components/common/KpiCard';
import { ZapIcon, CashIcon } from '@/icons';
import { formatINR } from '@/lib/utils';

const FIELDS = [
  { key: 'claude_api_key', label: 'Claude API Key', secret: true, placeholder: 'sk-ant-...' },
  {
    key: 'ai_model_filter',
    label: 'Model for filtering',
    type: 'select' as const,
    options: [
      { value: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5 (fastest)' },
      { value: 'claude-sonnet-4-6', label: 'Sonnet 4.6 (balanced)' },
      { value: 'claude-opus-4-7', label: 'Opus 4.7 (smartest)' },
    ],
  },
  {
    key: 'ai_model_drafts',
    label: 'Model for drafts',
    type: 'select' as const,
    options: [
      { value: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5 (fastest)' },
      { value: 'claude-sonnet-4-6', label: 'Sonnet 4.6 (balanced)' },
      { value: 'claude-opus-4-7', label: 'Opus 4.7 (smartest)' },
    ],
  },
];

interface MonthlyUsage {
  tokens: number;
  cost_inr: number;
}

interface TestResult {
  ok: boolean;
  message: string;
  response?: string;
}

export default function AnthropicPage() {
  const [initialValues, setInitialValues] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const [pingResult, setPingResult] = useState<string | null>(null);

  const { data: settings } = useQuery<SettingEntry[]>({
    queryKey: ['settings', 'anthropic'],
    queryFn: (): Promise<SettingEntry[]> => getSettingsByCategory('anthropic'),
  });

  useEffect(() => {
    if (settings) {
      const vals: Record<string, string> = {};
      for (const s of settings) vals[s.key] = s.value;
      setInitialValues(vals);
      setStatus(vals.claude_api_key ? 'connected' : 'disconnected');
    }
  }, [settings]);

  const { data: monthlyUsage, isLoading: loadingUsage } = useQuery<MonthlyUsage>({
    queryKey: ['admin-ai-usage-monthly'],
    queryFn: (): Promise<MonthlyUsage> => api.get('/admin/ai-usage?range=30d'),
  });

  const handleSave = async (values: Record<string, string>) => {
    await Promise.all(Object.entries(values).map(([k, v]) => setSetting(k, v)));
    setStatus(values.claude_api_key ? 'connected' : 'disconnected');
  };

  const handleTest = async (): Promise<{ ok: boolean; message: string }> => {
    const res = await api.post<TestResult>('/admin/integrations/anthropic/test');
    if (res.response) setPingResult(res.response);
    return { ok: res.ok, message: res.message };
  };

  return (
    <div>
      <PageHeader title="Anthropic" description="Claude AI integration for filtering and drafting" />

      <div className="max-w-2xl space-y-5">
        <div className="grid grid-cols-2 gap-4">
          {loadingUsage ? (
            <>
              <KpiCard title="" value="" loading />
              <KpiCard title="" value="" loading />
            </>
          ) : (
            <>
              <KpiCard
                title="Tokens this month"
                value={monthlyUsage ? (monthlyUsage.tokens / 1000).toFixed(1) + 'K' : '—'}
                icon={ZapIcon}
              />
              <KpiCard
                title="Cost this month"
                value={monthlyUsage ? formatINR(monthlyUsage.cost_inr) : '—'}
                icon={CashIcon}
              />
            </>
          )}
        </div>

        <IntegrationCard
          name="Anthropic / Claude"
          status={status}
          docsUrl="https://docs.anthropic.com"
          fields={FIELDS}
          initialValues={initialValues}
          onSave={handleSave}
          onTest={handleTest}
        >
          {pingResult && (
            <div className="rounded-md bg-muted/50 border border-border px-3 py-3">
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Ping response</p>
              <p className="text-xs text-foreground font-mono whitespace-pre-wrap">{pingResult}</p>
            </div>
          )}
        </IntegrationCard>
      </div>
    </div>
  );
}
