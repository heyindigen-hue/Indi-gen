import { TrashIcon } from '@/icons';
import { cn } from '@/lib/utils';
import type { WidgetInstance, WidgetType } from '@/types/sdui';

interface WidgetPreviewProps {
  widget: WidgetInstance;
  selected?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
}

interface WidgetStyle {
  bg: string;
  border: string;
  label: string;
  accent: string;
}

const WIDGET_STYLES: Record<WidgetType, WidgetStyle> = {
  TokenBalance: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
    label: 'Token Balance',
    accent: 'text-blue-700 dark:text-blue-300',
  },
  AnnouncementBanner: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    label: 'Announcement Banner',
    accent: 'text-amber-700 dark:text-amber-300',
  },
  QuickFilters: {
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    border: 'border-violet-200 dark:border-violet-800',
    label: 'Quick Filters',
    accent: 'text-violet-700 dark:text-violet-300',
  },
  LeadSwipeStack: {
    bg: 'bg-green-50 dark:bg-green-950/30',
    border: 'border-green-200 dark:border-green-800',
    label: 'Lead Swipe Stack',
    accent: 'text-green-700 dark:text-green-300',
  },
  RecentLeadsCarousel: {
    bg: 'bg-teal-50 dark:bg-teal-950/30',
    border: 'border-teal-200 dark:border-teal-800',
    label: 'Recent Leads Carousel',
    accent: 'text-teal-700 dark:text-teal-300',
  },
  ActionButtons: {
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    border: 'border-orange-200 dark:border-orange-800',
    label: 'Action Buttons',
    accent: 'text-orange-700 dark:text-orange-300',
  },
  MetricCard: {
    bg: 'bg-pink-50 dark:bg-pink-950/30',
    border: 'border-pink-200 dark:border-pink-800',
    label: 'Metric Card',
    accent: 'text-pink-700 dark:text-pink-300',
  },
  CustomHtml: {
    bg: 'bg-slate-50 dark:bg-slate-950/30',
    border: 'border-slate-200 dark:border-slate-700',
    label: 'Custom HTML',
    accent: 'text-slate-700 dark:text-slate-300',
  },
  Divider: {
    bg: 'bg-zinc-50 dark:bg-zinc-900/30',
    border: 'border-zinc-200 dark:border-zinc-700',
    label: 'Divider',
    accent: 'text-zinc-500 dark:text-zinc-400',
  },
  Spacer: {
    bg: 'bg-gray-50 dark:bg-gray-900/20',
    border: 'border-gray-200 dark:border-gray-700 border-dashed',
    label: 'Spacer',
    accent: 'text-gray-400 dark:text-gray-500',
  },
};

function WidgetBody({ widget }: { widget: WidgetInstance }) {
  const { type, props } = widget;

  if (type === 'TokenBalance') {
    return (
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Balance</span>
        <span className="text-sm font-semibold">{String(props.initialValue ?? '---')} tokens</span>
      </div>
    );
  }

  if (type === 'AnnouncementBanner') {
    return (
      <p className="text-xs text-muted-foreground truncate">
        {String(props.message ?? 'No message set')}
      </p>
    );
  }

  if (type === 'QuickFilters') {
    const filters = Array.isArray(props.filters) ? props.filters : [];
    return (
      <div className="flex gap-1 flex-wrap">
        {filters.slice(0, 3).map((f, i) => (
          <span key={i} className="px-2 py-0.5 rounded-full bg-black/10 text-xs">{String(f)}</span>
        ))}
        {filters.length === 0 && <span className="text-xs text-muted-foreground">No filters</span>}
      </div>
    );
  }

  if (type === 'LeadSwipeStack') {
    return (
      <div className="flex gap-1 items-center">
        <div className="w-8 h-10 rounded bg-black/10 text-[9px] flex items-center justify-center">Lead</div>
        <div className="w-8 h-10 rounded bg-black/10 text-[9px] flex items-center justify-center opacity-60">Lead</div>
      </div>
    );
  }

  if (type === 'RecentLeadsCarousel') {
    return (
      <div className="flex gap-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="w-10 h-8 rounded bg-black/10 text-[9px] flex items-center justify-center">Card</div>
        ))}
      </div>
    );
  }

  if (type === 'ActionButtons') {
    const buttons = Array.isArray(props.buttons) ? props.buttons : [];
    return (
      <div className="flex gap-1 flex-wrap">
        {buttons.slice(0, 3).map((b, i) => (
          <span key={i} className="px-2 py-0.5 rounded bg-black/15 text-xs">{String(b)}</span>
        ))}
        {buttons.length === 0 && <span className="text-xs text-muted-foreground">No buttons</span>}
      </div>
    );
  }

  if (type === 'MetricCard') {
    return (
      <div className="flex items-end justify-between">
        <span className="text-xs text-muted-foreground">{String(props.label ?? 'Metric')}</span>
        <span className="text-sm font-bold">{String(props.value ?? '0')}</span>
      </div>
    );
  }

  if (type === 'CustomHtml') {
    return <span className="text-xs text-muted-foreground font-mono">{'<html />'}</span>;
  }

  if (type === 'Divider') {
    return <div className="w-full h-px bg-border" />;
  }

  if (type === 'Spacer') {
    const height = Number(props.height ?? 16);
    return <div style={{ height: Math.min(height, 48) }} className="w-full" />;
  }

  return null;
}

export function WidgetPreview({ widget, selected, onSelect, onDelete }: WidgetPreviewProps) {
  const style = WIDGET_STYLES[widget.type];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => e.key === 'Enter' && onSelect?.()}
      className={cn(
        'group relative rounded-md border p-2.5 cursor-pointer transition-all select-none',
        style.bg,
        style.border,
        selected && 'ring-2 ring-primary ring-offset-1',
      )}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className={cn('text-[11px] font-semibold uppercase tracking-wide', style.accent)}>
          {style.label}
        </span>
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-black/10"
            aria-label="Delete widget"
          >
            <TrashIcon size={12} className="text-muted-foreground" />
          </button>
        )}
      </div>
      <WidgetBody widget={widget} />
    </div>
  );
}
