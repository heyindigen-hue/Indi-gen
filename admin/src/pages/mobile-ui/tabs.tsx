import { useState, useCallback } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { GripVertical, Trash2, Plus, AlertTriangle } from 'lucide-react';
import {
  Home,
  Search,
  Bell,
  User,
  Circle,
  Settings,
  Star,
  Heart,
  Bookmark,
  Map,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { IconPicker } from '@/components/sdui/IconPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { TabItem } from '@/types/sdui';
import type { LucideIcon } from 'lucide-react';

const MAX_TABS = 5;

const DEFAULT_TABS: TabItem[] = [
  { id: '1', icon: 'Home',   label: 'Home',    route: '/home',    enabled: true, order: 0 },
  { id: '2', icon: 'Search', label: 'Explore', route: '/explore', enabled: true, order: 1 },
  { id: '3', icon: 'Bell',   label: 'Alerts',  route: '/alerts',  enabled: true, order: 2 },
  { id: '4', icon: 'User',   label: 'Profile', route: '/profile', enabled: true, order: 3 },
];

const PREVIEW_ICON_MAP: Record<string, LucideIcon> = {
  Home, Search, Bell, User, Circle, Settings, Star, Heart, Bookmark, Map,
};

function PreviewIcon({ name }: { name: string }) {
  const Icon = PREVIEW_ICON_MAP[name] ?? Circle;
  return <Icon size={20} />;
}

// --- TabRow ---

interface TabRowProps {
  tab: TabItem;
  onChangeIcon: (id: string, icon: string) => void;
  onChangeLabel: (id: string, label: string) => void;
  onToggleEnabled: (id: string) => void;
  onDelete: (id: string) => void;
}

function TabRow({ tab, onChangeIcon, onChangeLabel, onToggleEnabled, onDelete }: TabRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tab.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-card"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors shrink-0"
        aria-label="Drag to reorder"
        tabIndex={0}
      >
        <GripVertical size={16} />
      </button>

      {/* Icon picker */}
      <div className="shrink-0">
        <IconPicker value={tab.icon} onChange={(icon) => onChangeIcon(tab.id, icon)} />
      </div>

      {/* Label */}
      <Input
        value={tab.label}
        onChange={(e) => onChangeLabel(tab.id, e.target.value)}
        className="h-8 text-sm w-32 shrink-0"
        placeholder="Label"
        aria-label="Tab label"
      />

      {/* Route — readonly */}
      <span className="text-xs text-muted-foreground font-mono bg-muted/40 px-2 py-1 rounded flex-1 min-w-0 truncate">
        {tab.route}
      </span>

      {/* Enabled switch */}
      <Switch
        checked={tab.enabled}
        onCheckedChange={() => onToggleEnabled(tab.id)}
        aria-label={`${tab.label} enabled`}
        className="shrink-0"
      />

      {/* Delete */}
      <button
        onClick={() => onDelete(tab.id)}
        className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
        aria-label={`Delete ${tab.label}`}
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

// --- Preview strip ---

interface PreviewStripProps {
  tabs: TabItem[];
}

function PreviewStrip({ tabs: allTabs }: PreviewStripProps) {
  const slots = Array.from({ length: MAX_TABS }, (_, i) => allTabs[i] ?? null);

  return (
    <div className="mt-8">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Preview — 375px
      </p>
      <div className="w-[375px] border border-border rounded-xl overflow-hidden bg-background shadow-sm">
        <div className="flex border-t border-border bg-card">
          {slots.map((tab, i) => (
            <div
              key={tab?.id ?? `empty-${i}`}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-3 gap-1',
                tab && !tab.enabled && 'opacity-30',
                !tab && 'opacity-10',
              )}
            >
              {tab ? (
                <>
                  <PreviewIcon name={tab.icon} />
                  <span className="text-[10px] text-muted-foreground leading-none">
                    {tab.label}
                  </span>
                </>
              ) : (
                <>
                  <Circle size={20} />
                  <span className="text-[10px] text-muted-foreground leading-none">—</span>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Main page ---

interface SavePayload {
  platform: 'mobile';
  enabled: boolean;
  screens: {
    tabs: { tabs: TabItem[] };
  };
}

export default function MobileUiTabsPage() {
  const queryClient = useQueryClient();
  const [tabs, setTabs] = useState<TabItem[]>(DEFAULT_TABS);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const saveMutation = useMutation({
    mutationFn: (payload: SavePayload) => api.post('/admin/manifests', payload),
    onSuccess: () => {
      toast.success('Tab configuration saved');
      queryClient.invalidateQueries({ queryKey: ['manifests'] });
    },
    onError: () => toast.error('Failed to save tab configuration'),
  });

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setTabs((prev) => {
      const oldIndex = prev.findIndex((t) => t.id === active.id);
      const newIndex = prev.findIndex((t) => t.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex).map((t, i) => ({ ...t, order: i }));
    });
  }, []);

  const handleAddTab = useCallback(() => {
    if (tabs.length >= MAX_TABS) return;
    const newTab: TabItem = {
      id: crypto.randomUUID(),
      icon: 'Circle',
      label: 'New Tab',
      route: '/new',
      enabled: true,
      order: tabs.length,
    };
    setTabs((prev) => [...prev, newTab]);
  }, [tabs.length]);

  const handleChangeIcon = useCallback((id: string, icon: string) => {
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, icon } : t)));
  }, []);

  const handleChangeLabel = useCallback((id: string, label: string) => {
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, label } : t)));
  }, []);

  const handleToggleEnabled = useCallback((id: string) => {
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t)));
  }, []);

  const handleDelete = useCallback((id: string) => {
    setTabs((prev) =>
      prev.filter((t) => t.id !== id).map((t, i) => ({ ...t, order: i })),
    );
  }, []);

  const handleSave = useCallback(() => {
    saveMutation.mutate({
      platform: 'mobile',
      enabled: false,
      screens: { tabs: { tabs } },
    });
  }, [saveMutation, tabs]);

  const atMax = tabs.length >= MAX_TABS;

  return (
    <div className="max-w-3xl">
      {/* Header row */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold">Tab Bar</h2>
          <Badge variant="secondary" className="text-xs">
            {tabs.length} / {MAX_TABS}
          </Badge>
          {atMax && (
            <Badge variant="destructive" className="flex items-center gap-1 text-xs">
              <AlertTriangle size={11} />
              Max tabs reached
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddTab}
            disabled={atMax}
            className="gap-1.5 text-xs"
          >
            <Plus size={13} />
            Add Tab
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="text-xs"
          >
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Column headers */}
      <div className="flex items-center gap-3 px-3 mb-1.5">
        <span className="w-4 shrink-0" />
        <span className="text-[11px] text-muted-foreground w-[84px] shrink-0">Icon</span>
        <span className="text-[11px] text-muted-foreground w-32 shrink-0">Label</span>
        <span className="text-[11px] text-muted-foreground flex-1">Route</span>
        <span className="text-[11px] text-muted-foreground w-9 text-center shrink-0">On</span>
        <span className="w-4 shrink-0" />
      </div>

      {/* Sortable list */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={tabs.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {tabs.map((tab) => (
              <TabRow
                key={tab.id}
                tab={tab}
                onChangeIcon={handleChangeIcon}
                onChangeLabel={handleChangeLabel}
                onToggleEnabled={handleToggleEnabled}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {tabs.length === 0 && (
        <div className="flex items-center justify-center h-24 rounded-lg border border-dashed border-border text-sm text-muted-foreground">
          No tabs — click Add Tab to start
        </div>
      )}

      {/* Preview */}
      <PreviewStrip tabs={tabs} />
    </div>
  );
}
