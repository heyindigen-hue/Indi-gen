import {
  motion,
  MotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import { ReactNode, useRef, useState } from 'react';
import SplitText from './SplitText';

const EASE = [0.16, 1, 0.3, 1] as const;

export interface StoryModuleProps {
  number: string;
  eyebrow: string;
  title: string;
  italicTail?: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  theme: 'cream' | 'ink';
  /** Mock receives the current step index (0-2) + a smoothed scrollYProgress. */
  mock: (step: number, progress: MotionValue<number>) => ReactNode;
  id?: string;
}

const SMOOTH_SPRING = { stiffness: 100, damping: 30, restDelta: 0.001 } as const;

export default function StoryModule({
  number,
  eyebrow,
  title,
  italicTail,
  body,
  ctaLabel,
  ctaHref,
  theme,
  mock,
  id,
}: StoryModuleProps) {
  const ref = useRef<HTMLDivElement>(null);
  // Single source of truth — every sub-animation derives from this.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });
  // Smooth out ticker jitter without lagging visibly.
  const smoothProgress = useSpring(scrollYProgress, SMOOTH_SPRING);

  // Stepped phases — three steps across the 140vh of pinned scroll.
  const stepMV = useTransform(smoothProgress, [0.05, 0.4, 0.75, 1], [0, 1, 2, 2]);
  const [step, setStep] = useState(0);
  useMotionValueEvent(stepMV, 'change', (v) => {
    const next = Math.round(v);
    setStep((cur) => (cur === next ? cur : next));
  });

  const isInk = theme === 'ink';
  const bg = isInk ? 'var(--ink)' : 'var(--cream)';
  const fg = isInk ? 'var(--cream)' : 'var(--ink)';
  const muted = isInk ? 'rgba(247,241,229,0.55)' : 'var(--ash)';

  return (
    <section
      ref={ref}
      id={id}
      className="relative w-full"
      style={{ backgroundColor: bg, color: fg, height: '140vh' }}
    >
      <div
        className="sticky top-0 h-screen w-full flex items-center"
        style={{ willChange: 'transform' }}
      >
        <div
          className="max-w-[1600px] mx-auto w-full"
          style={{ paddingInline: 'var(--section-x)' }}
        >
          <div className="grid md:grid-cols-12 gap-8 md:gap-10 items-center">
            {/* Left 40% — copy */}
            <div className="md:col-span-5">
              <div
                className="mono mb-8 md:mb-10 flex items-center gap-3"
                style={{ color: muted }}
              >
                <span style={{ color: fg, fontWeight: 500 }}>{number}</span>
                <span
                  style={{
                    width: 24,
                    height: 1,
                    backgroundColor: muted,
                    display: 'inline-block',
                  }}
                />
                <span>{eyebrow}</span>
              </div>
              <h2
                className="serif"
                style={{
                  fontSize: 'clamp(40px, 6vw, 96px)',
                  lineHeight: 1.05,
                  letterSpacing: '-0.018em',
                  fontWeight: 300,
                  color: fg,
                }}
              >
                <SplitText delay={0} stagger={0.03} duration={0.5} as="span" inView>
                  {title}
                </SplitText>
                {italicTail && (
                  <>
                    <br />
                    <span className="serif-italic">
                      <SplitText
                        delay={0.08}
                        stagger={0.03}
                        duration={0.5}
                        as="span"
                        italic
                        inView
                      >
                        {italicTail}
                      </SplitText>
                    </span>
                  </>
                )}
              </h2>
              <p
                className="mt-8 max-w-[36ch]"
                style={{
                  fontSize: 'clamp(17px, 1.3vw, 21px)',
                  lineHeight: 1.5,
                  color: muted,
                }}
              >
                {body}
              </p>

              <a
                href={ctaHref}
                className="mt-10 inline-flex items-center gap-2 group relative"
                style={{ color: fg, fontSize: 16, fontWeight: 500 }}
              >
                <span className="relative">
                  {ctaLabel}
                  <span
                    className="absolute left-0 -bottom-0.5 h-px w-full origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                    style={{ backgroundColor: fg }}
                  />
                </span>
                <motion.span
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.18, ease: EASE }}
                  style={{ display: 'inline-block' }}
                >
                  →
                </motion.span>
              </a>

              {/* Step indicator */}
              <div className="mt-12 flex items-center gap-2.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-px transition-all duration-300"
                    style={{
                      width: step === i ? 36 : 16,
                      backgroundColor: step === i ? 'var(--orange)' : muted,
                      opacity: step === i ? 1 : 0.4,
                    }}
                  />
                ))}
                <span className="mono ml-3" style={{ color: muted }}>
                  STEP {step + 1} / 3
                </span>
              </div>
            </div>

            {/* Right 60% — mock */}
            <div className="md:col-span-7 relative" style={{ minHeight: 540 }}>
              {mock(step, smoothProgress)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
