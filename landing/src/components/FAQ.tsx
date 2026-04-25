import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: 'How does the AI filtering work?',
    answer:
      'Claude Haiku reads each LinkedIn post and scores it against your ICP criteria. Posts with BUYER_PROJECT signals — phrases like "looking for", "evaluating", "need a vendor" — get surfaced. Everything else is discarded. The model runs in under 12 seconds per lead.',
  },
  {
    question: 'What is a token and how is it consumed?',
    answer:
      'One token represents one enriched, AI-scored lead. Scraping raw posts is free. A token is charged when you view full enrichment data (email, phone, company info) or generate an outreach draft for a lead.',
  },
  {
    question: 'Can I use my own LinkedIn account?',
    answer:
      'Yes. You can connect your own Apify API key or use our shared key pool. With your own key you get dedicated scraping quota and no rate-limit sharing with other users.',
  },
  {
    question: 'Is billing in INR? Do I get a GST invoice?',
    answer:
      'All pricing is in INR. Payments go through Cashfree. A GST-compliant invoice is generated automatically after every transaction and emailed to you.',
  },
  {
    question: 'How fresh are the leads?',
    answer:
      'The scraper runs every 12 hours by default. On Pro and Enterprise plans you can trigger an on-demand scrape at any time from the dashboard or mobile app.',
  },
  {
    question: 'What happens if I run out of tokens?',
    answer:
      'You can top up anytime from the billing page in as little as ₹99. Tokens never expire on paid plans. Free plan users have a fixed daily allowance that resets at midnight IST.',
  },
];

function FAQRow({ item }: { item: FAQItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border last:border-0">
      <button
        className="w-full flex items-center justify-between py-5 text-left gap-4 group"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="font-medium text-[15px] text-ink group-hover:text-brand transition-colors">
          {item.question}
        </span>
        <motion.div
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="flex-shrink-0 w-5 h-5 text-muted"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-[14px] text-muted leading-relaxed">{item.answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  return (
    <section className="py-24 px-6 lg:px-10 bg-surface border-t border-border">
      <div className="max-w-[720px] mx-auto">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand mb-3">
          FAQ
        </p>
        <h2 className="font-display text-[clamp(28px,4vw,40px)] font-semibold mb-14">
          Common questions
        </h2>
        <div>
          {FAQS.map((item) => (
            <FAQRow key={item.question} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
