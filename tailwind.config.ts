import type { Config } from 'tailwindcss';
export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: { extend: { colors: { ink: '#14253c', brand: '#125b79', ice: '#f2f7fa', line: '#dce6ee', muted: '#64748b' }, boxShadow: { soft: '0 6px 25px rgba(20,37,60,.055)' } } },
  plugins: []
} satisfies Config;
