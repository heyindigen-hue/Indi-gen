import { useState, useCallback, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
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
import { useRegisterCommand } from '@/store/commands';
import { DeviceFrame } from '@/components/sdui/DeviceFrame';
import { WidgetPreview } from '@/components/sdui/WidgetPreview';
import { PaletteItem } from './_home/PaletteItem';
import { CanvasWidget } from './_home/CanvasWidget';
import { InspectorForm } from './_home/InspectorForm';
import type { WidgetInstance, WidgetType } from '@/types/sdui';

const WIDGET_TYPES: WidgetType[] = [
  'TokenBalance',
  'AnnouncementBanner',
  'QuickFilters',
  'LeadSwipeStack',
  'RecentLeadsCarousel',
  'ActionButtons',
  'MetricCard',
  'CustomHtml',
  'Divider',
  'Spacer',
];

const DEFAULT_PROPS: Record<WidgetType, Record<string, unknown>> = {
  TokenBalance:        { initialValue: 0 },
  AnnouncementBanner:  { message: '', dismissable: false },
  QuickFilters:        { filters: [] },
  LeadSwipeStack:      { maxCards: 5, showScore: false },
  RecentLeadsCarousel: { limit: 10 },
  ActionButtons:       { buttons: [] },
  MetricCard:          { label: 'Metric', value: '0', trend: 'flat' },
  CustomHtml:          { html: '' },
  Divider:             { thickness: 1 },
  Spacer:              { height: 16 },
};

function createWidget(type: WidgetType): WidgetInstance {
  return {
    id: crypto.randomUUID(),
    type,
    props: { ...DEFAULT_PROPS[type] },
  };
}

// Tracks which palette item or canvas item is being dragged
interface ActiveDrag {
  source: 'palette' | 'canvas';
  widgetType?: WidgetType;
  widgetId?: string;
}

// The drop indicator index when dragging a palette item over the canvas
function getInsertIndex(widgets: WidgetInstance[], overId: string | null): number {
  if (!overId) return widgets.length;
  const idx = widgets.findIndex((w) => w.id === overId);
  return idx === -1 ? widgets.length : idx;
}

export default function MobileUiHomePage() {
  const { draft, active } = useManifest();
  const manifest = draft ?? active;
  const initialWidgets = manifest?.screens?.home?.widgets ?? [];

  const [widgets, setWidgets] = useState<WidgetInstance[]>(initialWidgets);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null);
  const [overCanvasId, setOverCanvasId] = useState<string | null>(null);
  const paletteRef = useRef<HTMLDivElement>(null);
  const [focusPalette, setFocusPalette] = useState(false);

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
    const data = event.active.data.current as { source: 'palette' | 'canvas'; widgetType?: WidgetType; widgetId?: string } | undefined;
    if (!data) return;
    setActiveDrag({ source: data.source, widgetType: data.widgetType, widgetId: data.widgetId });
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const over = event.over;
    if (!over) {
      setOverCanvasId(null);
      return;
    }
    setOverCanvasId(String(over.id));
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDrag(null);
    setOverCanvasId(null);

    if (!over) return;

    const activeData = active.data.current as { source: 'palette' | 'canvas'; widgetType?: WidgetType; widgetId?: string } | undefined;
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
      if (activeId === overId) return;
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

  // Widget used for the drag overlay
  const overlayWidget: WidgetInstance | null = (() => {
    if (!activeDrag) return null;
    if (activeDrag.source === 'palette' && activeDrag.widgetType) {
      return { id: '__overlay__', type: activeDrag.widgetType, props: { ...DEFAULT_PROPS[activeDrag.widgetType] } };
    }
    if (activeDrag.source === 'canvas' && activeDrag.widgetId) {
      return widgets.find((w) => w.id === activeDrag.widgetId) ?? null;
    }
    return null;
  })();

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
          className="w-[240px] shrink-0 rounded-lg border border-border bg-card"
          onFocus={() => setFocusPalette(true)}
          onBlur={() => setFocusPalette(false)}
        >
          <div className="p-3 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Widget Palette
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Drag onto canvas to add</p>
          </div>
          <div className="p-2 flex flex-col gap-1 overflow-y-auto max-h-[780px]">
            {WIDGET_TYPES.map((type) => (
              <PaletteItem key={type} type={type} focused={focusPalette} />
            ))}
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
                <CanvasDropZone overCanvasId={overCanvasId} />
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

function CanvasDropZone({ overCanvasId }: { overCanvasId: string | null }) {
  return (
    <div
      className={`
        flex flex-col items-center justify-center h-[400px] rounded-lg border-2 border-dashed
        transition-colors text-center px-4
        ${overCanvasId ? 'border-primary bg-primary/5' : 'border-border'}
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
