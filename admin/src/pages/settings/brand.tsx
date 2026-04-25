import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useRegisterCommand } from '@/store/commands';

type BrandSettings = {
  logo_light_url: string;
  logo_dark_url: string;
  accent_color: string;
  favicon_url: string;
  app_name: string;
  tagline: string;
  support_email: string;
};

type BrandState = {
  logoLightUrl: string;
  logoDarkUrl: string;
  accentColor: string;
  faviconUrl: string;
  appName: string;
  tagline: string;
  supportEmail: string;
};

function fromApi(data: BrandSettings): BrandState {
  return {
    logoLightUrl: data.logo_light_url,
    logoDarkUrl: data.logo_dark_url,
    accentColor: data.accent_color,
    faviconUrl: data.favicon_url,
    appName: data.app_name,
    tagline: data.tagline,
    supportEmail: data.support_email,
  };
}

const DEFAULTS: BrandState = {
  logoLightUrl: '',
  logoDarkUrl: '',
  accentColor: '#6366f1',
  faviconUrl: '',
  appName: '',
  tagline: '',
  supportEmail: '',
};

export default function BrandPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<BrandSettings>({
    queryKey: ['settings-brand'],
    queryFn: () => api.get<BrandSettings>('/admin/settings/brand'),
  });

  const [form, setForm] = useState<BrandState>(DEFAULTS);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (data) {
      const parsed = fromApi(data);
      setForm(parsed);
      setDirty(false);
    }
  }, [data]);

  useEffect(() => {
    if (form.accentColor) {
      document.documentElement.style.setProperty('--primary', form.accentColor);
    }
  }, [form.accentColor]);

  const mutation = useMutation({
    mutationFn: (values: BrandState) =>
      api.patch('/admin/settings/brand', {
        logo_light_url: values.logoLightUrl,
        logo_dark_url: values.logoDarkUrl,
        accent_color: values.accentColor,
        favicon_url: values.faviconUrl,
        app_name: values.appName,
        tagline: values.tagline,
        support_email: values.supportEmail,
      }),
    onSuccess: () => {
      toast.success('Brand settings saved');
      qc.invalidateQueries({ queryKey: ['settings-brand'] });
      setDirty(false);
    },
    onError: () => {
      toast.error('Failed to save brand settings');
    },
  });

  function set<K extends keyof BrandState>(key: K, value: BrandState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }

  function handleCancel() {
    if (data) {
      setForm(fromApi(data));
    } else {
      setForm(DEFAULTS);
    }
    setDirty(false);
  }

  useRegisterCommand(
    {
      id: 'settings.brand',
      label: 'Brand settings',
      group: 'Settings',
      action: () => navigate('/settings/brand'),
    },
    [navigate],
  );

  return (
    <div>
      <PageHeader
        title="Brand"
        subtitle="Customize your app's visual identity and contact details"
        actions={
          <>
            <Button variant="outline" onClick={handleCancel} disabled={!dirty || mutation.isPending}>
              Cancel
            </Button>
            <Button onClick={() => mutation.mutate(form)} disabled={!dirty || mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </>
        }
      />

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 rounded bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-6 max-w-2xl">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="appName">App name</Label>
              <Input
                id="appName"
                value={form.appName}
                onChange={(e) => set('appName', e.target.value)}
                placeholder="My App"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={form.tagline}
                onChange={(e) => set('tagline', e.target.value)}
                placeholder="Short description"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="supportEmail">Support email</Label>
            <Input
              id="supportEmail"
              type="email"
              value={form.supportEmail}
              onChange={(e) => set('supportEmail', e.target.value)}
              placeholder="support@example.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="logoLight">Logo (light mode URL)</Label>
              <Input
                id="logoLight"
                value={form.logoLightUrl}
                onChange={(e) => set('logoLightUrl', e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="logoDark">Logo (dark mode URL)</Label>
              <Input
                id="logoDark"
                value={form.logoDarkUrl}
                onChange={(e) => set('logoDarkUrl', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="favicon">Favicon URL</Label>
            <Input
              id="favicon"
              value={form.faviconUrl}
              onChange={(e) => set('faviconUrl', e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-1.5">
            <Label>Accent color</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.accentColor}
                onChange={(e) => set('accentColor', e.target.value)}
                className="h-9 w-10 cursor-pointer rounded border border-input bg-background p-0.5"
              />
              <Input
                value={form.accentColor}
                onChange={(e) => set('accentColor', e.target.value)}
                placeholder="#6366f1"
                className="w-36 font-mono"
              />
            </div>
          </div>

          <div
            className={cn(
              'rounded-lg border p-4 space-y-1',
            )}
            style={{ borderColor: form.accentColor || undefined }}
          >
            <p className="font-bold text-foreground">{form.appName || 'App name'}</p>
            <p className="text-sm text-muted-foreground">{form.tagline || 'Your tagline here'}</p>
          </div>
        </div>
      )}
    </div>
  );
}
