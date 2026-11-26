/** @type {import('tailwindcss').Config} */
// ธีม "โต๊ะไพ่": ผ้าสักหลาดเขียวเข้ม + การ์ดกระดาษ + หมึกแดง/ทอง
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Chonburi', 'Sarabun', 'serif'],
        sans: ['Sarabun', 'system-ui', 'sans-serif'],
      },
      colors: {
        // ผ้าสักหลาดโต๊ะ (พื้นหลัง/แผง)
        felt: {
          950: '#0a1f1c',
          900: '#0e2925',
          800: '#143530',
          700: '#1b443d',
          600: '#285850',
          500: '#3a7266',
          300: '#8fb0a6',
          200: '#b9cfc7',
        },
        // กระดาษการ์ด
        paper: {
          DEFAULT: '#f2e9d8',
          dim: '#ddd1b8',
          edge: '#c4b696',
        },
        // หมึกบนกระดาษ
        ink: {
          DEFAULT: '#2a1f1a',
          soft: '#5c4d42',
          faint: '#8d7e70',
        },
        gold: { DEFAULT: '#edb93b', deep: '#8a5f0b', soft: '#f6d98a' },
        ember: { DEFAULT: '#db3a2c', deep: '#9b2d24', soft: '#f2806f' },
        mint: { DEFAULT: '#86d6b4', deep: '#2f7d62' },
        sky: { DEFAULT: '#8ec5f0' },
        av: {
          1: '#e96a52',
          2: '#edb93b',
          3: '#86d6b4',
          4: '#8ec5f0',
          5: '#c7a6ea',
          6: '#f2a6b8',
          7: '#f59e5b',
          8: '#b9d66b',
        },
      },
      boxShadow: {
        card: '3px 4px 0 0 #04120f',
        'card-lg': '5px 7px 0 0 #04120f',
        'card-sm': '2px 3px 0 0 #04120f',
        'btn-gold': '0 4px 0 0 #8a5f0b',
        'btn-paper': '0 4px 0 0 #a39571',
        'btn-felt': '0 4px 0 0 #061512',
        'btn-ember': '0 4px 0 0 #6a1912',
        'btn-gold-up': '0 6px 0 0 #8a5f0b',
        'btn-paper-up': '0 6px 0 0 #a39571',
        'btn-felt-up': '0 6px 0 0 #061512',
        inset: 'inset 0 2px 0 0 rgba(0,0,0,.12)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.9) rotate(-2deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(0)' },
        },
        // ไพ่แจกออกเป็นพัดบนหน้าแรก (ใช้ครั้งเดียวตอนเปิดหน้า)
        deal: {
          '0%': { transform: 'translate(0,0) rotate(0deg)', opacity: '0' },
          '15%': { opacity: '1' },
          '100%': { transform: 'translate(var(--dx), var(--dy)) rotate(var(--rot))', opacity: '1' },
        },
        blink: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        confetti: {
          '0%': { opacity: '1', transform: 'translate3d(0,-10vh,0) rotate(0deg)' },
          '100%': { opacity: '0.9', transform: 'translate3d(var(--drift),110vh,0) rotate(var(--spin))' },
        },
        flash: {
          '0%': { opacity: '0' },
          '25%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'slide-in': {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'ring-pulse': {
          '0%': { boxShadow: '0 0 0 0 rgba(237,185,59,0.6)' },
          '100%': { boxShadow: '0 0 0 12px rgba(237,185,59,0)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-6px)' },
          '75%': { transform: 'translateX(6px)' },
        },
        stamp: {
          '0%': { opacity: '0', transform: 'scale(1.8) rotate(-18deg)' },
          '60%': { opacity: '1', transform: 'scale(0.94) rotate(-9deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(-9deg)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out both',
        'pop-in': 'pop-in 0.28s ease-out both',
        deal: 'deal 0.7s cubic-bezier(.2,.8,.2,1) both',
        blink: 'blink 1.6s ease-in-out infinite',
        shake: 'shake 0.3s ease-in-out',
        confetti: 'confetti linear forwards',
        flash: 'flash 0.9s ease-out both',
        'slide-in': 'slide-in 0.2s ease-out both',
        'ring-pulse': 'ring-pulse 1.4s ease-out infinite',
        stamp: 'stamp 0.35s ease-out both',
      },
    },
  },
  plugins: [],
}
