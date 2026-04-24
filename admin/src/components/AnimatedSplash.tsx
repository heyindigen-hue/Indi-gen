import { motion, AnimatePresence } from 'framer-motion';

interface Props { show: boolean; }

const PETALS = [0, 45, 90, 135, 180, 225, 270, 315];

export function AnimatedSplash({ show }: Props) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="admin-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4, ease: 'easeOut' } }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: '#FAF7F2',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: '24px',
          }}
        >
          <motion.svg
            width="72" height="72" viewBox="0 0 24 24"
            fill="none"
            initial="hidden"
            animate="visible"
          >
            {PETALS.map((angle, i) => (
              <motion.path
                key={angle}
                d="M12 12C10.5 10 10.5 7 12 5.5C13.5 7 13.5 10 12 12"
                stroke="#FF4716"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                transform={`rotate(${angle} 12 12)`}
                variants={{
                  hidden: { opacity: 0, scale: 0 },
                  visible: {
                    opacity: 1,
                    scale: 1,
                    transition: { delay: i * 0.05, duration: 0.25, ease: [0.34, 1.56, 0.64, 1] },
                  },
                }}
              />
            ))}
          </motion.svg>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.3 }}
            style={{
              fontFamily: 'Fraunces, Georgia, serif',
              fontStyle: 'italic',
              fontSize: '20px',
              fontWeight: 600,
              color: '#0B0A08',
              letterSpacing: '-0.02em',
            }}
          >
            LeadHangover
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
