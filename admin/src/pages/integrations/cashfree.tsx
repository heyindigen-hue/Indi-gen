import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LinkIcon, RefreshIcon } from '@/icons';
import { api } from '@/lib/api';
import { setSetting, getSettingsByCategory, SettingEntry } from '@/lib/settings';
import { PageHeader } from '@/components/common/PageHeader';
import { IntegrationCard } from '@/components/common/IntegrationCard';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRegisterCommand } from '@/store/commands';
import { useNavigate } from 'react-router-dom';

const WEBHOOK_URL = 'https://leadgen.indigenservices.com/webhook/cashfree';

const FIELDS = [
  { key: 'cashfree_app_id', label: 'App ID', placeholder: 'your-app-id' },
  { key: 'cashfree_secret_key', label: 'Secret Key', secret: true },
  { key: 'cashfree_webhook_secret', label: 'Webhook Secret', secret: true },
  {
    key: 'cashfree_env',
    label: 'Environment',
    type: 'select' as const,
    options: [
      { value: 'test', label: 'Test (Sandbox)' },
      { value: 'production', label: 'Production' },
    ],
  },
];

interface WebhookEvent {
  time: string;
  type: string;
  summary: string;
}

export default function CashfreePage() {
  const navigate = useNavigate();
  const [initialValues, setInitialValues] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');

  const { data: settings } = useQuery<SettingEntry[]>({
    queryKey: ['settings', 'cashfree'],
    queryFn: (): Promise<SettingEntry[]> => getSettingsByCategory('cashfree'),
  });

  useEffect(() => {
    if (settings) {
      const vals: Record<string, string> = {};
      for (const s of settings) vals[s.key] = s.value;
      setInitialValues(vals);
      setStatus(vals.cashfree_app_id ? 'connected' : 'disconnected');
    }
  }, [settings]);

  const { data: events = [] } = useQuery<WebhookEvent[]>({
    queryKey: ['cashfree-webhook-events'],
    queryFn: (): Promise<WebhookEvent[]> =>
      api.get('/admin/webhooks/log?provider=cashfree&limit=20'),
  });

  const handleSave = async (values: Record<string, string>) => {
    await Promise.all(Object.entries(values).map(([k, v]) => setSetting(k, v)));
    setStatus(values.cashfree_app_id ? 'connected' : 'disconnected');
  };

  const handleTest = async () => {
    return api.post<{ ok: boolean; message: string }>('/admin/integrations/cashfree/test');
  };

  const handlePlanSync = async () => {
    try {
      await api.post('/admin/integrations/cashfree/sync-plans');
      toast.success('Plans synced to Cashfree');
    } catch {
      toast.error('Plan sync failed');
    }
  };

  useRegisterCommand(
    {
      id: 'test-cashfree',
      label: 'Test Cashfree',
      group: 'Integrations',
      action: () => navigate('/integrations/cashfree#test'),
    },
    [navigate],
  );

  return (
    <div>
      <PageHeader
        title="Cashfree"
        description="Payment gateway integration for subscriptions and billing"
        actions={
          <Button size="sm" variant="outline" onClick={handlePlanSync}>
            <RefreshIcon size={14} className="mr-1.5" />
            Sync plans
          </Button>
        }
      />
      <div className="max-w-2xl">
        <IntegrationCard
          name="Cashfree Payments"
          status={status}
          docsUrl="https://docs.cashfree.com"
          fields={FIELDS}
          initialValues={initialValues}
          events={events}
          onSave={handleSave}
          onTest={handleTest}
        >
          <div className="rounded-md bg-muted/50 border border-border px-3 py-3">
            <p className="text-xs font-medium text-muted-foreground mb-1.5">
              Paste this webhook URL in your Cashfree dashboard
            </p>
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono text-foreground flex-1 truncate">{WEBHOOK_URL}</code>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 shrink-0"
                onClick={() => {
                  navigator.clipboard.writeText(WEBHOOK_URL);
                  toast.success('Copied');
                }}
              >
                <LinkIcon size={14} />
              </Button>
            </div>
          </div>
        </IntegrationCard>
      </div>
    </div>
  );
}
