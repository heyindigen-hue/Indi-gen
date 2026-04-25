import { motion, useScroll } from 'framer-motion';
import { useEffect, useState } from 'react';
import MagneticPill from './MagneticPill';
import FlowerMark from './FlowerMark';

const NAV_LINKS = [
  { label: '[ HUNT ]', href: '#hunt' },
  { label: '[ PROOF ]', href: '#proof' },
  { label: '[ PRICING ]', href: '#pricing' },
  { label: '[ STORY ]', href: '#story' },
];

export default function Nav() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    return scrollY.on('change', (v) => setScrolled(v > 100));
  }, [scrollY]);

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-[100] transition-all duration-300"
      style={{
        backdropFilter: scrolled ? 'saturate(180%) blur(8px)' : undefined,
        WebkitBackdropFilter: scrolled ? 'saturate(180%) blur(8px)' : undefined,
        backgroundColor: scrolled ? 'rgba(244, 241, 234, 0.78)' : 'transparent',
        borderBottom: scrolled ? '1px solid rgba(20,20,15,0.06)' : '1px solid transparent',
      }}
    >
      <div className="px-6 md:px-10 py-5 flex items-center justify-between max-w-[1600px] mx-auto">
        <a href="#top" className="flex items-center gap-2.5" data-cursor data-cursor-label="Home">
          <FlowerMark size={32} />
          <span className="font-display font-semibold tracking-[-0.02em] text-[18px] text-[#14140F]">
            LeadHangover
          </span>
        </a>

        <div className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.href} href={link.href}>
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <a
            href="/auth/login"
            className="hidden md:inline text-[14px] font-display tracking-[-0.01em] hover:opacity-60 transition-opacity"
            data-cursor
            data-cursor-label="Sign in"
          >
            Sign in
          </a>
          <div className="hidden md:block">
            <MagneticPill href="/auth/signup" cursorLabel="Start">
              Start free
            </MagneticPill>
          </div>
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden flex flex-col gap-1 p-2"
            aria-label="Menu"
            data-cursor
            data-cursor-label="Menu"
          >
            <span className={`block w-6 h-px bg-[#14140F] transition-transform ${open ? 'rotate-45 translate-y-[5px]' : ''}`} />
            <span className={`block w-6 h-px bg-[#14140F] transition-opacity ${open ? 'opacity-0' : ''}`} />
            <span className={`block w-6 h-px bg-[#14140F] transition-transform ${open ? '-rotate-45 -translate-y-[5px]' : ''}`} />
          </button>
        </div>
      </div>

      <motion.div
        className="md:hidden overflow-hidden border-t border-[rgba(20,20,15,0.1)] bg-[#F4F1EA]"
        initial={false}
        animate={{ height: open ? 'auto' : 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="px-6 py-6 flex flex-col gap-5">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="font-mono-brand text-[14px] uppercase tracking-[0.12em] hover:text-[#FF5A1F]"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <a
            href="/auth/login"
            className="font-display text-[16px] hover:opacity-60"
            onClick={() => setOpen(false)}
          >
            Sign in
          </a>
          <MagneticPill href="/auth/signup" cursorLabel="Start">Start free</MagneticPill>
        </div>
      </motion.div>
    </motion.nav>
  );
}

function NavLink({ children, href }: { children: string; href: string }) {
  return (
    <a
      href={href}
      className="relative font-mono-brand text-[12px] uppercase tracking-[0.12em] py-1 group inline-block"
      data-cursor
      data-cursor-label="Go"
    >
      <span className="relative z-10">{children}</span>
      <span className="absolute left-0 bottom-0 h-px w-full bg-[#14140F] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]" />
    </a>
  );
}
