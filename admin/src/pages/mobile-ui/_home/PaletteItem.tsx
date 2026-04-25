import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import type { WidgetCatalogEntry } from '@/components/sdui/widgetCatalog';

interface PaletteItemProps {
  entry: WidgetCatalogEntry;
  focused?: boolean;
}

export function PaletteItem({ entry, focused }: PaletteItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${entry.type}`,
    data: { source: 'palette', widgetType: entry.type },
  });

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'group flex items-start gap-2.5 px-2.5 py-2 rounded-md border border-transparent',
        'cursor-grab active:cursor-grabbing transition-all select-none touch-none',
        'hover:bg-muted/60 hover:border-border',
        isDragging && 'opacity-40 shadow-lg scale-95',
        focused && 'ring-1 ring-primary ring-offset-1',
      )}
    >
      <span
        className="mt-0.5 w-2 h-2 rounded-full shrink-0 ring-1 ring-black/10"
        style={{ backgroundColor: entry.colorDot }}
      />
      <div className="min-w-0">
        <p className="text-xs font-medium leading-tight text-foreground truncate">{entry.label}</p>
        <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 truncate">{entry.description}</p>
      </div>
      <span className="ml-auto hidden group-hover:block text-[10px] text-muted-foreground self-center whitespace-nowrap shrink-0">
        ⟶
      </span>
    </div>
  );
}
