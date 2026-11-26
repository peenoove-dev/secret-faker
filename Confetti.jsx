import { useMemo } from 'react'

const COLORS = ['#edb93b', '#db3a2c', '#86d6b4', '#8ec5f0', '#f2e9d8']
const SUITS = ['♠', '♥', '♦', '♣']

/** แต้มไพ่โปรยลงมา (CSS ล้วน) — ผู้ใช้ที่ตั้งค่าลดแอนิเมชันจะไม่เห็น */
export default function Confetti({ count = 46, palette = COLORS }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.9,
        dur: 2.8 + Math.random() * 2.2,
        size: 18 + Math.random() * 20,
        color: palette[i % palette.length],
        suit: SUITS[i % SUITS.length],
        drift: (Math.random() - 0.5) * 160,
        spin: 240 + Math.random() * 480,
      })),
    [count, palette],
  )
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-40 overflow-hidden motion-reduce:hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute -top-8 block animate-confetti leading-none"
          style={{
            left: `${p.left}%`,
            fontSize: p.size,
            color: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
            '--drift': `${p.drift}px`,
            '--spin': `${p.spin}deg`,
          }}
        >
          {p.suit}
        </span>
      ))}
    </div>
  )
}
