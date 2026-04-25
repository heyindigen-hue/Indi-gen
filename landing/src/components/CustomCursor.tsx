import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function CustomCursor() {
  const x = useMotionValue(-200);
  const y = useMotionValue(-200);
  const ringX = useSpring(x, { stiffness: 200, damping: 30, mass: 0.6 });
  const ringY = useSpring(y, { stiffness: 200, damping: 30, mass: 0.6 });

  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState<'idle' | 'link' | 'drag'>('idle');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (matchMedia('(pointer: coarse)').matches) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setEnabled(true);
    document.documentElement.classList.add('has-custom-cursor');
    return () => document.documentElement.classList.remove('has-custom-cursor');
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const onMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      const dragZone = t.closest('[data-cursor="drag"]');
      if (dragZone) {
        setMode('drag');
        return;
      }
      const linkLike = t.closest('a, button, [data-cursor="link"]');
      setMode(linkLike ? 'link' : 'idle');
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseover', onOver);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onOver);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  return (
    <>
      {/* Inner dot — exact pointer position, 8px ink */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-[9999]"
        style={{
          x,
          y,
          width: 8,
          height: 8,
          borderRadius: 999,
          backgroundColor: 'var(--ink)',
          translateX: '-50%',
          translateY: '-50%',
          mixBlendMode: 'difference',
        }}
        animate={{ opacity: mode === 'drag' ? 0 : 1, scale: mode === 'link' ? 0.5 : 1 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      />
      {/* Outer ring — spring lag */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-[9998]"
        style={{ x: ringX, y: ringY, translateX: '-50%', translateY: '-50%' }}
      >
        <motion.div
          className="rounded-full flex items-center justify-center"
          animate={{
            width: mode === 'drag' ? 76 : mode === 'link' ? 48 : 32,
            height: mode === 'drag' ? 36 : mode === 'link' ? 48 : 32,
            borderRadius: mode === 'drag' ? 999 : 999,
            backgroundColor: mode === 'drag' ? 'var(--cream)' : 'transparent',
            borderWidth: mode === 'drag' ? 0 : 1,
            borderColor: 'var(--ink)',
          }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          {mode === 'drag' && (
            <span
              className="mono"
              style={{ color: 'var(--ink)', fontSize: 10, letterSpacing: '0.14em' }}
            >
              drag
            </span>
          )}
        </motion.div>
      </motion.div>
    </>
  );
}
