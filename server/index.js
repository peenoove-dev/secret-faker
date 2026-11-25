// เซิร์ฟเวอร์เกม SECRET FAKER — ไม่มี dependency ภายนอก (Node 18+)
//  - POST /api/rooms                 สร้างห้อง
//  - POST /api/rooms/:code/join      เข้าห้อง
//  - GET  /api/rooms/:code/events    รับสถานะห้องแบบเรียลไทม์ (Server-Sent Events)
//  - POST /api/rooms/:code/action    ส่งคำสั่ง (พร้อม/เริ่มเกม/ส่งคำใบ้/โหวต/ฯลฯ)
//  - ไฟล์เว็บที่ build แล้ว (โฟลเดอร์ dist) ถูกเสิร์ฟจากที่นี่ด้วย

import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import {
  MAX_PLAYERS_OPTIONS,
  MIN_PLAYERS_TO_START,
  createGame,
  gameReducer,
  validateClue,
  viewFor,
} from '../shared/gameLogic.js'
import { WORD_BANK } from '../shared/wordBank.js'
import { createStore } from './store.js'
import { createAccounts, cleanDisplay } from './accounts.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.resolve(__dirname, '../dist')
const PORT = Number(process.env.PORT) || 3001

const GRACE_MS = Number(process.env.GRACE_MS) || 45_000 // หลุดการเชื่อมต่อนานเท่านี้ถึงถือว่าออกจากห้อง
const ROOM_TTL_MS = 6 * 60 * 60 * 1000 // ห้องที่ไม่มีความเคลื่อนไหวนาน 6 ชม. จะถูกลบ
const MAX_ROOMS = 500
const GUESS_MS = 45_000 // เวลาที่ตัวปลอมมีเดาคำหลังโดนโหวตออก
const AVATAR_MAX_BYTES = 60_000
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // ไม่มี 0/O/1/I

/** @type {Map<string, any>} */
const rooms = new Map()

const store = await createStore(path.resolve(__dirname, '../data'))
const accounts = createAccounts(store)
const CREATOR_CODE = process.env.CREATOR_CODE || '' // รหัสลับสำหรับปลดล็อกระบบผู้สร้าง (ตั้งใน Render → Environment)

/** คลังคำ = คำในโค้ด + คำที่ผู้สร้างเพิ่มเอง */
function currentBank() {
  return WORD_BANK.map((cat) => ({
    category: cat.category,
    words: [
      ...cat.words,
      ...store.data.customWords.filter((w) => w.cat === cat.category.en).map((w) => ({ th: w.th, en: w.en })),
    ],
  }))
}

/* ------------------------------ helpers ------------------------------ */

const randomId = () => crypto.randomBytes(4).toString('hex')
const randomToken = () => crypto.randomBytes(16).toString('hex')

function newCode() {
  for (;;) {
    let code = ''
    for (let i = 0; i < 6; i++) code += CODE_CHARS[crypto.randomInt(CODE_CHARS.length)]
    if (!rooms.has(code)) return code
  }
}

// ผู้เล่นที่ล็อกอิน: ใช้รูปโปรไฟล์ของบัญชีเป็นรูปในห้อง
function applyAccount(player, acc) {
  if (acc?.avatar) {
    player.avatar = Buffer.from(acc.avatar, 'base64')
    player.avatarV = acc.avatarV
  }
}

const cleanName = (s) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, 16)

function publicRoom(room) {
  return {
    code: room.code,
    name: room.name,
    maxPlayers: room.maxPlayers,
    isPrivate: room.isPrivate,
    inGame: !!room.game,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      ready: p.ready,
      isHost: p.isHost,
      connected: p.conns.size > 0,
      avatarV: p.avatar ? p.avatarV : null,
    })),
  }
}

function sendState(room, player) {
  if (!player.conns.size) return
  const payload = JSON.stringify({
    room: publicRoom(room),
    game: room.game ? viewFor(room.game, player.id) : null,
  })
  for (const res of player.conns) res.write(`event: state\ndata: ${payload}\n\n`)
}

// ตั้ง/ล้างตัวจับเวลาตอนตัวปลอมเดาคำ (เรียกทุกครั้งก่อนส่งสถานะ)
function syncGuessTimer(room) {
  const g = room.game?.guess
  if (g?.status === 'pending') {
    if (!room.guessTimer) {
      room.game = { ...room.game, guess: { ...g, deadline: Date.now() + GUESS_MS } }
      room.guessTimer = setTimeout(() => {
        room.guessTimer = null
        if (rooms.get(room.code) !== room || !room.game) return
        room.game = gameReducer(room.game, { type: 'GUESS_TIMEOUT' })
        broadcast(room)
      }, GUESS_MS)
    }
  } else if (room.guessTimer) {
    clearTimeout(room.guessTimer)
    room.guessTimer = null
  }
}

// บันทึกสถิติของผู้เล่นที่ล็อกอิน เมื่อเกมจบ (ครั้งเดียวต่อเกม)
function recordStats(room) {
  const g = room.game
  if (!g || g.phase !== 'gameover' || g.statsDone) return
  room.game = { ...g, statsDone: true }
  for (const p of g.players) {
    const acc = accounts.byId(room.accountOf.get(p.id))
    if (!acc) continue
    const spy = p.role === 'imposter'
    const won = g.winner === (spy ? 'imposters' : 'civilians')
    acc.stats.played++
    if (won) acc.stats.wins++
    if (spy) {
      acc.stats.spyPlayed++
      if (won) acc.stats.spyWins++
    }
  }
  accounts.save()
}

function broadcast(room) {
  syncGuessTimer(room)
  recordStats(room)
  room.touched = Date.now()
  room.players.forEach((p) => sendState(room, p))
}

function auth(room, pid, token) {
  const p = room?.players.find((x) => x.id === pid)
  return p && typeof token === 'string' && p.token === token ? p : null
}

function scheduleGrace(room, player) {
  clearTimeout(player.timer)
  player.timer = setTimeout(() => {
    if (!player.conns.size) removeFromRoom(room, player.id)
  }, GRACE_MS)
}

function removeFromRoom(room, pid) {
  const player = room.players.find((p) => p.id === pid)
  if (!player) return
  clearTimeout(player.timer)
  for (const res of player.conns) res.end()
  player.conns.clear()

  if (room.game) room.game = gameReducer(room.game, { type: 'REMOVE_PLAYER', playerId: pid })
  room.players = room.players.filter((p) => p.id !== pid)

  if (room.players.length === 0) {
    rooms.delete(room.code)
    return
  }
  if (!room.players.some((p) => p.isHost)) {
    const next = room.players.find((p) => p.conns.size) ?? room.players[0]
    next.isHost = true
    next.ready = true
  }
  broadcast(room)
}

/* ------------------------------ actions ------------------------------ */

function handleAction(room, player, body) {
  const type = body.type
  const game = room.game

  switch (type) {
    case 'TOGGLE_READY':
      if (game) return 'gameStarted'
      if (player.isHost) return '' // เจ้าของห้องพร้อมอยู่แล้วเสมอ
      player.ready = !player.ready
      return ''

    case 'LEAVE':
      removeFromRoom(room, player.id)
      return ''

    case 'START': {
      if (!player.isHost) return 'notHost'
      if (game) return 'gameStarted'
      if (room.players.length < MIN_PLAYERS_TO_START) return 'notEnough'
      if (!room.players.every((p) => p.ready)) return 'notReady'
      room.game = createGame(
        room.players.map((p) => ({ id: p.id, name: p.name })),
        currentBank(),
      )
      return ''
    }

    case 'PLAY_AGAIN': {
      if (!player.isHost) return 'notHost'
      if (game?.phase !== 'gameover') return 'badState'
      if (room.players.length < MIN_PLAYERS_TO_START) return 'notEnough'
      room.game = createGame(
        room.players.map((p) => ({ id: p.id, name: p.name })),
        currentBank(),
      )
      return ''
    }

    case 'BACK_TO_LOBBY': {
      if (!player.isHost) return 'notHost'
      if (game?.phase !== 'gameover') return 'badState'
      room.game = null
      room.players.forEach((p) => (p.ready = p.isHost))
      return ''
    }

    case 'ACK_REVEAL':
    case 'SUBMIT_CLUE':
    case 'CAST_VOTE':
    case 'GUESS_WORD':
    case 'CONTINUE': {
      if (!game) return 'badState'
      if (type === 'CONTINUE' && !player.isHost) return 'notHost'
      if (type === 'SUBMIT_CLUE') {
        const err = validateClue(game, body.text, player.id)
        if (err) return err
      }
      const next = gameReducer(game, {
        type,
        playerId: player.id, // ใช้ตัวตนจากโทเค็นเสมอ ไม่เชื่อค่าที่ client ส่งมา
        text: body.text,
        targetId: body.targetId,
        index: body.index,
      })
      if (next === game) return 'badState'
      room.game = next
      return ''
    }

    default:
      return 'badRequest'
  }
}

/* ------------------------------ HTTP ------------------------------ */

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
}

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(data))
}

function readBody(req, limit = 10_000) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (c) => {
      size += c.length
      if (size > limit) {
        reject(new Error('too large'))
        req.destroy()
      } else chunks.push(c)
    })
    req.on('end', () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {})
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
  })
}

function serveStatic(req, res) {
  const url = new URL(req.url, 'http://x')
  let file = path.join(DIST, decodeURIComponent(url.pathname))
  if (!file.startsWith(DIST)) return json(res, 403, { error: 'forbidden' })
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, 'index.html')
  if (!fs.existsSync(file)) {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
    return res.end('SECRET FAKER server is running. Run "npm run build" to build the web app, or use "npm run dev".')
  }
  const ext = path.extname(file)
  const headers = { 'Content-Type': MIME[ext] ?? 'application/octet-stream' }
  if (url.pathname.startsWith('/assets/')) headers['Cache-Control'] = 'public, max-age=31536000, immutable'
  res.writeHead(200, headers)
  fs.createReadStream(file).pipe(res)
}


/* ------------------------------ accounts & creator API ------------------------------ */

const bearer = (req) => String(req.headers.authorization ?? '').replace(/^Bearer /, '')
const clientIp = (req) => String(req.headers['x-forwarded-for'] ?? req.socket.remoteAddress ?? '').split(',')[0].trim()
const hasThai = (s) => /[\u0E00-\u0E7F]/.test(s)
const cleanWord = (s) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, 30)

function creatorOnly(req, res) {
  const acc = accounts.fromToken(bearer(req))
  if (!acc) {
    json(res, 401, { error: 'unauthorized' })
    return null
  }
  if (!acc.creator) {
    json(res, 403, { error: 'notCreator' })
    return null
  }
  return acc
}

function bankForCreator() {
  return WORD_BANK.map((cat) => ({
    key: cat.category.en,
    category: cat.category,
    words: [
      ...cat.words.map((w) => ({ th: w.th, en: w.en, custom: false })),
      ...store.data.customWords
        .filter((w) => w.cat === cat.category.en)
        .map((w) => ({ id: w.id, th: w.th, en: w.en, custom: true })),
    ],
  }))
}

/** คืน true ถ้าจัดการคำขอนี้แล้ว */
async function handleApi(req, res, url) {
  const p = url.pathname
  if (!/^\/api\/(auth|accounts|creator)\//.test(p)) return false

  // รูปโปรไฟล์ของบัญชี
  let m = p.match(/^\/api\/accounts\/([a-f0-9]+)\/avatar$/)
  if (m && req.method === 'GET') {
    const a = accounts.byId(m[1])
    if (!a?.avatar) return json(res, 404, { error: 'notFound' }), true
    res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=31536000, immutable' })
    res.end(Buffer.from(a.avatar, 'base64'))
    return true
  }

  if (req.method === 'GET' && p === '/api/auth/me') {
    const a = accounts.fromToken(bearer(req))
    if (!a) return json(res, 401, { error: 'unauthorized' }), true
    return json(res, 200, { account: accounts.publicAccount(a) }), true
  }
  if (req.method === 'GET' && p === '/api/creator/words') {
    if (!creatorOnly(req, res)) return true
    return json(res, 200, { categories: bankForCreator() }), true
  }
  if (req.method === 'GET' && p === '/api/creator/export') {
    if (!creatorOnly(req, res)) return true
    const { accounts: acs, customWords } = store.data
    return json(res, 200, { version: 1, accounts: acs, customWords }), true
  }
  if (req.method !== 'POST') return json(res, 404, { error: 'notFound' }), true

  const body = await readBody(req, p === '/api/creator/import' ? 6_000_000 : p === '/api/auth/avatar' ? 120_000 : 10_000)

  if (p === '/api/auth/register') {
    const r = await accounts.register(body.username, body.password)
    if (r.error) return json(res, 400, { error: r.error }), true
    return json(res, 200, { token: r.token, account: accounts.publicAccount(r.account) }), true
  }
  if (p === '/api/auth/login') {
    const r = await accounts.login(body.username, body.password, clientIp(req))
    if (r.error) return json(res, r.error === 'tooMany' ? 429 : 401, { error: r.error }), true
    return json(res, 200, { token: r.token, account: accounts.publicAccount(r.account) }), true
  }

  const acc = accounts.fromToken(bearer(req))
  if (!acc) return json(res, 401, { error: 'unauthorized' }), true

  if (p === '/api/auth/logout') {
    accounts.logout(bearer(req))
    return json(res, 200, { ok: true }), true
  }
  if (p === '/api/auth/profile') {
    const name = cleanDisplay(body.displayName)
    if (!name) return json(res, 400, { error: 'nameEmpty' }), true
    acc.displayName = name
    accounts.save()
    return json(res, 200, { account: accounts.publicAccount(acc) }), true
  }
  if (p === '/api/auth/avatar') {
    if (body.image === null) {
      acc.avatar = null
    } else {
      const mm = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(String(body.image ?? ''))
      if (!mm) return json(res, 400, { error: 'badImage' }), true
      const buf = Buffer.from(mm[1], 'base64')
      if (buf.length > AVATAR_MAX_BYTES || buf[0] !== 0xff || buf[1] !== 0xd8) return json(res, 400, { error: 'badImage' }), true
      acc.avatar = mm[1]
      acc.avatarV = Date.now()
    }
    accounts.save()
    return json(res, 200, { account: accounts.publicAccount(acc) }), true
  }
  if (p === '/api/creator/unlock') {
    if (!CREATOR_CODE) return json(res, 400, { error: 'creatorDisabled' }), true
    const a = Buffer.from(String(body.code ?? ''))
    const b = Buffer.from(CREATOR_CODE)
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return json(res, 403, { error: 'badCode' }), true
    acc.creator = true
    accounts.save()
    return json(res, 200, { account: accounts.publicAccount(acc) }), true
  }

  // ----- ต่อไปนี้ต้องเป็นผู้สร้างเท่านั้น -----
  if (!acc.creator) return json(res, 403, { error: 'notCreator' }), true

  if (p === '/api/creator/words') {
    const cat = WORD_BANK.find((c) => c.category.en === body.category)
    if (!cat) return json(res, 400, { error: 'badCategory' }), true
    const word = cleanWord(body.word)
    const other = cleanWord(body.translation)
    if (!word) return json(res, 400, { error: 'wordEmpty' }), true
    // ช่องแรกเป็นไทยหรืออังกฤษก็ได้ ระบบดูจากตัวอักษรเอง ถ้าไม่ใส่คำแปลจะใช้คำเดียวกันทั้งสองภาษา
    const th = hasThai(word) ? word : other || word
    const en = hasThai(word) ? other || word : word
    const all = [...cat.words, ...store.data.customWords.filter((w) => w.cat === cat.category.en)]
    if (all.some((w) => w.th.toLowerCase() === th.toLowerCase() || w.en.toLowerCase() === en.toLowerCase())) {
      return json(res, 409, { error: 'wordExists' }), true
    }
    if (store.data.customWords.length >= 2000) return json(res, 400, { error: 'serverBusy' }), true
    store.data.customWords.push({ id: crypto.randomBytes(4).toString('hex'), cat: cat.category.en, th, en, by: acc.id })
    store.save()
    return json(res, 200, { categories: bankForCreator() }), true
  }
  if (p === '/api/creator/words/delete') {
    const before = store.data.customWords.length
    store.data.customWords = store.data.customWords.filter((w) => w.id !== body.id)
    if (store.data.customWords.length === before) return json(res, 404, { error: 'notFound' }), true
    store.save()
    return json(res, 200, { categories: bankForCreator() }), true
  }
  if (p === '/api/creator/import') {
    const d = body.data
    if (!d || typeof d !== 'object') return json(res, 400, { error: 'badRequest' }), true
    const str = (v, n) => typeof v === 'string' && v.length <= n
    let addedWords = 0
    let addedAccounts = 0
    for (const w of Array.isArray(d.customWords) ? d.customWords : []) {
      const okCat = WORD_BANK.some((c) => c.category.en === w?.cat)
      if (!okCat || !str(w.id, 16) || !str(w.th, 30) || !str(w.en, 30) || !w.th || !w.en) continue
      if (store.data.customWords.some((x) => x.id === w.id || (x.cat === w.cat && x.th === w.th))) continue
      store.data.customWords.push({ id: w.id, cat: w.cat, th: w.th, en: w.en, by: str(w.by, 16) ? w.by : '' })
      addedWords++
    }
    for (const a of Object.values(d.accounts && typeof d.accounts === 'object' ? d.accounts : {})) {
      if (!str(a?.id, 16) || !str(a.username, 16) || !str(a.salt, 64) || !str(a.hash, 256) || !str(a.displayName, 16)) continue
      if (store.data.accounts[a.id] || Object.values(store.data.accounts).some((x) => x.usernameKey === a.username.toLowerCase())) continue
      store.data.accounts[a.id] = {
        id: a.id,
        username: a.username,
        usernameKey: a.username.toLowerCase(),
        salt: a.salt,
        hash: a.hash,
        displayName: a.displayName,
        avatar: str(a.avatar, 90_000) ? a.avatar : null,
        avatarV: Number(a.avatarV) || 0,
        creator: !!a.creator,
        stats: a.stats && typeof a.stats === 'object' ? a.stats : {},
        createdAt: Number(a.createdAt) || Date.now(),
      }
      addedAccounts++
    }
    store.save()
    return json(res, 200, { addedWords, addedAccounts, categories: bankForCreator() }), true
  }
  return json(res, 404, { error: 'notFound' }), true
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  if (req.method === 'OPTIONS') return res.writeHead(204).end()

  const url = new URL(req.url, 'http://x')
  if (!url.pathname.startsWith('/api/')) return serveStatic(req, res)

  try {
    if (await handleApi(req, res, url)) return

    // สร้างห้อง
    if (req.method === 'POST' && url.pathname === '/api/rooms') {
      const body = await readBody(req)
      const acc = accounts.fromToken(body.auth)
      const nickname = acc ? cleanDisplay(acc.displayName) : cleanName(body.nickname)
      if (!nickname) return json(res, 400, { error: 'nameEmpty' })
      if (rooms.size >= MAX_ROOMS) return json(res, 503, { error: 'serverBusy' })
      const maxPlayers = MAX_PLAYERS_OPTIONS.includes(body.maxPlayers) ? body.maxPlayers : 8
      const host = { id: randomId(), token: randomToken(), name: nickname, ready: true, isHost: true, conns: new Set(), timer: null }
      applyAccount(host, acc)
      const room = {
        code: newCode(),
        name: String(body.roomName ?? '').trim().slice(0, 24),
        maxPlayers,
        isPrivate: body.isPrivate !== false,
        players: [host],
        accountOf: new Map(acc ? [[host.id, acc.id]] : []),
        game: null,
        touched: Date.now(),
      }
      rooms.set(room.code, room)
      scheduleGrace(room, host)
      return json(res, 200, { code: room.code, playerId: host.id, token: host.token })
    }

    const m = url.pathname.match(/^\/api\/rooms\/([A-Za-z0-9]{6})\/(join|events|action|avatar(?:\/[a-f0-9]+)?)$/)
    if (!m) return json(res, 404, { error: 'notFound' })
    const room = rooms.get(m[1].toUpperCase())
    const route = m[2]

    // รูปโปรไฟล์: ดู (GET /avatar/:playerId) / อัปโหลด (POST /avatar)
    if (route.startsWith('avatar')) {
      if (!room) return json(res, 404, { error: 'roomNotFound' })
      if (req.method === 'GET') {
        const target = room.players.find((p) => p.id === route.split('/')[1])
        if (!target?.avatar) return json(res, 404, { error: 'notFound' })
        res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=31536000, immutable' })
        return res.end(target.avatar)
      }
      if (req.method === 'POST') {
        const body = await readBody(req, 120_000)
        const player = auth(room, body.pid, body.token)
        if (!player) return json(res, 401, { error: 'unauthorized' })
        const linked = accounts.byId(room.accountOf.get(player.id))
        if (body.image === null) {
          player.avatar = null
          if (linked) {
            linked.avatar = null
            accounts.save()
          }
        } else {
          const mm = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(String(body.image ?? ''))
          if (!mm) return json(res, 400, { error: 'badImage' })
          const buf = Buffer.from(mm[1], 'base64')
          if (buf.length > AVATAR_MAX_BYTES || buf[0] !== 0xff || buf[1] !== 0xd8) return json(res, 400, { error: 'badImage' })
          player.avatar = buf
          player.avatarV = Date.now()
          if (linked) {
            linked.avatar = mm[1]
            linked.avatarV = player.avatarV
            accounts.save()
          }
        }
        broadcast(room)
        return json(res, 200, { ok: true })
      }
      return json(res, 404, { error: 'notFound' })
    }

    // เข้าห้อง
    if (req.method === 'POST' && route === 'join') {
      const body = await readBody(req)
      const acc = accounts.fromToken(body.auth)
      const nickname = acc ? cleanDisplay(acc.displayName) : cleanName(body.nickname)
      if (!nickname) return json(res, 400, { error: 'nameEmpty' })
      if (!room) return json(res, 404, { error: 'roomNotFound' })
      if (room.game) return json(res, 409, { error: 'gameStarted' })
      if (room.players.length >= room.maxPlayers) return json(res, 409, { error: 'roomFull' })
      if (room.players.some((p) => p.name.toLowerCase() === nickname.toLowerCase())) {
        return json(res, 409, { error: 'nameTaken' })
      }
      const player = { id: randomId(), token: randomToken(), name: nickname, ready: false, isHost: false, conns: new Set(), timer: null }
      applyAccount(player, acc)
      if (acc) room.accountOf.set(player.id, acc.id)
      room.players.push(player)
      scheduleGrace(room, player)
      broadcast(room)
      return json(res, 200, { code: room.code, playerId: player.id, token: player.token })
    }

    // รับสถานะ (SSE)
    if (req.method === 'GET' && route === 'events') {
      const player = auth(room, url.searchParams.get('pid'), url.searchParams.get('token'))
      if (!player) return json(res, 401, { error: room ? 'unauthorized' : 'roomNotFound' })
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      })
      res.write('retry: 2000\n\n')
      clearTimeout(player.timer)
      player.conns.add(res)
      const ping = setInterval(() => res.write(': ping\n\n'), 20_000)
      req.on('close', () => {
        clearInterval(ping)
        player.conns.delete(res)
        if (!player.conns.size && rooms.get(room.code) === room) {
          if (room.players.includes(player)) {
            scheduleGrace(room, player)
            broadcast(room)
          }
        }
      })
      broadcast(room) // ให้คนอื่นเห็นว่าเรากลับมาออนไลน์ + ส่งสถานะให้เรา
      return
    }

    // ส่งคำสั่ง
    if (req.method === 'POST' && route === 'action') {
      const body = await readBody(req)
      const player = auth(room, body.pid, body.token)
      if (!player) return json(res, 401, { error: room ? 'unauthorized' : 'roomNotFound' })
      const error = handleAction(room, player, body)
      if (error) return json(res, 400, { error })
      if (rooms.get(room.code) === room) broadcast(room)
      return json(res, 200, { ok: true })
    }

    return json(res, 404, { error: 'notFound' })
  } catch {
    if (!res.headersSent) json(res, 400, { error: 'badRequest' })
  }
})

// เก็บกวาดห้องร้าง
setInterval(() => {
  const now = Date.now()
  for (const [code, room] of rooms) {
    if (now - room.touched > ROOM_TTL_MS) {
      room.players.forEach((p) => {
        clearTimeout(p.timer)
        p.conns.forEach((r) => r.end())
      })
      rooms.delete(code)
    }
  }
}, 10 * 60 * 1000).unref()

server.listen(PORT, () => console.log(`SECRET FAKER server listening on http://localhost:${PORT}`))
