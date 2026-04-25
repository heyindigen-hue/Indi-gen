import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { relTime } from '@/lib/utils';
import { useAuth } from '@/store/auth';
import { FlowerMark, BRAND } from '@/components/auth/BrandShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ZapIcon,
  LeadIcon,
  SendIcon,
  ChartIcon,
  ScraperIcon,
  PlusIcon,
  FileTextIcon,
  CalendarIcon,
} from '@/icons';

type Stats = {
  token_balance: number;
  leads_this_week: number;
  outreach_sent: number;
  reply_rate: number;
  subscription_status: string;
  subscription_plan: string;
  next_renewal: string | null;
};

type Lead = {
  id: string;
  name: string;
  company: string;
  score: number;
  status: string;
  created_at: string;
};

function getScoreVariant(score: number): 'success' | 'warning' | 'destructive' {
  if (score >= 70) return 'success';
  if (score >= 40) return 'warning';
  return 'destructive';
}

function getScoreLabel(score: number): string {
  if (score >= 70) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Home() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ['stats'],
    queryFn: () => api.get<Stats>('/users/me/stats'),
  });

  const { data: recentLeads, isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ['leads', 'recent'],
    queryFn: () => api.get<Lead[]>('/leads?limit=5&sort=created_at:desc'),
  });

  const greeting = getGreeting();
  const firstName = user?.name?.split(' ')[0] ?? null;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-['Fraunces'] italic text-3xl font-bold text-foreground">
          {firstName ? `${greeting}, ${firstName}` : greeting}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here's what's happening with your leads today.
        </p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Token Balance
                </CardTitle>
                <ZapIcon size={16} className="text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.token_balance ?? 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Leads This Week
                </CardTitle>
                <LeadIcon size={16} className="text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.leads_this_week ?? 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Outreach Sent
                </CardTitle>
                <SendIcon size={16} className="text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.outreach_sent ?? 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Reply Rate
                </CardTitle>
                <ChartIcon size={16} className="text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats != null ? `${stats.reply_rate.toFixed(1)}%` : '0%'}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/scrape">
            <ScraperIcon size={16} />
            Run Scrape
          </Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link to="/leads">
            <PlusIcon size={16} />
            Add Lead
          </Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link to="/proposals">
            <FileTextIcon size={16} />
            New Proposal
          </Link>
        </Button>
      </div>

      {/* Recent Leads */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Leads</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/leads">View all</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {leadsLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !recentLeads || recentLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center">
              <FlowerMark size={72} />
              <p
                style={{
                  fontFamily: BRAND.fraunces,
                  fontStyle: 'italic',
                  fontSize: 18,
                  lineHeight: 1.45,
                  color: BRAND.ash,
                  maxWidth: 380,
                }}
              >
                Your hunt starts at 3am IST tonight. We&apos;ll email you when leads land.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLeads.map((lead) => (
                  <TableRow
                    key={lead.id}
                    className="cursor-pointer"
                    onClick={() => window.location.assign(`/leads/${lead.id}`)}
                  >
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>{lead.company}</TableCell>
                    <TableCell>
                      <Badge variant={getScoreVariant(lead.score)}>
                        {getScoreLabel(lead.score)} ({lead.score})
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{lead.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {relTime(lead.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Subscription Status */}
      {statsLoading ? (
        <Skeleton className="h-20 w-full" />
      ) : stats ? (
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <CalendarIcon size={18} className="text-orange-500" />
              <div>
                <p className="text-sm font-medium">
                  {stats.subscription_plan ?? 'Free'} Plan
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.next_renewal
                    ? `Renews ${new Date(stats.next_renewal).toLocaleDateString()}`
                    : 'No renewal scheduled'}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/settings/billing">Upgrade</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
