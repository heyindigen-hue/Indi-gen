import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Outlet, NavLink } from 'react-router-dom';
import { CheckIcon, UploadIcon } from '@/icons';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/PageHeader';
import { ManifestVersionDropdown } from '@/components/sdui/ManifestVersionDropdown';
import { Button } from '@/components/ui/button';
import { useManifest } from '@/hooks/useManifest';
import { ManifestEditorProvider, useManifestEditor } from '@/context/ManifestEditorContext';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Manifest } from '@/types/sdui';

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
  const { getManifestContent, isDirty, markClean } = useManifestEditor();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const currentId = selectedId ?? active?.id ?? draft?.id ?? null;
  const currentManifest = versions.find((v) => v.id === currentId) ?? null;

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
    mutationFn: async () => {
      const content = getManifestContent();
      const latestVersion = versions.reduce((max, v) => Math.max(max, v.version), 0);

      if (currentId) {
        return api.patch<Manifest>(`/admin/manifests/${currentId}`, { content });
      }

      return api.post<Manifest>('/admin/manifests', {
        name: `draft-${Date.now()}`,
        platform: 'mobile',
        version: latestVersion + 1,
        content,
      });
    },
    onSuccess: () => {
      toast.success('Draft saved');
      markClean();
      queryClient.invalidateQueries({ queryKey: ['manifests'] });
    },
    onError: () => toast.error('Failed to save draft'),
  });

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Version</p>
      <ManifestVersionDropdown
        versions={versions}
        activeId={currentId}
        onSelect={setSelectedId}
        onPublish={(id) => publishMutation.mutate(id)}
        onRollback={(id) => rollbackMutation.mutate(id)}
      />
      <div className="flex flex-col gap-2 pt-1">
        <Button
          size="sm"
          variant="default"
          className="w-full gap-1.5 text-xs"
          onClick={() => currentId && publishMutation.mutate(currentId)}
          disabled={publishMutation.isPending || !currentId}
        >
          <UploadIcon size={14} />
          {publishMutation.isPending ? 'Publishing…' : 'Publish'}
        </Button>
        <Button
          size="sm"
          variant={isDirty ? 'default' : 'outline'}
          className="w-full gap-1.5 text-xs"
          onClick={() => saveDraftMutation.mutate()}
          disabled={saveDraftMutation.isPending}
        >
          <CheckIcon size={14} />
          {saveDraftMutation.isPending ? 'Saving…' : isDirty ? 'Save Draft *' : 'Save Draft'}
        </Button>
      </div>
      {currentManifest && (
        <p className="text-[10px] text-muted-foreground text-center">
          v{currentManifest.version}{currentManifest.enabled ? ' · live' : ' · draft'}
        </p>
      )}
    </div>
  );
}

function MobileUiLayoutInner() {
  return (
    <div>
      <PageHeader
        title="Mobile UI Builder"
        description="SDUI manifest editor — configure screens, widgets, and theme"
      />

      <div className="flex gap-6 items-start">
        <div className="flex-1 min-w-0">
          <SubTabNav />
          <Outlet />
        </div>

        <aside className="hidden lg:block w-52 shrink-0 sticky top-6">
          <div className="rounded-lg border border-border bg-card p-4">
            <VersionPanel />
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function MobileUiLayout() {
  return (
    <ManifestEditorProvider>
      <MobileUiLayoutInner />
    </ManifestEditorProvider>
  );
}
