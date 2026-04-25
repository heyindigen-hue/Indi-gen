import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
} from 'recharts';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type Range = '7d' | '30d' | '90d' | 'custom';

type InsightsData = {
  leads_per_day: { date: string; count: number }[];
  reply_rate_trend: { date: string; rate: number }[];
  token_burn: { date: string; used: number; limit: number }[];
  top_phrases: { phrase: string; leads_count: number }[];
  top_icps: { icp: string; leads_count: number; reply_rate: number }[];
};

const RANGE_BUTTONS: { label: string; value: Range }[] = [
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
  { label: 'Custom', value: 'custom' },
];

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-48 w-full rounded-md" />
      </CardContent>
    </Card>
  );
}

function TableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-36" />
      </CardHeader>
      <CardContent className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}

type TokenBarEntry = {
  date: string;
  used: number;
  remaining: number;
};

function buildTokenData(raw: InsightsData['token_burn']): TokenBarEntry[] {
  return raw.map((d) => ({
    date: d.date,
    used: d.used,
    remaining: Math.max(0, d.limit - d.used),
  }));
}

export default function Insights() {
  const [range, setRange] = useState<Range>('30d');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const queryParams = new URLSearchParams({ range });
  if (range === 'custom') {
    if (from) queryParams.set('from', from);
    if (to) queryParams.set('to', to);
  }

  const { data, isLoading } = useQuery<InsightsData>({
    queryKey: ['insights', range, from, to],
    queryFn: () => api.get<InsightsData>(`/insights?${queryParams.toString()}`),
    enabled: range !== 'custom' || (Boolean(from) && Boolean(to)),
  });

  const sortedPhrases = data
    ? [...data.top_phrases].sort((a, b) => b.leads_count - a.leads_count)
    : [];
  const sortedIcps = data
    ? [...data.top_icps].sort((a, b) => b.reply_rate - a.reply_rate)
    : [];
  const tokenData = data ? buildTokenData(data.token_burn) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-['Fraunces'] italic text-2xl font-semibold tracking-tight">
          Insights
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Your personal KPI analytics.</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {RANGE_BUTTONS.map((btn) => (
          <Button
            key={btn.value}
            variant={range === btn.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setRange(btn.value)}
          >
            {btn.label}
          </Button>
        ))}
        {range === 'custom' && (
          <div className="flex items-center gap-2 ml-2">
            <Input
              type="date"
              className="h-8 w-36 text-sm"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <span className="text-muted-foreground text-sm">to</span>
            <Input
              type="date"
              className="h-8 w-36 text-sm"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        )}
      </div>

      {isLoading ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
          <ChartSkeleton />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TableSkeleton />
            <TableSkeleton />
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Leads Scraped</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={data?.leads_per_day ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#f97316"
                      fill="#f9731633"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Reply Rate Trend %</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={data?.reply_rate_trend ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                      unit="%"
                    />
                    <Tooltip formatter={(v: number) => [`${v}%`, 'Reply Rate']} />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      stroke="#f97316"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Token Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={tokenData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Bar dataKey="used" name="Used" stackId="a" fill="#f97316" />
                  <Bar dataKey="remaining" name="Remaining" stackId="a" fill="#f9731633" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Top Phrases</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Phrase</TableHead>
                      <TableHead className="text-right">Leads</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedPhrases.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground text-sm py-8">
                          No data
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedPhrases.map((row) => (
                        <TableRow key={row.phrase}>
                          <TableCell className="text-sm">{row.phrase}</TableCell>
                          <TableCell className="text-right text-sm font-medium">
                            {row.leads_count}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Top ICPs</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ICP</TableHead>
                      <TableHead className="text-right">Leads</TableHead>
                      <TableHead className="text-right">Reply %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedIcps.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground text-sm py-8">
                          No data
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedIcps.map((row) => (
                        <TableRow key={row.icp}>
                          <TableCell className="text-sm">{row.icp}</TableCell>
                          <TableCell className="text-right text-sm">{row.leads_count}</TableCell>
                          <TableCell className="text-right text-sm font-medium">
                            {row.reply_rate.toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
