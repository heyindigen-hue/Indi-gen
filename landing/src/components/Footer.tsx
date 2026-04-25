import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import { FormEvent, useRef, useState } from 'react';
import FlowerMark from './FlowerMark';

const EASE = [0.16, 1, 0.3, 1] as const;

type FooterLink = { label: string; href: string };

const COLUMNS: Array<{ heading: string; links: FooterLink[] }> = [
  {
    heading: 'Product',
    links: [
      { label: 'How it works', href: '#story' },
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Mobile app', href: '#mobile' },
      { label: 'Customer login', href: '/customer/login' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'Blog', href: '#' },
      { label: 'Changelog', href: '#' },
      { label: 'Help center', href: '#' },
      { label: 'API docs', href: '#' },
      { label: 'Status', href: '#' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Indigen Services', href: 'https://indigenservices.com' },
      { label: 'Careers', href: '#' },
      { label: 'Contact', href: '#' },
      { label: 'Admin', href: '/admin/' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy', href: '#' },
      { label: 'Terms', href: '#' },
      { label: 'DPDP', href: '#' },
      { label: 'Refunds', href: '#' },
      { label: 'Cookie preferences', href: '#' },
    ],
  },
];

export default function Footer() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end end'],
  });
  const wordmarkY = useTransform(scrollYProgress, [0, 1], [0, -40]);

  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [lang, setLang] = useState<'EN' | 'HI'>('EN');

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.includes('@')) return;
    setSubmitted(true);
  }

  return (
    <footer
      ref={ref}
      id="footer"
      className="relative w-full overflow-hidden"
      style={{ backgroundColor: 'var(--cream)', color: 'var(--ink)' }}
    >
      <div
        className="pb-10 max-w-[1600px] mx-auto"
        style={{ paddingInline: 'var(--section-x)', paddingTop: 'var(--section-y)' }}
      >
        {/* Top: brand + newsletter */}
        <div className="grid md:grid-cols-12 gap-10 mb-16 md:mb-24 pb-12" style={{ borderBottom: '1px solid var(--line)' }}>
          <div className="md:col-span-5 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <FlowerMark size={36} />
              <span
                className="serif"
                style={{ fontSize: 26, fontWeight: 400, letterSpacing: '-0.02em' }}
              >
                LeadHangover
              </span>
            </div>
            <p
              className="serif"
              style={{
                fontSize: 22,
                fontWeight: 300,
                lineHeight: 1.4,
                letterSpacing: '-0.01em',
                maxWidth: '28ch',
                color: 'var(--ash)',
              }}
            >
              Built by Indigen Services.<br />Hand-rolled in Nashik.
            </p>
          </div>

          <div className="md:col-span-7 md:pl-16">
            <div className="mono mb-3" style={{ color: 'var(--ash)' }}>
              MORNING DIGEST · ONCE A WEEK
            </div>
            <form onSubmit={onSubmit} className="relative max-w-md">
              <AnimatePresence mode="wait">
                {!submitted ? (
                  <motion.div
                    key="form"
                    layoutId="newsletter-shell"
                    initial={false}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: EASE }}
                    className="flex items-center gap-3"
                  >
                    <input
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="line-input flex-1"
                      style={{ fontSize: 18 }}
                      required
                    />
                    <button
                      type="submit"
                      className="serif shrink-0"
                      style={{ fontSize: 18, fontWeight: 400, color: 'var(--ink)' }}
                    >
                      subscribe →
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="ok"
                    layoutId="newsletter-shell"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, ease: EASE }}
                    className="flex items-center gap-3 py-3"
                    style={{ borderBottom: '1px solid var(--orange)' }}
                  >
                    <motion.span
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.3, ease: EASE }}
                      className="block"
                      style={{ fontSize: 22, color: 'var(--orange)' }}
                    >
                      ✓
                    </motion.span>
                    <span className="serif" style={{ fontSize: 18, fontWeight: 300 }}>
                      You're in. First note lands Tuesday.
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>
        </div>

        {/* Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-6 mb-20 md:mb-32">
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 16,
                  color: 'var(--ink)',
                  letterSpacing: '-0.005em',
                }}
              >
                {col.heading}
              </div>
              <ul className="flex flex-col gap-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="relative group inline-block"
                      style={{ fontSize: 14, color: 'var(--ash)' }}
                    >
                      <span>{l.label}</span>
                      <span
                        className="absolute left-0 -bottom-0.5 h-px w-full origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                        style={{ backgroundColor: 'var(--orange)' }}
                      />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Giant wordmark */}
        <motion.div
          aria-hidden
          style={{ y: wordmarkY }}
          className="serif select-none leading-none"
        >
          <span
            style={{
              fontSize: 'clamp(120px, 22vw, 360px)',
              fontWeight: 300,
              letterSpacing: '-0.04em',
              color: 'var(--ink)',
              display: 'block',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            LeadHangover<span className="serif-italic">.</span>
          </span>
        </motion.div>

        {/* Bottom strip */}
        <div className="mt-10 md:mt-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-6" style={{ borderTop: '1px solid var(--line)' }}>
          <span className="mono" style={{ color: 'var(--ash)' }}>
            © 2026 INDI-GEN SERVICES · NASHIK, IN
          </span>
          <div className="flex items-center gap-5">
            <SocialIcon kind="x" />
            <SocialIcon kind="li" />
            <SocialIcon kind="ig" />
            <span className="block w-px h-4" style={{ backgroundColor: 'var(--line)' }} />
            <button
              onClick={() => setLang(lang === 'EN' ? 'HI' : 'EN')}
              className="mono flex items-center gap-1.5"
              style={{ color: 'var(--ash)' }}
            >
              <span style={{ color: lang === 'EN' ? 'var(--ink)' : 'var(--ash)' }}>EN</span>
              <span>/</span>
              <span style={{ color: lang === 'HI' ? 'var(--ink)' : 'var(--ash)' }}>HI</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ kind }: { kind: 'x' | 'li' | 'ig' }) {
  const stroke = 'var(--ash)';
  return (
    <a href="#" style={{ color: stroke }} className="hover:text-[var(--orange)] transition-colors">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        {kind === 'x' && (
          <path d="M2 2l5 6.2L2 14h2l4-4.5 3.5 4.5H14L8.7 7.3 14 2h-2L8.4 6.1 4.7 2z" fill="currentColor" />
        )}
        {kind === 'li' && (
          <>
            <rect x="1.5" y="1.5" width="13" height="13" rx="1" stroke="currentColor" strokeWidth="1" />
            <path d="M4 6.5v5M4 4.5v.5M7 11.5v-3a1.5 1.5 0 013 0v3M7 6.5v5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          </>
        )}
        {kind === 'ig' && (
          <>
            <rect x="1.5" y="1.5" width="13" height="13" rx="3" stroke="currentColor" strokeWidth="1" />
            <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1" />
            <circle cx="11.5" cy="4.5" r="0.6" fill="currentColor" />
          </>
        )}
      </svg>
    </a>
  );
}
