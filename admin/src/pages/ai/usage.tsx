import { useQuery } from '@tanstack/react-query';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { ZapIcon, CashIcon, ChartIcon, ClockIcon } from '@/icons';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/common/PageHeader';
import { KpiCard } from '@/components/common/KpiCard';
import { Skeleton } from '@/components/ui/skeleton';
import { formatINR } from '@/lib/utils';

interface UsageKpis {
  total_tokens: number;
  total_cost_inr: number;
  cache_hit_rate: number;
  avg_latency_ms: number;
}

interface DayBucket {
  date: string;
  haiku: number;
  sonnet: number;
  opus: number;
  cost_inr: number;
}

interface UsageCall {
  id: string;
  user_email: string;
  prompt_id: string;
  model: string;
  tokens_in: number;
  tokens_out: number;
  cost_inr: number;
  latency_ms: number;
  created_at: string;
}

interface UsageData {
  kpis: UsageKpis;
  daily: DayBucket[];
  calls: UsageCall[];
}

const MODEL_COLORS = {
  haiku: '#6366f1',
  sonnet: '#8b5cf6',
  opus: '#ec4899',
};

export default function AiUsagePage() {
  const { data, isLoading } = useQuery<UsageData>({
    queryKey: ['admin-ai-usage'],
    queryFn: () => api.get('/admin/ai-usage?range=7d'),
  });

  const kpis = data?.kpis;
  const daily = data?.daily ?? [];
  const calls = data?.calls ?? [];

  return (
    <div>
      <PageHeader title="AI Usage" description="Token consumption, cost, and latency over the last 7 days" />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <KpiCard key={i} title="" value="" loading />)
        ) : (
          <>
            <KpiCard
              title="Total tokens (7d)"
              value={kpis ? (kpis.total_tokens / 1000).toFixed(1) + 'K' : '—'}
              icon={ZapIcon}
            />
            <KpiCard
              title="Total cost (7d)"
              value={kpis ? formatINR(kpis.total_cost_inr) : '—'}
              icon={CashIcon}
            />
            <KpiCard
              title="Cache hit rate"
              value={kpis ? kpis.cache_hit_rate.toFixed(1) + '%' : '—'}
              icon={ChartIcon}
            />
            <KpiCard
              title="Avg latency"
              value={kpis ? kpis.avg_latency_ms.toFixed(0) + ' ms' : '—'}
              icon={ClockIcon}
            />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        {/* Tokens area chart */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-medium text-foreground mb-4">Tokens / day by model</h3>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={192}>
              <AreaChart data={daily} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="haiku"
                  stackId="1"
                  stroke={MODEL_COLORS.haiku}
                  fill={MODEL_COLORS.haiku}
                  fillOpacity={0.3}
                />
                <Area
                  type="monotone"
                  dataKey="sonnet"
                  stackId="1"
                  stroke={MODEL_COLORS.sonnet}
                  fill={MODEL_COLORS.sonnet}
                  fillOpacity={0.3}
                />
                <Area
                  type="monotone"
                  dataKey="opus"
                  stackId="1"
                  stroke={MODEL_COLORS.opus}
                  fill={MODEL_COLORS.opus}
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Cost bar chart */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-medium text-foreground mb-4">Cost ₹ / day</h3>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={192}>
              <BarChart data={daily} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  formatter={(v: number) => formatINR(v)}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="cost_inr" name="Cost (₹)" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Calls table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-medium text-foreground">Recent calls</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                {['User', 'Prompt', 'Model', 'Tokens in', 'Tokens out', 'Cost', 'Latency', 'Time'].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-left font-medium text-muted-foreground whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 py-2.5">
                          <Skeleton className="h-3 w-20" />
                        </td>
                      ))}
                    </tr>
                  ))
                : calls.slice(0, 50).map((c) => (
                    <tr key={c.id} className="hover:bg-accent/40 transition-colors">
                      <td className="px-4 py-2.5 text-foreground max-w-[140px] truncate">{c.user_email}</td>
                      <td className="px-4 py-2.5 text-muted-foreground font-mono">{c.prompt_id}</td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300">
                          {c.model}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground tabular-nums">
                        {c.tokens_in.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground tabular-nums">
                        {c.tokens_out.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground tabular-nums">
                        {formatINR(c.cost_inr)}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground tabular-nums">
                        {c.latency_ms}ms
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{c.created_at}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
          {!isLoading && calls.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">No calls in range</div>
          )}
        </div>
      </div>
    </div>
  );
}
