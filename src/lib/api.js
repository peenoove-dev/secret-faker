// ที่อยู่เซิร์ฟเวอร์: ปกติใช้โดเมนเดียวกับเว็บ (เว็บ + เซิร์ฟเวอร์อยู่ที่เดียวกัน)
// ถ้าแยกโฮสต์ ให้ตั้ง VITE_API_URL ตอน build เช่น https://my-server.onrender.com
const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

/** POST JSON → { ok: true, ...data } หรือ { ok: false, error: 'รหัสข้อผิดพลาด' } */
export async function post(path, body) {
  try {
    const res = await fetch(BASE + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    return res.ok ? { ok: true, ...data } : { ok: false, error: data.error ?? 'badRequest' }
  } catch {
    return { ok: false, error: 'network' }
  }
}

export const eventsUrl = ({ code, playerId, token }) =>
  `${BASE}/api/rooms/${code}/events?pid=${encodeURIComponent(playerId)}&token=${encodeURIComponent(token)}`
