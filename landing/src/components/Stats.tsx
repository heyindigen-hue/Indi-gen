import { animate, motion, useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

const STATS = [
  { value: 12.4, suffix: '×', eyebrow: '[ REPLY RATE ]', body: 'Higher response than templated cold outreach. Measured across 2,400 sequences.' },
  { value: 47, suffix: '%', eyebrow: '[ TIME SAVED ]', body: 'Hours back per week from automated targeting + drafting. A full Wednesday morning.' },
  { value: 3.2, suffix: 's', eyebrow: '[ TIME TO DRAFT ]', body: 'Average time from new lead → ready-to-approve message. Always overnight.' },
];

export default function Stats() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { amount: 0.6, once: true });

  return (
    <section
      id="proof"
      ref={sectionRef}
      className="px-6 md:px-10 py-32 md:py-44 transition-colors duration-200 ease-[cubic-bezier(0.65,0,0.35,1)] relative overflow-hidden"
      style={{
        backgroundColor: inView ? '#14140F' : '#F4F1EA',
        color: inView ? '#F4F1EA' : '#14140F',
      }}
    >
      <div className="max-w-[1600px] mx-auto">
        <div className="font-mono-brand text-[12px] uppercase tracking-[0.12em] mb-6 opacity-60 transition-colors duration-200">
          [ NUMBERS // 03 ]
        </div>
        <h2 className="text-h2 font-display max-w-[18ch] mb-20 md:mb-28">
          What three months of hunting looks like.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {STATS.map((s, i) => (
            <Stat key={i} {...s} active={inView} delay={i * 0.15} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Stat({
  value,
  suffix,
  eyebrow,
  body,
  active,
  delay,
}: {
  value: number;
  suffix: string;
  eyebrow: string;
  body: string;
  active: boolean;
  delay: number;
}) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (!active) return;
    const controls = animate(0, value, {
      duration: 1.6,
      delay,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setShown(v),
    });
    return () => controls.stop();
  }, [active, value, delay]);

  const isFloat = value % 1 !== 0;
  const display = isFloat ? shown.toFixed(1) : Math.round(shown).toString();
  return (
    <div className="border-t border-[rgba(244,241,234,0.18)] pt-6">
      <div className="font-mono-brand text-[12px] uppercase tracking-[0.12em] opacity-60 mb-4">{eyebrow}</div>
      <div
        className="font-display font-medium tracking-[-0.04em] leading-none flex items-baseline gap-0.5"
        style={{ fontSize: 'clamp(64px, 10vw, 140px)' }}
      >
        <span className="font-mono-brand mr-2 opacity-30 text-[0.32em] -translate-y-3">[</span>
        <SplitFlap text={display} />
        <span className="text-[var(--accent)]">{suffix}</span>
        <span className="font-mono-brand ml-2 opacity-30 text-[0.32em] -translate-y-3">]</span>
      </div>
      <p className="mt-6 max-w-[36ch] text-[15px] leading-[1.5] opacity-70">{body}</p>
    </div>
  );
}

function SplitFlap({ text }: { text: string }) {
  return (
    <span className="inline-flex">
      {text.split('').map((ch, i) => {
        if (/[0-9]/.test(ch)) {
          return <Digit key={`${i}-${ch}`} digit={parseInt(ch, 10)} />;
        }
        return (
          <span key={i} className="inline-block">
            {ch}
          </span>
        );
      })}
    </span>
  );
}

function Digit({ digit }: { digit: number }) {
  return (
    <span
      className="inline-block overflow-hidden align-baseline"
      style={{ height: '1em', lineHeight: 1 }}
    >
      <motion.span
        className="block"
        animate={{ y: `-${digit}em` }}
        transition={{ type: 'spring', stiffness: 120, damping: 18 }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <span key={n} className="block leading-[1] tabular-nums">
            {n}
          </span>
        ))}
      </motion.span>
    </span>
  );
}
