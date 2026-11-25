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

function broadcast(room) {
  syncGuessTimer(room)
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
      room.game = createGame(room.players.map((p) => ({ id: p.id, name: p.name })))
      return ''
    }

    case 'PLAY_AGAIN': {
      if (!player.isHost) return 'notHost'
      if (game?.phase !== 'gameover') return 'badState'
      if (room.players.length < MIN_PLAYERS_TO_START) return 'notEnough'
      room.game = createGame(room.players.map((p) => ({ id: p.id, name: p.name })))
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

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  if (req.method === 'OPTIONS') return res.writeHead(204).end()

  const url = new URL(req.url, 'http://x')
  if (!url.pathname.startsWith('/api/')) return serveStatic(req, res)

  try {
    // สร้างห้อง
    if (req.method === 'POST' && url.pathname === '/api/rooms') {
      const body = await readBody(req)
      const nickname = cleanName(body.nickname)
      if (!nickname) return json(res, 400, { error: 'nameEmpty' })
      if (rooms.size >= MAX_ROOMS) return json(res, 503, { error: 'serverBusy' })
      const maxPlayers = MAX_PLAYERS_OPTIONS.includes(body.maxPlayers) ? body.maxPlayers : 8
      const host = { id: randomId(), token: randomToken(), name: nickname, ready: true, isHost: true, conns: new Set(), timer: null }
      const room = {
        code: newCode(),
        name: String(body.roomName ?? '').trim().slice(0, 24),
        maxPlayers,
        isPrivate: body.isPrivate !== false,
        players: [host],
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
        if (body.image === null) {
          player.avatar = null
        } else {
          const mm = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(String(body.image ?? ''))
          if (!mm) return json(res, 400, { error: 'badImage' })
          const buf = Buffer.from(mm[1], 'base64')
          if (buf.length > AVATAR_MAX_BYTES || buf[0] !== 0xff || buf[1] !== 0xd8) return json(res, 400, { error: 'badImage' })
          player.avatar = buf
          player.avatarV = Date.now()
        }
        broadcast(room)
        return json(res, 200, { ok: true })
      }
      return json(res, 404, { error: 'notFound' })
    }

    // เข้าห้อง
    if (req.method === 'POST' && route === 'join') {
      const body = await readBody(req)
      const nickname = cleanName(body.nickname)
      if (!nickname) return json(res, 400, { error: 'nameEmpty' })
      if (!room) return json(res, 404, { error: 'roomNotFound' })
      if (room.game) return json(res, 409, { error: 'gameStarted' })
      if (room.players.length >= room.maxPlayers) return json(res, 409, { error: 'roomFull' })
      if (room.players.some((p) => p.name.toLowerCase() === nickname.toLowerCase())) {
        return json(res, 409, { error: 'nameTaken' })
      }
      const player = { id: randomId(), token: randomToken(), name: nickname, ready: false, isHost: false, conns: new Set(), timer: null }
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
