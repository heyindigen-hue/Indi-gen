import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

const QUOTES = [
  {
    quote:
      "Stopped writing first messages. Started reading replies. The drafts already sound like me by the time I open the app.",
    name: 'Mira Lalwani',
    role: 'FOUNDER / OUTBOUND CO',
  },
  {
    quote:
      "We replaced two sales-enablement tools and a part-time researcher. The targeting is the part that finally clicked.",
    name: 'Felix Andersen',
    role: 'HEAD OF GROWTH / KOTO',
  },
  {
    quote:
      "First pipeline tool that doesn't make me feel like I'm spamming people. The signal trail is the killer feature.",
    name: 'Hari Kumar',
    role: 'VP SALES / WEFTLY',
  },
  {
    quote:
      "Hangover is right — I literally wake up to qualified leads, score and draft. I open it before email.",
    name: 'Noor Bashir',
    role: 'GTM LEAD / PARALLAX',
  },
];

export default function Testimonials() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  return (
    <section id="testimonials" ref={ref} className="px-6 md:px-10 py-32 md:py-44">
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16">
        <div className="md:col-span-4 md:sticky md:top-32 self-start">
          <div className="font-mono-brand text-[12px] uppercase tracking-[0.12em] text-[var(--ink-soft)] mb-8">
            [ FROM HUNTERS ]
          </div>
          <div className="font-display text-[180px] md:text-[260px] leading-[0.7] text-[var(--ink)] -mt-4 -ml-2 select-none">
            "
          </div>
          <p className="mt-2 max-w-[28ch] text-body-l text-[var(--ink-soft)]">
            What teams say after the first three weeks.
          </p>
        </div>
        <div className="md:col-span-8 flex flex-col gap-8 md:gap-12">
          {QUOTES.map((q, i) => (
            <Quote key={i} {...q} index={i} progress={scrollYProgress} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Quote({
  quote,
  name,
  role,
  index,
  progress,
}: {
  quote: string;
  name: string;
  role: string;
  index: number;
  progress: ReturnType<typeof useScroll>['scrollYProgress'];
}) {
  // Avatar parallax bound to scroll
  const y = useTransform(progress, [0, 1], [20, -20]);
  return (
    <motion.div
      className="border-t border-[var(--line)] pt-8 md:pt-10"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
    >
      <p className="font-display text-[24px] md:text-[32px] leading-[1.25] tracking-[-0.02em] mb-6">
        <LineSplit text={quote} />
      </p>
      <div className="flex items-center gap-4">
        <motion.div
          className="w-8 h-8 rounded-full bg-[var(--ink)] flex items-center justify-center text-[#F4F1EA] font-mono-brand text-[10px]"
          style={{ y }}
        >
          {name.split(' ').map((p) => p[0]).join('')}
        </motion.div>
        <div>
          <span className="font-display text-[14px] tracking-[-0.01em]">{name}</span>
          <span className="ml-2 font-mono-brand text-[11px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">
            {role}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function LineSplit({ text }: { text: string }) {
  // Split into pseudo-lines on word boundaries (just animated as one line-split via stagger)
  const words = text.split(' ');
  return (
    <span aria-label={text}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom" aria-hidden>
          <motion.span
            className="inline-block"
            initial={{ y: 24, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: i * 0.018 }}
          >
            {w}&nbsp;
          </motion.span>
        </span>
      ))}
    </span>
  );
}
