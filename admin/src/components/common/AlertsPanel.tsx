import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { relTime } from '@/lib/utils';
import { api } from '@/lib/api';

interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message?: string;
  created_at: string;
}

const severityOrder: Alert['severity'][] = ['critical', 'warning', 'info'];

function severityDot(severity: Alert['severity']) {
  const classes = {
    critical: 'bg-red-500',
    warning: 'bg-amber-500',
    info: 'bg-blue-500',
  };
  return <span className={cn('h-2 w-2 rounded-full shrink-0 mt-0.5', classes[severity])} />;
}

function severityIcon(severity: Alert['severity']) {
  if (severity === 'critical') return <XCircle className="h-4 w-4 text-red-500" />;
  if (severity === 'warning') return <AlertTriangle className="h-4 w-4 text-amber-500" />;
  return <Info className="h-4 w-4 text-blue-500" />;
}

export function AlertsPanel() {
  const qc = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery<Alert[]>({
    queryKey: ['admin-alerts'],
    queryFn: () => api.get<Alert[]>('/admin/alerts'),
    staleTime: 30_000,
  });

  async function ackAlert(id: string) {
    qc.setQueryData<Alert[]>(['admin-alerts'], (prev) => (prev ?? []).filter((a) => a.id !== id));
    try {
      await api.post(`/admin/alerts/${id}/ack`);
    } catch {
      toast.error('Failed to acknowledge alert');
      await qc.invalidateQueries({ queryKey: ['admin-alerts'] });
    }
  }

  const grouped = severityOrder
    .map((sev) => ({ sev, items: alerts.filter((a) => a.severity === sev) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="rounded-lg border border-border bg-card flex flex-col h-[420px]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border shrink-0">
        <span className="text-sm font-medium text-foreground">Alerts</span>
        {alerts.length > 0 && (
          <span className="ml-2 text-xs bg-red-500/10 text-red-500 rounded-full px-1.5 py-0.5">
            {alerts.length}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
            <CheckCircle className="h-8 w-8 text-green-500/60" />
            <p className="text-sm">All clear</p>
          </div>
        ) : (
          <div>
            {grouped.map(({ sev, items }) => (
              <div key={sev}>
                <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30">
                  {sev}
                </div>
                {items.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 px-4 py-3 border-b border-border/50 hover:bg-muted/20 transition-colors"
                  >
                    <span className="mt-0.5">{severityIcon(alert.severity)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">{alert.title}</p>
                      {alert.message && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{alert.message}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">{relTime(alert.created_at)}</p>
                    </div>
                    <button
                      onClick={() => void ackAlert(alert.id)}
                      className="shrink-0 text-[10px] text-muted-foreground hover:text-foreground border border-border rounded px-1.5 py-0.5 transition-colors"
                    >
                      Ack
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Severity legend */}
      <div className="flex items-center gap-3 px-4 py-2 border-t border-border shrink-0">
        {(['critical', 'warning', 'info'] as const).map((sev) => (
          <span key={sev} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            {severityDot(sev)} {sev}
          </span>
        ))}
      </div>
    </div>
  );
}
