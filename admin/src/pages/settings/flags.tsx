import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusIcon } from '@/icons';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useRegisterCommand } from '@/store/commands';

type FeatureFlag = {
  id: string;
  description: string;
  enabled: boolean;
  rollout_pct: number;
  plan_targets: string[];
  created_at: string;
};

type FlagsResponse = {
  flags: FeatureFlag[];
};

type NewFlagForm = {
  id: string;
  description: string;
  enabled: boolean;
  rollout_pct: number;
};

const NEW_FLAG_DEFAULTS: NewFlagForm = {
  id: '',
  description: '',
  enabled: false,
  rollout_pct: 0,
};

export default function FlagsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<FlagsResponse>({
    queryKey: ['feature-flags'],
    queryFn: () => api.get<FlagsResponse>('/api/admin/feature-flags'),
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newFlag, setNewFlag] = useState<NewFlagForm>(NEW_FLAG_DEFAULTS);

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      api.patch(`/api/admin/feature-flags/${id}`, { enabled }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feature-flags'] });
    },
    onError: () => {
      toast.error('Failed to update flag');
    },
  });

  const rolloutMutation = useMutation({
    mutationFn: ({ id, rollout_pct }: { id: string; rollout_pct: number }) =>
      api.patch(`/api/admin/feature-flags/${id}`, { rollout_pct }),
    onError: () => {
      toast.error('Failed to update rollout');
    },
  });

  const createMutation = useMutation({
    mutationFn: (values: NewFlagForm) =>
      api.post('/api/admin/feature-flags', values),
    onSuccess: () => {
      toast.success('Feature flag created');
      qc.invalidateQueries({ queryKey: ['feature-flags'] });
      setDialogOpen(false);
      setNewFlag(NEW_FLAG_DEFAULTS);
    },
    onError: () => {
      toast.error('Failed to create feature flag');
    },
  });

  useRegisterCommand(
    {
      id: 'settings.flags',
      label: 'Feature flags',
      group: 'Settings',
      action: () => navigate('/settings/flags'),
    },
    [navigate],
  );

  const flags = data?.flags ?? [];

  return (
    <div>
      <PageHeader
        title="Feature flags"
        subtitle="Control feature availability per plan and rollout percentage"
        actions={
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <PlusIcon size={16} className="mr-1.5" />
            New flag
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 rounded bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Flag ID</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Enabled</TableHead>
                <TableHead>Rollout %</TableHead>
                <TableHead>Plans</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flags.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No feature flags configured
                  </TableCell>
                </TableRow>
              ) : (
                flags.map((flag) => (
                  <TableRow key={flag.id}>
                    <TableCell className="font-mono text-sm">{flag.id}</TableCell>
                    <TableCell className="text-sm">{flag.description}</TableCell>
                    <TableCell>
                      <Switch
                        checked={flag.enabled}
                        onCheckedChange={(checked) =>
                          toggleMutation.mutate({ id: flag.id, enabled: checked })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          defaultValue={flag.rollout_pct}
                          onMouseUp={(e) =>
                            rolloutMutation.mutate({
                              id: flag.id,
                              rollout_pct: Number((e.target as HTMLInputElement).value),
                            })
                          }
                          className="w-24 accent-primary"
                        />
                        <span className="text-sm text-muted-foreground w-8">
                          {flag.rollout_pct}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {flag.plan_targets.map((plan) => (
                          <span
                            key={plan}
                            className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
                          >
                            {plan}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New feature flag</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="flagId">
                Flag ID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="flagId"
                value={newFlag.id}
                onChange={(e) => setNewFlag((p) => ({ ...p, id: e.target.value }))}
                placeholder="new_feature_flag"
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="flagDesc">Description</Label>
              <Input
                id="flagDesc"
                value={newFlag.description}
                onChange={(e) => setNewFlag((p) => ({ ...p, description: e.target.value }))}
                placeholder="Brief description of this flag"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="flagEnabled"
                checked={newFlag.enabled}
                onCheckedChange={(v) => setNewFlag((p) => ({ ...p, enabled: v }))}
              />
              <Label htmlFor="flagEnabled">Enabled by default</Label>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="flagRollout">Rollout %: {newFlag.rollout_pct}</Label>
              <input
                id="flagRollout"
                type="range"
                min={0}
                max={100}
                value={newFlag.rollout_pct}
                onChange={(e) =>
                  setNewFlag((p) => ({ ...p, rollout_pct: Number(e.target.value) }))
                }
                className="w-full accent-primary"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate(newFlag)}
              disabled={!newFlag.id.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
