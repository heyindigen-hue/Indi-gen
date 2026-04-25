import { useEffect } from 'react';
import Lenis from 'lenis';

let lenisInstance: Lenis | null = null;

export function getLenis(): Lenis | null {
  return lenisInstance;
}

const SNAPPY_EASE = (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t));

export function useLenis() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const small = window.innerWidth < 768;
    if (reduce || small) return;
    if (lenisInstance) return;

    const lenis = new Lenis({
      duration: 0.9,
      lerp: 0.1,
      smoothWheel: true,
      wheelMultiplier: 1,
      easing: SNAPPY_EASE,
    });
    lenisInstance = lenis;

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    document.documentElement.classList.add('lenis');

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisInstance = null;
      document.documentElement.classList.remove('lenis');
    };
  }, []);
}
