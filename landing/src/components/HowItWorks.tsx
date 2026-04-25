import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import FlowerMark from './FlowerMark';

const STEPS = [
  {
    number: '01',
    title: 'Tell us your ICP',
    description: 'Pick industries, geography, and search phrases. Takes under 3 minutes.',
  },
  {
    number: '02',
    title: 'We scrape + filter',
    description: 'Every 12 hours, Claude reviews each LinkedIn post. Only buyers get through.',
  },
  {
    number: '03',
    title: 'You send',
    description: 'WhatsApp, Email, LinkedIn DM — drafted for you. One tap to send.',
  },
];

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start 80%', 'end 40%'],
  });

  const pathLength = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.15 } },
  };

  const stepVariants = {
    hidden: { opacity: 0, x: -24 },
    show: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="py-24 px-6 lg:px-10 bg-cream"
    >
      <div className="max-w-[1100px] mx-auto">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand mb-3">
          Simple process
        </p>
        <h2 className="font-display text-[clamp(28px,4vw,42px)] font-semibold mb-16 max-w-[480px]">
          Three steps from intent to outreach
        </h2>

        <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_60px_1fr] gap-0 lg:gap-0 max-w-[800px]">
          {/* Animated connecting line (Pattern 11) */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-px overflow-visible pointer-events-none">
            <svg
              className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-3"
              viewBox="0 0 10 400"
              preserveAspectRatio="none"
            >
              <motion.path
                d="M5 0 C5 50 5 350 5 400"
                stroke="#FF4716"
                strokeWidth="2"
                strokeDasharray="6 6"
                fill="none"
                style={{ pathLength }}
                strokeLinecap="round"
              />
            </svg>
          </div>

          <motion.div
            className="flex flex-col gap-12"
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
          >
            {STEPS.map((step) => (
              <motion.div
                key={step.number}
                variants={stepVariants}
                className="flex gap-5 items-start"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-soft border border-[#FFB098] flex items-center justify-center">
                  <FlowerMark size={22} />
                </div>
                <div>
                  <span className="font-mono-brand text-[11px] text-brand font-medium">
                    {step.number}
                  </span>
                  <h3 className="font-display italic text-[20px] font-semibold text-ink mb-1.5 mt-0.5">
                    {step.title}
                  </h3>
                  <p className="text-[14px] text-muted leading-relaxed max-w-[340px]">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}

            <motion.div
              variants={stepVariants}
              className="flex gap-5 items-start"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <span className="font-mono-brand text-[11px] text-muted font-medium">done</span>
                <p className="font-display italic text-[18px] font-semibold text-ink mt-0.5">
                  Pipeline full by morning.
                </p>
              </div>
            </motion.div>
          </motion.div>

          <div className="hidden lg:block" />

          {/* Right side illustration */}
          <motion.div
            className="hidden lg:flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <img
              src="/illustrations/onboarding-icp.svg"
              alt="ICP setup"
              className="w-full max-w-[280px] rounded-2xl"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
