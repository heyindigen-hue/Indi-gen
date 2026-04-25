import { LazyMotion, domAnimation, AnimatePresence, motion } from 'framer-motion';
import { lazy, Suspense, useEffect, useState } from 'react';
import { useLenis } from './lib/useLenis';

import Nav from './components/Nav';
import Hero from './components/Hero';
import TrustMarquee from './components/TrustMarquee';
import StoryModule from './components/StoryModule';
import Curtain from './components/Curtain';
import EvidenceGallery from './components/EvidenceGallery';
import FeatureGrid from './components/FeatureGrid';
import WorkflowDiagram from './components/WorkflowDiagram';
import Pricing from './components/Pricing';
import Testimonials from './components/Testimonials';
import FAQ from './components/FAQ';
import FinalCTA from './components/FinalCTA';
import Footer from './components/Footer';
import CustomCursor from './components/CustomCursor';
import GrainOverlay from './components/GrainOverlay';
import ScrollProgress from './components/ScrollProgress';

const IntakeMock = lazy(() => import('./components/modules/IntakeMock'));
const HuntMock = lazy(() => import('./components/modules/HuntMock'));
const QualifyMock = lazy(() => import('./components/modules/QualifyMock'));
const SendMock = lazy(() => import('./components/modules/SendMock'));

export default function App() {
  useLenis();
  const [transitionDone, setTransitionDone] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setTransitionDone(true), 420);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <LazyMotion features={domAnimation}>
      <div
        className="min-h-screen relative"
        style={{ backgroundColor: 'var(--cream)', color: 'var(--ink)' }}
      >
        <ScrollProgress />
        <GrainOverlay />
        <CustomCursor />

        <AnimatePresence>{!transitionDone && <PageCurtain />}</AnimatePresence>

        <Nav />

        <main>
          <Hero />
          <TrustMarquee />

          <Suspense fallback={<ModuleFallback theme="cream" />}>
            <StoryModule
              id="story-01"
              number="01"
              eyebrow="INTAKE"
              title="Tell us who"
              italicTail="you sell to."
              body="Pick an industry, drop a phrase, name your geography. We turn it into a hunting brief Claude can read."
              ctaLabel="See an example brief"
              ctaHref="/customer/signup"
              theme="cream"
              mock={(step, progress) => <IntakeMock step={step} progress={progress} />}
            />
          </Suspense>

          <Curtain reveal="ink" />

          <Suspense fallback={<ModuleFallback theme="ink" />}>
            <StoryModule
              id="story-02"
              number="02"
              eyebrow="HUNT"
              title="We scrape"
              italicTail="while you sleep."
              body="Every twelve hours we sweep LinkedIn — posts, comments, hashtags. Filtered hard for buying intent."
              ctaLabel="How the scraper works"
              ctaHref="#story"
              theme="ink"
              mock={(step, progress) => <HuntMock step={step} progress={progress} />}
            />
          </Suspense>

          <Curtain reveal="cream" />

          <Suspense fallback={<ModuleFallback theme="cream" />}>
            <StoryModule
              id="story-03"
              number="03"
              eyebrow="QUALIFY"
              title="Claude reads"
              italicTail="every post."
              body="Buyer? Job seeker? Self-promoter? We tag every lead with intent and a confidence score."
              ctaLabel="See the score model"
              ctaHref="#story"
              theme="cream"
              mock={(step, progress) => <QualifyMock step={step} progress={progress} />}
            />
          </Suspense>

          <Curtain reveal="ink" />

          <Suspense fallback={<ModuleFallback theme="ink" />}>
            <StoryModule
              id="story-04"
              number="04"
              eyebrow="SEND"
              title="Drafts that don't"
              italicTail="sound like a bot."
              body="WhatsApp, email, LinkedIn DM — written in your voice from your replies. You hit send."
              ctaLabel="See a sample sequence"
              ctaHref="#story"
              theme="ink"
              mock={(step, progress) => <SendMock step={step} progress={progress} />}
            />
          </Suspense>

          <Curtain reveal="cream" />

          <EvidenceGallery />
          <FeatureGrid />
          <WorkflowDiagram />
          <Pricing />
          <Testimonials />
          <FAQ />
          <FinalCTA />
        </main>

        <Footer />
      </div>
    </LazyMotion>
  );
}

function ModuleFallback({ theme }: { theme: 'cream' | 'ink' }) {
  return (
    <div
      className="w-full h-screen"
      style={{ backgroundColor: theme === 'cream' ? 'var(--cream)' : 'var(--ink)' }}
    />
  );
}

function PageCurtain() {
  return (
    <motion.div
      key="lh-curtain"
      className="fixed inset-0 z-[9999] flex items-end px-6 md:px-10 pb-8"
      style={{ backgroundColor: 'var(--cream)' }}
      initial={{ clipPath: 'inset(0 0 0 0)' }}
      exit={{
        clipPath: 'inset(0 0 100% 0)',
        transition: { duration: 0.45, ease: [0.65, 0, 0.35, 1] },
      }}
    >
      <span className="mono" style={{ color: 'var(--ash)' }}>
        LEADHANGOVER —
      </span>
    </motion.div>
  );
}
