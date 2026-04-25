import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { useState } from 'react';
import FlowerMark from './FlowerMark';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Customers', href: '#testimonial' },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (y) => {
    setScrolled(y > 24);
  });

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 px-6 lg:px-10 h-[60px] flex items-center justify-between"
      animate={{
        backgroundColor: scrolled ? 'rgba(250,247,242,0.88)' : 'rgba(250,247,242,0)',
        backdropFilter: scrolled ? 'blur(14px)' : 'blur(0px)',
        boxShadow: scrolled ? '0 1px 0 #EEE8DD' : '0 1px 0 transparent',
      }}
      transition={{ duration: 0.25 }}
    >
      <a href="/" className="flex items-center gap-2.5 group">
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: '#FF4716',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <FlowerMark size={22} />
        </div>
        <span
          className="text-[17px] font-semibold text-ink tracking-tight"
          style={{ fontFamily: "'Fraunces', serif" }}
        >
          LeadHangover
        </span>
      </a>

      <div className="hidden md:flex items-center gap-8">
        {NAV_LINKS.map((link) => (
          <motion.a
            key={link.label}
            href={link.href}
            className="text-[13px] font-medium text-muted hover:text-ink transition-colors"
            whileHover={{ y: -1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            {link.label}
          </motion.a>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <a
          href="/app/login"
          className="px-4 py-2 text-[13px] font-medium text-muted hover:text-ink transition-colors rounded-full"
        >
          Login
        </a>
        <motion.a
          href="/app/login"
          className="px-5 py-2 bg-brand text-white text-[13px] font-semibold rounded-full"
          whileHover={{ scale: 1.02, boxShadow: '0 4px 20px rgba(255,71,22,0.38)' }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 380, damping: 22 }}
        >
          Start free
        </motion.a>
      </div>
    </motion.nav>
  );
}
