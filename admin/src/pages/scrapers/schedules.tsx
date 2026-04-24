import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { relTime } from '@/lib/utils';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusPill } from '@/components/common/StatusPill';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';

type ScraperSchedule = {
  id: string;
  phrase_set: string;
  accounts_used: string[];
  cron_expr: string;
  next_run_at: string | null;
  enabled: boolean;
};

type SchedulesResponse = {
  schedules: ScraperSchedule[];
};

const CRON_PRESETS = [
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Every 4 hours', value: '0 */4 * * *' },
  { label: 'Every 6 hours', value: '0 */6 * * *' },
  { label: 'Daily (9am)', value: '0 9 * * *' },
  { label: 'Weekly (Mon 9am)', value: '0 9 * * 1' },
  { label: 'Custom', value: 'custom' },
];

const scheduleSchema = z.object({
  phrase_set: z.string().min(1, 'Phrase set is required'),
  cron_expr: z.string().min(1, 'Cron expression is required'),
});
type ScheduleFormData = z.infer<typeof scheduleSchema>;

export default function ScraperSchedulesPage() {
  const [newOpen, setNewOpen] = useState(false);
  const [preset, setPreset] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<SchedulesResponse>({
    queryKey: ['scraper-schedules'],
    queryFn: () => api.get<SchedulesResponse>('/admin/phrases'),
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ScheduleFormData>({ resolver: zodResolver(scheduleSchema) });

  const createMutation = useMutation({
    mutationFn: (d: ScheduleFormData) => api.post('/admin/phrases', d),
    onSuccess: () => {
      toast.success('Schedule created');
      queryClient.invalidateQueries({ queryKey: ['scraper-schedules'] });
      setNewOpen(false);
      reset();
      setPreset('');
    },
    onError: () => toast.error('Failed to create schedule'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      api.patch(`/admin/phrases/${id}`, { enabled }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scraper-schedules'] }),
    onError: () => toast.error('Toggle failed'),
  });

  const schedules = data?.schedules ?? [];
  const cronValue = watch('cron_expr');

  const handlePresetChange = (value: string) => {
    setPreset(value);
    if (value !== 'custom') {
      setValue('cron_expr', value, { shouldValidate: true });
    } else {
      setValue('cron_expr', '', { shouldValidate: false });
    }
  };

  const closeDialog = () => {
    setNewOpen(false);
    reset();
    setPreset('');
  };

  return (
    <div>
      <PageHeader
        title="Scraper Schedules"
        subtitle="Configure when scraper jobs run automatically"
        actions={
          <Button size="sm" onClick={() => setNewOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            New Schedule
          </Button>
        }
      />

      {/* Schedule list */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
        ) : schedules.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 border border-dashed border-border rounded-lg">
            <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No schedules yet</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => setNewOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Create first schedule
            </Button>
          </div>
        ) : (
          schedules.map((sched) => (
            <div
              key={sched.id}
              className="rounded-lg border border-border bg-card p-4 flex items-start gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{sched.phrase_set}</span>
                  <StatusPill
                    label={sched.enabled ? 'enabled' : 'disabled'}
                    variant={sched.enabled ? 'success' : 'muted'}
                  />
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                  <span>
                    <span className="font-medium">Cron:</span>{' '}
                    <code className="font-mono bg-muted px-1 rounded">{sched.cron_expr}</code>
                  </span>
                  {sched.accounts_used.length > 0 && (
                    <span>
                      {sched.accounts_used.length} account
                      {sched.accounts_used.length > 1 ? 's' : ''}
                    </span>
                  )}
                  {sched.next_run_at && (
                    <span>Next: {relTime(new Date(sched.next_run_at))}</span>
                  )}
                </div>
              </div>
              <Switch
                checked={sched.enabled}
                onCheckedChange={(checked) =>
                  toggleMutation.mutate({ id: sched.id, enabled: checked })
                }
              />
            </div>
          ))
        )}
      </div>

      {/* New schedule dialog */}
      <Dialog open={newOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setNewOpen(true); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Scraper Schedule</DialogTitle>
            <DialogDescription>
              Configure when this phrase set should be scraped automatically.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
            <div>
              <Label>Phrase set</Label>
              <Input
                {...register('phrase_set')}
                className="mt-1.5"
                placeholder="e.g. software engineers hiring"
              />
              {errors.phrase_set && (
                <p className="text-sm text-red-500 mt-1">{errors.phrase_set.message}</p>
              )}
            </div>
            <div>
              <Label>Frequency</Label>
              <Select value={preset} onValueChange={handlePresetChange}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Choose frequency..." />
                </SelectTrigger>
                <SelectContent>
                  {CRON_PRESETS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {preset === 'custom' && (
              <div>
                <Label>Custom cron expression</Label>
                <Input
                  {...register('cron_expr')}
                  className="mt-1.5 font-mono"
                  placeholder="0 */2 * * *"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  5 fields: minute hour day-of-month month day-of-week
                </p>
                {errors.cron_expr && (
                  <p className="text-sm text-red-500 mt-1">{errors.cron_expr.message}</p>
                )}
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || !cronValue}>
                Create schedule
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
