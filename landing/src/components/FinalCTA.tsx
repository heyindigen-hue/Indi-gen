import { motion, useReducedMotion } from 'framer-motion';
import SplitText from './SplitText';

export default function FinalCTA() {
  const reduce = useReducedMotion();
  return (
    <section
      className="relative w-full"
      style={{ backgroundColor: 'var(--ink)', color: 'var(--cream)' }}
    >
      <div className="section-rhythm max-w-[1600px] mx-auto text-center">
        <h2
          className="serif"
          style={{
            fontSize: 'clamp(48px, 9vw, 168px)',
            lineHeight: 1.0,
            letterSpacing: '-0.022em',
            fontWeight: 300,
            color: 'var(--cream)',
          }}
        >
          <SplitText delay={0.04} stagger={0.03} duration={0.6} as="span" inView>
            Start hunting
          </SplitText>{' '}
          <span className="serif-italic">
            <SplitText delay={0.18} stagger={0.03} duration={0.6} as="span" italic inView>
              today.
            </SplitText>
          </span>
        </h2>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 md:mt-16 flex flex-col items-center gap-6"
        >
          <a
            href="/auth/signup"
            className="rounded-full group relative overflow-hidden inline-block"
            style={{
              backgroundColor: 'var(--orange)',
              color: 'var(--ink)',
              padding: '18px 36px',
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: '-0.005em',
              minWidth: 220,
            }}
          >
            <span className="relative inline-block overflow-hidden" style={{ height: 22 }}>
              <span
                className="block transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-full"
                style={{ height: 22, lineHeight: '22px' }}
              >
                Start a hunt →
              </span>
              <span
                className="absolute top-0 left-0 right-0 translate-y-full transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0"
                style={{ height: 22, lineHeight: '22px' }}
              >
                Free for 14 days →
              </span>
            </span>
          </a>
          <span className="mono" style={{ color: 'rgba(247,241,229,0.55)' }}>
            no credit card · 14-day trial · cancel anytime
          </span>
        </motion.div>
      </div>
    </section>
  );
}
