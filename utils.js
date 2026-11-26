// สีพื้นของกรอบรูปผู้เล่น (สีทึบ ไม่ไล่เฉด) — ชื่อคลาสต้องเขียนเต็มเพื่อให้ Tailwind เจอ
export const AVATAR_COLORS = [
  'bg-av-1',
  'bg-av-2',
  'bg-av-3',
  'bg-av-4',
  'bg-av-5',
  'bg-av-6',
  'bg-av-7',
  'bg-av-8',
]

export const ROOM_CODE_LENGTH = 6

export function normalizeRoomCode(value) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, ROOM_CODE_LENGTH)
}

export function isValidRoomCode(value) {
  return normalizeRoomCode(value).length === ROOM_CODE_LENGTH
}

export function avatarColor(index) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length]
}

/** ตัวอักษรแรกของชื่อ (รองรับภาษาไทยและอีโมจิ) */
export function initial(name) {
  return (Array.from(name ?? '?')[0] ?? '?').toUpperCase()
}

export function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}

/** เลือกสีจากข้อความ (ใช้กับบัญชีที่ไม่มี index) */
export function colorFromText(text = '') {
  let h = 0
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}
