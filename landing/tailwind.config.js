/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#F7F1E5',
        paper: '#FBF7EE',
        ink: '#0E0E0C',
        ash: '#2A2823',
        orange: '#FF5A1F',
        line: 'rgba(14,14,12,0.10)',
        'line-soft': 'rgba(14,14,12,0.06)',
        'cream-line': 'rgba(247,241,229,0.16)',
      },
      fontFamily: {
        serif: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        hero: '-0.02em',
        h2: '-0.018em',
        mono: '0.12em',
      },
      transitionTimingFunction: {
        editorial: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};
