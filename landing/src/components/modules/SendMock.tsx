import { motion, AnimatePresence, MotionValue, useMotionValueEvent, useTransform } from 'framer-motion';
import { useState } from 'react';

const EASE = [0.16, 1, 0.3, 1] as const;

const DRAFT_LINES = [
  'Hi Marc — saw you mentioned killing off SalesLoft this Q.',
  'We just shipped a Claude-native draft engine that writes in your voice.',
  'Worth a 12-min look? Tuesday afternoon works on my end.',
];

const TOTAL_CHARS = DRAFT_LINES.reduce((s, l) => s + l.length, 0);

const SENT = [
  { name: 'Priya R.', channel: 'WhatsApp' },
  { name: 'Aisha B.', channel: 'Email' },
  { name: 'Rohit M.', channel: 'LinkedIn DM' },
  { name: 'Dana L.', channel: 'Email' },
];

interface Props {
  step: number;
  progress: MotionValue<number>;
}

export default function SendMock({ step, progress }: Props) {
  // Scroll-driven typing across all 3 lines.
  const charProgress = useTransform(progress, [0.20, 0.78], [0, 1]);
  const [typedLine, setTypedLine] = useState(0);
  const [typed, setTyped] = useState('');

  useMotionValueEvent(charProgress, 'change', (v) => {
    const target = Math.max(0, Math.min(TOTAL_CHARS, Math.round(v * TOTAL_CHARS)));
    let used = 0;
    let line = 0;
    let lineChar = 0;
    for (let i = 0; i < DRAFT_LINES.length; i++) {
      const len = DRAFT_LINES[i].length;
      if (used + len >= target) {
        line = i;
        lineChar = target - used;
        break;
      }
      used += len;
      line = i;
      lineChar = len;
    }
    setTypedLine((cur) => (cur === line ? cur : line));
    const nextSlice = DRAFT_LINES[line]?.slice(0, lineChar) ?? '';
    setTyped((cur) => (cur === nextSlice ? cur : nextSlice));
  });

  const renderedLines = DRAFT_LINES.slice(0, typedLine);
  const currentLine = DRAFT_LINES[typedLine] ? typed : '';

  return (
    <div className="flex flex-col gap-3" style={{ minHeight: 540 }}>
      {/* Top: composer */}
      <div
        className="rounded-3xl relative overflow-hidden flex-1"
        style={{
          backgroundColor: 'rgba(247,241,229,0.04)',
          border: '1px solid rgba(247,241,229,0.16)',
          padding: 18,
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="mono" style={{ color: 'rgba(247,241,229,0.55)' }}>
            COMPOSE / MARC KOWALSKI
          </div>
          <div className="mono flex items-center gap-1.5" style={{ color: 'rgba(247,241,229,0.55)', fontSize: 10 }}>
            <span className="block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--orange)' }} />
            CLAUDE · YOUR VOICE
          </div>
        </div>

        <div
          className="serif"
          style={{
            color: 'var(--cream)',
            fontSize: 18,
            lineHeight: 1.45,
            fontWeight: 300,
            letterSpacing: '-0.005em',
            minHeight: 130,
          }}
        >
          {renderedLines.map((l, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
              style={{ marginBottom: 8 }}
            >
              {l}
            </motion.div>
          ))}
          {currentLine && (
            <div>
              {currentLine}
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                style={{
                  display: 'inline-block',
                  width: 2,
                  height: 18,
                  backgroundColor: 'var(--orange)',
                  marginLeft: 2,
                  verticalAlign: 'middle',
                }}
              />
            </div>
          )}
        </div>
        <div
          className="mt-4 pt-3 flex items-center justify-between"
          style={{ borderTop: '1px solid rgba(247,241,229,0.1)' }}
        >
          <div className="flex gap-1.5">
            {['Email', 'WhatsApp', 'LinkedIn'].map((c, i) => (
              <span
                key={c}
                className="mono"
                style={{
                  padding: '4px 9px',
                  borderRadius: 999,
                  fontSize: 9.5,
                  backgroundColor: i === 0 ? 'var(--orange)' : 'rgba(247,241,229,0.06)',
                  color: i === 0 ? 'var(--ink)' : 'rgba(247,241,229,0.65)',
                }}
              >
                {c}
              </span>
            ))}
          </div>
          <span
            className="mono"
            style={{
              padding: '6px 12px',
              borderRadius: 999,
              fontSize: 10,
              color: 'var(--ink)',
              backgroundColor: 'var(--cream)',
            }}
          >
            send →
          </span>
        </div>
      </div>

      {/* Bottom split: sent + Gantt */}
      <div className="grid grid-cols-2 gap-3" style={{ flex: 1 }}>
        {/* Sent tray */}
        <div
          className="rounded-2xl p-4 flex flex-col gap-2"
          style={{
            backgroundColor: 'rgba(247,241,229,0.04)',
            border: '1px solid rgba(247,241,229,0.16)',
          }}
        >
          <div className="mono mb-1" style={{ color: 'rgba(247,241,229,0.55)' }}>
            SENT TODAY
          </div>
          <AnimatePresence>
            {SENT.slice(0, step >= 2 ? SENT.length : Math.max(1, step)).map((s, i) => (
              <motion.div
                key={s.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: EASE, delay: i * 0.04 }}
                className="flex items-center justify-between"
                style={{
                  padding: '8px 10px',
                  borderRadius: 10,
                  backgroundColor: 'rgba(247,241,229,0.04)',
                }}
              >
                <span style={{ color: 'var(--cream)', fontSize: 12, fontWeight: 500 }}>
                  {s.name}
                </span>
                <span className="mono" style={{ color: 'rgba(247,241,229,0.5)', fontSize: 9 }}>
                  {s.channel}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Gantt timeline */}
        <div
          className="rounded-2xl p-4 flex flex-col gap-3"
          style={{
            backgroundColor: 'rgba(247,241,229,0.04)',
            border: '1px solid rgba(247,241,229,0.16)',
          }}
        >
          <div className="mono mb-1" style={{ color: 'rgba(247,241,229,0.55)' }}>
            FOLLOW-UPS
          </div>
          {[
            { day: 'DAY 1', label: 'Opener', delay: 0, width: 0.18 },
            { day: 'DAY 3', label: 'Nudge', delay: 0.08, width: 0.42 },
            { day: 'DAY 7', label: 'Break-up', delay: 0.16, width: 0.78 },
          ].map((row) => (
            <div key={row.day} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="mono" style={{ color: 'rgba(247,241,229,0.6)', fontSize: 10 }}>
                  {row.day}
                </span>
                <span className="mono" style={{ color: 'rgba(247,241,229,0.4)', fontSize: 9.5 }}>
                  {row.label}
                </span>
              </div>
              <div
                className="rounded-full overflow-hidden h-1.5"
                style={{ backgroundColor: 'rgba(247,241,229,0.08)' }}
              >
                <motion.div
                  className="h-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: step >= 2 ? row.width : 0 }}
                  transition={{ duration: 0.55, ease: EASE, delay: row.delay }}
                  style={{
                    backgroundColor: 'var(--orange)',
                    transformOrigin: 'left',
                    width: '100%',
                  }}
                />
              </div>
            </div>
          ))}
          <div className="mt-auto pt-2 mono" style={{ color: 'rgba(247,241,229,0.4)', fontSize: 9.5 }}>
            AUTO-PAUSED ON REPLY
          </div>
        </div>
      </div>
    </div>
  );
}
