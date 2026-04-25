import { useEffect, useRef } from 'react';

type CharState = {
  el: HTMLElement;
  baseX: number;
  baseY: number;
  curX: number;
  curY: number;
  vX: number;
  vY: number;
  tX: number;
  tY: number;
  phase: number;
};

/**
 * Char-level force field. Pass the container element ref and a CSS selector for chars.
 * Within `radius` of cursor, each char is pushed along the cursor->char vector.
 * Springs naturally back when cursor leaves. Plus subtle idle drift per char.
 */
export function useForceField<T extends HTMLElement = HTMLElement>(opts?: {
  radius?: number;
  strength?: number;
  selector?: string;
  stiffness?: number;
  damping?: number;
  idle?: boolean;
  enabled?: boolean;
}) {
  const radius = opts?.radius ?? 180;
  const strength = opts?.strength ?? 18;
  const selector = opts?.selector ?? '.char';
  const stiffness = opts?.stiffness ?? 0.18;
  const damping = opts?.damping ?? 0.78;
  const idle = opts?.idle ?? true;
  const enabled = opts?.enabled ?? true;

  const containerRef = useRef<T | null>(null);
  const cursorRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    if (!enabled) return;
    const el = containerRef.current;
    if (!el) return;
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    let chars: CharState[] = [];

    const collect = () => {
      const charEls = Array.from(el.querySelectorAll<HTMLElement>(selector));
      chars = charEls.map((charEl, i) => {
        // reset transform to read true layout position
        charEl.style.transform = '';
        const rect = charEl.getBoundingClientRect();
        return {
          el: charEl,
          baseX: rect.left + rect.width / 2 + window.scrollX,
          baseY: rect.top + rect.height / 2 + window.scrollY,
          curX: 0,
          curY: 0,
          vX: 0,
          vY: 0,
          tX: 0,
          tY: 0,
          phase: Math.random() * Math.PI * 2 + i * 0.15,
        };
      });
    };

    const loop = (now: number) => {
      const cx = cursorRef.current.x + window.scrollX;
      const cy = cursorRef.current.y + window.scrollY;
      const t = now * 0.001;
      for (const c of chars) {
        const dx = cx - c.baseX;
        const dy = cy - c.baseY;
        const dist = Math.hypot(dx, dy);
        let targetX = 0;
        let targetY = 0;
        if (dist < radius && dist > 0.5) {
          const force = (1 - dist / radius) * strength;
          targetX = (dx / dist) * force;
          targetY = (dy / dist) * force;
        }
        // idle breath drift: small per-char vertical bob
        if (idle) {
          targetY += Math.sin(t * 0.9 + c.phase) * 1.4;
        }
        c.tX = targetX;
        c.tY = targetY;
        // critical-damped spring towards target
        const ax = (c.tX - c.curX) * stiffness - c.vX * damping;
        const ay = (c.tY - c.curY) * stiffness - c.vY * damping;
        c.vX += ax;
        c.vY += ay;
        c.curX += c.vX;
        c.curY += c.vY;
        c.el.style.transform = `translate3d(${c.curX.toFixed(2)}px, ${c.curY.toFixed(2)}px, 0)`;
      }
      raf = requestAnimationFrame(loop);
    };

    const onMove = (e: MouseEvent) => {
      cursorRef.current.x = e.clientX;
      cursorRef.current.y = e.clientY;
    };
    const onLeave = () => {
      cursorRef.current.x = -9999;
      cursorRef.current.y = -9999;
    };
    const onResize = () => {
      collect();
    };

    // initial collect after fonts may settle
    const t1 = setTimeout(collect, 50);
    const t2 = setTimeout(collect, 600);

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);
    window.addEventListener('resize', onResize);

    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('resize', onResize);
      clearTimeout(t1);
      clearTimeout(t2);
      // reset transforms
      for (const c of chars) {
        c.el.style.transform = '';
      }
    };
  }, [radius, strength, selector, stiffness, damping, idle, enabled]);

  return containerRef;
}
