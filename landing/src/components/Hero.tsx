import { motion, useReducedMotion } from 'framer-motion';
import LeadCard from './LeadCard';
import SplitText from './SplitText';

const EASE = [0.22, 1, 0.36, 1] as const;

const HERO_LEADS = [
  { name: 'John D.', role: 'CTO', company: 'Acme Threads', score: 8.4, tag: 'D2C' },
  { name: 'Priya R.', role: 'Founder', company: 'Loom & Co', score: 9.1, tag: 'Shopify Plus' },
  { name: 'Marc K.', role: 'Head of Growth', company: 'Northstar', score: 7.6, tag: 'B2B SaaS' },
  { name: 'Aisha B.', role: 'COO', company: 'Granular', score: 8.2, tag: 'Climate' },
  { name: 'Tom W.', role: 'VP Sales', company: 'Beacon Labs', score: 6.8, tag: 'Enterprise' },
  { name: 'Sana V.', role: 'CEO', company: 'Slate Studio', score: 8.9, tag: 'Agency' },
  { name: 'Rohit M.', role: 'Co-founder', company: 'Hearthstone', score: 7.4, tag: 'D2C' },
  { name: 'Elise P.', role: 'Director', company: 'Maple Group', score: 8.0, tag: 'B2B' },
  { name: 'Karthik S.', role: 'CMO', company: 'Pivot Mfg', score: 7.9, tag: 'Industrial' },
  { name: 'Dana L.', role: 'Head of RevOps', company: 'Helix', score: 8.6, tag: 'D2C' },
];

export default function Hero() {
  const reduce = useReducedMotion();
  return (
    <section
      id="top"
      className="relative w-full"
      style={{ backgroundColor: 'var(--cream)', minHeight: '100vh' }}
    >
      <div className="px-6 md:px-10 pt-40 md:pt-44 pb-10 max-w-[1600px] mx-auto">
        <motion.div
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8 md:mb-12"
        >
          <span className="mono" style={{ color: 'var(--ash)' }}>
            LEADHANGOVER —
          </span>
        </motion.div>

        <h1
          className="serif"
          style={{
            fontSize: 'clamp(56px, 9vw, 168px)',
            lineHeight: 1.0,
            letterSpacing: '-0.02em',
            fontWeight: 300,
            display: 'block',
          }}
        >
          <SplitText delay={0.15} stagger={0.07} duration={0.95} as="span">
            Hunt LinkedIn leads
          </SplitText>
          <br />
          <span className="serif-italic">
            <SplitText delay={0.45} stagger={0.07} duration={0.95} as="span" italic>
              while you sleep.
            </SplitText>
          </span>
        </h1>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.95, ease: EASE }}
          className="mt-12 md:mt-16 grid md:grid-cols-2 gap-10 items-end"
        >
          <p
            className="max-w-[34ch]"
            style={{ fontSize: 'clamp(17px, 1.3vw, 21px)', lineHeight: 1.5, color: 'var(--ash)' }}
          >
            Indigen Services builds your private outbound engine in twenty-one days.
            Claude reads every post. Drafts arrive in your inbox. You hit send.
          </p>
          <div className="flex flex-col gap-3 md:items-end">
            <a
              href="/auth/signup"
              className="serif group relative inline-flex items-center gap-3"
              style={{ fontSize: 28, fontWeight: 300 }}
            >
              <span className="relative">
                Start a hunt
                <span
                  className="absolute left-0 -bottom-0.5 h-px w-full"
                  style={{ backgroundColor: 'var(--ink)' }}
                />
              </span>
              <motion.span
                aria-hidden
                initial={false}
                whileHover={{ x: 6 }}
                style={{ display: 'inline-block', fontSize: 24 }}
              >
                →
              </motion.span>
            </a>
            <a href="#story" className="mono" style={{ color: 'var(--ash)' }}>
              watch the 90-sec demo →
            </a>
          </div>
        </motion.div>
      </div>

      {/* Bottom carousel strip */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 1.1, ease: EASE }}
        className="relative mt-6 md:mt-12 mb-10"
        data-cursor="drag"
        aria-hidden
      >
        <div className="px-6 md:px-10 mb-3 mono" style={{ color: 'var(--ash)', fontSize: 10 }}>
          → leads landing in your queue
        </div>
        <div
          className="relative overflow-hidden"
          style={{
            maskImage:
              'linear-gradient(90deg, transparent 0, #000 6%, #000 94%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(90deg, transparent 0, #000 6%, #000 94%, transparent 100%)',
          }}
        >
          <motion.div
            className="flex gap-4 py-2"
            animate={reduce ? undefined : { x: [0, -((280 + 16) * HERO_LEADS.length)] }}
            transition={
              reduce ? undefined : { duration: 60, repeat: Infinity, ease: 'linear' }
            }
            style={{ width: 'max-content' }}
          >
            {[...HERO_LEADS, ...HERO_LEADS].map((l, i) => (
              <LeadCard key={i} {...l} variant="paper" />
            ))}
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
