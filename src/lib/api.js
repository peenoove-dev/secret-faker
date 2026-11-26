// ที่อยู่เซิร์ฟเวอร์: ปกติใช้โดเมนเดียวกับเว็บ (เว็บ + เซิร์ฟเวอร์อยู่ที่เดียวกัน)
// ถ้าแยกโฮสต์ ให้ตั้ง VITE_API_URL ตอน build เช่น https://my-server.onrender.com
const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

/** เรียก API → { ok: true, ...data } หรือ { ok: false, error: 'รหัสข้อผิดพลาด' } */
export async function request(method, path, body, token) {
  try {
    const headers = {}
    if (body !== undefined) headers['Content-Type'] = 'application/json'
    if (token) headers.Authorization = `Bearer ${token}`
    const res = await fetch(BASE + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) return { ok: true, ...data }
    // 502/503/504 ที่ไม่มี JSON ตอบกลับ = เซิร์ฟเวอร์กำลังตื่น/ล่มชั่วคราว (เช่น Render แพลนฟรี) ไม่ใช่ข้อมูลผิด
    if (res.status >= 500 && !data.error) return { ok: false, error: 'network', status: res.status }
    return { ok: false, error: data.error ?? 'badRequest', status: res.status }
  } catch {
    return { ok: false, error: 'network' }
  }
}

export const post = (path, body, token) => request('POST', path, body, token)
export const get = (path, token) => request('GET', path, undefined, token)

export const eventsUrl = ({ code, playerId, token }) =>
  `${BASE}/api/rooms/${code}/events?pid=${encodeURIComponent(playerId)}&token=${encodeURIComponent(token)}`

export const avatarUrl = (code, pid, v) => `${BASE}/api/rooms/${code}/avatar/${pid}?v=${v}`
export const accountAvatarUrl = (id, v) => `${BASE}/api/accounts/${id}/avatar?v=${v}`
