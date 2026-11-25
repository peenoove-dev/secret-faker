// Avatar tile colors (Tailwind gradient classes)
export const AVATAR_COLORS = [
  'from-sky-400 to-cyan-500',
  'from-indigo-500 to-violet-500',
  'from-violet-500 to-purple-600',
  'from-orange-400 to-orange-600',
  'from-fuchsia-500 to-pink-500',
  'from-emerald-400 to-teal-500',
  'from-rose-400 to-red-500',
  'from-amber-300 to-yellow-500',
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
