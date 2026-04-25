import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const EASE = [0.22, 1, 0.36, 1] as const;
const TARGET = 'D2C founders in India who use Shopify Plus';
const TAGS = ['D2C', 'Shopify Plus', 'Hiring devs', 'India', 'Series A+'];

interface Props {
  step: number;
}

export default function IntakeMock({ step }: Props) {
  const [typed, setTyped] = useState('');

  useEffect(() => {
    if (step !== 1) {
      setTyped(step >= 2 ? TARGET : '');
      return;
    }
    let i = 0;
    setTyped('');
    const id = window.setInterval(() => {
      i++;
      setTyped(TARGET.slice(0, i));
      if (i >= TARGET.length) window.clearInterval(id);
    }, 38);
    return () => window.clearInterval(id);
  }, [step]);

  return (
    <motion.div
      layoutId="intake-card"
      transition={{ duration: 0.6, ease: EASE }}
      className="rounded-3xl relative overflow-hidden"
      style={{
        backgroundColor: 'var(--paper)',
        border: '1px solid var(--line)',
        padding: 24,
        minHeight: 520,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="mono" style={{ color: 'var(--ash)' }}>
          BRIEF / NEW HUNT
        </div>
        <div className="flex items-center gap-1.5">
          <span className="block w-2 h-2 rounded-full" style={{ backgroundColor: 'rgba(14,14,12,0.18)' }} />
          <span className="block w-2 h-2 rounded-full" style={{ backgroundColor: 'rgba(14,14,12,0.18)' }} />
          <span className="block w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--orange)' }} />
        </div>
      </div>

      <div className="mb-3 mono" style={{ color: 'var(--ash)' }}>
        WHO YOU SELL TO
      </div>

      <div
        className="rounded-2xl mb-6 relative"
        style={{
          padding: 20,
          backgroundColor: 'var(--cream)',
          border: '1px solid var(--line)',
          minHeight: 76,
        }}
      >
        {step === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="serif"
            style={{ fontSize: 22, fontWeight: 300, color: 'rgba(14,14,12,0.36)' }}
          >
            Add your ICP →
          </motion.div>
        )}
        {step >= 1 && (
          <div
            className="serif"
            style={{
              fontSize: 22,
              fontWeight: 300,
              color: 'var(--ink)',
              lineHeight: 1.35,
              letterSpacing: '-0.01em',
            }}
          >
            {typed}
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              style={{
                display: 'inline-block',
                width: 1.5,
                height: 22,
                backgroundColor: 'var(--orange)',
                marginLeft: 2,
                verticalAlign: 'middle',
              }}
            />
          </div>
        )}
      </div>

      <div className="mono mb-3" style={{ color: 'var(--ash)' }}>
        WE EXTRACT
      </div>
      <div className="flex flex-wrap gap-2 mb-6 min-h-[40px]">
        <AnimatePresence>
          {step >= 2 &&
            TAGS.map((t, i) => (
              <motion.span
                key={t}
                layout
                initial={{ opacity: 0, y: -10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.45, ease: EASE, delay: i * 0.08 }}
                className="rounded-full"
                style={{
                  padding: '7px 14px',
                  backgroundColor: i === 0 ? 'var(--orange)' : 'var(--cream)',
                  color: 'var(--ink)',
                  fontSize: 13,
                  fontWeight: 500,
                  border: i === 0 ? 'none' : '1px solid var(--line)',
                }}
              >
                {t}
              </motion.span>
            ))}
        </AnimatePresence>
      </div>

      <div className="h-px w-full" style={{ backgroundColor: 'var(--line)' }} />

      <div className="mt-5 grid grid-cols-3 gap-3">
        {[
          { k: 'GEO', v: 'India' },
          { k: 'INDUSTRY', v: 'D2C / Retail' },
          { k: 'STAGE', v: 'Series A+' },
        ].map((row) => (
          <div key={row.k}>
            <div className="mono" style={{ color: 'var(--ash)', fontSize: 10 }}>
              {row.k}
            </div>
            <div
              className="serif"
              style={{
                fontSize: 18,
                fontWeight: 300,
                color: step >= 2 ? 'var(--ink)' : 'rgba(14,14,12,0.4)',
                marginTop: 4,
                transition: 'color .4s',
              }}
            >
              {row.v}
            </div>
          </div>
        ))}
      </div>

      <div
        className="absolute bottom-6 right-6 mono"
        style={{ color: 'var(--ash)', fontSize: 10 }}
      >
        ⌘ + ↵ TO SAVE
      </div>
    </motion.div>
  );
}
