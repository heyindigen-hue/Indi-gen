import { motion, useMotionValue, useInView, animate, useTransform } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface StatItem {
  value: number;
  suffix: string;
  label: string;
  prefix?: string;
  format?: (n: number) => string;
}

const STATS: StatItem[] = [
  {
    value: 2783,
    suffix: '',
    label: 'leads scraped',
    format: (n) => Math.round(n).toLocaleString('en-IN'),
  },
  { value: 85, suffix: '%', label: 'qualification rate' },
  { value: 12, suffix: 's', label: 'avg per lead' },
  { value: 0, suffix: '', label: 'fixed cost', prefix: '₹' },
];

function AnimatedCounter({ item }: { item: StatItem }) {
  const ref = useRef<HTMLDivElement>(null);
  const mv = useMotionValue(0);
  const isInView = useInView(ref, { once: true, amount: 0.6 });
  const display = useTransform(mv, (v) =>
    item.format ? item.format(v) : String(Math.round(v))
  );

  useEffect(() => {
    if (!isInView) return;
    const ctrl = animate(mv, item.value, { duration: 1.6, ease: 'easeOut' });
    return () => ctrl.stop();
  }, [isInView, mv, item.value]);

  return (
    <div ref={ref} className="text-center px-6">
      <div className="font-display font-semibold text-[clamp(32px,4vw,48px)] leading-none text-ink mb-1.5 font-mono-brand">
        {item.prefix && <span>{item.prefix}</span>}
        <motion.span>{display}</motion.span>
        {item.suffix && <span>{item.suffix}</span>}
      </div>
      <div className="text-[12px] uppercase tracking-[0.1em] font-medium text-muted">
        {item.label}
      </div>
    </div>
  );
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export default function Stats() {
  return (
    <section className="border-y border-border bg-surface">
      <motion.div
        className="max-w-[1100px] mx-auto py-10 flex flex-wrap justify-center divide-x divide-border"
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.4 }}
      >
        {STATS.map((stat) => (
          <motion.div key={stat.label} variants={itemVariants} className="flex-1 min-w-[160px]">
            <AnimatedCounter item={stat} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
