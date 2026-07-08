/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#FAFAFA',
        surface: '#FFFFFF',
        muted: '#F5F5F7',
        ink: '#1D1D1F',
        subtle: '#6E6E73',
        accent: '#0071E3',
        // Categorie ferie (pastello)
        lavoro: { bg: '#D1F2DE', fg: '#1E8E4E' },
        bloccate: { bg: '#FCE4D6', fg: '#C9622A' },
        flessibili: { bg: '#FFF6D6', fg: '#B8860B' },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
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
          '0%': { transform: 'translateY(-14px) rotate(0deg)', opacity: '0' },
          '20%': { opacity: '1' },
          '100%': { transform: 'translateY(18px) rotate(28deg)', opacity: '0' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'sun-fall': 'sun-fall 1100ms ease-out forwards',
        'fade-in': 'fade-in 240ms ease',
        'scale-in': 'scale-in 200ms cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}
