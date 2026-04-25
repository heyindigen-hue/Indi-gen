import { TrashIcon } from '@/icons';
import { cn } from '@/lib/utils';
import { WIDGET_CATALOG_MAP } from '@/components/sdui/widgetCatalog';
import type { WidgetInstance } from '@/types/sdui';

interface WidgetPreviewProps {
  widget: WidgetInstance;
  selected?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
}

function WidgetBody({ widget }: { widget: WidgetInstance }) {
  const { type, props } = widget;
  const s = (v: unknown, fallback = ''): string => String(v ?? fallback);
  const b = (v: unknown): boolean => Boolean(v);
  const n = (v: unknown, fallback = 0): number => Number(v ?? fallback);

  switch (type) {
    case 'TokenBalance':
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] tracking-widest text-slate-400 font-mono">TOKENS</span>
            {b(props.showTopUp) && (
              <span className="text-[9px] bg-orange-500 text-white px-1.5 py-0.5 rounded-full font-semibold">Top up</span>
            )}
          </div>
          <span className="text-2xl font-bold text-slate-800 leading-none">1,240</span>
          <div className="flex items-end gap-2 mt-1">
            <svg width="64" height="20" viewBox="0 0 64 20">
              <polyline points="0,16 10,12 20,14 32,6 44,10 54,4 64,8" fill="none" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[10px] text-green-600 font-medium">+12 this week</span>
          </div>
        </div>
      );

    case 'AnnouncementBanner':
      return (
        <div className="flex items-start gap-2">
          <span className="text-amber-500 text-sm mt-0.5">📢</span>
          <p className="text-xs text-amber-800 leading-snug flex-1 truncate">
            {String(props.message || 'Announcement text here')}
          </p>
          {b(props.dismissable) && (
            <span className="text-[10px] text-amber-400 shrink-0">✕</span>
          )}
        </div>
      );

    case 'QuickFilters': {
      const filters = Array.isArray(props.filters) ? props.filters : [];
      return (
        <div className="flex gap-1 flex-wrap">
          {(filters.slice(0, 4) as string[]).map((f, i) => (
            <span key={i} className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium', i === 0 ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600')}>
              {f}
            </span>
          ))}
          {filters.length === 0 && <span className="text-[10px] text-muted-foreground">No filters</span>}
        </div>
      );
    }

    case 'LeadSwipeStack':
      return (
        <div className="flex items-center justify-center gap-[-8px] relative h-12">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="absolute w-28 h-10 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center px-2.5 gap-2"
              style={{ transform: `rotate(${(i - 1) * 3}deg) translateX(${(i - 1) * 6}px)`, zIndex: 3 - i }}
            >
              <div className="w-5 h-5 rounded-full bg-slate-200 shrink-0" />
              <div className="flex flex-col gap-0.5">
                <div className="h-1.5 w-12 bg-slate-200 rounded" />
                <div className="h-1 w-8 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      );

    case 'RecentLeadsCarousel':
      return (
        <div className="flex gap-1.5 overflow-hidden">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="shrink-0 w-16 h-14 rounded-lg border border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-1 p-1">
              <div className="w-6 h-6 rounded-full bg-slate-200" />
              <div className="h-1 w-10 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      );

    case 'ActionButtons': {
      const actions = Array.isArray(props.actions) ? (props.actions as string[]) : [];
      const buttons = actions.length ? actions : ['scrape', 'import'];
      return (
        <div className="flex gap-1.5">
          {buttons.slice(0, 3).map((b, i) => (
            <div key={i} className={cn('flex-1 h-7 rounded-lg flex items-center justify-center text-[10px] font-semibold', i === 0 ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200')}>
              {String(b).replace('_', ' ')}
            </div>
          ))}
        </div>
      );
    }

    case 'MetricCard':
      return (
        <div className="flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400">{String(props.label ?? 'Metric')}</span>
            <span className="text-xl font-bold text-slate-800 leading-none mt-0.5">{String(props.value ?? '0')}</span>
          </div>
          <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', props.trend === 'up' ? 'bg-green-100 text-green-700' : props.trend === 'down' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500')}>
            {props.trend === 'up' ? '↑ Up' : props.trend === 'down' ? '↓ Down' : '→ Flat'}
          </span>
        </div>
      );

    case 'CustomHtml':
      return <span className="text-[10px] text-muted-foreground font-mono">{'<html />'}</span>;

    case 'Divider':
      return <div className="w-full" style={{ height: Number(props.thickness ?? 1), background: '#E2E8F0' }} />;

    case 'Spacer': {
      const h = Math.min(Number(props.height ?? 16), 32);
      return <div style={{ height: h }} className="w-full bg-slate-50 border border-dashed border-slate-200 rounded text-[9px] text-center text-slate-300 flex items-center justify-center">{s(props.height)}px</div>;
    }

    case 'HeroBanner':
      return (
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 p-3">
          <p className="text-xs font-bold text-slate-800 leading-tight">{String(props.title ?? 'Hero Headline')}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">{String(props.subtitle ?? 'Subtitle text')}</p>
          {b(props.cta_label) && (
            <div className="mt-2 inline-flex items-center bg-orange-500 text-white text-[9px] font-semibold px-2 py-1 rounded-full">
              {s(props.cta_label)}
            </div>
          )}
          <div className="absolute right-2 bottom-2 text-2xl opacity-30">🎯</div>
        </div>
      );

    case 'ProfileCard':
      return (
        <div className="flex items-center gap-2">
          {b(props.showAvatar) && <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-300 shrink-0" />}
          <div className="flex-1 min-w-0">
            <div className="h-2 w-20 bg-slate-200 rounded mb-1" />
            {b(props.showPlan) && <div className="h-1.5 w-14 bg-orange-100 rounded" />}
          </div>
          {b(props.showTokens) && <div className="text-[10px] font-bold text-orange-500">1,240 tk</div>}
        </div>
      );

    case 'StatGrid': {
      const cells = Array.isArray(props.cells) ? (props.cells as any[]).slice(0, 4) : [];
      const labels = cells.length ? cells.map((c: any) => c.label) : ['Saved', 'Sent', 'Reply %', 'Tokens'];
      return (
        <div className="grid grid-cols-2 gap-1.5">
          {labels.slice(0, 4).map((label, i) => (
            <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg p-1.5">
              <div className="h-3 w-8 bg-slate-200 rounded mb-1" />
              <p className="text-[9px] text-slate-400">{label}</p>
            </div>
          ))}
        </div>
      );
    }

    case 'ProposalCard':
      return (
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
          <div className="text-lg">📄</div>
          <div className="flex-1 min-w-0">
            <div className="h-2 w-24 bg-slate-200 rounded mb-1" />
            <div className="h-1.5 w-16 bg-slate-100 rounded" />
          </div>
          <span className="text-[9px] text-orange-500 font-semibold shrink-0">Continue →</span>
        </div>
      );

    case 'ReferralBanner':
      return (
        <div className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-2">
          <span className="text-lg">🎁</span>
          <div className="flex-1">
            <p className="text-[10px] font-semibold text-slate-700">Invite friends, earn {n(props.reward, 50)} tokens</p>
            <div className="mt-1 flex items-center gap-1">
              <code className="text-[9px] bg-white border border-amber-200 px-1 rounded">EARN50</code>
            </div>
          </div>
        </div>
      );

    case 'ChartCard':
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 capitalize">{String(props.metric_key ?? 'leads_per_day').replace(/_/g, ' ')}</span>
            <span className="text-[9px] text-slate-400">{String(props.range ?? '30d')}</span>
          </div>
          <svg width="100%" height="28" viewBox="0 0 180 28" preserveAspectRatio="none">
            <polyline points="0,22 30,16 60,18 90,8 120,12 150,4 180,10" fill="none" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      );

    case 'SearchBar':
      return (
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <span className="text-slate-400 text-xs">🔍</span>
          <span className="text-[10px] text-slate-400">{String(props.placeholder ?? 'Search leads...')}</span>
        </div>
      );

    case 'ActivityFeed':
      return (
        <div className="flex flex-col gap-1">
          {[
            { icon: '🔍', text: 'Scraped 12 leads', time: '2m' },
            { icon: '💌', text: 'Message sent to Rohan', time: '1h' },
            { icon: '✅', text: 'Lead saved: Priya K.', time: '3h' },
          ].slice(0, Number(props.limit ?? 10) > 2 ? 3 : 2).map((ev, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs shrink-0">{ev.icon}</span>
              <span className="text-[10px] text-slate-600 flex-1 truncate">{ev.text}</span>
              <span className="text-[9px] text-slate-400 shrink-0">{ev.time}</span>
            </div>
          ))}
        </div>
      );

    case 'LessonCard':
      return (
        <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-100 p-2">
          <span className="text-lg">💡</span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-blue-800">Tip of the day</p>
            <p className="text-[9px] text-blue-600 mt-0.5 leading-snug">Use 3-word phrases for 2× more leads</p>
          </div>
        </div>
      );

    case 'StreakCounter':
      return (
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔥</span>
          <div>
            <p className="text-lg font-bold text-slate-800 leading-none">7</p>
            <p className="text-[10px] text-slate-500">{String(props.type ?? 'login')} day streak</p>
          </div>
          <div className="ml-auto flex gap-0.5">
            {[1,1,1,1,1,0,0].map((v, i) => (
              <div key={i} className={cn('w-3 h-3 rounded-sm', v ? 'bg-orange-400' : 'bg-slate-200')} />
            ))}
          </div>
        </div>
      );

    case 'TrendingPhrases':
      return (
        <div className="flex flex-col gap-1">
          {['looking for developer', 'building SaaS', 'AI chatbot'].slice(0, Math.min(Number(props.limit ?? 5), 3)).map((phrase, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-[10px] text-slate-600">{i + 1}. {phrase}</span>
              <span className="text-[9px] text-green-600 font-medium">+{(3 - i) * 4} leads</span>
            </div>
          ))}
        </div>
      );

    case 'SuggestedLeads':
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] font-semibold text-slate-600">AI Picks</span>
            <span className="text-[9px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">Score ≥{n(props.score_min, 7)}</span>
          </div>
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-slate-200 shrink-0" />
              <div className="h-1.5 flex-1 bg-slate-200 rounded" />
              <div className="h-3 w-6 bg-orange-200 rounded text-[8px] text-orange-600 flex items-center justify-center font-bold">9</div>
            </div>
          ))}
        </div>
      );

    case 'ChannelMix':
      return (
        <div className="flex gap-3 items-center">
          <div className="relative w-10 h-10">
            <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90">
              <circle cx="18" cy="18" r="14" fill="none" stroke="#F97316" strokeWidth="6" strokeDasharray="60 38" />
              <circle cx="18" cy="18" r="14" fill="none" stroke="#FCD34D" strokeWidth="6" strokeDasharray="25 73" strokeDashoffset="-60" />
              <circle cx="18" cy="18" r="14" fill="none" stroke="#E2E8F0" strokeWidth="6" strokeDasharray="15 83" strokeDashoffset="-85" />
            </svg>
          </div>
          <div className="flex flex-col gap-0.5">
            {[['#F97316', 'LinkedIn', '60%'], ['#FCD34D', 'Email', '25%'], ['#E2E8F0', 'Other', '15%']].map(([c, l, v]) => (
              <div key={l} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: c }} />
                <span className="text-[9px] text-slate-600">{l}</span>
                <span className="text-[9px] text-slate-400 ml-1">{v}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case 'TokenForecast':
      return (
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center justify-center w-12 h-12 rounded-full bg-orange-50 border border-orange-200">
            <span className="text-base font-bold text-orange-600 leading-none">23</span>
            <span className="text-[8px] text-orange-400">days</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-700">Token Runway</p>
            <p className="text-[10px] text-slate-400">at current burn rate</p>
          </div>
        </div>
      );

    case 'VideoCard':
      return (
        <div className="relative overflow-hidden rounded-lg bg-slate-800 aspect-video flex items-center justify-center" style={{ height: 64 }}>
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <div className="w-0 h-0 border-t-[6px] border-b-[6px] border-l-[10px] border-transparent border-l-white ml-1" />
          </div>
          <div className="absolute bottom-1 left-2 right-2">
            <p className="text-white text-[9px] font-medium truncate">{String(props.title ?? 'Tutorial Video')}</p>
          </div>
        </div>
      );

    case 'TestimonialQuote':
      return (
        <div className="flex flex-col gap-1 p-2 bg-slate-50 rounded-lg border border-slate-100">
          <span className="text-lg leading-none">"</span>
          <p className="text-[10px] text-slate-600 italic leading-snug">
            Found 40 new buyers in one week. This is insane.
          </p>
          <p className="text-[9px] text-slate-400 text-right">— Arjun S.</p>
        </div>
      );

    case 'FollowupReminder':
      return (
        <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2">
          <span className="text-lg">⏰</span>
          <div>
            <p className="text-[10px] font-semibold text-red-700">5 leads need follow-up</p>
            <p className="text-[9px] text-red-400">No reply in {n(props.days_threshold, 7)}+ days</p>
          </div>
          <span className="ml-auto text-[9px] text-red-500 font-semibold shrink-0">View →</span>
        </div>
      );

    case 'WhatsNewCard':
      return (
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-semibold text-slate-600">What's New</p>
          {['AI phrase suggestions', 'Bulk outreach', 'Dark mode'].slice(0, Number(props.limit ?? 3)).map((item, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-orange-400 shrink-0" />
              <span className="text-[9px] text-slate-500">{item}</span>
            </div>
          ))}
        </div>
      );

    default:
      return null;
  }
}

export function WidgetPreview({ widget, selected, onSelect, onDelete }: WidgetPreviewProps) {
  const entry = WIDGET_CATALOG_MAP[widget.type];
  const dot = entry?.colorDot ?? '#94A3B8';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => e.key === 'Enter' && onSelect?.()}
      className={cn(
        'group relative rounded-md border bg-card p-2.5 cursor-pointer transition-all select-none',
        'border-border hover:border-border/80',
        selected && 'ring-2 ring-primary ring-offset-1 border-primary/30',
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: dot }} />
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            {entry?.label ?? widget.type}
          </span>
        </div>
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/10"
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
