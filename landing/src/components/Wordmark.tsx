import { motion, useScroll, useSpring, useTransform, useVelocity } from 'framer-motion';
import { useForceField } from '../lib/useForceField';

export default function Wordmark() {
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const skewRaw = useTransform(velocity, [-3000, 3000], [-8, 8]);
  const skewY = useSpring(skewRaw, { stiffness: 80, damping: 14 });
  const xOffset = useTransform(velocity, [-3000, 3000], [-12, 12]);
  const xs = useSpring(xOffset, { stiffness: 80, damping: 14 });

  const ref = useForceField<HTMLDivElement>({
    radius: 220,
    strength: 24,
    selector: '.wm-char',
    enabled: true,
  });

  const text = 'LEADHANGOVER';

  return (
    <section className="relative overflow-hidden py-24 md:py-32" style={{ minHeight: '90vh', display: 'flex', alignItems: 'center' }}>
      <div className="w-full relative">
        {/* echo */}
        <motion.div
          aria-hidden
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ skewY, x: xs, mixBlendMode: 'difference' }}
        >
          <span
            className="font-display font-medium leading-none tracking-[-0.05em] text-[#FF5A1F] whitespace-nowrap"
            style={{ fontSize: 'clamp(120px, 28vw, 480px)', transform: 'translate(4px, 4px)' }}
          >
            {text}
          </span>
        </motion.div>

        <motion.div
          ref={ref}
          className="relative flex items-center justify-center force-field"
          style={{ skewY }}
        >
          <span
            className="font-display font-medium leading-none tracking-[-0.05em] text-[#14140F] whitespace-nowrap select-none"
            style={{ fontSize: 'clamp(120px, 28vw, 480px)' }}
            aria-label={text}
          >
            {text.split('').map((ch, i) => (
              <span
                key={i}
                className="wm-char inline-block"
                style={{ willChange: 'transform' }}
              >
                {ch}
              </span>
            ))}
          </span>
        </motion.div>
      </div>
    </section>
  );
}
