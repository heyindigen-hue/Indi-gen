import { useState, useCallback, useRef, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { useManifest } from '@/hooks/useManifest';
import { useManifestEditor } from '@/context/ManifestEditorContext';
import { useRegisterCommand } from '@/store/commands';
import { DeviceFrame } from '@/components/sdui/DeviceFrame';
import { WidgetPreview } from '@/components/sdui/WidgetPreview';
import { PaletteItem } from './_home/PaletteItem';
import { CanvasWidget } from './_home/CanvasWidget';
import { InspectorForm } from './_home/InspectorForm';
import {
  WIDGET_CATALOG,
  WIDGET_CATALOG_MAP,
  WIDGET_GROUPS,
  type WidgetGroup,
} from '@/components/sdui/widgetCatalog';
import type { WidgetInstance, WidgetType } from '@/types/sdui';

function createWidget(type: WidgetType): WidgetInstance {
  const entry = WIDGET_CATALOG_MAP[type];
  return {
    id: crypto.randomUUID(),
    type,
    props: { ...(entry?.defaultProps ?? {}) },
  };
}

interface ActiveDrag {
  source: 'palette' | 'canvas';
  widgetType?: WidgetType;
  widgetId?: string;
}

function getInsertIndex(widgets: WidgetInstance[], overId: string | null): number {
  if (!overId || overId === 'canvas') return widgets.length;
  const idx = widgets.findIndex((w) => w.id === overId);
  return idx === -1 ? widgets.length : idx;
}

function CanvasDropZone({ overCanvas }: { overCanvas: boolean }) {
  const { setNodeRef } = useDroppable({ id: 'canvas' });
  return (
    <div
      ref={setNodeRef}
      className={`
        flex flex-col items-center justify-center h-[400px] rounded-lg border-2 border-dashed
        transition-colors text-center px-4
        ${overCanvas ? 'border-primary bg-primary/5' : 'border-border'}
      `}
    >
      <p className="text-sm text-muted-foreground font-medium">
        Drag widgets from the palette to build the home screen
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        Widgets will appear in order here
      </p>
    </div>
  );
}

export default function MobileUiHomePage() {
  const { draft, active } = useManifest();
  const manifest = draft ?? active;
  const initialWidgets = (manifest?.screens?.home?.widgets ?? []) as WidgetInstance[];
  const { setHomeWidgets } = useManifestEditor();

  const [widgets, setWidgets] = useState<WidgetInstance[]>(initialWidgets);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null);
  const [overCanvasId, setOverCanvasId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Set<WidgetGroup>>(new Set());
  const paletteRef = useRef<HTMLDivElement>(null);
  const [focusPalette, setFocusPalette] = useState(false);

  // sync to editor context whenever widgets change
  useEffect(() => {
    setHomeWidgets(widgets);
  }, [widgets, setHomeWidgets]);

  useRegisterCommand(
    {
      id: 'add-widget',
      label: 'Add home widget',
      group: 'Mobile UI',
      action: () => {
        setFocusPalette(true);
        paletteRef.current?.focus();
      },
    },
    [],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current as ActiveDrag | undefined;
    if (!data) return;
    setActiveDrag(data);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const over = event.over;
    setOverCanvasId(over ? String(over.id) : null);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDrag(null);
    setOverCanvasId(null);

    if (!over) return;

    const activeData = active.data.current as ActiveDrag | undefined;
    if (!activeData) return;

    if (activeData.source === 'palette' && activeData.widgetType) {
      const newWidget = createWidget(activeData.widgetType);
      const overId = String(over.id);
      setWidgets((prev) => {
        const insertAt = getInsertIndex(prev, overId);
        const updated = [...prev];
        updated.splice(insertAt, 0, newWidget);
        return updated;
      });
      setSelectedId(newWidget.id);
      return;
    }

    if (activeData.source === 'canvas') {
      const activeId = String(active.id);
      const overId = String(over.id);
      if (activeId === overId || overId === 'canvas') return;
      setWidgets((prev) => {
        const oldIndex = prev.findIndex((w) => w.id === activeId);
        const newIndex = prev.findIndex((w) => w.id === overId);
        if (oldIndex === -1 || newIndex === -1) return prev;
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }, []);

  const handleDelete = useCallback((id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
    setSelectedId((prev) => (prev === id ? null : prev));
  }, []);

  const handleUpdateProps = useCallback((id: string, props: Record<string, unknown>) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, props } : w)),
    );
  }, []);

  const selectedWidget = widgets.find((w) => w.id === selectedId) ?? null;

  const overlayWidget: WidgetInstance | null = (() => {
    if (!activeDrag) return null;
    if (activeDrag.source === 'palette' && activeDrag.widgetType) {
      const entry = WIDGET_CATALOG_MAP[activeDrag.widgetType];
      return { id: '__overlay__', type: activeDrag.widgetType, props: { ...(entry?.defaultProps ?? {}) } };
    }
    if (activeDrag.source === 'canvas' && activeDrag.widgetId) {
      return widgets.find((w) => w.id === activeDrag.widgetId) ?? null;
    }
    return null;
  })();

  const toggleGroup = (g: WidgetGroup) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(g) ? next.delete(g) : next.add(g);
      return next;
    });

  const q = search.toLowerCase();
  const filteredCatalog = q
    ? WIDGET_CATALOG.filter((e) =>
        e.label.toLowerCase().includes(q) || e.description.toLowerCase().includes(q),
      )
    : null;

  const overCanvas = overCanvasId === 'canvas' || (overCanvasId !== null && widgets.some((w) => w.id === overCanvasId));

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 items-start min-h-[860px]">
        {/* Column 1: Palette */}
        <aside
          ref={paletteRef}
          tabIndex={-1}
          className="w-[252px] shrink-0 rounded-lg border border-border bg-card"
          onFocus={() => setFocusPalette(true)}
          onBlur={() => setFocusPalette(false)}
        >
          <div className="p-3 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Widget Palette
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Drag onto canvas to add</p>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search widgets…"
              className="mt-2 w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="overflow-y-auto max-h-[740px]">
            {filteredCatalog ? (
              <div className="p-2 flex flex-col gap-1">
                {filteredCatalog.map((entry) => (
                  <PaletteItem key={entry.type} entry={entry} focused={focusPalette} />
                ))}
                {filteredCatalog.length === 0 && (
                  <p className="text-xs text-muted-foreground px-2 py-4 text-center">No widgets match</p>
                )}
              </div>
            ) : (
              WIDGET_GROUPS.map((group) => {
                const entries = WIDGET_CATALOG.filter((e) => e.group === group.id);
                if (!entries.length) return null;
                const isCollapsed = collapsed.has(group.id);
                return (
                  <div key={group.id} className="border-b border-border last:border-0">
                    <button
                      onClick={() => toggleGroup(group.id)}
                      className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors"
                    >
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        <span>{group.icon}</span>
                        <span>{group.label}</span>
                        <span className="text-[10px] font-normal ml-0.5 opacity-60">({entries.length})</span>
                      </span>
                      <span className="text-[10px] text-muted-foreground">{isCollapsed ? '▶' : '▼'}</span>
                    </button>
                    {!isCollapsed && (
                      <div className="px-2 pb-2 flex flex-col gap-1">
                        {entries.map((entry) => (
                          <PaletteItem key={entry.type} entry={entry} focused={focusPalette} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Column 2: Canvas */}
        <div className="flex-1 flex flex-col items-center">
          <div className="mb-3 w-full max-w-[375px]">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-center">
              Canvas
            </p>
            <p className="text-[11px] text-muted-foreground text-center mt-0.5">
              {widgets.length} widget{widgets.length !== 1 ? 's' : ''}
            </p>
          </div>
          <DeviceFrame device="iphone">
            <div className="h-full overflow-y-auto p-2">
              {widgets.length === 0 ? (
                <CanvasDropZone overCanvas={overCanvas} />
              ) : (
                <SortableContext
                  items={widgets.map((w) => w.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex flex-col gap-1.5">
                    {widgets.map((widget) => (
                      <CanvasWidget
                        key={widget.id}
                        widget={widget}
                        selected={selectedId === widget.id}
                        onSelect={() => setSelectedId((prev) => (prev === widget.id ? null : widget.id))}
                        onDelete={() => handleDelete(widget.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              )}
            </div>
          </DeviceFrame>
        </div>

        {/* Column 3: Inspector */}
        <aside className="w-[320px] shrink-0 rounded-lg border border-border bg-card self-start sticky top-6">
          <div className="p-3 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Inspector
            </p>
          </div>
          <InspectorForm
            widget={selectedWidget}
            onUpdateProps={handleUpdateProps}
          />
        </aside>
      </div>

      <DragOverlay dropAnimation={null}>
        {overlayWidget && (
          <div className="w-[220px] opacity-90 shadow-xl rotate-1 pointer-events-none">
            <WidgetPreview widget={overlayWidget} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
