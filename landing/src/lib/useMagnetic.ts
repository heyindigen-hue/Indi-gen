import { useEffect, useRef } from 'react';
import { useMotionValue, useSpring } from 'framer-motion';

type Options = {
  strength?: number; // 0..1, fraction of cursor offset to translate
  radius?: number; // px halo around element
  stiffness?: number;
  damping?: number;
};

export function useMagnetic<T extends HTMLElement = HTMLElement>(
  opts: Options = {}
) {
  const { strength = 0.3, radius = 60, stiffness = 150, damping = 15 } = opts;
  const ref = useRef<T | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness, damping });
  const sy = useSpring(y, { stiffness, damping });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (matchMedia('(pointer: coarse)').matches) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      const halo = Math.max(rect.width, rect.height) / 2 + radius;
      if (dist < halo) {
        x.set(dx * strength);
        y.set(dy * strength);
      } else {
        x.set(0);
        y.set(0);
      }
    };
    const onLeave = () => {
      x.set(0);
      y.set(0);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
    };
  }, [strength, radius, x, y]);

  return { ref, x: sx, y: sy };
}
