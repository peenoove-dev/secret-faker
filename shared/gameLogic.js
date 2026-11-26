import { WORD_BANK } from './wordBank.js'
import { DRAW_CATEGORIES, DRAW_LAPS, sanitizeStroke } from './drawing.js'

/**
 * ตรรกะเกมล้วน ๆ (ไม่มี React) — รันบนเซิร์ฟเวอร์เท่านั้น
 * เซิร์ฟเวอร์เป็นผู้ตัดสินทุกอย่าง ผู้เล่นแต่ละคนจะได้รับ "view" ที่ซ่อนข้อมูลลับแล้ว
 *
 * phases: reveal → clues → voting → elimination → (clues … | gameover)
 *
 * actions (ทุก action มี playerId ที่เซิร์ฟเวอร์ใส่ให้เอง จากโทเค็นของผู้เล่น):
 *   ACK_REVEAL, SUBMIT_CLUE {text}, CAST_VOTE {targetId}, CONTINUE, REMOVE_PLAYER
 *
 * โหมดวาดรูป (state.mode === 'draw') ใช้เฟสเดิมทั้งหมด โดยเฟส 'clues' คือเฟสผลัดกันวาดคนละเส้น
 *   DRAW_STROKE {stroke}, DRAW_SKIP (เซิร์ฟเวอร์ส่งเองเมื่อหมดเวลา) — โหวตครั้งเดียวตัดสินเกม (ดู CONTINUE)
 */

export const MIN_PLAYERS_TO_START = 3
export const MAX_PLAYERS_OPTIONS = [4, 5, 6, 7, 8]
export const CANDIDATE_COUNT = 8 // จำนวนคำที่ตัวปลอมเห็นเป็นตัวช่วย (มีคำลับรวมอยู่ด้วย)
export const GUESS_OPTION_COUNT = 5 // ตัวเลือกตอนตัวปลอมโดนโหวตออกแล้วต้องเดาคำ

export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const norm = (s) => String(s).trim().toLowerCase()

export const getPlayer = (state, id) => state.players.find((p) => p.id === id)
export const alivePlayers = (state) => state.players.filter((p) => p.alive)
export const currentSpeaker = (state) => getPlayer(state, state.turnOrder[state.turnIndex])

export function imposterCountFor(playerCount, mode = 'words') {
  if (mode === 'draw') return 1 // โหมดวาดรูปมีตัวปลอมคนเดียวเสมอ
  return playerCount >= 7 ? 2 : 1
}

/** lobbyPlayers: [{ id, name }] · mode: 'words' (ใบ้คำ) | 'draw' (วาดรูป) */
export function createGame(lobbyPlayers, bank = WORD_BANK, mode = 'words') {
  const drawMode = mode === 'draw'
  const pool = drawMode ? bank.filter((c) => DRAW_CATEGORIES.includes(c.category.en)) : bank
  const cat = pick(pool.length ? pool : bank)
  const word = pick(cat.words)
  const others = shuffle(cat.words.filter((w) => w !== word)).slice(0, CANDIDATE_COUNT - 1)
  const candidates = shuffle([word, ...others])
  const fakerIds = new Set(
    shuffle(lobbyPlayers.map((p) => p.id)).slice(0, imposterCountFor(lobbyPlayers.length, mode)),
  )
  const players = lobbyPlayers.map((p, i) => ({
    id: p.id,
    name: p.name,
    colorIndex: i,
    role: fakerIds.has(p.id) ? 'imposter' : 'civilian',
    alive: true,
  }))
  const order = shuffle(players.map((p) => p.id))
  return {
    mode: drawMode ? 'draw' : 'words',
    phase: 'reveal',
    round: 1,
    players,
    category: cat.category, // { th, en }
    word, // { th, en }  — ห้ามส่งให้ Faker จนกว่าเกมจะจบ
    candidates, // คำที่ตัวปลอมเห็นเป็นตัวช่วย (รวมคำลับ) — ส่งให้ตัวปลอมเท่านั้น
    pstats: Object.fromEntries(lobbyPlayers.map((p) => [p.id, { clues: 0, votes: 0, correct: 0 }])), // สถิติรายคน (ใช้ให้คะแนน/สรุปตอนจบ)
    peeked: [], // ผู้สร้างที่ใช้ตาทิพย์ไปแล้วในเกมนี้ (คนละ 1 ครั้งต่อเกม)
    guess: null, // ตัวปลอมโดนโหวตออก → { by, options, status: 'pending'|'wrong'|'correct', picked }
    acks: [], // รหัสผู้เล่นที่กด "เข้าใจแล้ว" ในหน้าเปิดบทบาท
    // โหมดวาดรูป: ลำดับเดิมวนซ้ำ DRAW_LAPS รอบ (หนึ่งช่อง = หนึ่งเส้น)
    turnOrder: drawMode ? Array.from({ length: DRAW_LAPS }, () => order).flat() : order,
    turnIndex: 0,
    strokes: [], // โหมดวาดรูป: เส้นที่วาดแล้วทั้งหมด { playerId, pts, w } สีดูจากที่นั่งของผู้เล่น
    clues: [], // คำใบ้ของรอบนี้: { playerId, text }
    history: [], // คำใบ้ของรอบก่อนหน้า
    votes: {}, // voterId -> targetId
    lastResult: null,
    winner: null, // 'civilians' | 'imposters'
  }
}

// ตัวปลอมชนะเมื่อมี "มากกว่า" พลเมือง (เดิมคือเท่ากับก็ชนะ) → เกมยาวขึ้นอีก 1 รอบ
export function checkWinner(players) {
  const alive = players.filter((p) => p.alive)
  const fakers = alive.filter((p) => p.role === 'imposter').length
  const civilians = alive.length - fakers
  if (fakers === 0) return 'civilians'
  if (fakers > civilians) return 'imposters'
  return null
}

export function didIWin(view) {
  const me = getPlayer(view, view.meId)
  const side = me.role === 'imposter' ? 'imposters' : 'civilians'
  return view.winner === side
}

/**
 * คืนรหัสข้อผิดพลาด หรือ '' ถ้าคำใบ้ใช้ได้
 * ใช้ได้ทั้งกับ state เต็ม (เซิร์ฟเวอร์) และ view (ฝั่งเว็บ)
 * หมายเหตุ: ภาษาไทยมีสระ/วรรณยุกต์เป็น \p{M} ต้องรวมไว้ใน regex ด้วย
 */
export function validateClue(state, text, playerId) {
  const t = String(text ?? '').trim()
  if (!t) return 'clueEmpty'
  if (!/^[\p{L}\p{M}\p{N}-]{1,20}$/u.test(t)) return 'clueOneWord'
  const me = getPlayer(state, playerId)
  if (me?.role === 'civilian' && state.word) {
    if (norm(t) === norm(state.word.th) || norm(t) === norm(state.word.en)) return 'clueSecret'
  }
  const used = [...state.history.flat(), ...state.clues].map((c) => norm(c.text))
  if (used.includes(norm(t))) return 'clueUsed'
  return ''
}

/** โหมดวาดรูป: ไปตาถัดไป ถ้าครบทุกเส้นแล้วเข้าสู่การโหวต */
function advanceDrawTurn(state) {
  const turnIndex = state.turnIndex + 1
  if (turnIndex >= state.turnOrder.length) return { ...state, turnIndex, phase: 'voting', votes: {} }
  return { ...state, turnIndex }
}

/** ถ้าทุกคนที่ยังอยู่โหวตครบ → นับคะแนนแล้วไปหน้า elimination */
function maybeTally(state) {
  const alive = alivePlayers(state)
  const voted = alive.filter((p) => state.votes[p.id]).length
  if (voted < alive.length || alive.length === 0) return state

  const votes = state.votes
  const tally = {}
  Object.values(votes).forEach((id) => (tally[id] = (tally[id] || 0) + 1))
  const max = Math.max(...Object.values(tally))
  const top = Object.keys(tally).filter((id) => tally[id] === max)
  const eliminatedId = top.length === 1 ? top[0] : pick(top)
  const out = getPlayer(state, eliminatedId)
  const pstats = { ...state.pstats }
  for (const [voterId, targetId] of Object.entries(votes)) {
    const cur = pstats[voterId] ?? { clues: 0, votes: 0, correct: 0 }
    const hit = getPlayer(state, targetId)?.role === 'imposter'
    pstats[voterId] = { ...cur, votes: cur.votes + 1, correct: cur.correct + (hit ? 1 : 0) }
  }
  let guess = null
  if (out?.role === 'imposter') {
    const wrong = shuffle(state.candidates.filter((w) => w.th !== state.word.th)).slice(0, GUESS_OPTION_COUNT - 1)
    guess = { by: eliminatedId, options: shuffle([state.word, ...wrong]), status: 'pending', picked: null }
  }

  return {
    ...state,
    guess,
    pstats,
    phase: 'elimination',
    players: state.players.map((p) => (p.id === eliminatedId ? { ...p, alive: false } : p)),
    lastResult: { eliminatedId, tally, votes, tie: top.length > 1 },
  }
}

function maybeStartClues(state) {
  const everyoneAcked = alivePlayers(state).every((p) => state.acks.includes(p.id))
  return everyoneAcked ? { ...state, phase: 'clues' } : state
}

/** ผู้เล่นออกกลางเกม → ถือว่าตกรอบ แล้วจัดสถานะให้เดินต่อได้ */
function removePlayer(state, playerId) {
  // ตัวปลอมที่กำลังเดาคำหลุดจากห้อง → ถือว่าเดาผิด เกมเดินต่อได้
  if (state.phase === 'elimination' && state.guess?.status === 'pending' && state.guess.by === playerId) {
    return { ...state, guess: { ...state.guess, status: 'wrong', picked: null, timeout: true } }
  }
  const target = getPlayer(state, playerId)
  if (!target?.alive || state.phase === 'gameover') return state

  let next = {
    ...state,
    players: state.players.map((p) => (p.id === playerId ? { ...p, alive: false } : p)),
  }

  // ถ้ากำลังแสดงผลโหวตอยู่ ให้ปุ่ม "ไปต่อ" ตรวจผู้ชนะเอง
  if (state.phase === 'elimination') return next

  const winner = checkWinner(next.players)
  if (winner) return { ...next, winner, phase: 'gameover' }

  if (state.phase === 'reveal') return maybeStartClues(next)

  if (state.phase === 'clues') {
    if (!state.turnOrder.includes(playerId)) return next
    const turnOrder = state.turnOrder.filter((id) => id !== playerId)
    // ผู้เล่นหนึ่งคนอาจมีหลายช่องในลำดับ (โหมดวาดรูป) → ลดตำแหน่งตามจำนวนช่องที่หายไปก่อนตาปัจจุบัน
    const removedBefore = state.turnOrder.slice(0, state.turnIndex).filter((id) => id === playerId).length
    const turnIndex = state.turnIndex - removedBefore
    next = { ...next, turnOrder, turnIndex }
    if (turnIndex >= turnOrder.length) next = { ...next, phase: 'voting', votes: {} }
    return next
  }

  if (state.phase === 'voting') {
    // ลบโหวตของคนที่ออก และโหวตที่ลงให้คนที่ออก (คนนั้นโหวตใหม่ได้)
    const votes = {}
    Object.entries(state.votes).forEach(([voter, tgt]) => {
      if (voter !== playerId && tgt !== playerId) votes[voter] = tgt
    })
    return maybeTally({ ...next, votes })
  }

  return next
}

export function gameReducer(state, action) {
  if (!state) return state

  switch (action.type) {
    case 'ACK_REVEAL': {
      if (state.phase !== 'reveal') return state
      const p = getPlayer(state, action.playerId)
      if (!p?.alive || state.acks.includes(p.id)) return state
      return maybeStartClues({ ...state, acks: [...state.acks, p.id] })
    }

    case 'SUBMIT_CLUE': {
      if (state.phase !== 'clues' || state.mode === 'draw') return state
      const speakerId = state.turnOrder[state.turnIndex]
      if (action.playerId !== speakerId) return state
      if (validateClue(state, action.text, speakerId)) return state
      const clues = [...state.clues, { playerId: speakerId, text: action.text.trim() }]
      const turnIndex = state.turnIndex + 1
      const cur = state.pstats?.[speakerId] ?? { clues: 0, votes: 0, correct: 0 }
      const pstats = { ...state.pstats, [speakerId]: { ...cur, clues: cur.clues + 1 } }
      if (turnIndex >= state.turnOrder.length) {
        return { ...state, clues, pstats, turnIndex, phase: 'voting', votes: {} }
      }
      return { ...state, clues, pstats, turnIndex }
    }

    case 'CAST_VOTE': {
      if (state.phase !== 'voting') return state
      const voter = getPlayer(state, action.playerId)
      const target = getPlayer(state, action.targetId)
      if (!voter?.alive || !target?.alive || voter.id === target.id) return state
      if (state.votes[voter.id]) return state
      return maybeTally({ ...state, votes: { ...state.votes, [voter.id]: target.id } })
    }

    case 'DRAW_STROKE': {
      if (state.mode !== 'draw' || state.phase !== 'clues') return state
      const speakerId = state.turnOrder[state.turnIndex]
      if (action.playerId !== speakerId) return state
      const stroke = sanitizeStroke(action.stroke)
      if (!stroke) return state
      const cur = state.pstats?.[speakerId] ?? { clues: 0, votes: 0, correct: 0 }
      const pstats = { ...state.pstats, [speakerId]: { ...cur, clues: cur.clues + 1 } }
      const strokes = [...state.strokes, { playerId: speakerId, ...stroke }]
      return advanceDrawTurn({ ...state, strokes, pstats })
    }

    case 'DRAW_SKIP': {
      // เซิร์ฟเวอร์ส่งเมื่อหมดเวลา ต้องตรงกับตาปัจจุบันเป๊ะ ๆ ไม่งั้นเป็นของเก่า (ข้าม)
      if (state.mode !== 'draw' || state.phase !== 'clues') return state
      const speakerId = state.turnOrder[state.turnIndex]
      if (action.round !== state.round || action.turnIndex !== state.turnIndex || action.speaker !== speakerId) return state
      return advanceDrawTurn(state)
    }

    case 'CONTINUE': {
      if (state.phase !== 'elimination') return state
      if (state.guess?.status === 'pending') return state // รอตัวปลอมเดาคำก่อน
      if (state.mode === 'draw') {
        // โหมดวาดรูป: โหวตครั้งเดียวตัดสิน — จับตัวปลอมได้ (แล้วเดาคำไม่ถูก) พลเมืองชนะ จับผิดคน ตัวปลอมชนะ
        const caught = getPlayer(state, state.lastResult?.eliminatedId)?.role === 'imposter'
        const fakerLeft = alivePlayers(state).some((p) => p.role === 'imposter')
        return { ...state, winner: caught || !fakerLeft ? 'civilians' : 'imposters', phase: 'gameover' }
      }
      const winner = checkWinner(state.players)
      if (winner) return { ...state, winner, phase: 'gameover' }
      const aliveIds = state.players.filter((p) => p.alive).map((p) => p.id)
      return {
        ...state,
        phase: 'clues',
        round: state.round + 1,
        history: [...state.history, state.clues],
        clues: [],
        votes: {},
        turnOrder: shuffle(aliveIds),
        turnIndex: 0,
        lastResult: null,
        guess: null,
      }
    }

    case 'CREATOR_PEEK': {
      // เซิร์ฟเวอร์ตรวจแล้วว่าเป็นผู้สร้างก่อนเรียก action นี้
      if (state.phase === 'gameover' || state.peeked.includes(action.playerId)) return state
      return { ...state, peeked: [...state.peeked, action.playerId] }
    }

    case 'GUESS_WORD': {
      if (state.phase !== 'elimination' || state.guess?.status !== 'pending') return state
      if (action.playerId !== state.guess.by) return state
      const opt = state.guess.options[Number(action.index)]
      if (!opt) return state
      const correct = opt.th === state.word.th
      const guess = { ...state.guess, status: correct ? 'correct' : 'wrong', picked: opt }
      // เดาถูก = ตัวปลอมชนะทันที
      if (correct) return { ...state, guess, winner: 'imposters', phase: 'gameover' }
      return { ...state, guess }
    }

    case 'GUESS_TIMEOUT': {
      if (state.phase !== 'elimination' || state.guess?.status !== 'pending') return state
      return { ...state, guess: { ...state.guess, status: 'wrong', picked: null, timeout: true } }
    }

    case 'REMOVE_PLAYER':
      return removePlayer(state, action.playerId)

    default:
      return state
  }
}

/**
 * สร้าง "มุมมอง" ของเกมสำหรับผู้เล่นคนหนึ่ง — ซ่อนข้อมูลลับก่อนส่งออกไป
 *  - บทบาท: เห็นเฉพาะของตัวเอง + คนที่ตกรอบแล้ว (เฉลยทั้งหมดตอนจบเกม)
 *  - คำลับ: Faker จะไม่ได้รับจนกว่าเกมจะจบ
 *  - โหวต: ระหว่างโหวตเห็นแค่ของตัวเองกับจำนวนคนที่โหวตแล้ว
 */
export function viewFor(state, playerId, creator = false) {
  const over = state.phase === 'gameover'
  const me = getPlayer(state, playerId)
  const players = state.players.map((p) => {
    const show = over || p.id === playerId || !p.alive
    const { role, ...rest } = p
    return show ? { ...rest, role } : rest
  })
  const voting = state.phase === 'voting'
  return {
    phase: state.phase,
    round: state.round,
    meId: playerId,
    players,
    fakerCount: state.players.filter((p) => p.role === 'imposter').length,
    category: state.category,
    word: over || me?.role !== 'imposter' ? state.word : null,
    candidates: me?.role === 'imposter' && !over ? state.candidates : null,
    guess: state.guess
      ? {
          by: state.guess.by,
          status: state.guess.status,
          picked: state.guess.picked,
          timeout: !!state.guess.timeout,
          deadline: state.guess.deadline ?? null,
          options: state.guess.by === playerId && state.guess.status === 'pending' ? state.guess.options : null,
        }
      : null,
    // ฟังก์ชันพิเศษเฉพาะผู้สร้าง (null สำหรับผู้เล่นทั่วไป)
    cheat: creator
      ? {
          word: state.word,
          peeked: state.peeked.includes(playerId),
          fakerIds: state.peeked.includes(playerId)
            ? state.players.filter((p) => p.role === 'imposter').map((p) => p.id)
            : null,
          votes: voting ? state.votes : null,
        }
      : null,
    ackCount: state.acks.length,
    iAcked: state.acks.includes(playerId),
    mode: state.mode ?? 'words',
    strokes: state.strokes ?? [],
    turnDeadline: state.phase === 'clues' ? (state.turnDeadline ?? null) : null,
    turnOrder: state.turnOrder,
    turnIndex: state.turnIndex,
    clues: state.clues,
    history: state.history,
    votes: voting ? (state.votes[playerId] ? { [playerId]: state.votes[playerId] } : {}) : state.votes,
    voteCount: Object.keys(state.votes).length,
    lastResult: state.lastResult,
    winner: state.winner,
    // สรุปท้ายเกม + รางวัลของเราเอง (มีเมื่อเกมจบเท่านั้น)
    summary: over
      ? state.players.map((p) => ({ id: p.id, ...(state.pstats?.[p.id] ?? { clues: 0, votes: 0, correct: 0 }) }))
      : null,
    rewards: over ? (state.rewards?.[playerId] ?? null) : null,
  }
}
