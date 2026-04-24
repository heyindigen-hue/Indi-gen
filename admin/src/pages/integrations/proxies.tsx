import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { setSetting, getSettingsByCategory, SettingEntry } from '@/lib/settings';
import { PageHeader } from '@/components/common/PageHeader';
import { IntegrationCard } from '@/components/common/IntegrationCard';

const FIELDS = [
  {
    key: 'proxy_provider',
    label: 'Proxy provider',
    type: 'select' as const,
    options: [
      { value: 'iproyal', label: 'IPRoyal' },
      { value: 'brightdata', label: 'Bright Data' },
      { value: 'oxylabs', label: 'Oxylabs' },
      { value: 'custom', label: 'Custom' },
    ],
  },
  {
    key: 'proxy_url',
    label: 'Proxy URL',
    secret: true,
    placeholder: 'http://user:pass@host:port',
  },
];

interface ProxyHealth {
  ok: boolean;
  message?: string;
  ip?: string;
  country?: string;
  city?: string;
  sessions_available?: number;
  latency_ms?: number;
}

export default function ProxiesPage() {
  const [initialValues, setInitialValues] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const [health, setHealth] = useState<ProxyHealth | null>(null);

  const { data: settings } = useQuery<SettingEntry[]>({
    queryKey: ['settings', 'proxies'],
    queryFn: (): Promise<SettingEntry[]> => getSettingsByCategory('proxy'),
  });

  useEffect(() => {
    if (settings) {
      const vals: Record<string, string> = {};
      for (const s of settings) vals[s.key] = s.value;
      setInitialValues(vals);
      setStatus(vals.proxy_url ? 'connected' : 'disconnected');
    }
  }, [settings]);

  const handleSave = async (values: Record<string, string>) => {
    await Promise.all(Object.entries(values).map(([k, v]) => setSetting(k, v)));
    setStatus(values.proxy_url ? 'connected' : 'disconnected');
    setHealth(null);
  };

  const handleTest = async () => {
    const res = await api.post<ProxyHealth>('/admin/integrations/proxies/health');
    setHealth(res);
    return {
      ok: res.ok,
      message: res.message ?? (res.ok ? 'Proxy is healthy' : 'Proxy check failed'),
    };
  };

  return (
    <div>
      <PageHeader title="Proxies" description="Residential proxy configuration for scraping" />
      <div className="max-w-2xl space-y-5">
        <IntegrationCard
          name="Proxy Pool"
          status={status}
          fields={FIELDS}
          initialValues={initialValues}
          onSave={handleSave}
          onTest={handleTest}
        >
          {health && health.ok && (
            <div className="rounded-md bg-muted/50 border border-border px-3 py-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Pool info</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'IP', value: health.ip ?? '—' },
                  {
                    label: 'Location',
                    value:
                      health.city && health.country
                        ? `${health.city}, ${health.country}`
                        : '—',
                  },
                  {
                    label: 'Sessions available',
                    value: health.sessions_available?.toString() ?? '—',
                  },
                  { label: 'Latency', value: health.latency_ms ? `${health.latency_ms}ms` : '—' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="text-xs text-muted-foreground">{item.label}</div>
                    <div className="text-xs font-medium text-foreground font-mono">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </IntegrationCard>
      </div>
    </div>
  );
}
