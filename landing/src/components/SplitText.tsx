import { motion, useReducedMotion } from 'framer-motion';
import { ReactNode } from 'react';

interface Props {
  children: string;
  className?: string;
  delay?: number;
  stagger?: number;
  duration?: number;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';
  italic?: boolean;
  inView?: boolean;
}

const EASE = [0.22, 1, 0.36, 1] as const;

export default function SplitText({
  children,
  className = '',
  delay = 0,
  stagger = 0.06,
  duration = 0.9,
  as = 'span',
  italic = false,
  inView = false,
}: Props): ReactNode {
  const reduce = useReducedMotion();
  const Tag = as as any;
  const words = children.split(' ');

  if (reduce) {
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <Tag className={className} aria-label={children}>
      {words.map((w, i) => (
        <span className="word-mask" key={i} aria-hidden="true">
          <motion.span
            initial={{ y: '110%', rotate: italic ? 2 : 0 }}
            {...(inView
              ? { whileInView: { y: 0, rotate: 0 }, viewport: { once: true, margin: '-12%' } }
              : { animate: { y: 0, rotate: 0 } })}
            transition={{ duration, ease: EASE, delay: delay + i * stagger }}
            style={{ display: 'inline-block' }}
          >
            {w}
            {i !== words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
