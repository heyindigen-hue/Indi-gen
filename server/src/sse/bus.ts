import { Response } from 'express';
import { pub, sub } from '../redis';

const clients = new Map<string, Response[]>();

sub.psubscribe('sse:*');
sub.on('pmessage', (_pattern, channel, message) => {
  const topic = channel.replace('sse:', '');
  (clients.get(topic) || []).forEach(res => {
    res.write(`event: ${topic}\ndata: ${message}\n\n`);
  });
  (clients.get('*') || []).forEach(res => {
    res.write(`event: ${topic}\ndata: ${message}\n\n`);
  });
});

export function attachSSE(res: Response, topics: string[]) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  res.write(`event: connected\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`);

  topics.forEach(t => {
    const arr = clients.get(t) || [];
    arr.push(res);
    clients.set(t, arr);
  });

  const hb = setInterval(() => res.write(`: heartbeat\n\n`), 20000);
  res.on('close', () => {
    clearInterval(hb);
    topics.forEach(t => {
      const arr = (clients.get(t) || []).filter(r => r !== res);
      clients.set(t, arr);
    });
  });
}

export async function emit(topic: string, payload: any) {
  await pub.publish(`sse:${topic}`, JSON.stringify({ ts: Date.now(), ...payload }));
}
