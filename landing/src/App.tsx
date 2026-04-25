import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Lenis from 'lenis';
import Nav from './components/Nav';
import Hero from './components/Hero';
import Manifesto from './components/Manifesto';
import Features from './components/Features';
import Showcase from './components/Showcase';
import Stats from './components/Stats';
import ProofTicker from './components/ProofTicker';
import Testimonials from './components/Testimonials';
import Pricing from './components/Pricing';
import FAQ from './components/FAQ';
import Wordmark from './components/Wordmark';
import Footer from './components/Footer';
import CustomCursor from './components/CustomCursor';
import GrainOverlay from './components/GrainOverlay';

export default function App() {
  const [transitionDone, setTransitionDone] = useState(false);

  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const small = window.innerWidth < 768;
    if (reduce || small) {
      return;
    }
    const lenis = new Lenis({
      lerp: 0.1,
      duration: 1.2,
      smoothWheel: true,
      wheelMultiplier: 1,
    });
    let raf = 0;
    const tick = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setTransitionDone(true), 700);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] overflow-x-hidden relative">
      <GrainOverlay />
      <CustomCursor />

      {/* Page transition curtain */}
      <AnimatePresence>
        {!transitionDone && <PageCurtain />}
      </AnimatePresence>

      <Nav />

      <main>
        <Hero />
        <Manifesto />
        <Features />
        <Showcase />
        <Stats />
        <ProofTicker />
        <Testimonials />
        <Pricing />
        <FAQ />
        <Wordmark />
      </main>

      <Footer />
    </div>
  );
}

function PageCurtain() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      i = Math.min(100, i + 7);
      setPct(i);
      if (i >= 100) clearInterval(t);
    }, 28);
    return () => clearInterval(t);
  }, []);
  return (
    <motion.div
      key="lh-curtain"
      className="fixed inset-0 z-[9999] bg-[#F4F1EA] flex items-end p-8 md:p-12"
      initial={{ y: 0 }}
      exit={{ y: '-105%', transition: { duration: 0.5, ease: [0.65, 0, 0.35, 1] } }}
    >
      <div className="font-mono-brand text-[12px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">
        [ LOADING / {String(pct).padStart(2, '0')}% ]
      </div>
    </motion.div>
  );
}
