import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

const EASE = [0.22, 1, 0.36, 1] as const;

const ITEMS = [
  {
    q: 'Is LinkedIn scraping legal?',
    a: 'Public posts and public profile data are fair game under the hiQ v. LinkedIn precedent in the US, and we operate identically under Indian DPDP. We do not scrape behind logins of accounts that are not yours, we do not bulk-export private connections, and we honor LinkedIn rate limits with conservative pacing.',
  },
  {
    q: "What about LinkedIn's Terms of Service?",
    a: 'You authenticate with your own LinkedIn account, set your own pacing, and stay within human-feasible activity. We rotate sessions, keep cookie state warm, and stop the moment LinkedIn surfaces a friction prompt — no aggressive bypassing.',
  },
  {
    q: 'How does Claude score a lead?',
    a: 'Each post or comment is summarized into intent (buyer / seeker / self-promo / noise) plus a confidence score from 0 to 10. The model uses your ICP brief plus rolling examples from leads you accepted or rejected. Scores improve every week.',
  },
  {
    q: 'What data do you store?',
    a: 'Your ICP brief, the public LinkedIn artifacts that matched, the enriched contact details we found, your draft messages, and outcomes (sent / replied / closed). All in your tenant. Nothing is shared across customers.',
  },
  {
    q: 'Can I export my leads?',
    a: 'CSV, JSON, and webhook in real time. We will also push to HubSpot, Pipedrive, Zoho, Salesforce, and any system that speaks Zapier. Your data leaves with you.',
  },
  {
    q: 'How long is the free trial?',
    a: 'Fourteen days, no credit card. You get fifty leads, one ICP, and the full draft engine. After that you pick a plan or your data sits idle for thirty days before deletion.',
  },
  {
    q: 'Do you support white-label?',
    a: 'Yes — Pro and Enterprise can rebrand the admin app, add a custom domain, and resell to their own clients. The mobile app supports custom theming too.',
  },
  {
    q: 'What if I run out of tokens mid-month?',
    a: 'You can buy a top-up pack at the same per-token rate, or wait for the next cycle. We never overcharge silently — you will see a banner and an explicit confirmation before any extra charge.',
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section
      id="faq"
      className="relative w-full"
      style={{ backgroundColor: 'var(--cream)' }}
    >
      <div className="px-6 md:px-10 py-24 md:py-36 max-w-[1600px] mx-auto">
        <div className="mb-14 md:mb-20 max-w-[34ch]">
          <div className="mono mb-4" style={{ color: 'var(--ash)' }}>
            QUESTIONS / ANSWERED
          </div>
          <h2
            className="serif"
            style={{
              fontSize: 'clamp(40px, 6vw, 96px)',
              lineHeight: 1.05,
              letterSpacing: '-0.018em',
              fontWeight: 300,
            }}
          >
            Eight things people <span className="serif-italic">always ask.</span>
          </h2>
        </div>

        <div style={{ borderTop: '1px solid var(--line)' }}>
          {ITEMS.map((item, i) => (
            <FAQRow
              key={i}
              item={item}
              isOpen={open === i}
              onToggle={() => setOpen(open === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQRow({
  item,
  isOpen,
  onToggle,
}: {
  item: { q: string; a: string };
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div style={{ borderBottom: '1px solid var(--line)' }} className="group">
      <button
        onClick={onToggle}
        className="w-full text-left py-6 md:py-8 flex items-start gap-6 relative"
      >
        <span
          className="absolute left-0 right-0 bottom-0 h-px origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ backgroundColor: 'var(--orange)' }}
        />
        <span className="flex-1">
          <span
            className="serif block"
            style={{
              fontSize: 'clamp(22px, 2vw, 30px)',
              lineHeight: 1.25,
              letterSpacing: '-0.012em',
              fontWeight: 300,
              color: 'var(--ink)',
            }}
          >
            {item.q}
          </span>
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="serif shrink-0"
          style={{
            fontSize: 32,
            fontWeight: 300,
            color: isOpen ? 'var(--orange)' : 'var(--ink)',
            lineHeight: 1,
          }}
        >
          +
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
            style={{ overflow: 'hidden' }}
          >
            <p
              className="pb-7 md:pb-9"
              style={{
                fontSize: 17,
                lineHeight: 1.55,
                color: 'var(--ash)',
                maxWidth: '64ch',
              }}
            >
              {item.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
