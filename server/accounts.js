// ระบบบัญชีผู้ใช้: สมัคร / เข้าสู่ระบบ / โปรไฟล์ / สถิติ (ไม่มี dependency ภายนอก)
import crypto from 'node:crypto'
import { emptyStats, levelFor } from '../shared/achievements.js'

const USER_RE = /^[A-Za-z0-9_.-]{3,16}$/
const SESSION_TTL_MS = 60 * 24 * 60 * 60 * 1000
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex')
const scrypt = (pw, salt) =>
  new Promise((resolve, reject) =>
    crypto.scrypt(pw, salt, 64, (e, k) => (e ? reject(e) : resolve(k.toString('hex')))),
  )

export const cleanDisplay = (s) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, 16)

export function createAccounts(store) {
  const { data, save } = store
  const fails = new Map() // key → { n, until }

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

  function newSession(accountId) {
    const token = crypto.randomBytes(24).toString('hex')
    data.sessions[sha(token)] = { accountId, created: Date.now() }
    save()
    return token
  }

  function fromToken(token) {
    if (typeof token !== 'string' || !token) return null
    const s = data.sessions[sha(token)]
    if (!s) return null
    if (Date.now() - s.created > SESSION_TTL_MS) {
      delete data.sessions[sha(token)]
      return null
    }
    const a = byId(s.accountId)
    return a ? ensure(a) : null
  }

  async function register(username, password) {
    const u = String(username ?? '').trim()
    if (!USER_RE.test(u)) return { error: 'badUsername' }
    if (typeof password !== 'string' || password.length < 6 || password.length > 100) return { error: 'badPassword' }
    if (byUsername(u)) return { error: 'usernameTaken' }
    if (Object.keys(data.accounts).length >= 5000) return { error: 'serverBusy' }
    const salt = crypto.randomBytes(16).toString('hex')
    const a = {
      id: crypto.randomBytes(5).toString('hex'),
      username: u,
      usernameKey: u.toLowerCase(),
      salt,
      hash: await scrypt(password, salt),
      displayName: u.slice(0, 16),
      avatar: null,
      avatarV: 0,
      creator: false,
      stats: emptyStats(),
      achievements: {},
      createdAt: Date.now(),
    }
    data.accounts[a.id] = a
    save()
    return { account: a, token: newSession(a.id) }
  }

  async function login(username, password, ipKey) {
    const key = `${ipKey}|${String(username).toLowerCase()}`
    const f = fails.get(key)
    if (f && f.n >= 8 && Date.now() < f.until) return { error: 'tooMany' }
    const a = byUsername(String(username ?? '').trim())
    let ok = false
    if (a && typeof password === 'string') {
      const h = await scrypt(password, a.salt)
      ok = crypto.timingSafeEqual(Buffer.from(h, 'hex'), Buffer.from(a.hash, 'hex'))
    }
    if (!ok) {
      fails.set(key, { n: (f?.n ?? 0) + 1, until: Date.now() + 5 * 60 * 1000 })
      return { error: 'badLogin' }
    }
    fails.delete(key)
    return { account: a, token: newSession(a.id) }
  }

  function logout(token) {
    delete data.sessions[sha(token)]
    save()
  }

  return { all: () => Object.values(data.accounts).map(ensure), byId, publicAccount, fromToken, register, login, logout, save }
}
