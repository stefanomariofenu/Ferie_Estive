/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F4F8FC',
        surface: '#FFFFFF',
        muted: '#EEF3FA',
        ink: '#0B1C3A',
        subtle: '#5A6B85',
        accent: '#00338D',
        'accent-soft': '#005EB8',
        cyan: '#00A3E0',
        pink: '#C6007E',
        // Categorie ferie (chiave KPMG: neutro / blu / cyan)
        lavoro: { bg: '#E9F0F8', fg: '#3C4C66' },
        bloccate: { bg: '#00338D', fg: '#FFFFFF' },
        flessibili: { bg: '#00A3E0', fg: '#06243B' },
      },
      fontFamily: {
        sans: [
          '"Instrument Sans"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'system-ui',
          'sans-serif',
        ],
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
      },
      borderRadius: {
        card: '18px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)',
        pop: '0 8px 30px rgba(0,0,0,0.08)',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        'sun-fall': {
          '0%': { transform: 'translateY(-8vh) rotate(0deg)', opacity: '0' },
          '15%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateY(105vh) rotate(220deg)', opacity: '0' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'sun-pop': {
          '0%': { opacity: '0', transform: 'scale(0.3) rotate(-40deg)' },
          '60%': { opacity: '1', transform: 'scale(1.12) rotate(8deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(0deg)' },
        },
        rise: {
          '0%': { opacity: '0', transform: 'translateY(18px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        cloud: {
          '0%': { transform: 'translateX(var(--from, -30%))' },
          '100%': { transform: 'translateX(112vw)' },
        },
      },
      animation: {
        'sun-fall': 'sun-fall 1100ms ease-out forwards',
        'fade-in': 'fade-in 240ms ease',
        'scale-in': 'scale-in 220ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        'sun-pop': 'sun-pop 700ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        rise: 'rise 600ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
        cloud: 'cloud linear infinite',
      },
    },
  },
  plugins: [],
}
