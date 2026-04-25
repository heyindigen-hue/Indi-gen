import { motion } from 'framer-motion';

export default function Testimonial() {
  return (
    <section
      id="testimonial"
      className="py-24 px-6 lg:px-10 bg-[#FAF7F2] relative overflow-hidden"
    >
      {/* Scattered petal background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.06]">
        {[
          { x: '5%', y: '15%', r: 12 },
          { x: '80%', y: '10%', r: 8 },
          { x: '92%', y: '65%', r: 14 },
          { x: '10%', y: '75%', r: 10 },
          { x: '50%', y: '5%', r: 6 },
        ].map(({ x, y, r }, i) => (
          <div
            key={i}
            className="absolute"
            style={{ left: x, top: y }}
          >
            <svg width={r * 6} height={r * 6} viewBox="0 0 80 80" fill="none">
              <g transform="translate(40,40)">
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, j) => (
                  <ellipse
                    key={angle}
                    cx="0" cy="-22" rx="9" ry="18"
                    fill={j % 2 === 0 ? '#FF4716' : '#C8553D'}
                    transform={`rotate(${angle})`}
                  />
                ))}
              </g>
            </svg>
          </div>
        ))}
      </div>

      <div className="max-w-[800px] mx-auto text-center relative">
        {/* Quote — ink-fade (Pattern 14) */}
        <motion.blockquote
          className="font-display italic text-[clamp(20px,3vw,32px)] leading-[1.4] text-ink mb-8"
          initial={{ opacity: 0.4, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          "Indi-gen used to take 6 hours of manual LinkedIn scrolling per day.
          LeadHangover does it before my coffee."
        </motion.blockquote>

        {/* Byline — types in (Pattern 14 byline trail) */}
        <motion.cite
          className="not-italic"
          initial={{ clipPath: 'inset(0 100% 0 0)', opacity: 0.7 }}
          whileInView={{ clipPath: 'inset(0 0% 0 0)', opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.9, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Avatar ring breath (Pattern 15) */}
          <div className="flex items-center justify-center gap-3">
            <div className="relative">
              <motion.div
                className="w-10 h-10 rounded-full bg-brand-soft border-2 border-brand/30 flex items-center justify-center font-display italic font-semibold text-brand"
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 1.4, delay: 0.6, ease: 'easeInOut', repeat: Infinity, repeatDelay: 3 }}
              >
                Y
              </motion.div>
            </div>
            <div className="text-left">
              <p className="text-[14px] font-semibold text-ink">Yashraj Bhadane</p>
              <p className="text-[12px] text-muted">Founder, Indigen Services</p>
            </div>
          </div>
        </motion.cite>
      </div>
    </section>
  );
}
