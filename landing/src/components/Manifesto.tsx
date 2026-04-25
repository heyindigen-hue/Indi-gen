import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

const STATES = ["We don't scrape.", "We don't blast.", 'We hunt.'];

export default function Manifesto() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });
  const stateIndex = useTransform(scrollYProgress, [0, 0.33, 0.66, 1], [0, 1, 2, 2]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    return stateIndex.on('change', (v) => {
      const next = Math.min(STATES.length - 1, Math.max(0, Math.floor(v)));
      setActive(next);
    });
  }, [stateIndex]);

  const accent = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section
      id="story"
      ref={ref}
      className="relative"
      style={{ height: '250vh' }}
    >
      <div className="sticky top-0 h-screen flex items-center justify-center px-6 md:px-10 overflow-hidden">
        <BraillePattern />

        {/* Progress line */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-px origin-left"
          style={{ scaleX: accent, backgroundColor: '#FF5A1F' }}
        />

        <div className="relative max-w-[18ch] text-center">
          <div className="font-mono-brand text-[12px] uppercase tracking-[0.12em] text-[var(--ink-soft)] mb-8">
            [ MANIFESTO // 03 ]
          </div>

          <div className="text-h2 font-display text-[#14140F] min-h-[1.2em]" style={{ perspective: '1000px' }}>
            <AnimatePresence mode="popLayout">
              <motion.div
                key={active}
                className="inline-block"
              >
                {STATES[active].split('').map((ch, i) => (
                  <motion.span
                    key={`${active}-${ch}-${i}`}
                    className="inline-block"
                    initial={{ rotateX: -90, opacity: 0 }}
                    animate={{ rotateX: 0, opacity: 1 }}
                    exit={{ rotateX: 90, opacity: 0 }}
                    transition={{
                      duration: 0.45,
                      delay: i * 0.012,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    style={{ display: ch === ' ' ? 'inline' : 'inline-block', whiteSpace: 'pre' }}
                  >
                    {ch}
                  </motion.span>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          <motion.p
            className="mt-10 text-body-l max-w-[32ch] mx-auto text-[var(--ink-soft)]"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          >
            Most outreach tools fire bullets in the dark. We follow tracks, read signals, and only knock when there's a reason to.
          </motion.p>

          <div className="mt-12 flex items-center justify-center gap-2">
            {STATES.map((_, i) => (
              <span
                key={i}
                className="h-px transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  width: i === active ? 32 : 8,
                  backgroundColor: i === active ? '#FF5A1F' : 'rgba(20,20,15,0.2)',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function BraillePattern() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const chars = ['⠁', '⠂', '⠄', '⠈', '⠐', '⠠', '⡀', '⢀'];
    const cell = 32;
    let frame = 0;
    let raf = 0;
    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      ctx.fillStyle = 'rgba(20,20,15,0.06)';
      ctx.font = '14px "JetBrains Mono", monospace';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      const cols = Math.ceil(canvas.offsetWidth / cell);
      const rows = Math.ceil(canvas.offsetHeight / cell);
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const idx = (x * 7 + y * 13 + Math.floor(frame / 15)) % chars.length;
          ctx.fillText(chars[idx], x * cell + cell / 2, y * cell + cell / 2);
        }
      }
    };
    let last = 0;
    const tick = (t: number) => {
      if (t - last > 250) {
        draw();
        last = t;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);
  return <canvas ref={ref} className="absolute inset-0 w-full h-full pointer-events-none" />;
}
