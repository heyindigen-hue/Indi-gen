import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { WidgetPreview } from '@/components/sdui/WidgetPreview';
import type { WidgetInstance } from '@/types/sdui';

interface CanvasWidgetProps {
  widget: WidgetInstance;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export function CanvasWidget({ widget, selected, onSelect, onDelete }: CanvasWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: widget.id,
    data: { source: 'canvas', widgetId: widget.id },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'touch-none',
        isDragging && 'opacity-50 z-50',
      )}
    >
      <WidgetPreview
        widget={widget}
        selected={selected}
        onSelect={onSelect}
        onDelete={onDelete}
      />
    </div>
  );
}
