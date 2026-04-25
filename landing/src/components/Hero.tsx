import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type Variants,
} from 'framer-motion';
import { useEffect } from 'react';
import FlowerMark from './FlowerMark';

const HEADLINE = 'Find buyers, not noise.';
const HEADLINE_WORDS = HEADLINE.split(' ');

const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const wordVariants: Variants = {
  hidden: {
    y: 28,
    opacity: 0,
    clipPath: 'inset(0 0 100% 0)',
  },
  show: {
    y: 0,
    opacity: 1,
    clipPath: 'inset(0 0 0% 0)',
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
  },
};

const subtitleVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

const ctaVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function Hero() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 150, damping: 25 };
  const mx = useSpring(mouseX, springConfig);
  const my = useSpring(mouseY, springConfig);

  const frontX = useTransform(mx, [-1, 1], [-8, 8]);
  const frontY = useTransform(my, [-1, 1], [-8, 8]);
  const backX = useTransform(mx, [-1, 1], [18, -18]);
  const backY = useTransform(my, [-1, 1], [18, -18]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      mouseX.set((e.clientX - cx) / cx);
      mouseY.set((e.clientY - cy) / cy);
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, [mouseX, mouseY]);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-[60px]">
      {/* Gradient backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#FFF5EF] via-cream to-cream pointer-events-none" />

      {/* Cursor-aware parallax flowers (Pattern 3) */}
      <motion.div
        className="absolute top-[10%] right-[6%] opacity-[0.12] pointer-events-none"
        style={{ x: backX, y: backY }}
      >
        <FlowerMark size={220} />
      </motion.div>
      <motion.div
        className="absolute bottom-[12%] left-[4%] opacity-[0.08] pointer-events-none"
        style={{ x: frontX, y: frontY }}
      >
        <FlowerMark size={140} />
      </motion.div>

      <div className="relative max-w-[1200px] mx-auto px-6 lg:px-10 py-20 w-full grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-12 items-center">

        {/* Left column */}
        <div>
          {/* Eyebrow chip */}
          <motion.div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-brand-soft rounded-full text-[12px] font-semibold text-terra tracking-wide mb-7"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-brand" />
            Wake up to better leads
          </motion.div>

          {/* H1 — word-by-word ink-flow reveal (Pattern 1) */}
          <motion.h1
            className="font-display text-[clamp(44px,6vw,72px)] font-semibold italic leading-[1.05] mb-6"
            style={{ color: '#0B0A08' }}
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {HEADLINE_WORDS.map((word, i) => (
              <motion.span
                key={i}
                variants={wordVariants}
                className="inline-block mr-[0.22em]"
                style={
                  word === 'buyers,' || word === 'noise.'
                    ? { color: '#FF4716', animationDelay: '0.15s' }
                    : {}
                }
              >
                {word}
              </motion.span>
            ))}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="text-[17px] text-muted leading-relaxed max-w-[480px] mb-8"
            variants={subtitleVariants}
            initial="hidden"
            animate="show"
          >
            AI-filtered LinkedIn leads delivered every 12 hours.
            <br />
            We score, enrich, and draft outreach. You hit send.
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="flex flex-wrap gap-3 mb-9"
            variants={ctaVariants}
            initial="hidden"
            animate="show"
          >
            <motion.a
              href="/app/login"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-brand text-white text-[15px] font-semibold rounded-full"
              whileHover={{ scale: 1.02, boxShadow: '0 6px 28px rgba(255,71,22,0.4)' }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 380, damping: 22 }}
            >
              Start free trial
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </motion.a>
            <motion.a
              href="#how-it-works"
              className="inline-flex items-center gap-2 px-7 py-3.5 border border-border text-[15px] font-medium text-ink rounded-full hover:border-ink transition-colors"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              Watch demo
            </motion.a>
          </motion.div>

          {/* Trust strip */}
          <motion.p
            className="text-[12px] text-muted"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
          >
            Used by 8 founders shipping ~50 leads/day ·{' '}
            <span className="font-semibold font-mono-brand text-ink">₹0</span> fixed cost
          </motion.p>
        </div>

        {/* Right column — hero illustration */}
        <motion.div
          className="relative flex justify-center"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Bloom flower — slow rotation */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center opacity-20"
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          >
            <FlowerMark size={360} animated />
          </motion.div>

          {/* Main illustration */}
          <motion.img
            src="/illustrations/hero-onboarding.svg"
            alt="LeadHangover dashboard preview"
            className="relative w-full max-w-[420px] rounded-2xl"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          />

          {/* Floating small petals */}
          {[
            { x: '-10%', y: '5%', size: 28, delay: 0 },
            { x: '90%', y: '20%', size: 20, delay: 0.3 },
            { x: '85%', y: '70%', size: 16, delay: 0.6 },
          ].map((petal, i) => (
            <motion.div
              key={i}
              className="absolute pointer-events-none"
              style={{ left: petal.x, top: petal.y }}
              animate={{ y: [-4, 4, -4], rotate: [0, 15, 0] }}
              transition={{
                duration: 4 + i,
                repeat: Infinity,
                delay: petal.delay,
                ease: 'easeInOut',
              }}
            >
              <FlowerMark size={petal.size} />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-cream to-transparent pointer-events-none" />
    </section>
  );
}
