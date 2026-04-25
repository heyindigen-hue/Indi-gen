import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import FlowerMark from './FlowerMark';

const FOOTER_LINKS = [
  {
    heading: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'How it works', href: '#how-it-works' },
      { label: 'Mobile app', href: '/app/login' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: 'https://indigenservices.com' },
      { label: 'Contact', href: 'mailto:hello@indigenservices.com' },
      { label: 'WhatsApp', href: 'https://wa.me/917499168918' },
      { label: 'Blog', href: '#' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Terms of Service', href: '/app/terms' },
      { label: 'Privacy Policy', href: '/app/privacy' },
      { label: 'DPDP Compliance', href: '/app/dpdp' },
    ],
  },
];

export default function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: footerRef,
    offset: ['start end', 'end end'],
  });

  // Pattern 16 — wordmark mask reveal
  const clipPath = useTransform(
    scrollYProgress,
    [0, 1],
    ['inset(100% 0 0 0)', 'inset(0% 0 0 0)']
  );

  return (
    <footer ref={footerRef} className="bg-[#0B0A08] text-white/60">
      <div className="max-w-[1100px] mx-auto px-6 lg:px-10">
        {/* Top section */}
        <div className="pt-16 pb-12 grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-12">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <FlowerMark size={28} />
              <span
                className="text-white text-[17px] font-semibold"
                style={{ fontFamily: "'Fraunces', serif" }}
              >
                LeadHangover
              </span>
            </div>
            <p className="text-[13px] leading-relaxed max-w-[220px] mb-5">
              AI-powered lead generation for Indian founders. Wake up to a full pipeline.
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-white/40 tracking-wide">
                Made in India
              </span>
              <span className="text-[14px]">🇮🇳</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8">
            {FOOTER_LINKS.map((col) => (
              <div key={col.heading}>
                <h4 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40 mb-4">
                  {col.heading}
                </h4>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-[13px] hover:text-white transition-colors"
                        target={link.href.startsWith('http') ? '_blank' : undefined}
                        rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Wordmark reveal (Pattern 16) */}
        <div className="overflow-hidden py-8 border-t border-white/[0.08]">
          <motion.div style={{ clipPath }} className="overflow-hidden">
            <p
              className="text-[clamp(40px,8vw,96px)] font-display font-semibold text-white/[0.06] leading-none tracking-[0.04em] whitespace-nowrap"
            >
              LEADHANGOVER
            </p>
          </motion.div>
        </div>

        {/* Bottom bar */}
        <div className="pb-8 flex flex-wrap items-center justify-between gap-4 text-[12px]">
          <span>© 2026 Indigen Services. All rights reserved.</span>
          <span className="text-white/30">Built by Indigen Services · Nashik, India</span>
        </div>
      </div>
    </footer>
  );
}
