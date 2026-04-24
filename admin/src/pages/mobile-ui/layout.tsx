import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Outlet, NavLink } from 'react-router-dom';
import { Save, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/PageHeader';
import { ManifestVersionDropdown } from '@/components/sdui/ManifestVersionDropdown';
import { Button } from '@/components/ui/button';
import { useManifest } from '@/hooks/useManifest';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const SUB_TABS = [
  { label: 'Home', to: '/mobile-ui/home' },
  { label: 'Tabs', to: '/mobile-ui/tabs' },
  { label: 'Onboarding', to: '/mobile-ui/onboarding' },
  { label: 'Paywall', to: '/mobile-ui/paywall' },
  { label: 'Theme', to: '/mobile-ui/theme' },
  { label: 'Strings', to: '/mobile-ui/strings' },
  { label: 'Templates', to: '/mobile-ui/templates' },
] as const;

function SubTabNav() {
  return (
    <nav className="flex gap-1 border-b border-border mb-6 overflow-x-auto">
      {SUB_TABS.map(({ label, to }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px',
              isActive
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
            )
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

function VersionPanel() {
  const queryClient = useQueryClient();
  const { versions, active, draft } = useManifest();

  const publishMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/manifests/${id}/publish`),
    onSuccess: () => {
      toast.success('Manifest published');
      queryClient.invalidateQueries({ queryKey: ['manifests'] });
    },
    onError: () => toast.error('Publish failed'),
  });

  const rollbackMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/manifests/${id}/rollback`),
    onSuccess: () => {
      toast.success('Rolled back');
      queryClient.invalidateQueries({ queryKey: ['manifests'] });
    },
    onError: () => toast.error('Rollback failed'),
  });

  const saveDraftMutation = useMutation({
    mutationFn: () => api.post('/admin/manifests/draft'),
    onSuccess: () => {
      toast.success('Draft saved');
      queryClient.invalidateQueries({ queryKey: ['manifests'] });
    },
    onError: () => toast.error('Failed to save draft'),
  });

  const selectedId = active?.id ?? draft?.id ?? null;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Version</p>
      <ManifestVersionDropdown
        versions={versions}
        activeId={selectedId}
        onPublish={(id) => publishMutation.mutate(id)}
        onRollback={(id) => rollbackMutation.mutate(id)}
      />
      <div className="flex flex-col gap-2 pt-1">
        <Button
          size="sm"
          variant="default"
          className="w-full gap-1.5 text-xs"
          onClick={() => selectedId && publishMutation.mutate(selectedId)}
          disabled={publishMutation.isPending || !selectedId}
        >
          <Upload className="h-3.5 w-3.5" />
          {publishMutation.isPending ? 'Publishing...' : 'Publish'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="w-full gap-1.5 text-xs"
          onClick={() => saveDraftMutation.mutate()}
          disabled={saveDraftMutation.isPending}
        >
          <Save className="h-3.5 w-3.5" />
          {saveDraftMutation.isPending ? 'Saving...' : 'Save Draft'}
        </Button>
      </div>
    </div>
  );
}

export default function MobileUiLayout() {
  return (
    <div>
      <PageHeader
        title="Mobile UI Builder"
        description="SDUI manifest editor — configure screens, widgets, and theme"
      />

      <div className="flex gap-6 items-start">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          <SubTabNav />
          <Outlet />
        </div>

        {/* Right sticky panel */}
        <aside className="hidden lg:block w-52 shrink-0 sticky top-6">
          <div className="rounded-lg border border-border bg-card p-4">
            <VersionPanel />
          </div>
        </aside>
      </div>
    </div>
  );
}
