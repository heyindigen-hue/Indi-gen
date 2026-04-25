import { motion } from 'framer-motion';

interface FlowerMarkProps {
  size?: number;
  className?: string;
  animated?: boolean;
  petalColor?: string;
  centerColor?: string;
}

const PETAL_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

const petalVariants = {
  hidden: { scale: 0.4, rotate: -8, opacity: 0 },
  show: {
    scale: 1,
    rotate: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

export default function FlowerMark({
  size = 32,
  className = '',
  animated = false,
  petalColor = '#14140F',
  centerColor = '#FF5A1F',
}: FlowerMarkProps) {
  if (!animated) {
    return (
      <svg width={size} height={size} viewBox="0 0 80 80" fill="none" className={className} aria-hidden>
        <g transform="translate(40,40)">
          {PETAL_ANGLES.map((angle) => (
            <ellipse
              key={angle}
              cx="0"
              cy="-22"
              rx="6"
              ry="18"
              fill={petalColor}
              transform={`rotate(${angle})`}
            />
          ))}
          <circle cx="0" cy="0" r="6" fill={centerColor} />
        </g>
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" className={className} aria-hidden>
      <motion.g
        transform="translate(40,40)"
        animate={{ rotate: [0, 1, -1, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 0.7 }}
      >
        <motion.g initial="hidden" animate="show" transition={{ staggerChildren: 0.05 } as never}>
          {PETAL_ANGLES.map((angle) => (
            <motion.ellipse
              key={angle}
              cx="0"
              cy="-22"
              rx="6"
              ry="18"
              fill={petalColor}
              transform={`rotate(${angle})`}
              variants={petalVariants}
            />
          ))}
        </motion.g>
        <motion.circle
          cx="0"
          cy="0"
          r="6"
          fill={centerColor}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </motion.g>
    </svg>
  );
}
