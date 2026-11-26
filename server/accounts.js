// ระบบบัญชีผู้ใช้: สมัคร / เข้าสู่ระบบ / โปรไฟล์ / สถิติ (ไม่มี dependency ภายนอก)
//  - รหัสผ่าน: scrypt + salt สุ่มรายบัญชี (ไม่เก็บรหัสจริง) เทียบแบบ timingSafeEqual
//  - เซสชัน: โทเค็นสุ่ม 192 บิต เก็บเฉพาะค่า SHA-256 ฝั่งเซิร์ฟเวอร์ (หลุดฐานข้อมูลก็เอาไปใช้ล็อกอินไม่ได้)
//           หมดอายุเมื่อไม่ใช้งาน 30 วัน / อายุรวมไม่เกิน 90 วัน / มีได้ไม่เกิน 10 เครื่องต่อบัญชี / ล้างของหมดอายุเป็นระยะ
import crypto from 'node:crypto'
import { emptyStats, levelFor } from '../shared/achievements.js'

const USER_RE = /^[A-Za-z0-9_.-]{3,16}$/
const SESSION_IDLE_MS = 30 * 24 * 60 * 60 * 1000
const SESSION_MAX_MS = 90 * 24 * 60 * 60 * 1000
const SESSION_TOUCH_MS = 60 * 60 * 1000 // ต่ออายุเซสชันอย่างช้าชั่วโมงละครั้ง (ไม่เขียนดิสก์ทุกคำขอ)
const MAX_SESSIONS_PER_ACCOUNT = 10

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex')
const scrypt = (pw, salt) =>
  new Promise((resolve, reject) =>
    crypto.scrypt(pw, salt, 64, (e, k) => (e ? reject(e) : resolve(k.toString('hex')))),
  )
const DUMMY_SALT = crypto.randomBytes(16).toString('hex')

export const cleanDisplay = (s) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, 16)

export function createAccounts(store) {
  const { data, save } = store
  const fails = new Map() // key → { n, until }
  const registering = new Set() // ชื่อที่กำลังสมัครอยู่ (กันสมัครชื่อเดียวกันพร้อมกัน 2 คำขอ)

  const byId = (id) => (id ? data.accounts[id] ?? null : null)
  const byUsername = (u) => Object.values(data.accounts).find((a) => a.usernameKey === String(u).toLowerCase())

  function ensure(a) {
    a.stats = { ...emptyStats(), ...(a.stats ?? {}) }
    a.achievements = a.achievements ?? {}
    return a
  }

  function publicAccount(a) {
    ensure(a)
    return {
      id: a.id,
      username: a.username,
      displayName: a.displayName,
      avatarV: a.avatar ? a.avatarV : null,
      creator: !!a.creator,
      stats: a.stats,
      level: levelFor(a.stats.points),
      achievements: Object.keys(a.achievements),
    }
  }

  /* ---------- เซสชัน ---------- */
  const expired = (s, now) => now - s.created > SESSION_MAX_MS || now - (s.last ?? s.created) > SESSION_IDLE_MS

  function newSession(accountId) {
    // จำกัดจำนวนเซสชันต่อบัญชี: เกินแล้วตัดอันเก่าสุดออก
    const mine = Object.entries(data.sessions)
      .filter(([, s]) => s.accountId === accountId)
      .sort((a, b) => a[1].created - b[1].created)
    while (mine.length >= MAX_SESSIONS_PER_ACCOUNT) delete data.sessions[mine.shift()[0]]

    const token = crypto.randomBytes(24).toString('hex')
    const now = Date.now()
    data.sessions[sha(token)] = { accountId, created: now, last: now }
    save()
    return token
  }

  function fromToken(token) {
    if (typeof token !== 'string' || !token) return null
    const k = sha(token)
    const s = data.sessions[k]
    if (!s) return null
    const now = Date.now()
    const a = byId(s.accountId)
    if (!a || expired(s, now)) {
      delete data.sessions[k]
      save()
      return null
    }
    if (now - (s.last ?? s.created) > SESSION_TOUCH_MS) {
      s.last = now
      save()
    }
    return ensure(a)
  }

  function purgeSessions() {
    const now = Date.now()
    let n = 0
    for (const [k, s] of Object.entries(data.sessions)) {
      if (expired(s, now) || !byId(s.accountId)) {
        delete data.sessions[k]
        n++
      }
    }
    if (n) save()
    return n
  }
  purgeSessions()
  setInterval(purgeSessions, 60 * 60 * 1000).unref()

  /* ---------- สมัคร / เข้าสู่ระบบ / ออก ---------- */
  async function register(username, password) {
    const u = String(username ?? '').trim()
    if (!USER_RE.test(u)) return { error: 'badUsername' }
    if (typeof password !== 'string' || password.length < 6 || password.length > 100) return { error: 'badPassword' }
    const key = u.toLowerCase()
    if (registering.has(key) || byUsername(u)) return { error: 'usernameTaken' }
    if (Object.keys(data.accounts).length >= 5000) return { error: 'serverBusy' }

    registering.add(key)
    try {
      const salt = crypto.randomBytes(16).toString('hex')
      const hash = await scrypt(password, salt)
      if (byUsername(u)) return { error: 'usernameTaken' } // ตรวจซ้ำหลัง await (กัน race)
      let id
      do id = crypto.randomBytes(5).toString('hex')
      while (data.accounts[id])
      const a = {
        id,
        username: u,
        usernameKey: key,
        salt,
        hash,
        displayName: u.slice(0, 16),
        avatar: null,
        avatarV: 0,
        creator: false,
        stats: emptyStats(),
        achievements: {},
        createdAt: Date.now(),
      }
      data.accounts[a.id] = a
      const token = newSession(a.id)
      try {
        await store.flush() // ตอบ "สมัครสำเร็จ" หลังข้อมูลลงที่เก็บถาวรแล้วเท่านั้น
      } catch (e) {
        console.error('[accounts] register: persist failed, rolled back:', e.message)
        delete data.accounts[a.id]
        delete data.sessions[sha(token)]
        return { error: 'serverBusy' }
      }
      return { account: a, token }
    } finally {
      registering.delete(key)
    }
  }

  async function login(username, password, ipKey) {
    const key = `${ipKey}|${String(username).toLowerCase()}`
    const f = fails.get(key)
    if (f && f.n >= 8 && Date.now() < f.until) return { error: 'tooMany' }
    const a = byUsername(String(username ?? '').trim())
    let ok = false
    if (typeof password === 'string') {
      // ไม่มีบัญชีนี้ก็ยังคำนวณ hash หลอก เพื่อให้เวลาตอบใกล้เคียงกัน (กันเดาว่ามีชื่อผู้ใช้นี้ไหม)
      const h = await scrypt(password, a ? a.salt : DUMMY_SALT)
      ok = !!a && crypto.timingSafeEqual(Buffer.from(h, 'hex'), Buffer.from(a.hash, 'hex'))
    }
    if (!ok) {
      fails.set(key, { n: (f?.n ?? 0) + 1, until: Date.now() + 5 * 60 * 1000 })
      return { error: 'badLogin' }
    }
    fails.delete(key)
    const token = newSession(a.id)
    try {
      await store.flush()
    } catch (e) {
      console.error('[accounts] login: session persist failed:', e.message) // บัญชียังอยู่ครบ แค่เซสชันอาจไม่รอดรีสตาร์ต
    }
    return { account: a, token }
  }

  async function logout(token) {
    delete data.sessions[sha(token)]
    try {
      await store.flush()
    } catch {
      save()
    }
  }

  return { all: () => Object.values(data.accounts).map(ensure), byId, publicAccount, fromToken, register, login, logout, purgeSessions, save }
}
