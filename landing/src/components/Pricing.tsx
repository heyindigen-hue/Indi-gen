import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import MagneticPill from './MagneticPill';

interface Plan {
  id: string;
  name: string;
  price: number | string;
  cadence: string;
  features: string[];
  featured?: boolean;
  cta?: string;
}

const FALLBACK_PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 0,
    cadence: 'free for 7 days',
    features: ['100 leads / mo', '1 sequence', 'Manual approve', 'Email support'],
    cta: 'Start free',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49,
    cadence: 'per month',
    features: ['1,500 leads / mo', '5 sequences', 'Auto-approve rules', 'Claude voice match', 'CRM sync', 'Priority support'],
    featured: true,
    cta: 'Start hunting',
  },
  {
    id: 'team',
    name: 'Team',
    price: 199,
    cadence: 'per month, 5 seats',
    features: ['Unlimited leads', 'Unlimited sequences', 'Shared voice library', 'Team analytics', 'Webhooks + API', 'Dedicated success manager'],
    cta: 'Talk to sales',
  },
];

export default function Pricing() {
  const [plans, setPlans] = useState<Plan[]>(FALLBACK_PLANS);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/billing/plans')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const list = Array.isArray(data) ? data : data?.plans;
        if (Array.isArray(list) && list.length) {
          const normalized: Plan[] = list.map((p: any, i: number) => ({
            id: p.id ?? String(i),
            name: p.name ?? p.title ?? 'Plan',
            price: p.price ?? p.amount ?? 0,
            cadence: p.cadence ?? p.interval ?? 'per month',
            features: Array.isArray(p.features) ? p.features : [],
            featured: typeof p.featured === 'boolean' ? p.featured : i === 1,
            cta: p.cta ?? 'Choose plan',
          }));
          setPlans(normalized);
        }
      })
      .catch(() => {
        // keep fallback
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="pricing" className="px-6 md:px-10 py-32 md:py-44">
      <div className="max-w-[1600px] mx-auto">
        <div className="font-mono-brand text-[12px] uppercase tracking-[0.12em] text-[var(--ink-soft)] mb-6">
          [ PRICING // 04 ]
        </div>
        <h2 className="text-h2 font-display max-w-[18ch] mb-16 md:mb-24">
          Simple. No seat tax. Cancel anytime.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4 items-stretch">
          {plans.map((p, i) => (
            <PlanCard key={p.id} plan={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PlanCard({ plan, index }: { plan: Plan; index: number }) {
  const [hover, setHover] = useState(false);
  const isFeatured = plan.featured;
  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
    >
      {isFeatured && (
        <motion.div
          className="absolute -top-3.5 right-6 z-10 origin-center"
          animate={{ rotate: [-4, -3, -4, -5, -4] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="inline-block bg-[#FF5A1F] text-[#14140F] font-mono-brand text-[10px] uppercase tracking-[0.12em] px-3 py-1.5 rounded-full">
            [ MOST POPULAR ]
          </span>
        </motion.div>
      )}
      <div
        className={`rounded-3xl p-8 md:p-10 h-full flex flex-col gap-8 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isFeatured
            ? 'bg-[#14140F] text-[#F4F1EA]'
            : `bg-[#F4F1EA] text-[#14140F] ${hover ? 'border-2' : 'border'} border-[rgba(20,20,15,0.18)]`
        }`}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{ padding: !isFeatured && hover ? 'calc(2rem - 1px) calc(2.5rem - 1px)' : undefined }}
      >
        <div>
          <div
            className={`font-mono-brand text-[12px] uppercase tracking-[0.12em] mb-4 ${
              isFeatured ? 'text-[rgba(244,241,234,0.6)]' : 'text-[var(--ink-soft)]'
            }`}
          >
            [ {plan.name.toUpperCase()} ]
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-medium tracking-[-0.04em]" style={{ fontSize: 'clamp(48px, 6vw, 72px)' }}>
              {typeof plan.price === 'number' ? (plan.price === 0 ? 'Free' : `$${plan.price}`) : plan.price}
            </span>
            {typeof plan.price === 'number' && plan.price !== 0 && (
              <span className="font-mono-brand text-[12px] uppercase tracking-[0.12em] opacity-60">/ mo</span>
            )}
          </div>
          <div className={`mt-2 font-mono-brand text-[11px] uppercase tracking-[0.12em] ${isFeatured ? 'opacity-60' : 'text-[var(--ink-soft)]'}`}>
            {plan.cadence}
          </div>
        </div>

        <div className={`h-px ${isFeatured ? 'bg-[rgba(244,241,234,0.18)]' : 'bg-[var(--line)]'}`} />

        <ul className="flex flex-col gap-3 flex-1">
          {plan.features.map((f, i) => (
            <Feature
              key={i}
              text={f}
              index={i}
              hover={hover}
              isFeatured={!!isFeatured}
            />
          ))}
        </ul>

        <div className="pt-2">
          <MagneticPill
            href={isFeatured ? '/auth/signup' : plan.id === 'team' ? 'mailto:book@leadhangover.com' : '/auth/signup'}
            variant={isFeatured ? 'inverse' : 'primary'}
            size="lg"
            cursorLabel="Choose"
          >
            {plan.cta || 'Choose plan'}
          </MagneticPill>
        </div>
      </div>
    </motion.div>
  );
}

function Feature({
  text,
  index,
  hover,
  isFeatured,
}: {
  text: string;
  index: number;
  hover: boolean;
  isFeatured: boolean;
}) {
  return (
    <motion.li
      className="flex items-start gap-3 text-[14px] leading-[1.5]"
    >
      <motion.span
        className="font-mono-brand text-[14px] mt-px"
        animate={{
          color: isFeatured ? '#FF5A1F' : hover ? '#FF5A1F' : 'rgba(20,20,15,0.4)',
        }}
        transition={{ duration: 0.25, delay: hover ? index * 0.06 : 0 }}
      >
        ✓
      </motion.span>
      <span className={isFeatured ? 'text-[rgba(244,241,234,0.85)]' : 'text-[var(--ink)]'}>{text}</span>
    </motion.li>
  );
}
