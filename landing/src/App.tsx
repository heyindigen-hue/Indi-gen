import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Nav from './components/Nav';
import Hero from './components/Hero';
import Stats from './components/Stats';
import Features from './components/Features';
import IllustrationShowcase from './components/IllustrationShowcase';
import HowItWorks from './components/HowItWorks';
import Pricing from './components/Pricing';
import Testimonial from './components/Testimonial';
import FAQ from './components/FAQ';
import CTAStrip from './components/CTAStrip';
import Footer from './components/Footer';

export default function App() {
  const [curtainDone, setCurtainDone] = useState(false);
  const [showCurtain] = useState(() => {
    try {
      return !sessionStorage.getItem('lh-curtain');
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!showCurtain) {
      setCurtainDone(true);
      return;
    }
    const t = setTimeout(() => {
      try {
        sessionStorage.setItem('lh-curtain', '1');
      } catch {
        // ignore
      }
    }, 900);
    return () => clearTimeout(t);
  }, [showCurtain]);

  return (
    <div className="min-h-screen bg-cream text-ink overflow-x-hidden">
      <AnimatePresence onExitComplete={() => setCurtainDone(true)}>
        {showCurtain && !curtainDone && (
          <motion.div
            key="curtain"
            className="fixed inset-0 bg-cream z-[9999] origin-bottom"
            initial={{ scaleY: 1 }}
            exit={{
              scaleY: 0,
              transition: { duration: 0.85, ease: [0.76, 0, 0.24, 1] },
            }}
          />
        )}
      </AnimatePresence>

      <Nav />

      <main>
        <Hero />
        <Stats />
        <Features />
        <IllustrationShowcase />
        <HowItWorks />
        <Pricing />
        <Testimonial />
        <FAQ />
        <CTAStrip />
      </main>

      <Footer />
    </div>
  );
}
