import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import type { WidgetType } from '@/types/sdui';

interface PaletteItemProps {
  type: WidgetType;
  focused?: boolean;
}

const PALETTE_COLORS: Record<WidgetType, { bg: string; text: string; dot: string }> = {
  TokenBalance:        { bg: 'bg-blue-50 dark:bg-blue-950/40',    text: 'text-blue-700 dark:text-blue-300',    dot: 'bg-blue-500' },
  AnnouncementBanner:  { bg: 'bg-amber-50 dark:bg-amber-950/40',  text: 'text-amber-700 dark:text-amber-300',  dot: 'bg-amber-500' },
  QuickFilters:        { bg: 'bg-violet-50 dark:bg-violet-950/40', text: 'text-violet-700 dark:text-violet-300', dot: 'bg-violet-500' },
  LeadSwipeStack:      { bg: 'bg-green-50 dark:bg-green-950/40',  text: 'text-green-700 dark:text-green-300',  dot: 'bg-green-500' },
  RecentLeadsCarousel: { bg: 'bg-teal-50 dark:bg-teal-950/40',   text: 'text-teal-700 dark:text-teal-300',   dot: 'bg-teal-500' },
  ActionButtons:       { bg: 'bg-orange-50 dark:bg-orange-950/40', text: 'text-orange-700 dark:text-orange-300', dot: 'bg-orange-500' },
  MetricCard:          { bg: 'bg-pink-50 dark:bg-pink-950/40',    text: 'text-pink-700 dark:text-pink-300',    dot: 'bg-pink-500' },
  CustomHtml:          { bg: 'bg-slate-50 dark:bg-slate-950/40',  text: 'text-slate-700 dark:text-slate-300',  dot: 'bg-slate-500' },
  Divider:             { bg: 'bg-zinc-50 dark:bg-zinc-900/40',    text: 'text-zinc-600 dark:text-zinc-400',    dot: 'bg-zinc-400' },
  Spacer:              { bg: 'bg-gray-50 dark:bg-gray-900/30',    text: 'text-gray-500 dark:text-gray-400',    dot: 'bg-gray-400' },
};

const PALETTE_LABELS: Record<WidgetType, string> = {
  TokenBalance:        'Token Balance',
  AnnouncementBanner:  'Announcement',
  QuickFilters:        'Quick Filters',
  LeadSwipeStack:      'Lead Swipe Stack',
  RecentLeadsCarousel: 'Leads Carousel',
  ActionButtons:       'Action Buttons',
  MetricCard:          'Metric Card',
  CustomHtml:          'Custom HTML',
  Divider:             'Divider',
  Spacer:              'Spacer',
};

export function PaletteItem({ type, focused }: PaletteItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { source: 'palette', widgetType: type },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  const colors = PALETTE_COLORS[type];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'flex items-center gap-2 px-2.5 py-2 rounded-md border cursor-grab active:cursor-grabbing',
        'border-transparent transition-all select-none touch-none',
        colors.bg,
        isDragging && 'opacity-40 shadow-lg scale-95',
        focused && 'ring-2 ring-primary ring-offset-1',
      )}
    >
      <span className={cn('w-2 h-2 rounded-full shrink-0', colors.dot)} />
      <span className={cn('text-xs font-medium leading-tight', colors.text)}>
        {PALETTE_LABELS[type]}
      </span>
    </div>
  );
}
