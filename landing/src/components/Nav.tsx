import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { useState } from 'react';
import FlowerMark from './FlowerMark';

const NAV = [
  { label: 'How it works', href: '#story' },
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 80));

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-[90]"
      style={{
        backdropFilter: scrolled ? 'saturate(180%) blur(10px)' : undefined,
        WebkitBackdropFilter: scrolled ? 'saturate(180%) blur(10px)' : undefined,
        backgroundColor: scrolled ? 'rgba(247,241,229,0.78)' : 'transparent',
        borderBottom: scrolled ? '1px solid var(--line)' : '1px solid transparent',
        transition: 'background-color .35s ease, border-color .35s ease',
      }}
    >
      <div className="px-6 md:px-10 py-5 flex items-center justify-between max-w-[1600px] mx-auto">
        <a
          href="#top"
          className="flex items-center gap-2.5 group"
          style={{ color: 'var(--ink)' }}
        >
          <FlowerMark size={28} />
          <span
            className="serif"
            style={{ fontSize: 20, fontWeight: 400, letterSpacing: '-0.02em' }}
          >
            LeadHangover
          </span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {NAV.map((l) => (
            <NavLink key={l.href} href={l.href}>
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-5">
          <a
            href="/customer/login"
            className="hidden md:inline mono"
            style={{ color: 'var(--ash)' }}
          >
            sign in
          </a>
          <a
            href="/customer/signup"
            className="hidden md:inline-block group relative overflow-hidden rounded-full"
            style={{
              backgroundColor: 'var(--ink)',
              color: 'var(--cream)',
              padding: '10px 20px',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <span className="relative inline-block">Start free</span>
          </a>
          <span
            aria-hidden
            className="hidden md:inline-block w-px h-4"
            style={{ backgroundColor: 'var(--line)' }}
          />
          <a
            href="/admin/"
            className="hidden md:inline mono"
            style={{ color: 'var(--ash)', fontSize: 11 }}
          >
            Admin →
          </a>
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden flex flex-col gap-1.5 p-2"
            aria-label="Menu"
          >
            <span
              className={`block w-5 h-px transition-transform duration-300 ${
                open ? 'rotate-45 translate-y-[6px]' : ''
              }`}
              style={{ backgroundColor: 'var(--ink)' }}
            />
            <span
              className={`block w-5 h-px transition-opacity duration-300 ${open ? 'opacity-0' : ''}`}
              style={{ backgroundColor: 'var(--ink)' }}
            />
            <span
              className={`block w-5 h-px transition-transform duration-300 ${
                open ? '-rotate-45 -translate-y-[6px]' : ''
              }`}
              style={{ backgroundColor: 'var(--ink)' }}
            />
          </button>
        </div>
      </div>

      <motion.div
        className="md:hidden overflow-hidden"
        initial={false}
        animate={{ height: open ? 'auto' : 0 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        style={{ backgroundColor: 'var(--cream)', borderTop: '1px solid var(--line)' }}
      >
        <div className="px-6 py-6 flex flex-col gap-5">
          {NAV.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="serif"
              style={{ fontSize: 22 }}
            >
              {l.label}
            </a>
          ))}
          <div className="h-px my-2" style={{ backgroundColor: 'var(--line)' }} />
          <a href="/customer/login" className="mono" style={{ color: 'var(--ash)' }}>
            sign in
          </a>
          <a
            href="/customer/signup"
            className="inline-block w-fit rounded-full"
            style={{
              backgroundColor: 'var(--ink)',
              color: 'var(--cream)',
              padding: '12px 22px',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Start free
          </a>
          <a href="/admin/" className="mono" style={{ color: 'var(--ash)', fontSize: 11 }}>
            Admin →
          </a>
        </div>
      </motion.div>
    </motion.nav>
  );
}

function NavLink({ children, href }: { children: string; href: string }) {
  return (
    <a
      href={href}
      className="relative group inline-block"
      style={{ fontSize: 14, color: 'var(--ink)' }}
    >
      <span>{children}</span>
      <span
        className="absolute left-0 -bottom-1 h-px w-full origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ backgroundColor: 'var(--ink)' }}
      />
    </a>
  );
}
