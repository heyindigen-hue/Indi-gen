import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Download, Pause, Play, ArrowDownToLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRegisterCommand } from '@/store/commands';
import { useNavigate } from 'react-router-dom';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogService = 'api' | 'scraper' | 'worker';

type LogEntry = {
  id: string;
  timestamp: string;
  level: LogLevel;
  service: LogService;
  message: string;
  raw: string;
};

const MAX_LOGS = 10000;

const LEVEL_CLASS: Record<LogLevel, string> = {
  debug: 'text-zinc-500',
  info: 'text-zinc-100',
  warn: 'text-amber-400',
  error: 'text-red-400',
};

const LEVEL_LABEL_CLASS: Record<LogLevel, string> = {
  debug: 'text-zinc-500',
  info: 'text-blue-400',
  warn: 'text-amber-400',
  error: 'text-red-400',
};

function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

function formatTimestamp(ts: string): string {
  try {
    return new Date(ts).toISOString().replace('T', ' ').slice(0, 23);
  } catch {
    return ts;
  }
}

export default function LogsPage() {
  const navigate = useNavigate();

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [paused, setPaused] = useState(false);
  const [followTail, setFollowTail] = useState(true);
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>('all');
  const [serviceFilter, setServiceFilter] = useState<LogService | 'all'>('all');
  const [regexFilter, setRegexFilter] = useState('');

  const parentRef = useRef<HTMLDivElement>(null);

  // SSE connection — re-runs when paused changes so we can close/reopen
  useEffect(() => {
    const BASE = (import.meta.env.VITE_API_URL as string) || '/api';
    const token = localStorage.getItem('indigen_token');
    const es = new EventSource(`${BASE}/admin/logs/stream?token=${token}`);

    es.onmessage = (e: MessageEvent) => {
      if (paused) return;
      try {
        const entry: LogEntry = JSON.parse(e.data as string);
        setLogs((prev) => {
          const next = [...prev, entry];
          return next.length > MAX_LOGS ? next.slice(next.length - MAX_LOGS) : next;
        });
      } catch {
        // ignore malformed messages
      }
    };

    es.onerror = () => {
      es.close();
    };

    return () => es.close();
  }, [paused]);

  const filteredLogs = useMemo(() => {
    let result = logs;

    if (levelFilter !== 'all') {
      result = result.filter((l) => l.level === levelFilter);
    }

    if (serviceFilter !== 'all') {
      result = result.filter((l) => l.service === serviceFilter);
    }

    if (regexFilter.trim()) {
      try {
        const re = new RegExp(regexFilter, 'i');
        result = result.filter((l) => re.test(l.message) || re.test(l.raw));
      } catch {
        // invalid regex — skip filter
      }
    }

    return result;
  }, [logs, levelFilter, serviceFilter, regexFilter]);

  const virtualizer = useVirtualizer({
    count: filteredLogs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 20,
    overscan: 20,
  });

  // Follow tail
  useEffect(() => {
    if (followTail && parentRef.current) {
      parentRef.current.scrollTop = parentRef.current.scrollHeight;
    }
  }, [filteredLogs, followTail]);

  const handleExport = useCallback(() => {
    const lines = filteredLogs
      .map(
        (l) =>
          `[${formatTimestamp(l.timestamp)}] [${l.level.toUpperCase()}] [${l.service}] ${stripAnsi(l.raw)}`,
      )
      .join('\n');
    const blob = new Blob([lines], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredLogs]);

  useRegisterCommand(
    {
      id: 'platform.logs',
      label: 'View logs',
      group: 'Platform',
      action: () => navigate('/platform/logs'),
    },
    [],
  );

  useRegisterCommand(
    {
      id: 'platform.logs.pause',
      label: 'Pause log stream',
      group: 'Platform',
      action: () => setPaused((p) => !p),
    },
    [],
  );

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  return (
    <div>
      <PageHeader
        title="Logs"
        subtitle="Live streaming log viewer"
      />

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-3 items-end">
        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Level</Label>
          <Select
            value={levelFilter}
            onValueChange={(v) => setLevelFilter(v as LogLevel | 'all')}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All levels</SelectItem>
              <SelectItem value="debug">
                <span className={LEVEL_LABEL_CLASS.debug}>debug</span>
              </SelectItem>
              <SelectItem value="info">
                <span className={LEVEL_LABEL_CLASS.info}>info</span>
              </SelectItem>
              <SelectItem value="warn">
                <span className={LEVEL_LABEL_CLASS.warn}>warn</span>
              </SelectItem>
              <SelectItem value="error">
                <span className={LEVEL_LABEL_CLASS.error}>error</span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Service</Label>
          <Select
            value={serviceFilter}
            onValueChange={(v) => setServiceFilter(v as LogService | 'all')}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All services</SelectItem>
              <SelectItem value="api">api</SelectItem>
              <SelectItem value="scraper">scraper</SelectItem>
              <SelectItem value="worker">worker</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs text-muted-foreground">Filter regex</Label>
          <Input
            className="w-52 font-mono text-xs"
            placeholder="e.g. error|timeout"
            value={regexFilter}
            onChange={(e) => setRegexFilter(e.target.value)}
          />
        </div>

        <div className="flex items-end gap-2 ml-auto">
          <Button
            variant={paused ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPaused((p) => !p)}
          >
            {paused ? (
              <>
                <Play className="h-3.5 w-3.5 mr-1.5" />
                Resume
              </>
            ) : (
              <>
                <Pause className="h-3.5 w-3.5 mr-1.5" />
                Pause
              </>
            )}
          </Button>

          <Button
            variant={followTail ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFollowTail((f) => !f)}
          >
            <ArrowDownToLine className="h-3.5 w-3.5 mr-1.5" />
            Follow
          </Button>

          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export ({filteredLogs.length.toLocaleString()})
          </Button>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-3 mb-2 text-xs text-muted-foreground">
        <span>{filteredLogs.length.toLocaleString()} entries</span>
        {paused && (
          <span className="text-amber-500 font-medium">PAUSED</span>
        )}
        {!paused && (
          <span className="text-green-500 font-medium">LIVE</span>
        )}
      </div>

      {/* Log viewer */}
      <div
        ref={parentRef}
        className="h-[calc(100vh-220px)] overflow-auto font-mono text-xs bg-zinc-950 text-zinc-100 rounded-md p-2"
      >
        {filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-zinc-600">
            {logs.length === 0 ? 'Waiting for log entries...' : 'No entries match current filters'}
          </div>
        ) : (
          <div style={{ height: `${totalSize}px`, position: 'relative' }}>
            {virtualItems.map((vItem) => {
              const entry = filteredLogs[vItem.index];
              const text = stripAnsi(entry.raw) || entry.message;
              return (
                <div
                  key={entry.id}
                  data-index={vItem.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${vItem.start}px)`,
                  }}
                  className={cn(
                    'whitespace-pre leading-5 px-1 hover:bg-zinc-900/60',
                    LEVEL_CLASS[entry.level],
                  )}
                >
                  <span className="text-zinc-600 select-none">
                    [{formatTimestamp(entry.timestamp)}]{' '}
                  </span>
                  <span
                    className={cn(
                      'font-semibold uppercase w-5 inline-block',
                      LEVEL_CLASS[entry.level],
                    )}
                  >
                    [{entry.level}]
                  </span>
                  <span className="text-zinc-500 select-none"> [{entry.service}] </span>
                  {text}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
