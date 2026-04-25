import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { relTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MailIcon, ChevronRightIcon, AlertCircleIcon } from '@/icons';

type OutreachItem = {
  lead_id: string;
  lead_name: string;
  lead_company: string;
  lead_score: number;
  channel: 'LinkedIn' | 'Email' | 'WhatsApp';
  last_touched_at: string;
  draft_content: string;
  status: string;
};

type TabKey = 'drafts' | 'sent' | 'replied' | 'followup';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'drafts', label: 'Drafts' },
  { key: 'sent', label: 'Sent' },
  { key: 'replied', label: 'Replied' },
  { key: 'followup', label: 'Follow-up' },
];

function channelBadgeClass(channel: OutreachItem['channel']): string {
  if (channel === 'LinkedIn') return 'bg-blue-100 text-blue-700 border-blue-200';
  if (channel === 'Email') return 'bg-orange-100 text-orange-700 border-orange-200';
  return 'bg-green-100 text-green-700 border-green-200';
}

function isOverdue(lastTouchedAt: string): boolean {
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  return Date.now() - new Date(lastTouchedAt).getTime() > sevenDaysMs;
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
          <TableCell><Skeleton className="h-5 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-48" /></TableCell>
          <TableCell><Skeleton className="h-8 w-16" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

function EmptyState({ tab }: { tab: TabKey }) {
  const messages: Record<TabKey, string> = {
    drafts: 'No drafts yet.',
    sent: 'No sent outreach.',
    replied: 'No replies yet.',
    followup: 'No leads need follow-up.',
  };
  return (
    <TableRow>
      <TableCell colSpan={6}>
        <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
          <MailIcon className="h-8 w-8 opacity-40" />
          <p className="text-sm">{messages[tab]}</p>
        </div>
      </TableCell>
    </TableRow>
  );
}

function OutreachTable({ tab }: { tab: TabKey }) {
  const { data, isLoading } = useQuery<OutreachItem[]>({
    queryKey: ['outreach', tab],
    queryFn: () => api.get<OutreachItem[]>(`/outreach?tab=${tab}`),
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Lead</TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Channel</TableHead>
          <TableHead>Last Touch</TableHead>
          <TableHead>Draft Preview</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <SkeletonRows />
        ) : !data || data.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          data.map((item) => {
            const overdue = tab === 'followup' && isOverdue(item.last_touched_at);
            return (
              <TableRow
                key={item.lead_id}
                className={overdue ? 'bg-amber-50 dark:bg-amber-950/20' : undefined}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-1.5">
                    {overdue && (
                      <AlertCircleIcon className="h-4 w-4 text-amber-500 shrink-0" />
                    )}
                    {item.lead_name}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{item.lead_company}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${channelBadgeClass(item.channel)}`}
                  >
                    {item.channel}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                  {relTime(item.last_touched_at)}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm max-w-xs truncate">
                  {item.draft_content.length > 80
                    ? `${item.draft_content.slice(0, 80)}…`
                    : item.draft_content}
                </TableCell>
                <TableCell>
                  <Button asChild variant="ghost" size="sm">
                    <Link to={`/leads/${item.lead_id}`} className="flex items-center gap-1">
                      View
                      <ChevronRightIcon className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}

export default function Outreach() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-['Fraunces'] italic text-2xl font-semibold tracking-tight">
          Outreach
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your LinkedIn, email, and WhatsApp outreach.
        </p>
      </div>

      <Tabs defaultValue="drafts">
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.key} value={t.key}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((t) => (
          <TabsContent key={t.key} value={t.key} className="mt-4">
            <div className="rounded-md border overflow-hidden">
              <OutreachTable tab={t.key} />
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
