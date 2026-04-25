import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import LeadCard from './LeadCard';

const EASE = [0.16, 1, 0.3, 1] as const;

const CARDS: Array<{ kind: 'lead' | 'note' | 'metric' | 'reply' | 'inbox'; data: any; caption: string }> = [
  { kind: 'lead', data: { name: 'Marc Kowalski', role: 'Head of Growth', company: 'Northstar', score: 8.9, tag: 'B2B SaaS' }, caption: '01 — first qualified lead, hour 4' },
  { kind: 'note', data: { title: 'Why?', body: 'Mentioned killing SalesLoft. Active hiring. Funded series A.' }, caption: '02 — Claude\'s reasoning trail' },
  { kind: 'metric', data: { label: 'Open rate', value: '64%', delta: '+18pp vs avg' }, caption: '03 — opener variant B' },
  { kind: 'reply', data: { from: 'Marc K.', body: 'Tuesday 3pm IST works. Can you keep it to 12 mins?' }, caption: '04 — first reply, day 2' },
  { kind: 'inbox', data: { count: 18, channel: 'Inbox' }, caption: '05 — leads waiting Monday morning' },
  { kind: 'lead', data: { name: 'Aisha Bhatnagar', role: 'COO', company: 'Granular', score: 7.8, tag: 'Climate' }, caption: '06 — score 7.8, intent: buyer' },
  { kind: 'metric', data: { label: 'Reply rate', value: '11.4%', delta: 'industry avg 2.1%' }, caption: '07 — voice-matched drafts work' },
  { kind: 'note', data: { title: 'Skip', body: 'Self-promo. Shared own newsletter. Filter out.' }, caption: '08 — not every signal is a buyer' },
  { kind: 'lead', data: { name: 'Dana Lopez', role: 'Head of RevOps', company: 'Helix', score: 9.4, tag: 'D2C' }, caption: '09 — top score this week' },
  { kind: 'reply', data: { from: 'Priya R.', body: 'Send the proposal. We\'re ready to move.' }, caption: '10 — proposal sent, lead-to-quote 6 mins' },
  { kind: 'inbox', data: { count: 7, channel: 'WhatsApp' }, caption: '11 — WhatsApp wins for India D2C' },
  { kind: 'metric', data: { label: 'Hours saved', value: '34/wk', delta: 'vs manual scrolling' }, caption: '12 — your team gets time back' },
  { kind: 'note', data: { title: 'Follow up', body: 'Day 7 break-up note → 4 of 5 reopen.' }, caption: '13 — break-up emails actually work' },
  { kind: 'lead', data: { name: 'Sana Vora', role: 'CEO', company: 'Slate Studio', score: 8.5, tag: 'Agency' }, caption: '14 — and another one tomorrow' },
];

const CARD_WIDTH = 320;
const GAP = 20;

export default function EvidenceGallery() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const x = useMotionValue(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });
  const scrollX = useTransform(
    scrollYProgress,
    [0.05, 0.95],
    [0, -trackWidth]
  );

  useEffect(() => {
    if (!trackRef.current) return;
    const measure = () => {
      const w = (trackRef.current?.scrollWidth ?? 0) - window.innerWidth + 80;
      setTrackWidth(Math.max(0, w));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // bind scrollX → x
  useMotionValueEvent(scrollX, 'change', (v) => {
    x.set(v);
  });
  useMotionValueEvent(x, 'change', (v) => {
    const i = Math.min(CARDS.length - 1, Math.max(0, Math.round(-v / (CARD_WIDTH + GAP))));
    setActiveIndex(i);
  });

  return (
    <section
      ref={sectionRef}
      id="proof"
      className="relative w-full"
      style={{ backgroundColor: 'var(--cream)', height: '180vh' }}
    >
      <div
        className="sticky top-0 h-screen w-full flex flex-col justify-center overflow-hidden"
        data-cursor="drag"
        style={{ willChange: 'transform' }}
      >
        <div
          className="mb-10 md:mb-14 flex items-end justify-between gap-6 max-w-[1600px] mx-auto w-full"
          style={{ paddingInline: 'var(--section-x)' }}
        >
          <div>
            <div className="mono mb-4" style={{ color: 'var(--ash)' }}>
              EVIDENCE / WHAT YOU WAKE UP TO
            </div>
            <h2
              className="serif"
              style={{
                fontSize: 'clamp(36px, 5vw, 72px)',
                lineHeight: 1.05,
                letterSpacing: '-0.018em',
                fontWeight: 300,
                maxWidth: '20ch',
              }}
            >
              Drag through fourteen mornings.
            </h2>
          </div>
          <div className="hidden md:flex flex-col items-end gap-1">
            <span className="mono tabular-nums" style={{ color: 'var(--ink)', fontSize: 22, fontWeight: 500 }}>
              {String(activeIndex + 1).padStart(2, '0')} / {CARDS.length}
            </span>
            <span className="mono" style={{ color: 'var(--ash)' }}>
              SCROLL OR DRAG →
            </span>
          </div>
        </div>

        <motion.div
          ref={trackRef}
          drag={reduce ? false : 'x'}
          dragConstraints={{ left: -trackWidth, right: 0 }}
          dragElastic={0.05}
          dragMomentum
          style={{
            x,
            width: 'max-content',
            cursor: 'grab',
            paddingInline: 'var(--section-x)',
            willChange: 'transform',
          }}
          whileTap={{ cursor: 'grabbing' }}
          className="flex gap-5"
        >
          {CARDS.map((card, i) => (
            <EvidenceCard key={i} card={card} index={i} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function EvidenceCard({ card, index }: { card: typeof CARDS[number]; index: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      whileHover={reduce ? undefined : { scale: 1.03, rotate: index % 2 === 0 ? -1 : 1 }}
      transition={{ duration: 0.18, ease: EASE }}
      style={{ width: CARD_WIDTH, flexShrink: 0 }}
      className="select-none flex flex-col gap-3 group"
    >
      <div
        className="rounded-3xl relative overflow-hidden"
        style={{
          backgroundColor: 'var(--paper)',
          border: '1px solid var(--line)',
          padding: 18,
          minHeight: 240,
        }}
      >
        {card.kind === 'lead' && (
          <div className="-m-1">
            <LeadCard {...card.data} variant="paper" />
          </div>
        )}
        {card.kind === 'note' && (
          <>
            <div className="mono mb-3" style={{ color: 'var(--ash)' }}>
              CLAUDE NOTE
            </div>
            <div
              className="serif"
              style={{ fontSize: 20, fontWeight: 300, marginBottom: 12, letterSpacing: '-0.01em' }}
            >
              {card.data.title}
            </div>
            <div style={{ fontSize: 14, color: 'var(--ash)', lineHeight: 1.5 }}>
              {card.data.body}
            </div>
          </>
        )}
        {card.kind === 'metric' && (
          <>
            <div className="mono mb-2" style={{ color: 'var(--ash)' }}>
              METRIC
            </div>
            <div className="mb-2" style={{ fontSize: 13, color: 'var(--ash)' }}>
              {card.data.label}
            </div>
            <div
              className="serif"
              style={{
                fontSize: 64,
                fontWeight: 300,
                color: 'var(--ink)',
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}
            >
              {card.data.value}
            </div>
            <div className="mt-3 mono" style={{ color: 'var(--orange)' }}>
              {card.data.delta}
            </div>
          </>
        )}
        {card.kind === 'reply' && (
          <>
            <div className="mono mb-3" style={{ color: 'var(--ash)' }}>
              REPLY · {card.data.from}
            </div>
            <div
              className="serif"
              style={{
                fontSize: 18,
                fontWeight: 300,
                color: 'var(--ink)',
                lineHeight: 1.45,
                letterSpacing: '-0.005em',
              }}
            >
              "{card.data.body}"
            </div>
            <div className="mt-5 flex items-center gap-2">
              <span className="block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--orange)' }} />
              <span className="mono" style={{ color: 'var(--orange)' }}>
                INTERESTED
              </span>
            </div>
          </>
        )}
        {card.kind === 'inbox' && (
          <>
            <div className="mono mb-3" style={{ color: 'var(--ash)' }}>
              {card.data.channel.toUpperCase()}
            </div>
            <div
              className="serif"
              style={{ fontSize: 84, fontWeight: 300, color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1 }}
            >
              {card.data.count}
            </div>
            <div className="mt-3 mono" style={{ color: 'var(--ash)' }}>
              UNREAD · OVERNIGHT
            </div>
          </>
        )}
      </div>
      <span
        className="mono px-1 opacity-60 group-hover:opacity-100 transition-opacity duration-300"
        style={{ color: 'var(--ash)' }}
      >
        {card.caption}
      </span>
    </motion.div>
  );
}
