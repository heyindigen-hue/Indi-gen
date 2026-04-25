import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import FlowerMark from './FlowerMark';

const EASE = [0.22, 1, 0.36, 1] as const;

interface Quote {
  quote: string;
  attribution: string;
  role: string;
  flower: { petal: string; core: string };
}

const QUOTES: Quote[] = [
  {
    quote:
      'We went from six hours of manual scrolling to leads waiting in the morning. The drafts close themselves.',
    attribution: 'Sales lead',
    role: 'B2B SaaS, 18 person team',
    flower: { petal: '#0E0E0C', core: '#FF5A1F' },
  },
  {
    quote:
      'Indigen built ours in three weeks. We replaced two SDR tools and a Slack channel of complaints.',
    attribution: 'Founder',
    role: 'D2C agency, Mumbai',
    flower: { petal: '#FF5A1F', core: '#0E0E0C' },
  },
  {
    quote:
      'The proposal builder is the killer feature. Lead-to-quote in two clicks — and the buyer thinks I wrote it.',
    attribution: 'Independent consultant',
    role: 'Operations, Bengaluru',
    flower: { petal: '#2A2823', core: '#FF5A1F' },
  },
];

export default function Testimonials() {
  return (
    <section className="relative w-full" style={{ backgroundColor: 'var(--cream)' }}>
      <div className="px-6 md:px-10 py-24 md:py-36 max-w-[1600px] mx-auto">
        <div className="mb-14 md:mb-20 max-w-[40ch]">
          <div className="mono mb-4" style={{ color: 'var(--ash)' }}>
            VOICES / FROM THE FIELD
          </div>
          <h2
            className="serif"
            style={{
              fontSize: 'clamp(40px, 6vw, 96px)',
              lineHeight: 1.05,
              letterSpacing: '-0.018em',
              fontWeight: 300,
            }}
          >
            People who used to <span className="serif-italic">scroll.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5 md:gap-6">
          {QUOTES.map((q, i) => (
            <QuoteCard key={i} quote={q} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function QuoteCard({ quote, index }: { quote: Quote; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const range = index === 1 ? [-20, -40] : index === 0 ? [0, -20] : [-10, -30];
  const y = useTransform(scrollYProgress, [0, 1], range);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10%' }}
      transition={{ duration: 0.7, ease: EASE, delay: index * 0.08 }}
      style={{ y }}
    >
      <div
        className="rounded-3xl h-full flex flex-col gap-6"
        style={{
          backgroundColor: 'var(--paper)',
          border: '1px solid var(--line)',
          padding: 28,
          minHeight: 380,
        }}
      >
        <span
          className="serif"
          style={{ fontSize: 64, lineHeight: 0.6, color: 'var(--orange)', fontWeight: 300 }}
        >
          “
        </span>
        <p
          className="serif"
          style={{
            fontSize: 'clamp(20px, 1.6vw, 24px)',
            lineHeight: 1.4,
            letterSpacing: '-0.008em',
            fontWeight: 300,
            color: 'var(--ink)',
            flex: 1,
          }}
        >
          {quote.quote}
        </p>
        <div
          className="flex items-center gap-3 pt-4"
          style={{ borderTop: '1px solid var(--line)' }}
        >
          <div
            className="rounded-full flex items-center justify-center shrink-0"
            style={{
              width: 44,
              height: 44,
              backgroundColor: 'var(--cream)',
              border: '1px solid var(--line)',
            }}
          >
            <FlowerMark size={28} petal={quote.flower.petal} core={quote.flower.core} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
              {quote.attribution}
            </div>
            <div className="mono" style={{ color: 'var(--ash)', fontSize: 10 }}>
              {quote.role}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
