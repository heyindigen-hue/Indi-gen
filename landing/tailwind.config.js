/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: '#FF4716',
        'brand-soft': '#FFE6D7',
        terra: '#C8553D',
        cream: '#FAF7F2',
        surface: '#FFFFFF',
        ink: '#0B0A08',
        muted: '#6B6558',
        border: '#EEE8DD',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['Inter Tight', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
