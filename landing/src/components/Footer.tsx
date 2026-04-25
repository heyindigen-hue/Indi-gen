import { motion } from 'framer-motion';
import { useState, FormEvent } from 'react';
import FlowerMark from './FlowerMark';
import { useMagnetic } from '../lib/useMagnetic';

const COLUMNS = [
  {
    label: 'PRODUCT',
    items: [
      { label: 'Targeting', href: '#hunt' },
      { label: 'Outreach', href: '#hunt' },
      { label: 'Replies', href: '#hunt' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Changelog', href: '/changelog' },
    ],
  },
  {
    label: 'COMPANY',
    items: [
      { label: 'Story', href: '#story' },
      { label: 'Hunters', href: '#testimonials' },
      { label: 'Careers', href: '/careers' },
      { label: 'Press', href: '/press' },
      { label: 'Contact', href: 'mailto:book@leadhangover.com' },
    ],
  },
  {
    label: 'LEGAL',
    items: [
      { label: 'Terms', href: '/terms' },
      { label: 'Privacy', href: '/privacy' },
      { label: 'DPA', href: '/dpa' },
      { label: 'Security', href: '/security' },
    ],
  },
];

export default function Footer() {
  const { ref, x, y } = useMagnetic<HTMLAnchorElement>({ strength: 0.18, radius: 80 });
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  };

  return (
    <footer className="bg-[var(--bg)] text-[var(--ink)] border-t border-[var(--line)]">
      <div className="px-6 md:px-10 pt-24 md:pt-32 pb-10 max-w-[1600px] mx-auto">
        {/* Email CTA */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="font-mono-brand text-[12px] uppercase tracking-[0.12em] text-[var(--ink-soft)] mb-4">
            [ TALK TO US ]
          </div>
          <motion.a
            ref={ref as React.Ref<HTMLAnchorElement>}
            href="mailto:book@leadhangover.com"
            style={{ x, y }}
            className="font-display font-medium tracking-[-0.04em] inline-flex items-baseline gap-3 hover:text-[#FF5A1F] transition-colors duration-300"
            data-cursor
            data-cursor-label="Mail"
          >
            <span style={{ fontSize: 'clamp(40px, 6vw, 80px)' }}>book@leadhangover.com</span>
            <span className="font-mono-brand text-[24px] md:text-[40px]">→</span>
          </motion.a>
        </motion.div>

        {/* Newsletter */}
        <div className="mt-20 md:mt-24 grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-5">
            <div className="flex items-center gap-2.5 mb-5">
              <FlowerMark size={28} />
              <span className="font-display font-semibold tracking-[-0.02em] text-[16px]">LeadHangover</span>
            </div>
            <p className="text-body-l max-w-[36ch] text-[var(--ink-soft)]">
              We hunt LinkedIn while you sleep. So you wake up to better leads.
            </p>
            <form onSubmit={onSubmit} className="mt-8 max-w-[400px] relative">
              <div className="font-mono-brand text-[11px] uppercase tracking-[0.12em] text-[var(--ink-soft)] mb-3">
                [ FIELD NOTES // MONTHLY ]
              </div>
              <div className="relative group">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={submitted ? 'Subscribed.' : 'your@email.com'}
                  disabled={submitted}
                  className="w-full pr-10 pb-3 pt-2 bg-transparent text-[18px] outline-none disabled:opacity-60"
                />
                <span className="absolute left-0 right-0 bottom-0 h-px bg-[var(--ink-line)]" />
                <motion.span
                  className="absolute left-0 bottom-0 h-px bg-[#14140F] origin-left"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: submitted ? 1 : 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                />
                <span
                  className="absolute left-0 bottom-0 h-px bg-[#14140F] origin-left scale-x-0 group-focus-within:scale-x-100 transition-transform duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] w-full"
                />
                <button
                  type="submit"
                  className="absolute right-0 bottom-2 font-mono-brand text-[18px] hover:text-[#FF5A1F] transition-colors"
                  data-cursor
                  data-cursor-label="Send"
                  aria-label="Subscribe"
                >
                  →
                </button>
              </div>
            </form>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.label} className="md:col-span-2">
              <div className="font-mono-brand text-[11px] uppercase tracking-[0.12em] text-[var(--ink-soft)] mb-5">
                [ {col.label} ]
              </div>
              <ul className="flex flex-col gap-3">
                {col.items.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="text-[14px] hover:text-[#FF5A1F] transition-colors"
                      data-cursor
                      data-cursor-label="Open"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="md:col-span-1">
            <div className="font-mono-brand text-[11px] uppercase tracking-[0.12em] text-[var(--ink-soft)] mb-5">
              [ SOCIAL ]
            </div>
            <ul className="flex md:flex-col gap-4 md:gap-3 text-[14px]">
              {[
                { l: 'Twitter', h: 'https://twitter.com/leadhangover' },
                { l: 'LinkedIn', h: 'https://linkedin.com/company/leadhangover' },
                { l: 'GitHub', h: 'https://github.com/leadhangover' },
              ].map((s) => (
                <li key={s.l}>
                  <a
                    href={s.h}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-[#FF5A1F] transition-colors"
                    data-cursor
                    data-cursor-label="Open"
                  >
                    {s.l}↗
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Mono meta */}
        <div className="mt-24 md:mt-32 pt-6 border-t border-[var(--line)] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="font-mono-brand text-[11px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">
            [ NASHIK / IN // 2026 // © LEADHANGOVER ]
          </div>
          <div className="font-mono-brand text-[11px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">
            [ STATUS // ALL SYSTEMS HUNTING ]
          </div>
        </div>
      </div>
    </footer>
  );
}
