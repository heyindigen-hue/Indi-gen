import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Plan {
  id: string;
  name: string;
  price_inr: number;
  tokens?: number;
  description: string;
  features: string[];
  popular?: boolean;
}

const DEFAULT_PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price_inr: 0,
    description: 'Get started with manual searches and basic lead scoring.',
    features: ['10 leads / day', '3 saved queries', 'AI scoring', 'Mobile app access'],
  },
  {
    id: 'starter',
    name: 'Starter',
    price_inr: 1499,
    tokens: 500,
    description: 'Daily automated scrapes + full AI filtering.',
    features: ['50 leads / day', '10 saved queries', 'Full AI scoring', 'SignalHire enrichment', 'WhatsApp outreach drafts'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price_inr: 4999,
    tokens: 2000,
    description: 'Unlimited scraping, proposals, and priority support.',
    features: ['Unlimited leads', 'Unlimited saved queries', 'AI Proposal Builder', 'Company intelligence', 'Multi-key rotation', 'Priority support'],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price_inr: -1,
    description: 'Dedicated scraper, custom ICP rules, SLA, and team access.',
    features: ['Everything in Pro', 'Custom ICP training', 'Dedicated Apify account', 'Team seats', 'SLA + onboarding', 'White-label option'],
  },
];

function SpotlightCard({
  plan,
  hoveredId,
  onHover,
  onLeave,
}: {
  plan: Plan;
  hoveredId: string | null;
  onHover: (id: string) => void;
  onLeave: () => void;
}) {
  const cx = useMotionValue(0);
  const cy = useMotionValue(0);
  const scx = useSpring(cx, { stiffness: 200, damping: 20 });
  const scy = useSpring(cy, { stiffness: 200, damping: 20 });

  const isHovered = hoveredId === plan.id;
  const isMuted = hoveredId !== null && !isHovered;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    cx.set(e.clientX - rect.left);
    cy.set(e.clientY - rect.top);
  };

  const priceStr =
    plan.price_inr < 0
      ? 'Custom'
      : plan.price_inr === 0
      ? '₹0'
      : `₹${plan.price_inr.toLocaleString('en-IN')}`;

  const ctaHref =
    plan.id === 'enterprise' ? 'mailto:hello@indigenservices.com' : '/app/login';
  const ctaLabel =
    plan.id === 'enterprise' ? 'Contact sales' : plan.price_inr === 0 ? 'Get started' : 'Start trial';

  return (
    <motion.div
      className={`relative rounded-2xl border p-7 overflow-hidden cursor-default ${
        plan.popular
          ? 'border-brand ring-1 ring-brand/20'
          : 'border-border'
      }`}
      animate={{
        opacity: isMuted ? 0.7 : 1,
        scale: isHovered ? 1.02 : 1,
        y: isHovered ? -8 : 0,
        boxShadow: isHovered
          ? '0 20px 50px rgba(11,10,8,0.12)'
          : '0 0 0 transparent',
      }}
      transition={{ type: 'spring', stiffness: 250, damping: 22 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => onHover(plan.id)}
      onMouseLeave={onLeave}
    >
      {/* Cursor spotlight (Pattern 20) */}
      {isHovered && (
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-2xl"
          style={{
            background: `radial-gradient(240px circle at ${scx.get()}px ${scy.get()}px, rgba(255,71,22,0.10), transparent 60%)`,
          }}
        />
      )}

      {plan.popular && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 bg-brand text-white text-[11px] font-semibold tracking-wide rounded-full">
          Most popular
        </div>
      )}

      <div className="mb-5">
        <h3 className="font-display italic text-[18px] font-semibold text-ink mb-1">{plan.name}</h3>
        <div className="font-display font-semibold text-[36px] leading-none text-ink mb-1">
          {priceStr}
          {plan.price_inr > 0 && (
            <span className="text-[14px] font-body font-normal text-muted ml-1">/ mo</span>
          )}
        </div>
        {plan.tokens && (
          <p className="text-[12px] font-mono-brand text-brand">{plan.tokens.toLocaleString()} tokens</p>
        )}
        <p className="text-[13px] text-muted mt-2 leading-snug">{plan.description}</p>
      </div>

      <ul className="space-y-2 mb-7">
        {plan.features.map((f) => (
          <li key={f} className="flex items-center gap-2.5 text-[13px] text-ink">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF4716" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {f}
          </li>
        ))}
      </ul>

      <motion.a
        href={ctaHref}
        className={`block w-full py-2.5 text-center rounded-full text-[14px] font-semibold transition-colors ${
          plan.popular
            ? 'bg-brand text-white hover:bg-terra'
            : 'border border-border text-ink hover:border-ink'
        }`}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
      >
        {ctaLabel}
      </motion.a>
    </motion.div>
  );
}

export default function Pricing() {
  const [plans, setPlans] = useState<Plan[]>(DEFAULT_PLANS);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/billing/plans')
      .then((r) => r.ok ? r.json() : null)
      .then((data: Plan[] | null) => {
        if (Array.isArray(data) && data.length > 0) setPlans(data);
      })
      .catch(() => {});
  }, []);

  return (
    <section id="pricing" className="py-24 px-6 lg:px-10 bg-[#FFF8F5]">
      <div className="max-w-[1100px] mx-auto">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand mb-3">
          Simple pricing
        </p>
        <h2 className="font-display text-[clamp(28px,4vw,42px)] font-semibold mb-16">
          Start free, scale as you grow
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((plan) => (
            <SpotlightCard
              key={plan.id}
              plan={plan}
              hoveredId={hoveredId}
              onHover={setHoveredId}
              onLeave={() => setHoveredId(null)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
