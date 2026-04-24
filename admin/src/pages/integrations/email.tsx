import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { setSetting, getSettingsByCategory, SettingEntry } from '@/lib/settings';
import { PageHeader } from '@/components/common/PageHeader';
import { IntegrationCard } from '@/components/common/IntegrationCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const FIELDS = [
  { key: 'resend_api_key', label: 'Resend API Key', secret: true, placeholder: 're_...' },
  { key: 'email_from_name', label: 'From name', placeholder: 'Indi-gen' },
  { key: 'email_from_address', label: 'From address', placeholder: 'no-reply@indigenservices.com' },
  { key: 'email_reply_to', label: 'Reply-to', placeholder: 'support@indigenservices.com' },
];

interface EmailEvent {
  time: string;
  type: string;
  summary: string;
}

export default function EmailPage() {
  const [initialValues, setInitialValues] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const [testTo, setTestTo] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  const { data: settings } = useQuery<SettingEntry[]>({
    queryKey: ['settings', 'email'],
    queryFn: (): Promise<SettingEntry[]> => getSettingsByCategory('email'),
  });

  useEffect(() => {
    if (settings) {
      const vals: Record<string, string> = {};
      for (const s of settings) vals[s.key] = s.value;
      setInitialValues(vals);
      setStatus(vals.resend_api_key ? 'connected' : 'disconnected');
    }
  }, [settings]);

  const { data: events = [] } = useQuery<EmailEvent[]>({
    queryKey: ['email-send-events'],
    queryFn: (): Promise<EmailEvent[]> =>
      api.get('/admin/notifications?channel=email&limit=20'),
  });

  const handleSave = async (values: Record<string, string>) => {
    await Promise.all(Object.entries(values).map(([k, v]) => setSetting(k, v)));
    setStatus(values.resend_api_key ? 'connected' : 'disconnected');
  };

  const handleTest = async () => {
    return api.post<{ ok: boolean; message: string }>('/admin/integrations/email/test');
  };

  const handleSendTest = async () => {
    if (!testTo) {
      toast.error('Enter a recipient address');
      return;
    }
    setSendingTest(true);
    try {
      await api.post('/admin/integrations/email/send-test', { to: testTo });
      toast.success(`Test email sent to ${testTo}`);
    } catch {
      toast.error('Failed to send test email');
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div>
      <PageHeader title="Email" description="Transactional email via Resend" />
      <div className="max-w-2xl">
        <IntegrationCard
          name="Resend"
          status={status}
          docsUrl="https://resend.com/docs"
          fields={FIELDS}
          initialValues={initialValues}
          events={events}
          onSave={handleSave}
          onTest={handleTest}
        >
          <div className="rounded-md bg-muted/50 border border-border px-3 py-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">Send a test email</p>
            <div className="flex gap-2">
              <Input
                placeholder="recipient@example.com"
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
