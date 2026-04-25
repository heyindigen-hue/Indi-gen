import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';

const EASE = [0.16, 1, 0.3, 1] as const;

interface Node {
  id: string;
  label: string;
  detail: string;
  illustration: () => JSX.Element;
}

const NODES: Node[] = [
  {
    id: 'icp',
    label: 'ICP',
    detail: 'Tell us who you sell to. We turn your sentence into a structured brief — industry, geo, stage, signals.',
    illustration: () => (
      <svg viewBox="0 0 80 80" fill="none">
        <circle cx="40" cy="40" r="22" stroke="var(--ink)" strokeWidth="1.2" />
        <circle cx="40" cy="40" r="12" stroke="var(--ink)" strokeWidth="1.2" />
        <circle cx="40" cy="40" r="3" fill="var(--orange)" />
      </svg>
    ),
  },
  {
    id: 'scrape',
    label: 'Scrape',
    detail: 'Every twelve hours we sweep LinkedIn for posts, comments and hashtags that match your brief.',
    illustration: () => (
      <svg viewBox="0 0 80 80" fill="none">
        <path d="M16 24 H64 M16 40 H64 M16 56 H64" stroke="var(--ink)" strokeWidth="1.2" strokeDasharray="3 3" />
        <circle cx="22" cy="24" r="2.5" fill="var(--orange)" />
        <circle cx="46" cy="40" r="2.5" fill="var(--orange)" />
        <circle cx="58" cy="56" r="2.5" fill="var(--orange)" />
      </svg>
    ),
  },
  {
    id: 'enrich',
    label: 'Enrich',
    detail: 'SignalHire fills in the gaps — verified email, mobile number, alternative channels.',
    illustration: () => (
      <svg viewBox="0 0 80 80" fill="none">
        <circle cx="40" cy="40" r="22" stroke="var(--ink)" strokeWidth="1.2" />
        <path d="M30 36 L50 36 M30 44 L46 44" stroke="var(--ink)" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="58" cy="22" r="6" fill="var(--orange)" />
      </svg>
    ),
  },
  {
    id: 'score',
    label: 'Score',
    detail: 'Claude reads each lead and assigns intent + confidence. Buyers float to the top, noise sinks.',
    illustration: () => (
      <svg viewBox="0 0 80 80" fill="none">
        <path d="M16 56 L32 40 L48 48 L64 24" stroke="var(--ink)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="64" cy="24" r="3.5" fill="var(--orange)" />
      </svg>
    ),
  },
  {
    id: 'outreach',
    label: 'Outreach',
    detail: 'Drafts arrive in your inbox in your voice. WhatsApp, email, LinkedIn — your pick. You hit send.',
    illustration: () => (
      <svg viewBox="0 0 80 80" fill="none">
        <path d="M14 30 L66 22 L46 58 L40 42 L14 30 Z" stroke="var(--ink)" strokeWidth="1.2" strokeLinejoin="round" />
        <circle cx="42" cy="40" r="3" fill="var(--orange)" />
      </svg>
    ),
  },
];

export default function WorkflowDiagram() {
  const [active, setActive] = useState<string | null>(NODES[0].id);
  const reduce = useReducedMotion();
  const activeNode = NODES.find((n) => n.id === active) ?? NODES[0];

  return (
    <section
      id="story"
      className="relative w-full"
      style={{ backgroundColor: 'var(--cream)' }}
    >
      <div className="section-rhythm max-w-[1600px] mx-auto">
        <div className="mb-14 md:mb-20 max-w-[42ch]">
          <div className="mono mb-4" style={{ color: 'var(--ash)' }}>
            WORKFLOW / FIVE STEPS
          </div>
          <h2
            className="serif"
            style={{
              fontSize: 'clamp(40px, 6vw, 96px)',
              lineHeight: 1.05,
              letterSpacing: '-0.018em',
              fontWeight: 300,
            }}
          >
            How it actually <span className="serif-italic">works.</span>
          </h2>
        </div>

        {/* Node row */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-15%' }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } },
          }}
          className="relative"
        >
          {/* Dashed connector line behind nodes */}
          <svg
            className="hidden md:block absolute inset-0 w-full pointer-events-none"
            style={{ height: 110 }}
            viewBox="0 0 1000 110"
            preserveAspectRatio="none"
          >
            <motion.path
              d="M 80 55 L 920 55"
              stroke="var(--ink)"
              strokeWidth="1.2"
              strokeDasharray="6 6"
              fill="none"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true, margin: '-15%' }}
              transition={{ duration: reduce ? 0 : 0.9, ease: EASE, delay: 0.15 }}
            />
          </svg>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-y-10 gap-x-4 relative">
            {NODES.map((n, i) => (
              <motion.button
                key={n.id}
                onClick={() => setActive(n.id)}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.5, ease: EASE }}
                whileHover={{ y: -4 }}
                className="flex flex-col items-center gap-3 group"
                style={{ cursor: 'pointer' }}
              >
                <motion.div
                  className="rounded-full flex items-center justify-center relative"
                  animate={{
                    backgroundColor: active === n.id ? 'var(--paper)' : 'var(--cream)',
                  }}
                  transition={{ duration: 0.3, ease: EASE }}
                  style={{
                    width: 110,
                    height: 110,
                    border: '1px solid var(--line)',
                  }}
                >
                  {active === n.id && (
                    <motion.span
                      layoutId="flow-ring"
                      className="absolute inset-0 rounded-full"
                      style={{ border: '1.5px solid var(--orange)' }}
                      transition={{ duration: 0.35, ease: EASE }}
                    />
                  )}
                  <div style={{ width: 56, height: 56 }}>{n.illustration()}</div>
                </motion.div>
                <div className="mono" style={{ color: 'var(--ash)' }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div
                  className="serif"
                  style={{
                    fontSize: 22,
                    fontWeight: 300,
                    letterSpacing: '-0.012em',
                    color: 'var(--ink)',
                  }}
                >
                  {n.label}
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Detail panel */}
        <div className="mt-14 md:mt-20 min-h-[140px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeNode.id}
              layoutId="flow-detail"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="rounded-3xl flex flex-col md:flex-row items-start gap-8 md:gap-12"
              style={{
                backgroundColor: 'var(--paper)',
                border: '1px solid var(--line)',
                padding: '32px 36px',
              }}
            >
              <div
                className="rounded-2xl shrink-0"
                style={{
                  width: 120,
                  height: 120,
                  backgroundColor: 'var(--cream)',
                  border: '1px solid var(--line)',
                }}
              >
                <div style={{ width: 120, height: 120, padding: 24 }}>
                  {activeNode.illustration()}
                </div>
              </div>
              <div className="flex-1">
                <div className="mono mb-3" style={{ color: 'var(--ash)' }}>
                  STEP / {activeNode.label.toUpperCase()}
                </div>
                <p
                  className="serif"
                  style={{
                    fontSize: 'clamp(22px, 2vw, 32px)',
                    fontWeight: 300,
                    letterSpacing: '-0.012em',
                    lineHeight: 1.3,
                    maxWidth: '46ch',
                  }}
                >
                  {activeNode.detail}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
