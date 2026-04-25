import { motion } from 'framer-motion';

interface FlowerMarkProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

const PETAL_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

const petalVariants = {
  hidden: { scale: 0.4, rotate: -8 },
  show: {
    scale: 1,
    rotate: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

export default function FlowerMark({ size = 40, className = '', animated = false }: FlowerMarkProps) {
  if (!animated) {
    return (
      <svg width={size} height={size} viewBox="0 0 80 80" fill="none" className={className}>
        <g transform="translate(40,40)">
          {PETAL_ANGLES.map((angle) => (
            <ellipse
              key={angle}
              cx="0"
              cy="-22"
              rx="9"
              ry="18"
              fill="#F5E6D3"
              transform={`rotate(${angle})`}
            />
          ))}
          <circle cx="0" cy="0" r="9" fill="#FF4716" />
        </g>
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" className={className}>
      {/* Idle sway wraps the entire group after bloom */}
      <motion.g
        transform="translate(40,40)"
        animate={{ rotate: [0, 1, -1, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 0.7 }}
      >
        {/* Petals bloom with stagger */}
        <motion.g
          initial="hidden"
          animate="show"
          transition={{ staggerChildren: 0.07 } as never}
        >
          {PETAL_ANGLES.map((angle, i) => (
            <motion.ellipse
              key={angle}
              cx="0"
              cy="-22"
              rx="9"
              ry="18"
              fill="#F5E6D3"
              transform={`rotate(${angle})`}
              custom={i}
              variants={petalVariants}
            />
          ))}
        </motion.g>

        {/* Center dot appears after petals */}
        <motion.circle
          cx="0"
          cy="0"
          r="9"
          fill="#FF4716"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.6, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </motion.g>
    </svg>
  );
}
