import { ChartIcon, CreditCardIcon, UsersIcon, AlertCircleIcon, SparkleIcon, ZapIcon, GlobeIcon, XIcon } from '@/icons';
import { cn } from '@/lib/utils';
import { relTime } from '@/lib/utils';
import type { LiveEvent } from '@/hooks/useLiveEvents';

interface EventFeedProps {
  events: LiveEvent[];
  filter: string;
  onFilterChange: (f: string) => void;
  paused: boolean;
  onTogglePause: () => void;
  connected: boolean;
}

const FILTERS = ['all', 'scrape', 'payment', 'signup', 'error'] as const;

const filterMatchers: Record<string, (type: string) => boolean> = {
  all: () => true,
  scrape: (t) => t.startsWith('scrape'),
  payment: (t) => t.startsWith('payment'),
  signup: (t) => t.startsWith('user') || t.startsWith('signup'),
  error: (t) => t.startsWith('error'),
};

function eventIcon(type: string) {
  if (type.startsWith('scrape')) return <ChartIcon size={14} className="text-blue-400 shrink-0" />;
  if (type.startsWith('payment')) return <CreditCardIcon size={14} className="text-green-400 shrink-0" />;
  if (type.startsWith('user') || type.startsWith('signup')) return <UsersIcon size={14} className="text-purple-400 shrink-0" />;
  if (type.startsWith('error')) return <AlertCircleIcon size={14} className="text-red-400 shrink-0" />;
  return <SparkleIcon size={14} className="text-muted-foreground shrink-0" />;
}

function typeBadgeClass(type: string) {
  if (type.startsWith('scrape')) return 'bg-blue-500/10 text-blue-400';
  if (type.startsWith('payment')) return 'bg-green-500/10 text-green-400';
  if (type.startsWith('user') || type.startsWith('signup')) return 'bg-purple-500/10 text-purple-400';
  if (type.startsWith('error')) return 'bg-red-500/10 text-red-400';
  return 'bg-muted text-muted-foreground';
}

export function EventFeed({ events, filter, onFilterChange, paused, onTogglePause, connected }: EventFeedProps) {
  const filtered = events.filter((e) => (filterMatchers[filter] ?? filterMatchers.all)(e.type));

  return (
    <div className="rounded-lg border border-border bg-card flex flex-col h-[420px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">Live Events</span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            {connected ? (
              <GlobeIcon size={12} className="text-green-500" />
            ) : (
              <XIcon size={12} className="text-muted-foreground" />
            )}
            {connected ? 'live' : 'disconnected'}
          </span>
        </div>
        <button
          onClick={onTogglePause}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted"
        >
          {paused ? <ZapIcon size={12} /> : <SparkleIcon size={12} />}
          {paused ? 'Resume' : 'Pause'}
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-1.5 px-4 py-2 border-b border-border shrink-0">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => onFilterChange(f)}
            className={cn(
              'px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors',
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground',
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Event list */}
      <div className="flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            {paused ? 'Feed paused' : 'Waiting for events…'}
          </div>
        ) : (
          <ul>
            {filtered.map((ev) => (
              <li
                key={ev.id}
                className="flex items-start gap-3 px-4 py-2.5 border-b border-border/50 hover:bg-muted/30 transition-colors"
              >
                <span className="mt-0.5">{eventIcon(ev.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium', typeBadgeClass(ev.type))}>
                      {ev.type}
                    </span>
                  </div>
                  <p className="text-xs text-foreground truncate">{ev.summary}</p>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap mt-0.5 shrink-0">
                  {relTime(new Date(ev.ts))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
