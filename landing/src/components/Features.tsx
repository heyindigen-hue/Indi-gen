import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const FEATURES = [
  {
    num: '[01]',
    label: 'TARGETING',
    title: 'Pick your ICP, watch us hunt.',
    body: 'Define the company size, role, geography and intent signals that matter. We lock in and only return matches.',
    span: 'md:col-span-5',
  },
  {
    num: '[02]',
    label: 'OUTREACH',
    title: 'Drafts that sound human.',
    body: 'Claude writes the first message after reading their last 30 days of activity. Approve, tweak, or rewrite in one click.',
    span: 'md:col-span-4',
  },
  {
    num: '[03]',
    label: 'REPLIES',
    title: 'Track every reply.',
    body: 'Inbox-grade thread view. Score replies by intent. Auto-promote interested leads to your CRM.',
    span: 'md:col-span-3',
  },
];

export default function Features() {
  return (
    <section id="hunt" className="px-6 md:px-10 py-32 md:py-44 relative">
      <div className="max-w-[1600px] mx-auto">
        <div className="font-mono-brand text-[12px] uppercase tracking-[0.12em] text-[var(--ink-soft)] mb-6">
          [ HOW IT HUNTS // 01 ]
        </div>
        <h2 className="text-h2 font-display max-w-[18ch] mb-16 md:mb-24">
          Three steps. No spam. Real replies.
        </h2>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-12 gap-6"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          transition={{ staggerChildren: 0.12 }}
        >
          {FEATURES.map((f, i) => (
            <FeatureCard key={i} index={i} {...f} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function FeatureCard({
  num,
  label,
  title,
  body,
  span,
  index,
}: {
  num: string;
  label: string;
  title: string;
  body: string;
  span: string;
  index: number;
}) {
  const [hover, setHover] = useState(false);
  return (
    <motion.article
      className={`${span} group bg-[#F4F1EA] border border-[var(--line)] rounded-3xl p-8 md:p-10 flex flex-col justify-between min-h-[420px] md:min-h-[480px] cursor-pointer relative overflow-hidden`}
      variants={{
        hidden: { opacity: 0, y: 48 },
        show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
      }}
      whileHover={{ y: -6, boxShadow: '0 20px 40px -20px rgba(20,20,15,.18)' }}
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      data-cursor
      data-cursor-label="Read"
    >
      <div className="flex items-start justify-between">
        <motion.span
          className="font-mono-brand text-[12px] uppercase tracking-[0.12em] text-[var(--ink-soft)]"
          animate={{ rotate: hover ? 5 : 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        >
          {num} {label}
        </motion.span>
        <CardArrow hover={hover} />
      </div>

      <div className="my-12 flex items-center justify-center min-h-[140px]">
        {index === 0 && <CrosshairLock active={hover} />}
        {index === 1 && <MessageStack active={hover} />}
        {index === 2 && <ReplyChart active={hover} />}
      </div>

      <div>
        <h3 className="font-display text-[26px] md:text-[28px] leading-[1.1] tracking-[-0.02em] mb-3">
          {title}
        </h3>
        <p className="text-[15px] leading-[1.5] text-[var(--ink-soft)]">{body}</p>
      </div>
    </motion.article>
  );
}

function CardArrow({ hover }: { hover: boolean }) {
  return (
    <motion.span
      className="font-mono-brand text-[18px]"
      animate={{ x: hover ? 4 : 0, y: hover ? -4 : 0, opacity: hover ? 1 : 0.4 }}
      transition={{ type: 'spring', stiffness: 280, damping: 20 }}
    >
      ↗
    </motion.span>
  );
}

// Inline animations
function CrosshairLock({ active }: { active: boolean }) {
  return (
    <svg width="160" height="160" viewBox="0 0 160 160" className="text-[#14140F]">
      <motion.circle
        cx="80"
        cy="80"
        r="60"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        animate={{ rotate: active ? 360 : 0 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '80px 80px' }}
        strokeDasharray="2 6"
      />
      <circle cx="80" cy="80" r="40" stroke="currentColor" strokeWidth="1" fill="none" />
      <motion.circle
        cx="80"
        cy="80"
        r="6"
        fill="#FF5A1F"
        animate={{ scale: active ? [1, 1.4, 1] : 1 }}
        transition={{ duration: 1.2, repeat: Infinity }}
      />
      <line x1="20" y1="80" x2="50" y2="80" stroke="currentColor" />
      <line x1="110" y1="80" x2="140" y2="80" stroke="currentColor" />
      <line x1="80" y1="20" x2="80" y2="50" stroke="currentColor" />
      <line x1="80" y1="110" x2="80" y2="140" stroke="currentColor" />
    </svg>
  );
}

function MessageStack({ active }: { active: boolean }) {
  return (
    <div className="relative w-[200px] h-[140px]">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute left-0 right-0 px-3 py-2 rounded-2xl border border-[var(--line)] bg-[#F4F1EA] font-mono-brand text-[10px] tracking-[0.04em] text-[var(--ink-soft)]"
          style={{ top: i * 30, zIndex: 3 - i }}
          initial={{ x: 0 }}
          animate={{ x: active ? i * 8 : 0, rotate: active ? i * 1.5 : 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20, delay: i * 0.04 }}
        >
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A1F]" />
            <span className="truncate">{['Hey Sarah, saw your post on…', 'Quick question — are you…', "Couldn't help but notice…"][i]}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function ReplyChart({ active }: { active: boolean }) {
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    if (active) setDrawn(true);
  }, [active]);
  return (
    <svg width="200" height="120" viewBox="0 0 200 120" className="text-[#14140F]">
      <line x1="0" y1="100" x2="200" y2="100" stroke="currentColor" strokeOpacity="0.2" />
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={i} x1={i * 50} y1="98" x2={i * 50} y2="102" stroke="currentColor" strokeOpacity="0.4" />
      ))}
      <motion.path
        d="M 0 90 L 40 70 L 80 75 L 120 50 L 160 30 L 200 20"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: drawn ? 1 : 0 }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.circle
        cx="200"
        cy="20"
        r="5"
        fill="#FF5A1F"
        initial={{ scale: 0 }}
        animate={{ scale: drawn ? [0, 1.5, 1] : 0 }}
        transition={{ duration: 0.5, delay: 1.4 }}
      />
    </svg>
  );
}
