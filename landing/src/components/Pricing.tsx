import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

const EASE = [0.22, 1, 0.36, 1] as const;

interface Plan {
  id: string;
  name: string;
  price: number;
  yearly?: number;
  cadence: string;
  features: string[];
  featured?: boolean;
  cta: string;
  href: string;
}

const FALLBACK: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    cadence: 'try for 14 days',
    features: ['50 leads / mo', '1 ICP', 'Manual approve', 'Community help'],
    cta: 'Start free',
    href: '/auth/signup',
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    yearly: 24,
    cadence: 'per month',
    features: [
      '500 leads / mo',
      '2 ICPs',
      'Email + LinkedIn',
      'Voice match',
      'Email support',
    ],
    cta: 'Start hunting',
    href: '/auth/signup?plan=starter',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 79,
    yearly: 65,
    cadence: 'per month',
    features: [
      '2,500 leads / mo',
      'Unlimited ICPs',
      'WhatsApp + Email + LinkedIn',
      'Auto-approve rules',
      'CRM sync',
      'Priority support',
    ],
    featured: true,
    cta: 'Start hunting',
    href: '/auth/signup?plan=pro',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 299,
    yearly: 249,
    cadence: 'per month, 5 seats',
    features: [
      'Unlimited leads',
      'Team analytics',
      'White-label option',
      'Webhooks + API',
      'Dedicated success manager',
      'SLA + DPA',
    ],
    cta: 'Talk to us',
    href: 'mailto:hello@leadhangover.com',
  },
];

type Cadence = 'monthly' | 'yearly';

export default function Pricing() {
  const [plans, setPlans] = useState<Plan[]>(FALLBACK);
  const [cadence, setCadence] = useState<Cadence>('monthly');

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
            price: Number(p.price ?? p.amount ?? 0),
            yearly: typeof p.yearly === 'number' ? p.yearly : undefined,
            cadence: p.cadence ?? p.interval ?? 'per month',
            features: Array.isArray(p.features) ? p.features : [],
            featured: typeof p.featured === 'boolean' ? p.featured : i === 2,
            cta: p.cta ?? 'Choose plan',
            href: p.href ?? '/auth/signup',
          }));
          setPlans(normalized);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      id="pricing"
      className="relative w-full"
      style={{ backgroundColor: 'var(--ink)', color: 'var(--cream)' }}
    >
      <div className="px-6 md:px-10 py-24 md:py-36 max-w-[1600px] mx-auto">
        <div className="mb-12 md:mb-16 grid md:grid-cols-2 gap-8 items-end">
          <div>
            <div className="mono mb-4" style={{ color: 'rgba(247,241,229,0.6)' }}>
              PRICING / NO SEAT TAX
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
              Pay for{' '}
              <span className="serif-italic">leads,</span>
              <br />
              not seats.
            </h2>
          </div>
          <div className="md:justify-self-end">
            <CadenceToggle cadence={cadence} setCadence={setCadence} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
          {plans.slice(0, 4).map((p, i) => (
            <PlanCard key={p.id} plan={p} index={i} cadence={cadence} />
          ))}
        </div>

        <div
          className="mt-10 mono flex items-center gap-3"
          style={{ color: 'rgba(247,241,229,0.55)' }}
        >
          <span className="block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--orange)' }} />
          GST-INCLUSIVE FOR INDIA · UPI / CARD / NETBANKING VIA CASHFREE
        </div>
      </div>
    </section>
  );
}

function CadenceToggle({
  cadence,
  setCadence,
}: {
  cadence: Cadence;
  setCadence: (c: Cadence) => void;
}) {
  return (
    <div
      className="relative inline-flex items-center rounded-full"
      style={{
        backgroundColor: 'rgba(247,241,229,0.06)',
        border: '1px solid rgba(247,241,229,0.16)',
        padding: 4,
      }}
    >
      {(['monthly', 'yearly'] as const).map((c) => (
        <button
          key={c}
          onClick={() => setCadence(c)}
          className="relative z-10 mono"
          style={{
            padding: '8px 16px',
            color: cadence === c ? 'var(--ink)' : 'rgba(247,241,229,0.7)',
            transition: 'color .35s',
          }}
        >
          {c}
          {c === 'yearly' && (
            <span style={{ marginLeft: 8, color: cadence === c ? 'var(--ink)' : 'var(--orange)' }}>
              −18%
            </span>
          )}
          {cadence === c && (
            <motion.span
              layoutId="toggle-pill"
              className="absolute inset-0 rounded-full -z-10"
              style={{ backgroundColor: 'var(--cream)' }}
              transition={{ duration: 0.4, ease: EASE }}
            />
          )}
        </button>
      ))}
    </div>
  );
}

function PlanCard({
  plan,
  index,
  cadence,
}: {
  plan: Plan;
  index: number;
  cadence: Cadence;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-15%' });
  const reduce = useReducedMotion();
  const isFeatured = plan.featured;

  const target =
    cadence === 'yearly' && plan.yearly !== undefined ? plan.yearly : plan.price;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView || reduce) {
      setDisplay(target);
      return;
    }
    const start = display;
    const dur = 700;
    const t0 = performance.now();
    let raf = 0;
    function tick(t: number) {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(start + (target - start) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, inView]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.7, ease: EASE, delay: index * 0.08 }}
      className="relative"
      style={{ scale: isFeatured ? 1.02 : 1 }}
    >
      <div
        className="rounded-3xl h-full flex flex-col gap-7 relative overflow-hidden"
        style={{
          backgroundColor: 'var(--paper)',
          color: 'var(--ink)',
          border: isFeatured ? '1px solid transparent' : '1px solid rgba(247,241,229,0.18)',
          padding: 28,
          minHeight: 480,
        }}
      >
        {isFeatured && (
          <motion.div
            className="absolute top-0 left-0 right-0 h-[3px] origin-left"
            initial={{ scaleX: 0 }}
            animate={inView ? { scaleX: 1 } : undefined}
            transition={{ duration: 0.9, ease: EASE, delay: 0.4 }}
            style={{ backgroundColor: 'var(--orange)' }}
          />
        )}

        <div>
          <div className="mono mb-4" style={{ color: 'var(--ash)' }}>
            {plan.name.toUpperCase()}
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className="serif tabular-nums"
              style={{
                fontSize: 'clamp(48px, 5vw, 72px)',
                fontWeight: 300,
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}
            >
              {plan.price === 0 ? 'Free' : `$${display}`}
            </span>
            {plan.price !== 0 && (
              <span className="mono" style={{ color: 'var(--ash)' }}>
                / mo
              </span>
            )}
          </div>
          <div className="mt-2 mono" style={{ color: 'var(--ash)' }}>
            {plan.cadence}
          </div>
        </div>

        <div className="h-px" style={{ backgroundColor: 'var(--line)' }} />

        <ul className="flex flex-col gap-3 flex-1">
          {plan.features.map((f, i) => (
            <li key={i} className="flex items-start gap-2.5" style={{ fontSize: 14 }}>
              <span
                className="mono mt-0.5 shrink-0"
                style={{
                  color: 'var(--orange)',
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                ✓
              </span>
              <span style={{ color: 'var(--ink)' }}>{f}</span>
            </li>
          ))}
        </ul>

        <a
          href={plan.href}
          className="rounded-full text-center"
          style={{
            padding: '14px 22px',
            backgroundColor: isFeatured ? 'var(--orange)' : 'var(--ink)',
            color: isFeatured ? 'var(--ink)' : 'var(--cream)',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '-0.005em',
            display: 'inline-block',
          }}
        >
          {plan.cta} →
        </a>
      </div>
    </motion.div>
  );
}
