import { motion } from 'framer-motion';

interface Illustration {
  src: string;
  alt: string;
  caption: string;
}

const ILLUSTRATIONS: Illustration[] = [
  { src: '/illustrations/hero-onboarding.svg', alt: 'Start your day', caption: 'Start your day' },
  { src: '/illustrations/empty-leads.svg', alt: 'Always more to find', caption: 'Always more to find' },
  { src: '/illustrations/scrape-running.svg', alt: 'Always working', caption: 'Always working' },
  { src: '/illustrations/paywall-tokens.svg', alt: 'Pay per lead', caption: 'Pay per lead' },
  { src: '/illustrations/success-bloom.svg', alt: 'Wins compound', caption: 'Wins compound' },
  { src: '/illustrations/error-wilted.svg', alt: 'We catch failures', caption: 'We catch failures' },
  { src: '/illustrations/empty-outreach.svg', alt: 'Empty inbox = good', caption: 'Empty inbox = good' },
  { src: '/illustrations/hero-paywall.svg', alt: 'Choose your speed', caption: 'Choose your speed' },
];

function IllustrationCard({ item, index }: { item: Illustration; index: number }) {
  return (
    <motion.div
      className="group flex-shrink-0 w-[220px]"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ delay: index * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="rounded-2xl overflow-hidden border border-border bg-surface mb-3"
        whileHover={{ scale: 1.05, boxShadow: '0 12px 32px rgba(11,10,8,0.1)' }}
        transition={{ type: 'spring', stiffness: 250, damping: 20 }}
      >
        <img
          src={item.src}
          alt={item.alt}
          className="w-full h-[180px] object-cover"
          loading="lazy"
        />
      </motion.div>
      <motion.p
        className="text-[12px] font-medium text-muted text-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.06 + 0.2 }}
      >
        {item.caption}
      </motion.p>
    </motion.div>
  );
}

export default function IllustrationShowcase() {
  return (
    <section className="py-20 bg-[#FFF8F5] border-y border-border overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10 mb-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand mb-3">
          Product story
        </p>
        <h2 className="font-display text-[clamp(26px,3.5vw,38px)] font-semibold">
          Eight scenes. One workflow.
        </h2>
      </div>

      <div className="px-6 lg:px-10">
        <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
          {ILLUSTRATIONS.map((item, i) => (
            <div key={item.src} className="snap-start">
              <IllustrationCard item={item} index={i} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
