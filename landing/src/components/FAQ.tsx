import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

const FAQS = [
  {
    q: 'Is what you do legal?',
    a: 'Yes. We collect publicly visible LinkedIn profile data the same way a human visiting a profile does. We do not scrape private data, bypass auth, or violate ToS. You connect your own LinkedIn account; nothing happens off-account.',
  },
  {
    q: 'Will I get my LinkedIn account banned?',
    a: 'We mirror human behavior with rate limits well under platform thresholds, randomized timing, and per-user pacing. We have run >180k sessions without a single account flagged. You stay in control of every action.',
  },
  {
    q: 'How do you handle data privacy?',
    a: 'GDPR + CCPA compliant. All lead data lives in your workspace, encrypted at rest. We do not train models on your data. You can export or delete everything at any moment.',
  },
  {
    q: 'How long is the free trial?',
    a: '7 days. Full Pro features. No credit card. After trial, choose any plan or stay on Starter (100 leads/mo).',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'One click. No emails to support, no cancellation calls. Your account converts to Starter at the end of the billing cycle.',
  },
  {
    q: 'Do you have a team plan?',
    a: 'Yes. Team comes with 5 seats, shared voice library, and admin analytics. Need 20+? We have an enterprise tier with SSO and dedicated infra.',
  },
  {
    q: 'Can I export my data?',
    a: 'CSV, JSON or direct sync to HubSpot, Salesforce, Pipedrive, Attio and Notion. Webhooks let you push into anything custom.',
  },
  {
    q: 'Do you offer webhooks or an API?',
    a: 'On Team and Enterprise. Lead events, reply events and sequence stage changes — all available as webhooks or via REST API.',
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="px-6 md:px-10 py-32 md:py-44">
      <div className="max-w-[70ch] mx-auto">
        <div className="font-mono-brand text-[12px] uppercase tracking-[0.12em] text-[var(--ink-soft)] mb-6">
          [ FAQ // 05 ]
        </div>
        <h2 className="text-h2 font-display mb-16 md:mb-20">
          Questions, answered.
        </h2>
        <div className="border-t border-[var(--line)]">
          {FAQS.map((item, i) => (
            <FAQItem
              key={i}
              q={item.q}
              a={item.a}
              open={open === i}
              onToggle={() => setOpen(open === i ? null : i)}
              index={i}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQItem({
  q,
  a,
  open,
  onToggle,
  index,
}: {
  q: string;
  a: string;
  open: boolean;
  onToggle: () => void;
  index: number;
}) {
  return (
    <div className="border-b border-[var(--line)]">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-start gap-6 py-6 md:py-8 text-left group"
        data-cursor
        data-cursor-label={open ? 'Close' : 'Open'}
      >
        <span className="font-mono-brand text-[12px] uppercase tracking-[0.12em] text-[var(--ink-soft)] pt-2 w-10 shrink-0">
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className="flex-1 font-display text-[20px] md:text-[24px] leading-[1.3] tracking-[-0.02em] group-hover:text-[#FF5A1F] transition-colors duration-200">
          {q}
        </span>
        <motion.span
          className="font-mono-brand text-[20px] shrink-0 pt-1"
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          +
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="pl-16 pb-8 pr-4">
              <p className="text-[16px] leading-[1.6] text-[var(--ink-soft)] max-w-[60ch]">{a}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
