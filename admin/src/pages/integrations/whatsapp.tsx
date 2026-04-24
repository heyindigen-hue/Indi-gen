import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { setSetting, getSettingsByCategory, SettingEntry } from '@/lib/settings';
import { PageHeader } from '@/components/common/PageHeader';
import { IntegrationCard } from '@/components/common/IntegrationCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { SendIcon } from '@/icons';

const FIELDS = [
  { key: 'whatsapp_phone_id', label: 'Phone Number ID', placeholder: '1234567890' },
  { key: 'whatsapp_access_token', label: 'Access Token', secret: true },
  { key: 'whatsapp_verify_token', label: 'Webhook Verify Token', secret: true },
];

interface WaTemplate {
  key: string;
  value: string;
}

export default function WhatsAppPage() {
  const [initialValues, setInitialValues] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const [testTo, setTestTo] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  const { data: settings } = useQuery<SettingEntry[]>({
    queryKey: ['settings', 'whatsapp'],
    queryFn: (): Promise<SettingEntry[]> => getSettingsByCategory('whatsapp'),
  });

  useEffect(() => {
    if (settings) {
      const vals: Record<string, string> = {};
      for (const s of settings) vals[s.key] = s.value;
      setInitialValues(vals);
      setStatus(
        vals.whatsapp_phone_id && vals.whatsapp_access_token ? 'connected' : 'disconnected',
      );
    }
  }, [settings]);

  const { data: allSettings = [] } = useQuery<WaTemplate[]>({
    queryKey: ['settings', 'wa_templates'],
    queryFn: (): Promise<WaTemplate[]> => api.get('/admin/settings?category=wa_template'),
  });

  const templates = allSettings.filter((s) => s.key.startsWith('wa_template_'));

  const handleSave = async (values: Record<string, string>) => {
    await Promise.all(Object.entries(values).map(([k, v]) => setSetting(k, v)));
    setStatus(
      values.whatsapp_phone_id && values.whatsapp_access_token ? 'connected' : 'disconnected',
    );
  };

  const handleTest = async () => {
    return api.post<{ ok: boolean; message: string }>('/admin/integrations/whatsapp/test');
  };

  const handleSendTest = async () => {
    if (!testTo) {
      toast.error('Enter a phone number');
      return;
    }
    setSendingTest(true);
    try {
      await api.post('/admin/integrations/whatsapp/send-test', { to: testTo });
      toast.success(`Test message sent to ${testTo}`);
    } catch {
      toast.error('Failed to send test message');
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div>
      <PageHeader title="WhatsApp" description="WhatsApp Business API via Meta Cloud API" />
      <div className="max-w-2xl">
        <IntegrationCard
          name="WhatsApp Business"
          status={status}
          docsUrl="https://developers.facebook.com/docs/whatsapp/cloud-api"
          fields={FIELDS}
          initialValues={initialValues}
          onSave={handleSave}
          onTest={handleTest}
        >
          {templates.length > 0 && (
            <div className="rounded-md bg-muted/50 border border-border px-3 py-3">
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                <SendIcon size={14} />
                Templates
              </p>
              <div className="space-y-1.5">
                {templates.map((t) => (
                  <div key={t.key} className="flex items-start gap-2">
                    <span className="text-xs font-mono text-muted-foreground shrink-0">{t.key}</span>
                    <span className="text-xs text-foreground truncate">{t.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-md bg-muted/50 border border-border px-3 py-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">Send test message</p>
            <div className="flex gap-2">
              <Input
                placeholder="+91 98765 43210"
                value={testTo}
                onChange={(e) => setTestTo(e.target.value)}
                className="text-sm"
              />
              <Button size="sm" variant="outline" onClick={handleSendTest} disabled={sendingTest}>
                {sendingTest ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>
        </IntegrationCard>
      </div>
    </div>
  );
}
