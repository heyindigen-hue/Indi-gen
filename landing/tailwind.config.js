/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#F4F1EA',
        ink: '#14140F',
        'ink-soft': 'rgba(20,20,15,0.6)',
        'ink-line': 'rgba(20,20,15,0.1)',
        accent: '#FF5A1F',
        success: '#2BB673',
      },
      fontFamily: {
        display: ['Manrope', 'system-ui', 'sans-serif'],
        body: ['Manrope', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        'hero': '-0.04em',
        'h2': '-0.03em',
        'tight-2': '-0.02em',
        'wide-mono': '0.12em',
      },
    },
  },
  plugins: [],
};
