import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { setSetting, getSettingsByCategory, SettingEntry } from '@/lib/settings';
import { PageHeader } from '@/components/common/PageHeader';
import { IntegrationCard } from '@/components/common/IntegrationCard';
import { KpiCard } from '@/components/common/KpiCard';
import { CreditCardIcon } from '@/icons';

const FIELDS = [
  { key: 'signalhire_api_key', label: 'API Key', secret: true, placeholder: 'sh-...' },
];

interface CreditBalance {
  credits: number;
  used: number;
}

interface Callback {
  time: string;
  type: string;
  summary: string;
}

export default function SignalHirePage() {
  const [initialValues, setInitialValues] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');

  const { data: settings } = useQuery<SettingEntry[]>({
    queryKey: ['settings', 'signalhire'],
    queryFn: (): Promise<SettingEntry[]> => getSettingsByCategory('signalhire'),
  });

  useEffect(() => {
    if (settings) {
      const vals: Record<string, string> = {};
      for (const s of settings) vals[s.key] = s.value;
      setInitialValues(vals);
      setStatus(vals.signalhire_api_key ? 'connected' : 'disconnected');
    }
  }, [settings]);

  const { data: balance } = useQuery<CreditBalance>({
    queryKey: ['signalhire-credits'],
    queryFn: (): Promise<CreditBalance> => api.get('/admin/integrations/signalhire/credits'),
    enabled: status === 'connected',
  });

  const { data: callbacks = [] } = useQuery<Callback[]>({
    queryKey: ['signalhire-callbacks'],
    queryFn: (): Promise<Callback[]> =>
      api.get('/admin/integrations/signalhire/callbacks?limit=20'),
    enabled: status === 'connected',
  });

  const handleSave = async (values: Record<string, string>) => {
    await Promise.all(Object.entries(values).map(([k, v]) => setSetting(k, v)));
    setStatus(values.signalhire_api_key ? 'connected' : 'disconnected');
  };

  const handleTest = async () => {
    return api.post<{ ok: boolean; message: string }>('/admin/integrations/signalhire/test');
  };

  return (
    <div>
      <PageHeader
        title="SignalHire"
        description="Lead enrichment — contact and company data provider"
      />

      <div className="max-w-2xl space-y-5">
        {balance && (
          <div className="grid grid-cols-2 gap-4">
            <KpiCard
              title="Credits remaining"
              value={balance.credits.toLocaleString()}
              icon={CreditCardIcon}
            />
            <KpiCard title="Credits used (month)" value={balance.used.toLocaleString()} />
          </div>
        )}

        <IntegrationCard
          name="SignalHire"
          status={status}
          docsUrl="https://www.signalhire.com/api"
          fields={FIELDS}
          initialValues={initialValues}
          events={callbacks}
          onSave={handleSave}
          onTest={handleTest}
        />
      </div>
    </div>
  );
}
