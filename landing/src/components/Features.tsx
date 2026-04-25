import { motion } from 'framer-motion';

interface Feature {
  title: string;
  description: string;
  icon: React.ReactNode;
}

function AiIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.5 5 5.5.8-4 3.9.9 5.5L12 14.8l-4.9 2.4.9-5.5L4 7.8l5.5-.8z" />
    </svg>
  );
}
function LinkedInIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}
function EnrichIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
    </svg>
  );
}
function DraftIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}
function ProposalIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}
function MobileIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  );
}

const FEATURES: Feature[] = [
  {
    title: 'AI Filter',
    description: 'Claude reads every post and discards 85% of noise. Only BUYER_PROJECT signals pass.',
    icon: <AiIcon />,
  },
  {
    title: 'LinkedIn-first',
    description: 'Native scraping with multi-account rotation. Your pipeline never stops.',
    icon: <LinkedInIcon />,
  },
  {
    title: 'Auto-enrichment',
    description: 'Email + phone via SignalHire. 4,763 credits ready the moment you sign up.',
    icon: <EnrichIcon />,
  },
  {
    title: 'Smart drafts',
    description: 'WhatsApp / Email / LinkedIn DM written in your voice — one tap to send.',
    icon: <DraftIcon />,
  },
  {
    title: 'Proposal builder',
    description: 'From lead → proposal → sent in 2 clicks. PDF ready in under 10 seconds.',
    icon: <ProposalIcon />,
  },
  {
    title: 'Mobile-first',
    description: 'Swipe through leads on the train. Tap to send. Works offline.',
    icon: <MobileIcon />,
  },
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  },
};

function FeatureCard({ feature }: { feature: Feature }) {
  return (
    <motion.div
      variants={cardVariants}
      className="group relative bg-surface border border-border rounded-2xl p-7 cursor-default overflow-hidden"
      whileHover={{
        rotateX: 2,
        rotateY: -2,
        scale: 1.01,
        boxShadow: '0 12px 40px rgba(11,10,8,0.08)',
        borderColor: '#FFB098',
      }}
      transition={{ type: 'spring', stiffness: 220, damping: 20 }}
      style={{ transformPerspective: 1000 }}
    >
      {/* Cursor spotlight (Pattern 20 simplified via gradient on hover) */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-radial-cream rounded-2xl" />

      <motion.div
        className="w-11 h-11 rounded-xl bg-brand-soft flex items-center justify-center text-brand mb-5"
        whileHover={{ rotate: 10 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
      >
        {feature.icon}
      </motion.div>
      <h3
        className="font-display italic text-[18px] font-semibold text-ink mb-2"
      >
        {feature.title}
      </h3>
      <p className="text-[14px] text-muted leading-relaxed">{feature.description}</p>
    </motion.div>
  );
}

export default function Features() {
  return (
    <section id="features" className="py-24 px-6 lg:px-10 max-w-[1200px] mx-auto">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand mb-3">
        Why LeadHangover
      </p>
      <h2
        className="font-display text-[clamp(28px,4vw,42px)] font-semibold mb-16 max-w-[520px]"
      >
        Everything you need to fill your pipeline
      </h2>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-15% 0px' }}
      >
        {FEATURES.map((f) => (
          <FeatureCard key={f.title} feature={f} />
        ))}
      </motion.div>
    </section>
  );
}
