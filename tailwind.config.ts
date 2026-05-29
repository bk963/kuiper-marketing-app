import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Kuiper Safety CI (von www.kuiper-safety.de übernommen)
        brand: {
          DEFAULT: '#00C2FF',  // primary cyan
          light: '#14b3e8',
          dark: '#00b0e8',
          deep: '#0d8aa5',
        },
        navy: {
          DEFAULT: '#0b1a4d',
          dark: '#07102d',
          mid: '#0D1B3E',
          deep: '#0e1c3a',
        },
        ink: '#0e0f12',
      },
      fontFamily: {
        sans: ['Figtree', 'system-ui', '-apple-system', 'sans-serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'brand-glow': 'radial-gradient(ellipse 1200px 900px at 80% 10%, rgba(0,194,255,.18), transparent 60%), linear-gradient(160deg, #0b1a4d, #071237)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
export default config;
