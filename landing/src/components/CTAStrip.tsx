import { motion } from 'framer-motion';

export default function CTAStrip() {
  return (
    <section className="py-28 px-6 lg:px-10 bg-ink text-white relative overflow-hidden">
      {/* Faint flower watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04]">
        <svg width="600" height="600" viewBox="0 0 80 80" fill="none">
          <g transform="translate(40,40)">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
              <ellipse
                key={angle}
                cx="0" cy="-22" rx="9" ry="18"
                fill={i % 2 === 0 ? '#FF4716' : '#C8553D'}
                transform={`rotate(${angle})`}
              />
            ))}
            <circle cx="0" cy="0" r="9" fill="#FF4716" />
          </g>
        </svg>
      </div>

      <div className="relative max-w-[680px] mx-auto text-center">
        <motion.h2
          className="font-display italic text-[clamp(32px,5vw,52px)] font-semibold leading-[1.1] mb-5"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          Ready to wake up to better leads?
        </motion.h2>

        <motion.p
          className="text-[16px] text-white/70 mb-10"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ delay: 0.15, duration: 0.6 }}
        >
          Join founders already filling their pipeline every morning.
        </motion.p>

        <motion.div
          className="flex flex-wrap gap-3 justify-center"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ delay: 0.25, duration: 0.6 }}
        >
          <motion.a
            href="/app/login"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-brand text-white text-[15px] font-semibold rounded-full"
            whileHover={{ scale: 1.02, boxShadow: '0 6px 28px rgba(255,71,22,0.5)' }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 22 }}
          >
            Start free trial
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </motion.a>
          <motion.a
            href="mailto:hello@indigenservices.com"
            className="inline-flex items-center gap-2 px-8 py-3.5 border border-white/20 text-white/85 text-[15px] font-medium rounded-full hover:border-white/40 transition-colors"
            whileHover={{ scale: 1.01 }}
          >
            Talk to us
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
