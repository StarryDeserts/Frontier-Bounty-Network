/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#060b12',
        graphite: '#0c141d',
        panel: '#0f1a25',
        steel: '#172635',
        line: '#274155',
        ink: '#e7f3ff',
        muted: '#8fa8bd',
        frost: '#89d8ff',
        ice: '#c2f0ff',
        amber: '#f0b56a',
        crimson: '#ef6a74',
        mint: '#68d4bf',
      },
      fontFamily: {
        display: ['"Space Grotesk"', '"Segoe UI"', 'sans-serif'],
        body: ['"Manrope"', '"Segoe UI"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        panel: '0 24px 80px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
        glow: '0 0 0 1px rgba(137, 216, 255, 0.16), 0 16px 48px rgba(18, 102, 143, 0.16)',
      },
      backgroundImage: {
        'panel-sheen': 'linear-gradient(140deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01) 38%, rgba(137,216,255,0.05) 100%)',
      },
    },
  },
  plugins: [],
};
