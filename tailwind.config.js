/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', '"Noto Sans Thai"', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', '"Noto Sans Thai"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Noto Sans Thai"', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: {
          950: '#07040f',
          900: '#0d0818',
          800: '#140d24',
          700: '#1c1333',
          600: '#271b45',
        },
        neon: {
          blue: '#22d3ee',
          sky: '#38bdf8',
          purple: '#a855f7',
          violet: '#7c3aed',
          pink: '#ec4899',
          green: '#34d399',
        },
      },
      boxShadow: {
        'glow-blue': '0 0 24px rgba(34, 211, 238, 0.35)',
        'glow-purple': '0 0 28px rgba(168, 85, 247, 0.45)',
        'glow-pink': '0 8px 32px rgba(236, 72, 153, 0.35)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.85)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-6px)' },
          '75%': { transform: 'translateX(6px)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
        'pop-in': 'pop-in 0.35s ease-out both',
        float: 'float 6s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2.4s ease-in-out infinite',
        shake: 'shake 0.3s ease-in-out',
      },
    },
  },
  plugins: [],
}
