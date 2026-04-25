import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useEffect, useRef, useState, ReactNode, forwardRef } from 'react';

type Props = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'ghost' | 'inverse';
  size?: 'md' | 'lg';
  className?: string;
  caret?: boolean;
  cursorLabel?: string;
};

const MagneticPill = forwardRef<HTMLAnchorElement | HTMLButtonElement, Props>(
  ({ children, href, onClick, variant = 'primary', size = 'md', className = '', caret = true, cursorLabel = 'Open' }, _fwdRef) => {
    const wrapRef = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const sx = useSpring(x, { stiffness: 150, damping: 15 });
    const sy = useSpring(y, { stiffness: 150, damping: 15 });

    const lx = useMotionValue(0);
    const ly = useMotionValue(0);
    const slx = useSpring(lx, { stiffness: 200, damping: 20 });
    const sly = useSpring(ly, { stiffness: 200, damping: 20 });

    const [hovering, setHovering] = useState(false);

    useEffect(() => {
      const el = wrapRef.current;
      if (!el) return;
      if (matchMedia('(pointer: coarse)').matches) return;
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const onMove = (e: MouseEvent) => {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.hypot(dx, dy);
        const halo = Math.max(rect.width, rect.height) / 2 + 60;
        if (dist < halo) {
          x.set(dx * 0.3);
          y.set(dy * 0.3);
          lx.set(dx * 0.5);
          ly.set(dy * 0.5);
        } else {
          x.set(0);
          y.set(0);
          lx.set(0);
          ly.set(0);
        }
      };
      window.addEventListener('mousemove', onMove);
      return () => window.removeEventListener('mousemove', onMove);
    }, [x, y, lx, ly]);

    const sizeClasses = size === 'lg'
      ? 'h-16 px-9 text-base'
      : 'h-14 px-7 text-[15px]';

    const variantClasses =
      variant === 'primary'
        ? 'bg-[#14140F] text-[#F4F1EA] hover:bg-[#FF5A1F]'
        : variant === 'inverse'
        ? 'bg-[#F4F1EA] text-[#14140F] hover:bg-[#FF5A1F] hover:text-[#F4F1EA]'
        : 'bg-transparent text-[#14140F] border border-[rgba(20,20,15,0.2)] hover:bg-[#14140F] hover:text-[#F4F1EA]';

    const inner = (
      <motion.div
        style={{ x: slx, y: sly }}
        className="relative flex items-center gap-3"
      >
        <span className="font-display font-medium tracking-[-0.01em]">
          {children}
        </span>
        {caret && (
          <motion.span
            className="font-mono-brand text-base"
            animate={{ x: hovering ? 4 : 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 20 }}
          >
            →
          </motion.span>
        )}
      </motion.div>
    );

    const baseClass = `inline-flex items-center justify-center rounded-full transition-colors duration-300 [transition-timing-function:cubic-bezier(0.65,0,0.35,1)] active:scale-[0.96] ${sizeClasses} ${variantClasses} ${className}`;

    return (
      <motion.div
        ref={wrapRef}
        style={{ x: sx, y: sy }}
        className="inline-block"
        onHoverStart={() => setHovering(true)}
        onHoverEnd={() => setHovering(false)}
      >
        {href ? (
          <a
            href={href}
            className={baseClass}
            onClick={onClick}
            data-cursor
            data-cursor-label={cursorLabel}
          >
            {inner}
          </a>
        ) : (
          <button
            type="button"
            className={baseClass}
            onClick={onClick}
            data-cursor
            data-cursor-label={cursorLabel}
          >
            {inner}
          </button>
        )}
      </motion.div>
    );
  }
);

MagneticPill.displayName = 'MagneticPill';
export default MagneticPill;
