/** พื้นหลังโต๊ะไพ่: ผ้าสักหลาดมีเม็ดเนื้อ + แสงตะเกียงเหนือโต๊ะ (นิ่ง ไม่มีแอนิเมชัน) */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .55 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

export default function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-felt-900">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% 0%, rgba(58,114,102,.38), transparent 70%), radial-gradient(ellipse at 50% 120%, rgba(4,18,15,.7), transparent 60%)',
        }}
      />
      <div className="absolute inset-0 opacity-[0.07] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
    </div>
  )
}
