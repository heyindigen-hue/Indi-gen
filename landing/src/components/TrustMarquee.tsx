import { motion, useReducedMotion } from 'framer-motion';

const TEAMS = [
  'Loom & Co',
  'Northstar',
  'Granular',
  'Slate Studio',
  'Hearthstone',
  'Pivot Mfg',
  'Helix Health',
  'Maple Group',
  'Beacon Labs',
  'Acme Threads',
];

export default function TrustMarquee() {
  const reduce = useReducedMotion();
  return (
    <section
      className="w-full border-y"
      style={{
        backgroundColor: 'var(--cream)',
        borderColor: 'var(--line)',
        paddingBlock: 'var(--section-y-tight)',
      }}
    >
      <div
        className="mb-6 max-w-[1600px] mx-auto"
        style={{ paddingInline: 'var(--section-x)' }}
      >
        <span className="mono" style={{ color: 'var(--ash)' }}>
          TEAMS HUNTING WITH LEADHANGOVER
        </span>
      </div>
      <div
        className="relative overflow-hidden"
        style={{
          maskImage:
            'linear-gradient(90deg, transparent 0, #000 6%, #000 94%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(90deg, transparent 0, #000 6%, #000 94%, transparent 100%)',
        }}
      >
        <motion.div
          className="flex gap-12 items-center"
          style={{ width: 'max-content' }}
          animate={reduce ? undefined : { x: [0, -1400] }}
          transition={reduce ? undefined : { duration: 30, repeat: Infinity, ease: 'linear' }}
          whileHover={{ x: 0 }}
        >
          {[...TEAMS, ...TEAMS, ...TEAMS].map((t, i) => (
            <div key={i} className="flex items-center gap-12 shrink-0">
              <span
                className="font-sans"
                style={{
                  fontSize: 22,
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: 'var(--ink)',
                  whiteSpace: 'nowrap',
                }}
              >
                {t}
              </span>
              <span
                className="block w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: 'var(--ash)', opacity: 0.5 }}
              />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
