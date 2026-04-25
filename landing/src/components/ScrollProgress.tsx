import { motion, useScroll } from 'framer-motion';

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] z-[95] pointer-events-none"
      style={{
        scaleX: scrollYProgress,
        transformOrigin: 0,
        backgroundColor: 'var(--orange)',
        willChange: 'transform',
      }}
      aria-hidden
    />
  );
}
