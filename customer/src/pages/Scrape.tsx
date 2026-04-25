import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { relTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScraperIcon, PlusIcon, TrashIcon, RefreshIcon, XIcon, ClockIcon } from '@/icons';

type JobStatus = 'running' | 'queued' | 'completed' | 'failed';

type Job = {
  id: string;
  status: JobStatus;
  leads_found: number;
  eta: string;
  created_at: string;
};

type Run = {
  id: string;
  created_at: string;
  phrases: string[];
  leads_found: number;
  duration_seconds: number;
  status: string;
};

type Phrase = {
  id: string;
  phrase: string;
  active: boolean;
};

type JobBadgeVariant = 'default' | 'secondary' | 'success' | 'destructive';

function jobBadgeVariant(status: JobStatus): JobBadgeVariant {
  const map: Record<JobStatus, JobBadgeVariant> = {
    running: 'default',
    queued: 'secondary',
    completed: 'success',
    failed: 'destructive',
  };
  return map[status];
}

function runStatusVariant(status: string): 'success' | 'destructive' | 'secondary' {
  if (status === 'completed') return 'success';
  if (status === 'failed') return 'destructive';
  return 'secondary';
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export default function Scrape() {
  const queryClient = useQueryClient();
  const [newPhrase, setNewPhrase] = useState('');

  const { data: jobs, isLoading: jobsLoading } = useQuery<Job[]>({
    queryKey: ['scrape', 'jobs'],
    queryFn: () => api.get<Job[]>('/scrape/jobs'),
    refetchInterval: (query) => {
      const data = query.state.data;
      const hasRunning = data?.some(
        (j) => j.status === 'running' || j.status === 'queued'
      );
      return hasRunning ? 5000 : false;
    },
  });

  const { data: runs, isLoading: runsLoading } = useQuery<Run[]>({
    queryKey: ['scrape', 'runs'],
    queryFn: () => api.get<Run[]>('/scrape/runs?limit=20'),
  });

  const { data: phrases, isLoading: phrasesLoading } = useQuery<Phrase[]>({
    queryKey: ['scrape', 'phrases'],
    queryFn: () => api.get<Phrase[]>('/scrape/phrases'),
  });

  const startScrape = useMutation({
    mutationFn: () => api.post('/scrape'),
    onSuccess: () => {
      toast.success('Scrape started');
      queryClient.invalidateQueries({ queryKey: ['scrape', 'jobs'] });
    },
    onError: () => toast.error('Failed to start scrape'),
  });

  const cancelJob = useMutation({
    mutationFn: (id: string) => api.delete(`/scrape/jobs/${id}`),
    onSuccess: () => {
      toast.success('Job cancelled');
      queryClient.invalidateQueries({ queryKey: ['scrape', 'jobs'] });
    },
    onError: () => toast.error('Failed to cancel job'),
  });

  const togglePhrase = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.patch(`/scrape/phrases/${id}`, { active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scrape', 'phrases'] }),
    onError: () => toast.error('Failed to update phrase'),
  });

  const deletePhrase = useMutation({
    mutationFn: (id: string) => api.delete(`/scrape/phrases/${id}`),
    onSuccess: () => {
      toast.success('Phrase deleted');
      queryClient.invalidateQueries({ queryKey: ['scrape', 'phrases'] });
    },
    onError: () => toast.error('Failed to delete phrase'),
  });

  const addPhrase = useMutation({
    mutationFn: (phrase: string) => api.post('/scrape/phrases', { phrase }),
    onSuccess: () => {
      toast.success('Phrase added');
      setNewPhrase('');
      queryClient.invalidateQueries({ queryKey: ['scrape', 'phrases'] });
    },
    onError: () => toast.error('Failed to add phrase'),
  });

  const handleAddPhrase = () => {
    const trimmed = newPhrase.trim();
    if (!trimmed) return;
    addPhrase.mutate(trimmed);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-['Fraunces'] italic text-2xl font-semibold tracking-tight">
            Scrape
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Run scrapes and manage your search phrases.
          </p>
        </div>
        <Button
          size="lg"
          onClick={() => startScrape.mutate()}
          disabled={startScrape.isPending}
          className="gap-2"
        >
          <ScraperIcon className="h-4 w-4" />
          Run Scrape
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <RefreshIcon className="h-4 w-4" />
            Active Jobs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {jobsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !jobs || jobs.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <ClockIcon className="h-7 w-7 opacity-40" />
              <p className="text-sm">No active jobs.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between rounded-md border px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant={jobBadgeVariant(job.status)}>
                      {job.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {job.leads_found} leads found
                    </span>
                    {job.eta && (
                      <span className="text-xs text-muted-foreground">ETA: {job.eta}</span>
                    )}
                  </div>
                  {(job.status === 'running' || job.status === 'queued') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => cancelJob.mutate(job.id)}
                      disabled={cancelJob.isPending}
                      className="h-8 gap-1 text-destructive hover:text-destructive"
                    >
                      <XIcon className="h-3.5 w-3.5" />
                      Cancel
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Runs</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Phrases</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right">Duration</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : !runs || runs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                      <ScraperIcon className="h-7 w-7 opacity-40" />
                      <p className="text-sm">No runs yet.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                runs.map((run) => {
                  const phrasesStr = run.phrases.join(', ');
                  const truncated =
                    phrasesStr.length > 60 ? `${phrasesStr.slice(0, 60)}…` : phrasesStr;
                  return (
                    <TableRow key={run.id}>
                      <TableCell className="text-sm whitespace-nowrap">
                        {relTime(run.created_at)}
                      </TableCell>
                      <TableCell
                        className="text-sm text-muted-foreground max-w-xs truncate"
                        title={phrasesStr}
                      >
                        {truncated}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {run.leads_found}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {formatDuration(run.duration_seconds)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={runStatusVariant(run.status)}>{run.status}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Manage Phrases</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {phrasesLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !phrases || phrases.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
              <PlusIcon className="h-6 w-6 opacity-40" />
              <p className="text-sm">No phrases yet. Add one below.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {phrases.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-md border px-4 py-2.5"
                >
                  <span className="text-sm flex-1 mr-4">{p.phrase}</span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <Switch
                        id={`phrase-${p.id}`}
                        checked={p.active}
                        onCheckedChange={(checked) =>
                          togglePhrase.mutate({ id: p.id, active: checked })
                        }
                      />
                      <Label htmlFor={`phrase-${p.id}`} className="text-xs text-muted-foreground cursor-pointer">
                        {p.active ? 'Active' : 'Inactive'}
                      </Label>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => deletePhrase.mutate(p.id)}
                      disabled={deletePhrase.isPending}
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Separator />

          <div className="flex gap-2">
            <Input
              placeholder="Add a new phrase…"
              value={newPhrase}
              onChange={(e) => setNewPhrase(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddPhrase();
              }}
              className="flex-1"
            />
            <Button
              onClick={handleAddPhrase}
              disabled={!newPhrase.trim() || addPhrase.isPending}
              className="gap-1.5"
            >
              <PlusIcon className="h-4 w-4" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
