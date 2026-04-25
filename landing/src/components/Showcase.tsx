import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

const SLIDES = [
  {
    eyebrow: '[ DASHBOARD ]',
    title: 'A morning briefing, not an overflowing inbox.',
    body: 'Every lead landed overnight is scored, summarized and ranked before you open the app.',
    ui: 'dashboard' as const,
  },
  {
    eyebrow: '[ LEAD DETAIL ]',
    title: 'Every signal we used, in plain English.',
    body: 'See why Claude scored them a 9.2 — the post, the comment, the role change — without leaving the lead.',
    ui: 'detail' as const,
  },
  {
    eyebrow: '[ OUTREACH ]',
    title: 'A draft worth sending. Or a one-click rewrite.',
    body: "Voice-matched first messages with a track record of replies. Approve, edit, or skip.",
    ui: 'outreach' as const,
  },
];

export default function Showcase() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });
  const x = useTransform(scrollYProgress, [0, 1], ['0%', '-66.666%']);
  const [active, setActive] = useState(0);

  useEffect(() => {
    return scrollYProgress.on('change', (v) => {
      const idx = Math.min(2, Math.max(0, Math.floor(v * 3 - 0.001)));
      setActive(idx);
    });
  }, [scrollYProgress]);

  return (
    <section id="showcase" ref={ref} className="relative" style={{ height: '300vh' }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="absolute top-8 md:top-12 left-6 md:left-10 right-6 md:right-10 flex items-center justify-between z-10">
          <div className="font-mono-brand text-[12px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">
            [ INSIDE THE PRODUCT // 02 ]
          </div>
          <div className="flex items-center gap-1.5">
            {SLIDES.map((_, i) => (
              <span
                key={i}
                className="h-px transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  width: i === active ? 56 : 16,
                  backgroundColor: i === active ? '#14140F' : 'rgba(20,20,15,0.25)',
                }}
              />
            ))}
          </div>
        </div>
        <motion.div className="flex h-full" style={{ width: '300%', x }}>
          {SLIDES.map((slide, i) => (
            <Slide key={i} slide={slide} active={active === i} index={i} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function Slide({ slide, active, index }: { slide: typeof SLIDES[number]; active: boolean; index: number }) {
  const captionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(captionRef, { once: false, amount: 0.4 });
  return (
    <div className="w-1/3 h-full flex items-center px-6 md:px-16 pt-32 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 w-full max-w-[1500px] mx-auto items-center">
        <div className="order-2 md:order-1">
          <DeviceFrame ui={slide.ui} active={active} />
        </div>
        <div ref={captionRef} className="order-1 md:order-2">
          <div className="font-mono-brand text-[12px] uppercase tracking-[0.12em] text-[var(--ink-soft)] mb-4">
            {slide.eyebrow} <span className="text-[var(--accent)]">// 0{index + 1}</span>
          </div>
          <h3 className="text-h2 font-display max-w-[14ch] mb-6">{slide.title}</h3>
          <Typewriter text={slide.body} active={active && inView} />
        </div>
      </div>
    </div>
  );
}

function Typewriter({ text, active }: { text: string; active: boolean }) {
  const [out, setOut] = useState('');
  useEffect(() => {
    if (!active) {
      setOut('');
      return;
    }
    let i = 0;
    const t = setInterval(() => {
      i++;
      setOut(text.slice(0, i));
      if (i >= text.length) clearInterval(t);
    }, 22);
    return () => clearInterval(t);
  }, [text, active]);
  return (
    <p className="font-mono-brand text-[14px] leading-[1.6] max-w-[42ch] text-[var(--ink)]">
      {out}
      {out.length < text.length && <span className="inline-block w-[7px] h-[12px] bg-[var(--ink)] ml-0.5 align-middle animate-pulse" />}
    </p>
  );
}

function DeviceFrame({ ui, active }: { ui: 'dashboard' | 'detail' | 'outreach'; active: boolean }) {
  return (
    <motion.div
      className="rounded-2xl bg-[#14140F] p-3 shadow-[0_30px_80px_-40px_rgba(20,20,15,0.5)]"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: active ? 1 : 0.6, y: active ? 0 : 30 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-center gap-1.5 px-2 py-2">
        <span className="w-2 h-2 rounded-full bg-[rgba(255,255,255,0.18)]" />
        <span className="w-2 h-2 rounded-full bg-[rgba(255,255,255,0.18)]" />
        <span className="w-2 h-2 rounded-full bg-[rgba(255,255,255,0.18)]" />
        <span className="ml-3 font-mono-brand text-[9px] tracking-[0.12em] uppercase text-[rgba(244,241,234,0.4)]">
          leadhangover.com/{ui}
        </span>
      </div>
      <div className="rounded-xl bg-[#1B1B16] overflow-hidden aspect-[4/3] relative">
        {ui === 'dashboard' && <UIDashboard active={active} />}
        {ui === 'detail' && <UIDetail active={active} />}
        {ui === 'outreach' && <UIOutreach active={active} />}
      </div>
    </motion.div>
  );
}

function UIDashboard({ active }: { active: boolean }) {
  return (
    <div className="absolute inset-0 p-5 flex flex-col gap-3 text-[#F4F1EA]">
      <div className="flex items-center justify-between">
        <div className="font-mono-brand text-[10px] uppercase tracking-[0.12em] opacity-50">[ TODAY // 47 NEW ]</div>
        <div className="font-mono-brand text-[10px] opacity-50">8:14 AM</div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {['12', '47', '9.1'].map((n, i) => (
          <motion.div
            key={i}
            className="bg-[rgba(244,241,234,0.06)] rounded-lg px-3 py-2"
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: active ? 0 : 16, opacity: active ? 1 : 0 }}
            transition={{ delay: 0.2 + i * 0.08, duration: 0.4 }}
          >
            <div className="font-display text-[18px] font-medium">{n}</div>
            <div className="font-mono-brand text-[8px] opacity-50 uppercase tracking-[0.12em]">
              {['qualified', 'reviewed', 'avg score'][i]}
            </div>
          </motion.div>
        ))}
      </div>
      <div className="flex-1 flex flex-col gap-1.5 overflow-hidden">
        {['Sarah Chen', 'Raj Patel', 'Maya Singh', 'Daniel Okafor', 'Aiko Tanaka'].map((n, i) => (
          <motion.div
            key={n}
            className="flex items-center justify-between bg-[rgba(244,241,234,0.04)] rounded-md px-3 py-2"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: active ? 0 : -20, opacity: active ? 1 : 0 }}
            transition={{ delay: 0.4 + i * 0.06, duration: 0.4 }}
          >
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-[rgba(244,241,234,0.18)]" />
              <span className="font-display text-[11px]">{n}</span>
            </div>
            <span className="font-mono-brand text-[9px] text-[#FF5A1F]">9.{i + 1}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function UIDetail({ active }: { active: boolean }) {
  return (
    <div className="absolute inset-0 p-5 flex gap-3 text-[#F4F1EA]">
      <div className="w-[40%] flex flex-col gap-2">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: active ? 1 : 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[rgba(244,241,234,0.06)] rounded-lg p-3"
        >
          <div className="w-10 h-10 rounded-full bg-[rgba(244,241,234,0.18)] mb-2" />
          <div className="font-display text-[13px]">Sarah Chen</div>
          <div className="font-mono-brand text-[9px] opacity-50 uppercase tracking-[0.12em] mt-0.5">DIR / SALES</div>
          <div className="mt-3 flex items-center gap-1">
            <span className="font-mono-brand text-[20px] font-medium">9.2</span>
            <span className="font-mono-brand text-[9px] opacity-50">/ 10</span>
          </div>
        </motion.div>
      </div>
      <div className="flex-1 flex flex-col gap-1.5">
        <div className="font-mono-brand text-[9px] uppercase tracking-[0.12em] opacity-50 mb-1">[ SIGNAL TRAIL ]</div>
        {[
          'Posted: "we just doubled qualified pipeline"',
          'Promoted to Director 28 days ago',
          'Engaged 4× w/ competitor content',
          'ICP match: SaaS, 50–200, US',
        ].map((s, i) => (
          <motion.div
            key={i}
            className="flex items-start gap-2 bg-[rgba(244,241,234,0.04)] rounded-md px-2.5 py-1.5"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: active ? 0 : 20, opacity: active ? 1 : 0 }}
            transition={{ delay: 0.4 + i * 0.07, duration: 0.4 }}
          >
            <span className="text-[#FF5A1F] font-mono-brand text-[10px] mt-px">→</span>
            <span className="font-mono-brand text-[9px] tracking-[0.02em] leading-[1.5]">{s}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function UIOutreach({ active }: { active: boolean }) {
  return (
    <div className="absolute inset-0 p-5 flex flex-col gap-2 text-[#F4F1EA]">
      <div className="font-mono-brand text-[9px] uppercase tracking-[0.12em] opacity-50 mb-1">[ DRAFT // SARAH CHEN ]</div>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: active ? 0 : 20, opacity: active ? 1 : 0 }}
        transition={{ delay: 0.25, duration: 0.5 }}
        className="bg-[rgba(244,241,234,0.06)] rounded-lg p-3 flex-1 font-display text-[12px] leading-[1.55]"
      >
        Hey Sarah —<br />
        Saw your post on doubling qualified pipeline and the new dir role. Congrats.
        <br /><br />
        Curious how you're sourcing for that new motion? We're testing something with another team in the same range; happy to share what's working if useful.
        <br /><br />
        — A.
      </motion.div>
      <div className="flex gap-2 mt-1">
        {['Approve', 'Rewrite', 'Skip'].map((b, i) => (
          <motion.button
            key={b}
            className={`flex-1 rounded-full font-mono-brand text-[10px] uppercase tracking-[0.12em] py-2 ${i === 0 ? 'bg-[#FF5A1F] text-[#14140F]' : 'border border-[rgba(244,241,234,0.2)]'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: active ? 1 : 0 }}
            transition={{ delay: 0.7 + i * 0.08 }}
          >
            {b}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
