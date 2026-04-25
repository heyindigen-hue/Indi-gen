import { motion } from 'framer-motion';

interface FlowerMarkProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

const PETAL_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

export default function FlowerMark({ size = 40, className = '', animated = false }: FlowerMarkProps) {
  const containerVariants = {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.07 },
    },
  };

  const petalVariants = {
    hidden: { scale: 0.3, opacity: 0, rotate: -15 },
    show: {
      scale: 1,
      opacity: 1,
      rotate: 0,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    },
  };

  if (!animated) {
    return (
      <svg width={size} height={size} viewBox="0 0 80 80" fill="none" className={className}>
        <g transform="translate(40,40)">
          {PETAL_ANGLES.map((angle, i) => (
            <ellipse
              key={angle}
              cx="0"
              cy="-22"
              rx="9"
              ry="18"
              fill={i % 2 === 0 ? '#FF4716' : '#C8553D'}
              opacity={i % 2 === 0 ? 0.92 : 0.85}
              transform={`rotate(${angle})`}
            />
          ))}
          <circle cx="0" cy="0" r="9" fill="#FF4716" />
          <circle cx="0" cy="0" r="5" fill="#FAF7F2" />
        </g>
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" className={className}>
      <motion.g
        transform="translate(40,40)"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {PETAL_ANGLES.map((angle, i) => (
          <motion.ellipse
            key={angle}
            cx="0"
            cy="-22"
            rx="9"
            ry="18"
            fill={i % 2 === 0 ? '#FF4716' : '#C8553D'}
            opacity={i % 2 === 0 ? 0.92 : 0.85}
            transform={`rotate(${angle})`}
            variants={petalVariants}
          />
        ))}
        <motion.circle
          cx="0"
          cy="0"
          r="9"
          fill="#FF4716"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.6, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.circle
          cx="0"
          cy="0"
          r="5"
          fill="#FAF7F2"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.7, duration: 0.3 }}
        />
      </motion.g>

      {/* Idle gentle rotation overlay */}
      <motion.g
        transform="translate(40,40)"
        animate={{ rotate: [0, 1, -1, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <circle cx="0" cy="0" r="0" fill="none" />
      </motion.g>
    </svg>
  );
}
