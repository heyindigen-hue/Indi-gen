import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function CustomCursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 500, damping: 40, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 500, damping: 40, mass: 0.5 });

  const [hover, setHover] = useState(false);
  const [label, setLabel] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (matchMedia('(pointer: coarse)').matches) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setEnabled(true);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const onMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      const linkLike = t.closest('a, button, [data-cursor]');
      if (linkLike) {
        const lbl = (linkLike as HTMLElement).dataset.cursorLabel ?? null;
        setHover(true);
        setLabel(lbl);
      } else {
        setHover(false);
        setLabel(null);
      }
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
    <motion.div
      ref={ref}
      className="pointer-events-none fixed top-0 left-0 z-[9998]"
      style={{ x: sx, y: sy }}
    >
      <motion.div
        className="rounded-full"
        style={{
          translateX: '-50%',
          translateY: '-50%',
          mixBlendMode: 'difference',
        }}
        animate={{
          width: label ? 88 : hover ? 56 : 12,
          height: label ? 88 : hover ? 56 : 12,
          backgroundColor: hover ? 'transparent' : '#F4F1EA',
          borderColor: '#F4F1EA',
          borderWidth: hover ? 1 : 0,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      >
        {label && (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-mono-brand text-[10px] uppercase tracking-[0.12em] text-[#F4F1EA]">
              {label}
            </span>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
