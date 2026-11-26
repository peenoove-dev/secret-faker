/** วาบสีที่ขอบจอสั้น ๆ (ใช้ตอนไล่คนออก / เกมจบ) — ไม่แสดงถ้าตั้งค่าลดแอนิเมชัน */
const TONES = {
  pink: 'rgba(219,58,44,0.45)', // แดง = ตัวปลอมเป็นฝ่ายได้เปรียบ/พลเมืองโดนไล่
  green: 'rgba(134,214,180,0.4)', // เขียวมินต์ = จับตัวปลอมได้
  blue: 'rgba(237,185,59,0.4)', // ทอง = ฝ่ายพลเมืองชนะ
}
export default function ScreenFlash({ tone = 'pink' }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-30 animate-flash motion-reduce:hidden"
      style={{ background: `radial-gradient(circle at center, transparent 40%, ${TONES[tone] ?? TONES.pink} 100%)` }}
    />
  )
}
