// โหมดวาดรูป — ค่าคงที่ + ฟังก์ชันล้วน ๆ ที่ใช้ร่วมกันทั้งเซิร์ฟเวอร์และหน้าเว็บ
//
// กติกา: ผู้เล่นผลัดกันวาดคนละ "หนึ่งเส้น" (ยกนิ้ว/ปล่อยเมาส์ = จบเส้น) บนผืนผ้าใบเดียวกัน วนกัน DRAW_LAPS รอบ
// แต่ละคนมีสีประจำตัวคนละสี ผู้เล่นทุกคนรู้ว่าต้องวาดอะไร ยกเว้นตัวปลอม 1 คนที่ต้องเดาจากรูปที่คนอื่นวาด
// แล้วเนียนวาดตาม จากนั้นโหวตหาตัวปลอม

/** หมวดที่วาดง่าย (ตัดหมวด อาชีพ/ประเทศ/สถานที่ ที่วาดบอกยากออก) — ใช้ชื่อหมวดภาษาอังกฤษใน wordBank */
export const DRAW_CATEGORIES = ['Animals', 'Food', 'Objects', 'Vehicles', 'Fruits']

export const DRAW_LAPS = 2 // วนกี่รอบ (ทุกคนวาดคนละ DRAW_LAPS เส้น)
export const DRAW_TURN_MS = 25_000 // เวลาต่อหนึ่งตา เกินแล้วข้ามตาให้อัตโนมัติ

export const CANVAS_SIZE = 1000 // ผืนผ้าใบสี่เหลี่ยมจัตุรัส พิกัด 0–1000
export const MAX_STROKE_POINTS = 240
export const MIN_POINT_GAP = 7 // ระยะห่างขั้นต่ำระหว่างจุด (หน่วยผืนผ้าใบ) ลดขนาดข้อมูลที่ส่ง
export const BRUSH_WIDTHS = [7, 14, 26] // บาง / กลาง / หนา

/** สีประจำตัวผู้เล่น (ตามลำดับที่นั่ง) — เลือกให้แยกกันออกบนพื้นกระดาษ มีชื่อสีไว้ให้คนตาบอดสีด้วย */
export const DRAW_COLORS = [
  { hex: '#e63946', th: 'แดง', en: 'Red' },
  { hex: '#f08a00', th: 'ส้ม', en: 'Orange' },
  { hex: '#2a9d4b', th: 'เขียว', en: 'Green' },
  { hex: '#1d6fd6', th: 'น้ำเงิน', en: 'Blue' },
  { hex: '#8e44ad', th: 'ม่วง', en: 'Purple' },
  { hex: '#e8559a', th: 'ชมพู', en: 'Pink' },
  { hex: '#0f9d9a', th: 'เขียวน้ำทะเล', en: 'Teal' },
  { hex: '#6b4423', th: 'น้ำตาล', en: 'Brown' },
]

export const drawColor = (index) => DRAW_COLORS[((index % DRAW_COLORS.length) + DRAW_COLORS.length) % DRAW_COLORS.length]

const clamp = (n) => Math.min(CANVAS_SIZE, Math.max(0, n))

/**
 * ตรวจ/ทำความสะอาดเส้นที่ client ส่งมา — เซิร์ฟเวอร์ไม่เชื่อข้อมูลจากเครื่องผู้เล่น
 * รับ { pts: [[x, y], ...], w: 0|1|2 } คืนค่าที่ปลอดภัย หรือ null ถ้าผิดรูปแบบ
 */
export function sanitizeStroke(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.pts)) return null
  if (raw.pts.length < 1 || raw.pts.length > MAX_STROKE_POINTS) return null
  const pts = []
  for (const p of raw.pts) {
    if (!Array.isArray(p) || p.length !== 2) return null
    if (typeof p[0] !== 'number' || typeof p[1] !== 'number') return null
    if (!Number.isFinite(p[0]) || !Number.isFinite(p[1])) return null
    pts.push([clamp(Math.round(p[0])), clamp(Math.round(p[1]))])
  }
  const w = Number.isInteger(raw.w) && raw.w >= 0 && raw.w < BRUSH_WIDTHS.length ? raw.w : 1
  return { pts, w }
}

/** แปลงจุดเป็น path ของ SVG (โค้งเรียบด้วยจุดกึ่งกลาง) */
export function strokePath(pts) {
  if (!pts.length) return ''
  if (pts.length === 1) return `M${pts[0][0]} ${pts[0][1]}l0.01 0` // จุดเดียว = วาดเป็นจุดกลม
  let d = `M${pts[0][0]} ${pts[0][1]}`
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = Math.round((pts[i][0] + pts[i + 1][0]) / 2)
    const my = Math.round((pts[i][1] + pts[i + 1][1]) / 2)
    d += `Q${pts[i][0]} ${pts[i][1]} ${mx} ${my}`
  }
  const last = pts[pts.length - 1]
  return `${d}L${last[0]} ${last[1]}`
}
