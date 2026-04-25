import { motion, Reorder } from 'framer-motion';
import { useEffect, useState } from 'react';
import FlowerMark from '../FlowerMark';

const EASE = [0.22, 1, 0.36, 1] as const;

type Row = {
  id: string;
  name: string;
  signal: string;
  intent: 'buyer' | 'seeker' | 'self' | 'noise';
  score: number;
};

const INITIAL: Row[] = [
  { id: 'a', name: 'Marc Kowalski', signal: 'Killing off SalesLoft this Q...', intent: 'buyer', score: 8.9 },
  { id: 'b', name: 'Rohit Mehra', signal: 'Just closed our seed. Building...', intent: 'buyer', score: 8.2 },
  { id: 'c', name: 'Lou Venner', signal: 'New role unlocked! Looking for...', intent: 'seeker', score: 2.1 },
  { id: 'd', name: 'Dana Lopez', signal: 'Need a tool that drafts in our voice...', intent: 'buyer', score: 9.4 },
  { id: 'e', name: 'Self-Promo Sam', signal: 'Read my new ebook on outbound...', intent: 'self', score: 1.4 },
  { id: 'f', name: 'Aisha Bhatnagar', signal: 'Our outbound is broken. We tried...', intent: 'buyer', score: 7.8 },
  { id: 'g', name: 'Generic Repost', signal: 'Reposted: "10 tips for SDRs"...', intent: 'noise', score: 0.6 },
];

const SORTED: Row[] = [...INITIAL].sort((a, b) => b.score - a.score);

const PILL_COLOR: Record<Row['intent'], string> = {
  buyer: 'var(--orange)',
  seeker: 'rgba(14,14,12,0.4)',
  self: 'rgba(14,14,12,0.4)',
  noise: 'rgba(14,14,12,0.3)',
};

const PILL_LABEL: Record<Row['intent'], string> = {
  buyer: 'BUYER',
  seeker: 'JOB SEEKER',
  self: 'SELF-PROMO',
  noise: 'NOISE',
};

interface Props {
  step: number;
}

export default function QualifyMock({ step }: Props) {
  const [items, setItems] = useState<Row[]>(INITIAL);

  useEffect(() => {
    if (step >= 2) setItems(SORTED);
    else setItems(INITIAL);
  }, [step]);

  return (
    <div
      className="rounded-3xl relative overflow-hidden flex flex-col"
      style={{
        backgroundColor: 'var(--paper)',
        border: '1px solid var(--line)',
        padding: 20,
        minHeight: 540,
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="mono" style={{ color: 'var(--ash)' }}>
          INTENT MODEL · CLAUDE HAIKU
        </div>
        <div
          className="rounded-full mono flex items-center gap-1.5"
          style={{
            padding: '4px 10px',
            backgroundColor: step >= 1 ? 'rgba(255,90,31,0.12)' : 'rgba(14,14,12,0.05)',
            color: step >= 1 ? 'var(--orange)' : 'var(--ash)',
            fontSize: 9.5,
            transition: 'all .4s',
          }}
        >
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: step >= 1 ? 'var(--orange)' : 'var(--ash)' }}
          />
          {step === 0 ? 'IDLE' : step === 1 ? 'SCORING' : 'SORTED'}
        </div>
      </div>

      <Reorder.Group
        axis="y"
        values={items}
        onReorder={setItems}
        className="flex flex-col gap-2 flex-1"
      >
        {items.map((row) => {
          const dim = step >= 2 && row.intent !== 'buyer';
          const filled = step >= 1;
          return (
            <Reorder.Item
              key={row.id}
              value={row}
              drag={false}
              layout
              transition={{ duration: 0.7, ease: EASE }}
              className="rounded-xl flex items-center gap-3"
              style={{
                padding: 14,
                backgroundColor: 'var(--cream)',
                border: '1px solid var(--line)',
                opacity: dim ? 0.32 : 1,
                transition: 'opacity .5s',
              }}
            >
              <div
                className="rounded-full shrink-0 flex items-center justify-center"
                style={{
                  width: 30,
                  height: 30,
                  backgroundColor: 'rgba(14,14,12,0.05)',
                }}
              >
                <FlowerMark size={18} petal="rgba(14,14,12,0.5)" core="var(--orange)" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{row.name}</span>
                  {row.intent === 'buyer' && (
                    <motion.span
                      key={`dot-${row.id}-${step}`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3, ease: EASE, delay: 0.2 }}
                      className="block w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: 'var(--orange)' }}
                    />
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ash)', lineHeight: 1.4 }}>
                  {row.signal}
                </div>
                {/* Score bar */}
                <div className="mt-2 flex items-center gap-2">
                  <div
                    className="rounded-full overflow-hidden flex-1 h-1"
                    style={{ backgroundColor: 'rgba(14,14,12,0.08)' }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      initial={false}
                      animate={{ width: filled ? `${row.score * 10}%` : '0%' }}
                      transition={{ duration: 0.7, ease: EASE }}
                      style={{
                        backgroundColor: row.intent === 'buyer' ? 'var(--orange)' : 'rgba(14,14,12,0.35)',
                      }}
                    />
                  </div>
                  <span className="mono tabular-nums" style={{ fontSize: 10, color: 'var(--ash)' }}>
                    {row.score.toFixed(1)}
                  </span>
                </div>
              </div>
              <span
                className="mono shrink-0"
                style={{
                  fontSize: 9,
                  padding: '4px 9px',
                  borderRadius: 999,
                  backgroundColor: 'transparent',
                  color: PILL_COLOR[row.intent],
                  border: `1px solid ${PILL_COLOR[row.intent]}`,
                  opacity: filled ? 1 : 0.3,
                  transition: 'opacity .5s',
                }}
              >
                {PILL_LABEL[row.intent]}
              </span>
            </Reorder.Item>
          );
        })}
      </Reorder.Group>
    </div>
  );
}
