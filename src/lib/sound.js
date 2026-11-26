// เอฟเฟกต์เสียง + สั่นเบา ๆ — สังเคราะห์ด้วย Web Audio ทั้งหมด (ไม่มีไฟล์เสียง ไม่เพิ่มขนาดเว็บ)
// - เบราว์เซอร์บังคับให้เริ่มเสียงหลังผู้ใช้แตะหน้าจอ → ปลดล็อกตอนแตะครั้งแรกอัตโนมัติ
// - ปิด/เปิดเสียงและความดังเก็บใน localStorage (ปุ่มอยู่ที่ <SoundToggle />)
import { useSyncExternalStore } from 'react'

const KEY = 'secret-faker:sound:v1'
const listeners = new Set()

function load() {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (p && typeof p === 'object') return { muted: !!p.muted, volume: Math.min(1, Math.max(0, Number(p.volume ?? 0.7))) }
  } catch {
    /* ignore */
  }
  return { muted: false, volume: 0.7 }
}

let prefs = load()
let ctx = null
let master = null
let noiseBuf = null

function emit() {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs))
  } catch {
    /* ignore */
  }
  if (master) master.gain.value = prefs.muted ? 0 : prefs.volume
  listeners.forEach((l) => l())
}

export const setMuted = (muted) => {
  prefs = { ...prefs, muted: !!muted }
  emit()
  if (!muted) sfx.click()
}
export const setVolume = (volume) => {
  prefs = { ...prefs, volume: Math.min(1, Math.max(0, volume)) }
  emit()
}
export function useSoundPrefs() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => prefs,
  )
}

function audio() {
  if (prefs.muted) return null
  if (!ctx) {
    const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)
    if (!AC) return null
    try {
      ctx = new AC()
      master = ctx.createGain()
      master.gain.value = prefs.volume
      master.connect(ctx.destination)
    } catch {
      return null
    }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}

// ปลดล็อกเสียงตอนผู้ใช้แตะ/กดครั้งแรก
if (typeof window !== 'undefined') {
  const unlock = () => {
    audio()
    window.removeEventListener('pointerdown', unlock)
    window.removeEventListener('keydown', unlock)
  }
  window.addEventListener('pointerdown', unlock)
  window.addEventListener('keydown', unlock)
}

/** โน้ตเดี่ยว: f = ความถี่เริ่ม, to = ความถี่ปลาย (เลื่อนเสียง), at = หน่วงกี่วินาที */
function tone({ f, to, at = 0, d = 0.15, type = 'sine', v = 0.25 }) {
  const c = audio()
  if (!c) return
  const t0 = c.currentTime + at
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(f, t0)
  if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + d)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(v, t0 + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + d)
  o.connect(g).connect(master)
  o.start(t0)
  o.stop(t0 + d + 0.03)
}

/** เสียงลม/ซ่า (whoosh) — noise ผ่านฟิลเตอร์ที่กวาดความถี่ */
function whoosh({ at = 0, d = 0.35, from = 400, to = 2400, v = 0.18 }) {
  const c = audio()
  if (!c) return
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate)
    const data = noiseBuf.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  }
  const t0 = c.currentTime + at
  const src = c.createBufferSource()
  src.buffer = noiseBuf
  src.loop = true
  const bp = c.createBiquadFilter()
  bp.type = 'bandpass'
  bp.Q.value = 1.2
  bp.frequency.setValueAtTime(from, t0)
  bp.frequency.exponentialRampToValueAtTime(to, t0 + d)
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(v, t0 + d * 0.4)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + d)
  src.connect(bp).connect(g).connect(master)
  src.start(t0)
  src.stop(t0 + d + 0.05)
}

const notes = (list, base = {}) => list.forEach(([f, at, d]) => tone({ ...base, f, at, d }))

export function vibrate(pattern) {
  if (prefs.muted) return
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* ignore */
  }
}

// โน้ต: C5 523 · E5 659 · G5 784 · C6 1047
export const sfx = {
  click: () => tone({ f: 620, to: 480, d: 0.06, type: 'triangle', v: 0.12 }),
  join: () => notes([[520, 0, 0.1], [780, 0.08, 0.14]], { type: 'sine', v: 0.18 }),
  leave: () => notes([[620, 0, 0.1], [390, 0.08, 0.16]], { type: 'sine', v: 0.16 }),
  ready: () => notes([[660, 0, 0.09], [990, 0.07, 0.14]], { type: 'triangle', v: 0.2 }),
  chat: () => tone({ f: 880, to: 1180, d: 0.09, type: 'sine', v: 0.12 }),
  send: () => tone({ f: 520, to: 760, d: 0.08, type: 'triangle', v: 0.12 }),
  error: () => {
    tone({ f: 190, d: 0.16, type: 'sawtooth', v: 0.13 })
    vibrate(60)
  },
  start: () => {
    whoosh({ d: 0.5, from: 300, to: 3000 })
    notes([[392, 0.05, 0.14], [523, 0.17, 0.14], [659, 0.29, 0.14], [1047, 0.41, 0.35]], { type: 'triangle', v: 0.22 })
    vibrate([40, 40, 80])
  },
  reveal: () => {
    whoosh({ d: 0.4, from: 200, to: 1800, v: 0.16 })
    tone({ f: 330, to: 660, d: 0.3, type: 'sine', v: 0.14 })
  },
  phase: () => whoosh({ d: 0.3, from: 500, to: 2200, v: 0.1 }),
  yourTurn: () => {
    notes([[784, 0, 0.12], [1047, 0.13, 0.22]], { type: 'triangle', v: 0.26 })
    vibrate([60, 50, 60])
  },
  clue: () => tone({ f: 700, to: 420, d: 0.1, type: 'triangle', v: 0.16 }),
  vote: () => {
    tone({ f: 150, to: 70, d: 0.18, type: 'sine', v: 0.32 })
    tone({ f: 900, d: 0.04, type: 'square', v: 0.05 })
  },
  tick: () => tone({ f: 1500, d: 0.04, type: 'square', v: 0.07 }),
  caught: () => {
    // โหวตโดนตัวปลอม
    notes([[523, 0, 0.12], [659, 0.1, 0.12], [784, 0.2, 0.3]], { type: 'triangle', v: 0.22 })
    vibrate([80, 40, 80])
  },
  eliminated: () => {
    // พลเมืองโดนไล่ผิดคน
    tone({ f: 330, to: 110, d: 0.5, type: 'sawtooth', v: 0.18 })
    tone({ f: 165, to: 55, d: 0.55, type: 'sine', v: 0.25 })
    vibrate([140])
  },
  win: () => {
    notes([[523, 0, 0.14], [659, 0.13, 0.14], [784, 0.26, 0.14], [1047, 0.39, 0.5]], { type: 'triangle', v: 0.24 })
    notes([[262, 0.39, 0.55], [392, 0.39, 0.55]], { type: 'sine', v: 0.14 })
    vibrate([60, 40, 60, 40, 140])
  },
  lose: () => {
    notes([[392, 0, 0.2], [330, 0.2, 0.2], [262, 0.4, 0.5]], { type: 'sawtooth', v: 0.12 })
    vibrate([200])
  },
  achievement: () => {
    notes([[1047, 0, 0.1], [1319, 0.09, 0.1], [1568, 0.18, 0.1], [2093, 0.27, 0.4]], { type: 'sine', v: 0.18 })
  },
}
