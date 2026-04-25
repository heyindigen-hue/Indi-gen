import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useForceField } from '../lib/useForceField';
import MagneticPill from './MagneticPill';

const HEADLINE_WORDS = ['Wake', 'up', 'to', 'better', 'leads.'];

const SUBTITLE_LINES = [
  'We hunt LinkedIn while you sleep,',
  'score every lead with Claude,',
  "and draft outreach that doesn't sound like a bot.",
];

const EYEBROW = '[ LH-001 // LINKEDIN LEAD HUNTING ]';

const TICKER_ITEMS = [
  'Sarah Chen — Director of Sales — qualified 2m ago — added to sequence',
  'Raj Patel — VP Engineering — score 9.2 — DM drafted',
  'Maya Singh — Founder, Acme — match: SaaS+India — outreach sent',
  'Daniel Okafor — Head of RevOps — qualified 4m ago — reviewing',
  'Aiko Tanaka — Director of Growth — score 8.7 — DM drafted',
  'Lukas Bauer — VP Sales — match: B2B+EMEA — outreach sent',
];

export default function Hero() {
  const [eyebrowText, setEyebrowText] = useState('');
  const [showHeadline, setShowHeadline] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [showCTA, setShowCTA] = useState(false);
  const [showTicker, setShowTicker] = useState(false);

  const headlineRef = useForceField<HTMLHeadingElement>({
    radius: 180,
    strength: 18,
    selector: '.char',
    enabled: showHeadline,
  });

  // Eyebrow typewriter
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setEyebrowText(EYEBROW.slice(0, i));
      if (i >= EYEBROW.length) clearInterval(interval);
    }, 18);
    const t1 = setTimeout(() => setShowHeadline(true), 350);
    const t2 = setTimeout(() => setShowSubtitle(true), 900);
    const t3 = setTimeout(() => setShowCTA(true), 1250);
    const t4 = setTimeout(() => setShowTicker(true), 1400);
    return () => {
      clearInterval(interval);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  return (
    <section
      id="top"
      className="relative pt-36 md:pt-44 pb-12 md:pb-20 px-6 md:px-10 overflow-hidden min-h-screen flex flex-col"
    >
      {/* Eyebrow */}
      <div className="max-w-[1600px] mx-auto w-full">
        <div className="font-mono-brand text-[12px] uppercase tracking-[0.12em] text-[var(--ink-soft)] mb-8 md:mb-12 h-[14px]">
          {eyebrowText}
          <span className="inline-block w-[7px] h-[12px] -mb-px ml-0.5 align-middle bg-[var(--ink)] animate-pulse" />
        </div>
      </div>

      {/* Headline */}
      <div className="max-w-[1600px] mx-auto w-full">
        <h1
          ref={headlineRef}
          className="text-hero font-display text-[#14140F] force-field select-none"
          aria-label={HEADLINE_WORDS.join(' ')}
        >
          {HEADLINE_WORDS.map((word, wi) => (
            <span key={wi} className="word">
              <WordReveal word={word} delay={wi * 0.07} active={showHeadline} />
              {wi < HEADLINE_WORDS.length - 1 && <span className="char">&nbsp;</span>}
            </span>
          ))}
        </h1>
      </div>

      {/* Subtitle + CTA + ticker */}
      <div className="max-w-[1600px] mx-auto w-full mt-10 md:mt-16 flex-1 flex flex-col">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
          <div className="md:col-span-7 lg:col-span-6">
            {SUBTITLE_LINES.map((line, i) => (
              <div key={i} className="overflow-hidden">
                <motion.p
                  className="text-body-l text-[#14140F]"
                  initial={{ y: '110%' }}
                  animate={{ y: showSubtitle ? '0%' : '110%' }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 }}
                >
                  {line}
                </motion.p>
              </div>
            ))}
          </div>
          <div className="md:col-span-5 lg:col-span-4 lg:col-start-9 flex flex-col gap-3 items-start">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: showCTA ? 1 : 0, scale: showCTA ? 1 : 0.92 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <MagneticPill href="/auth/signup" size="lg" cursorLabel="Start">
                Start hunting
              </MagneticPill>
            </motion.div>
            <motion.div
              className="font-mono-brand text-[11px] uppercase tracking-[0.12em] text-[var(--ink-soft)] mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: showCTA ? 1 : 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              [ free for 7 days // no card ]
            </motion.div>
          </div>
        </div>

        {/* Ticker */}
        <motion.div
          className="mt-16 md:mt-20 lg:mt-24 -mx-6 md:-mx-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: showTicker ? 0.6 : 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="border-y border-[var(--line)] py-3.5 overflow-hidden relative">
            <div className="marquee-track">
              {[0, 1].map((dup) => (
                <div key={dup} className="flex items-center gap-12 pr-12 shrink-0" aria-hidden={dup === 1}>
                  <Ticker />
                </div>
              ))}
            </div>
            <style>{`
              .marquee-track { animation: lh-marquee 40s linear infinite; }
              @keyframes lh-marquee {
                from { transform: translateX(0); }
                to { transform: translateX(-50%); }
              }
              @media (prefers-reduced-motion: reduce) {
                .marquee-track { animation: none; }
              }
            `}</style>
          </div>
        </motion.div>
      </div>

      {/* Bottom hint */}
      <div className="max-w-[1600px] mx-auto w-full mt-8 md:mt-12 flex items-center justify-between font-mono-brand text-[11px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">
        <span>↓ Scroll</span>
        <span className="hidden md:inline">[ v1.0 // april 2026 ]</span>
      </div>
    </section>
  );
}

function WordReveal({ word, delay, active }: { word: string; delay: number; active: boolean }) {
  return (
    <span className="inline-block overflow-hidden align-bottom" style={{ paddingBottom: '0.08em' }}>
      <motion.span
        className="inline-block"
        initial={{ y: '110%' }}
        animate={{ y: active ? '0%' : '110%' }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay }}
      >
        {word.split('').map((ch, i) => (
          <span key={`${ch}-${i}`} className="char">
            {ch}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

function Ticker() {
  return (
    <>
      {TICKER_ITEMS.map((item, i) => (
        <span key={i} className="font-mono-brand text-[12px] tracking-[0.04em] uppercase whitespace-nowrap text-[var(--ink-soft)]">
          <span className="text-[var(--accent)] mr-3">{'>>>'}</span>
          {item}
        </span>
      ))}
    </>
  );
}
