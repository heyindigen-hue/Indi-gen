import { useState } from 'react';
import { ExternalLink, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusPill } from './StatusPill';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export interface IntegrationField {
  key: string;
  label: string;
  secret?: boolean;
  placeholder?: string;
  type?: 'text' | 'select';
  options?: Array<{ value: string; label: string }>;
}

export interface IntegrationEvent {
  time: string;
  type: string;
  summary: string;
}

interface IntegrationCardProps {
  name: string;
  logo?: React.ReactNode;
  status: 'connected' | 'disconnected' | 'error';
  docsUrl?: string;
  fields: IntegrationField[];
  initialValues?: Record<string, string>;
  events?: IntegrationEvent[];
  onSave: (values: Record<string, string>) => Promise<void>;
  onTest?: () => Promise<{ ok: boolean; message: string }>;
  children?: React.ReactNode;
}

const STATUS_VARIANT = {
  connected: 'success',
  disconnected: 'muted',
  error: 'error',
} as const;

export function IntegrationCard({
  name,
  logo,
  status,
  docsUrl,
  fields,
  initialValues = {},
  events,
  onSave,
  onTest,
  children,
}: IntegrationCardProps) {
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(values);
      toast.success(`${name} settings saved`);
    } catch {
      toast.error(`Failed to save ${name} settings`);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!onTest) return;
    setTesting(true);
    setTestResult(null);
    try {
      const result = await onTest();
      setTestResult(result);
      if (result.ok) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch {
      setTestResult({ ok: false, message: 'Test failed' });
      toast.error('Test failed');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          {logo && <div className="h-8 w-8 flex items-center justify-center">{logo}</div>}
          <div>
            <h3 className="text-sm font-semibold text-foreground">{name}</h3>
            <div className="mt-0.5">
              <StatusPill
                label={status}
                variant={STATUS_VARIANT[status]}
              />
            </div>
          </div>
        </div>
        {docsUrl && (
          <a
            href={docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            Docs <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      <div className="p-5 space-y-5">
        {/* Fields */}
        <div className="space-y-3">
          {fields.map((field) => (
            <div key={field.key}>
              <Label className="text-xs text-muted-foreground mb-1.5 block">{field.label}</Label>
              {field.type === 'select' && field.options ? (
                <select
                  value={values[field.key] ?? ''}
                  onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                  className={cn(
                    'w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm',
                    'focus:outline-none focus:ring-1 focus:ring-ring',
                    'text-foreground',
                  )}
                >
                  <option value="">Select...</option>
                  {field.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="relative">
                  <Input
                    type={field.secret && !revealed[field.key] ? 'password' : 'text'}
                    placeholder={field.placeholder ?? (field.secret ? '••••••••' : '')}
                    value={values[field.key] ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                    className="pr-16 font-mono text-xs"
                  />
                  {field.secret && (
                    <button
                      type="button"
                      onClick={() => setRevealed((r) => ({ ...r, [field.key]: !r[field.key] }))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      {revealed[field.key] ? 'Hide' : 'Show'}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Extra children (webhook URL, info blocks, etc.) */}
        {children}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
          {onTest && (
            <Button size="sm" variant="outline" onClick={handleTest} disabled={testing}>
              <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', testing && 'animate-spin')} />
              {testing ? 'Testing...' : 'Test connection'}
            </Button>
          )}
          {testResult && (
            <span
              className={cn(
                'flex items-center gap-1 text-xs',
                testResult.ok ? 'text-green-500' : 'text-red-500',
              )}
            >
              {testResult.ok ? (
                <CheckCircle className="h-3.5 w-3.5" />
              ) : (
                <XCircle className="h-3.5 w-3.5" />
              )}
              {testResult.message}
            </span>
          )}
        </div>

        {/* Events */}
        {events && events.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" />
              Recent events
            </p>
            <div className="rounded-md border border-border divide-y divide-border max-h-56 overflow-y-auto">
              {events.map((evt, i) => (
                <div key={i} className="flex items-start gap-3 px-3 py-2">
                  <span className="text-xs text-muted-foreground shrink-0 w-28 truncate">{evt.time}</span>
                  <span className="text-xs font-medium text-foreground shrink-0 w-24 truncate">{evt.type}</span>
                  <span className="text-xs text-muted-foreground truncate">{evt.summary}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
