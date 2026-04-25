import { motion } from 'framer-motion';
import { useState } from 'react';

const EASE = [0.16, 1, 0.3, 1] as const;

interface Feature {
  title: string;
  desc: string;
  icon: (color: string) => JSX.Element;
}

const STROKE = (color: string) => ({
  fill: 'none',
  stroke: color,
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

const FEATURES: Feature[] = [
  {
    title: 'AI scoring',
    desc: 'Claude Haiku reads every post and ranks intent.',
    icon: (c) => (
      <svg viewBox="0 0 32 32" {...STROKE(c)}>
        <circle cx="16" cy="16" r="10" />
        <path d="M11 17l3 3 7-8" />
      </svg>
    ),
  },
  {
    title: 'Multi-account rotation',
    desc: 'Spread the load across LinkedIn sessions safely.',
    icon: (c) => (
      <svg viewBox="0 0 32 32" {...STROKE(c)}>
        <circle cx="11" cy="13" r="3" />
        <circle cx="21" cy="13" r="3" />
        <path d="M5 25c1-4 5-6 11-6s10 2 11 6" />
      </svg>
    ),
  },
  {
    title: 'Cookie persistence',
    desc: 'No constant re-logins. Sessions stay warm.',
    icon: (c) => (
      <svg viewBox="0 0 32 32" {...STROKE(c)}>
        <path d="M22 4a4 4 0 00-4 4 4 4 0 004 4 4 4 0 004-4" />
        <path d="M16 6a10 10 0 1010 10" />
        <circle cx="11" cy="14" r="1" />
        <circle cx="14" cy="20" r="1" />
        <circle cx="20" cy="22" r="1" />
      </svg>
    ),
  },
  {
    title: 'SignalHire enrichment',
    desc: 'Phone, email, alt channels appended automatically.',
    icon: (c) => (
      <svg viewBox="0 0 32 32" {...STROKE(c)}>
        <path d="M22 17v6a2 2 0 01-2 2 17 17 0 01-15-15 2 2 0 012-2h6l2 5-3 2a13 13 0 005 5l2-3z" />
      </svg>
    ),
  },
  {
    title: 'Drafts in your voice',
    desc: 'WhatsApp, email, LinkedIn — all sound like you.',
    icon: (c) => (
      <svg viewBox="0 0 32 32" {...STROKE(c)}>
        <path d="M5 7h22v15H13l-6 5v-5H5z" />
        <path d="M11 14h10M11 18h6" />
      </svg>
    ),
  },
  {
    title: 'Push when leads land',
    desc: 'iOS, Android, browser — only the high scores.',
    icon: (c) => (
      <svg viewBox="0 0 32 32" {...STROKE(c)}>
        <path d="M9 22h14l-2-3v-5a5 5 0 00-10 0v5z" />
        <path d="M14 25a2 2 0 004 0" />
      </svg>
    ),
  },
  {
    title: 'Token-based pricing',
    desc: 'Pay per qualified lead, not per seat.',
    icon: (c) => (
      <svg viewBox="0 0 32 32" {...STROKE(c)}>
        <circle cx="16" cy="16" r="10" />
        <path d="M16 11v10M13 13h5a2 2 0 010 4h-4a2 2 0 000 4h6" />
      </svg>
    ),
  },
  {
    title: 'Cashfree-native',
    desc: 'UPI, INR, GST invoices. Built for India.',
    icon: (c) => (
      <svg viewBox="0 0 32 32" {...STROKE(c)}>
        <rect x="5" y="9" width="22" height="14" rx="2" />
        <path d="M5 14h22M9 19h4" />
      </svg>
    ),
  },
  {
    title: 'White-label ready',
    desc: 'Your brand, your domain, your customer.',
    icon: (c) => (
      <svg viewBox="0 0 32 32" {...STROKE(c)}>
        <path d="M16 5l9 5v6c0 7-4 11-9 12-5-1-9-5-9-12v-6z" />
      </svg>
    ),
  },
  {
    title: 'Mobile app',
    desc: 'Swipe through leads on the bus.',
    icon: (c) => (
      <svg viewBox="0 0 32 32" {...STROKE(c)}>
        <rect x="10" y="4" width="12" height="24" rx="3" />
        <path d="M14 24h4" />
      </svg>
    ),
  },
  {
    title: 'DPDP-compliant',
    desc: 'Data export. Full erasure. India-ready.',
    icon: (c) => (
      <svg viewBox="0 0 32 32" {...STROKE(c)}>
        <path d="M16 5l9 4v7c0 7-4 10-9 11-5-1-9-4-9-11V9z" />
        <path d="M12 16l3 3 6-7" />
      </svg>
    ),
  },
  {
    title: 'Custom search phrases',
    desc: 'Your ICP, in plain English. We turn it into a brief.',
    icon: (c) => (
      <svg viewBox="0 0 32 32" {...STROKE(c)}>
        <circle cx="14" cy="14" r="7" />
        <path d="M19 19l7 7" />
      </svg>
    ),
  },
];

export default function FeatureGrid() {
  return (
    <section
      id="features"
      className="relative w-full"
      style={{ backgroundColor: 'var(--cream)' }}
    >
      <div className="section-rhythm max-w-[1600px] mx-auto">
        <div className="mb-12 md:mb-20 grid md:grid-cols-2 gap-6 items-end">
          <div>
            <div className="mono mb-4" style={{ color: 'var(--ash)' }}>
              FEATURES / TWELVE BUILT-INS
            </div>
            <h2
              className="serif"
              style={{
                fontSize: 'clamp(40px, 6vw, 96px)',
                lineHeight: 1.05,
                letterSpacing: '-0.018em',
                fontWeight: 300,
                maxWidth: '14ch',
              }}
            >
              The boring stuff,{' '}
              <span className="serif-italic">already done.</span>
            </h2>
          </div>
          <p
            className="md:max-w-md md:justify-self-end"
            style={{ fontSize: 18, color: 'var(--ash)', lineHeight: 1.5 }}
          >
            Every feature here is shipped, used by paying customers, and live
            inside the admin dashboard you'll get on day one.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-px" style={{ backgroundColor: 'var(--line)' }}>
          {FEATURES.map((f, i) => (
            <FeatureTile key={i} feature={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureTile({ feature, index }: { feature: Feature; index: number }) {
  const [hover, setHover] = useState(false);
  return (
    <motion.div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10%' }}
      transition={{ duration: 0.4, ease: EASE, delay: (index % 4) * 0.04 }}
      whileHover={{ y: -4 }}
      className="relative overflow-hidden"
      style={{
        backgroundColor: 'var(--cream)',
        padding: '36px 28px',
        minHeight: 220,
      }}
    >
      <div
        className="absolute inset-0 origin-top-left"
        style={{
          backgroundColor: 'transparent',
          transition: 'border-color .4s',
          border: hover ? '1px solid var(--orange)' : '1px solid transparent',
          pointerEvents: 'none',
        }}
      />
      <div className="relative">
        <motion.div
          animate={{ rotate: hover ? 5 : 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          style={{ width: 32, height: 32, marginBottom: 24 }}
        >
          {feature.icon(hover ? 'var(--orange)' : 'var(--ink)')}
        </motion.div>
        <h3
          className="serif"
          style={{
            fontSize: 22,
            fontWeight: 300,
            letterSpacing: '-0.012em',
            marginBottom: 8,
            color: 'var(--ink)',
          }}
        >
          {feature.title}
        </h3>
        <p style={{ fontSize: 14, color: 'var(--ash)', lineHeight: 1.5 }}>
          {feature.desc}
        </p>
      </div>
    </motion.div>
  );
}
