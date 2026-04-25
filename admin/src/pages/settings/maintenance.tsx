import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircleIcon, CheckIcon, XIcon } from '@/icons';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useRegisterCommand } from '@/store/commands';

type MaintenanceSettings = {
  enabled: boolean;
  banner_message: string;
  eta: string | null;
  bypass_ips: string[];
};

type FormState = {
  bannerMessage: string;
  eta: string;
  bypassIps: string;
};

function toIsoLocal(isoStr: string | null): string {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function MaintenancePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<MaintenanceSettings>({
    queryKey: ['settings-maintenance'],
    queryFn: () => api.get<MaintenanceSettings>('/admin/settings/maintenance'),
  });

  const [form, setForm] = useState<FormState>({
    bannerMessage: '',
    eta: '',
    bypassIps: '',
  });

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'enable' | 'disable';
  }>({ open: false, action: 'enable' });

  useEffect(() => {
    if (data) {
      setForm({
        bannerMessage: data.banner_message,
        eta: toIsoLocal(data.eta),
        bypassIps: data.bypass_ips.join('\n'),
      });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      api.patch('/admin/settings/maintenance', {
        banner_message: form.bannerMessage,
        eta: form.eta ? new Date(form.eta).toISOString() : null,
        bypass_ips: form.bypassIps
          .split('\n')
          .map((ip) => ip.trim())
          .filter(Boolean),
      }),
    onSuccess: () => {
      toast.success('Maintenance settings saved');
      qc.invalidateQueries({ queryKey: ['settings-maintenance'] });
    },
    onError: () => {
      toast.error('Failed to save settings');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (action: 'enable' | 'disable') =>
      api.post(`/admin/settings/maintenance/${action}`),
    onSuccess: (_, action) => {
      toast.success(action === 'enable' ? 'Maintenance mode enabled' : 'Maintenance mode disabled');
      qc.invalidateQueries({ queryKey: ['settings-maintenance'] });
      setConfirmDialog({ open: false, action: 'enable' });
    },
    onError: () => {
      toast.error('Failed to toggle maintenance mode');
    },
  });

  function handleToggleClick() {
    if (!data) return;
    setConfirmDialog({ open: true, action: data.enabled ? 'disable' : 'enable' });
  }

  useRegisterCommand(
    {
      id: 'settings.maintenance.view',
      label: 'Maintenance settings',
      group: 'Settings',
      action: () => navigate('/settings/maintenance'),
    },
    [navigate],
  );

  useRegisterCommand(
    {
      id: 'settings.maintenance.toggle',
      label: 'Toggle maintenance mode',
      group: 'Settings',
      action: () => {
        if (data) {
          setConfirmDialog({ open: true, action: data.enabled ? 'disable' : 'enable' });
        }
      },
    },
    [data],
  );

  const isEnabled = data?.enabled ?? false;

  return (
    <div>
      <PageHeader
        title="Maintenance"
        subtitle="Control system availability and display a maintenance banner"
        actions={
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 rounded bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-6 max-w-2xl">
          {isEnabled ? (
            <div className="flex items-center gap-3 rounded-lg border border-destructive bg-destructive/10 px-4 py-3">
              <XIcon size={20} className="text-destructive shrink-0" />
              <span className="font-semibold text-destructive">MAINTENANCE MODE ACTIVE</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border border-green-500 bg-green-500/10 px-4 py-3">
              <CheckIcon size={20} className="text-green-600 shrink-0" />
              <span className="font-semibold text-green-700 dark:text-green-400">System is live</span>
            </div>
          )}

          <div className="flex items-start justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Maintenance mode</Label>
              <p className="text-sm text-muted-foreground">
                Enabling this immediately blocks all mobile and public API requests
              </p>
            </div>
            <div className="flex items-center gap-3 ml-4">
              <Switch checked={isEnabled} onCheckedChange={handleToggleClick} />
              <Button
                variant={isEnabled ? 'destructive' : 'default'}
                size="sm"
                onClick={handleToggleClick}
              >
                {isEnabled ? 'Disable maintenance' : 'Enable maintenance'}
              </Button>
            </div>
          </div>

          <div
            className={cn(
              'border border-amber-400 bg-amber-50 dark:bg-amber-950 rounded p-3',
              'flex items-start gap-2',
            )}
          >
            <AlertCircleIcon size={16} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Warning: Enabling this immediately blocks all mobile and public API requests
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bannerMsg">Banner message</Label>
            <textarea
              id="bannerMsg"
              value={form.bannerMessage}
              onChange={(e) => setForm((p) => ({ ...p, bannerMessage: e.target.value }))}
              placeholder="We are currently performing scheduled maintenance. Please check back soon."
              className={cn(
                'w-full min-h-[100px] text-sm p-3 border rounded-md bg-background resize-y',
                'border-input focus:outline-none focus:ring-2 focus:ring-ring',
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="eta">Estimated end time</Label>
            <input
              id="eta"
              type="datetime-local"
              value={form.eta}
              onChange={(e) => setForm((p) => ({ ...p, eta: e.target.value }))}
              className={cn(
                'flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm',
                'focus:outline-none focus:ring-2 focus:ring-ring',
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bypassIps">Admin bypass IPs (one per line)</Label>
            <textarea
              id="bypassIps"
              value={form.bypassIps}
              onChange={(e) => setForm((p) => ({ ...p, bypassIps: e.target.value }))}
              placeholder="192.168.1.1&#10;10.0.0.1"
              className={cn(
                'w-full min-h-[100px] font-mono text-sm p-3 border rounded-md bg-background resize-y',
                'border-input focus:outline-none focus:ring-2 focus:ring-ring',
              )}
            />
          </div>
        </div>
      )}

      <Dialog
        open={confirmDialog.open}
        onOpenChange={(v) => setConfirmDialog((p) => ({ ...p, open: v }))}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.action === 'enable'
                ? 'Enable maintenance mode?'
                : 'Disable maintenance mode?'}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.action === 'enable'
                ? 'Are you sure? This will block all users immediately.'
                : 'Disable maintenance mode and restore access for all users?'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialog((p) => ({ ...p, open: false }))}
            >
              Cancel
            </Button>
            <Button
              variant={confirmDialog.action === 'enable' ? 'destructive' : 'default'}
              onClick={() => toggleMutation.mutate(confirmDialog.action)}
              disabled={toggleMutation.isPending}
            >
              {toggleMutation.isPending ? 'Please wait...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
