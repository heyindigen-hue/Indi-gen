import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/store/auth';

export type LiveEvent = {
  id: string;
  type: string;
  summary: string;
  metadata?: unknown;
  ts: number;
};

export function useLiveEvents() {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [paused, setPaused] = useState(false);
  const [connected, setConnected] = useState(false);
  const token = useAuth((s) => s.token);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    if (!token) return;
    // TODO: backend needs to accept ?token= query param for EventSource auth.
    // Until wired in server/src/middleware/auth.ts, SSE will 401 silently.
    const url = `/api/admin/live?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.onmessage = (e) => {
      if (pausedRef.current) return;
      try {
        const data = JSON.parse(e.data) as Record<string, unknown>;
        const ev: LiveEvent = {
          id: crypto.randomUUID(),
          type: (data.type as string) || 'unknown',
          summary:
            (data.summary as string) || JSON.stringify(data).slice(0, 120),
          metadata: data,
          ts: (data.ts as number) || Date.now(),
        };
        setEvents((prev) => [ev, ...prev].slice(0, 100));
      } catch {
        // ignore malformed messages
      }
    };
    return () => es.close();
  }, [token]);

  return {
    events,
    paused,
    setPaused,
    connected,
    clear: () => setEvents([]),
  };
}
