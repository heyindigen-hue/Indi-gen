import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

interface CurtainProps {
  /** The color that ENDS up showing on top after the curtain pulls. */
  reveal: 'cream' | 'ink';
}

/**
 * 60vh slab between modules. Starts as the previous module's color,
 * a clip-path inset draws the next color from bottom-up as we scroll
 * through. Hard editorial "turn the page" feel — no springs.
 */
export default function Curtain({ reveal }: CurtainProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const clip = useTransform(
    scrollYProgress,
    [0.2, 0.6],
    ['inset(100% 0 0 0)', 'inset(0% 0 0 0)']
  );
  const baseBg = reveal === 'cream' ? 'var(--ink)' : 'var(--cream)';
  const topBg = reveal === 'cream' ? 'var(--cream)' : 'var(--ink)';
  return (
    <div
      ref={ref}
      className="relative w-full"
      style={{ height: '60vh', backgroundColor: baseBg }}
      aria-hidden
    >
      <motion.div
        className="absolute inset-0"
        style={{ backgroundColor: topBg, clipPath: clip }}
      />
    </div>
  );
}
