import { motion, AnimatePresence, MotionValue, useMotionValueEvent } from 'framer-motion';
import { useMemo, useState } from 'react';
import FlowerMark from '../FlowerMark';

const EASE = [0.16, 1, 0.3, 1] as const;

const STREAM = [
  { name: 'Priya Raghavan', role: 'Founder · Loom & Co', snippet: 'Hiring two senior backend engineers — Shopify + Postgres stack...' },
  { name: 'Marc Kowalski', role: 'Head of Growth · Northstar', snippet: 'Looking for vendors who can run multi-touch sequences without...' },
  { name: 'Aisha Bhatnagar', role: 'COO · Granular', snippet: 'Our outbound is broken. We tried 3 platforms last quarter...' },
  { name: 'Tom Whitfield', role: 'VP Sales · Beacon Labs', snippet: 'Killing off SalesLoft this Q. Anyone running an AI-first stack...' },
  { name: 'Sana Vora', role: 'CEO · Slate Studio', snippet: 'Quietly scaling our agency from 4 to 12. RFP volume is...' },
  { name: 'Rohit Mehra', role: 'Co-founder · Hearthstone', snippet: 'Just closed our seed. Building the founding sales motion now...' },
  { name: 'Dana Lopez', role: 'Head of RevOps · Helix', snippet: 'We need a tool that drafts in our voice. Our SDRs sound like...' },
];

interface Props {
  step: number;
  progress: MotionValue<number>;
}

export default function HuntMock({ step, progress }: Props) {
  const visibleCount = step === 0 ? 1 : step === 1 ? 4 : STREAM.length;

  const [counter, setCounter] = useState(1247);

  // Frozen "minutes ago" stamps so they don't reroll on every parent render.
  const stamps = useMemo(
    () => STREAM.map(() => Math.floor(Math.random() * 9) + 1),
    []
  );

  // Setter bails on equal values, so this only re-renders when the integer changes.
  useMotionValueEvent(progress, 'change', (v) => {
    const c = Math.round(1247 + (8902 - 1247) * Math.min(1, v * 1.3));
    setCounter((cur) => (cur === c ? cur : c));
  });

  return (
    <div
      className="rounded-3xl relative overflow-hidden flex flex-col"
      style={{
        backgroundColor: 'rgba(247,241,229,0.04)',
        border: '1px solid rgba(247,241,229,0.16)',
        minHeight: 540,
      }}
    >
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(247,241,229,0.12)' }}
      >
        <div className="flex items-center gap-2.5">
          <FlowerMark size={18} petal="rgba(247,241,229,0.85)" core="var(--orange)" />
          <span className="mono" style={{ color: 'rgba(247,241,229,0.7)' }}>
            LIVE STREAM
          </span>
        </div>
        <div className="flex items-center gap-2">
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            className="block w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: 'var(--orange)' }}
          />
          <span className="mono" style={{ color: 'rgba(247,241,229,0.55)' }}>
            SCRAPING
          </span>
        </div>
      </div>

      <div className="flex-1 px-5 py-4 flex flex-col gap-2 overflow-hidden">
        <AnimatePresence initial={false}>
          {STREAM.slice(0, visibleCount).map((row, i) => (
            <motion.div
              key={row.name}
              layout
              initial={{ opacity: 0, y: -12, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: EASE, delay: i * 0.03 }}
              className="rounded-xl flex items-start gap-3"
              style={{
                padding: '12px 14px',
                backgroundColor: 'rgba(247,241,229,0.04)',
                border: '1px solid rgba(247,241,229,0.08)',
              }}
            >
              <div
                className="rounded-full shrink-0 flex items-center justify-center"
                style={{
                  width: 30,
                  height: 30,
                  backgroundColor: 'rgba(247,241,229,0.06)',
                }}
              >
                <FlowerMark
                  size={18}
                  petal="rgba(247,241,229,0.6)"
                  core="var(--orange)"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className="flex items-center justify-between gap-2"
                  style={{ color: 'var(--cream)' }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{row.name}</span>
                  <span className="mono" style={{ color: 'rgba(247,241,229,0.4)', fontSize: 9.5 }}>
                    {stamps[i]}M AGO
                  </span>
                </div>
                <div className="mono" style={{ color: 'rgba(247,241,229,0.5)', fontSize: 9.5, marginTop: 2 }}>
                  {row.role}
                </div>
                <div
                  style={{ color: 'rgba(247,241,229,0.78)', fontSize: 12.5, marginTop: 6, lineHeight: 1.4 }}
                >
                  {row.snippet}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{ borderTop: '1px solid rgba(247,241,229,0.12)' }}
      >
        <div>
          <div className="mono" style={{ color: 'rgba(247,241,229,0.55)', fontSize: 10 }}>
            POSTS SCANNED · LAST 12H
          </div>
          <div
            className="serif tabular-nums"
            style={{ fontSize: 36, fontWeight: 300, color: 'var(--cream)', letterSpacing: '-0.02em' }}
          >
            {counter.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="mono" style={{ color: 'rgba(247,241,229,0.55)', fontSize: 10 }}>
            BUYING SIGNALS
          </div>
          <div
            className="serif tabular-nums"
            style={{ fontSize: 36, fontWeight: 300, color: 'var(--orange)', letterSpacing: '-0.02em' }}
          >
            {Math.round(counter * 0.07).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
