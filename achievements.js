// ระบบคะแนน เลเวล และความสำเร็จ — ตรรกะล้วน ๆ ใช้ได้ทั้งเซิร์ฟเวอร์และหน้าเว็บ
// เซิร์ฟเวอร์เป็นผู้ให้คะแนนเท่านั้น (เรียก applyGameResult ตอนเกมจบ)

export const POINTS = {
  play: 3, // เล่นจนจบ 1 เกม
  win: 10, // ชนะ
  spyWinBonus: 5, // ชนะในบทบาทตัวปลอม (ยากกว่า)
  correctVote: 2, // โหวตโดนตัวปลอมแต่ละครั้ง
  guessBonus: 5, // ตัวปลอมเดาคำลับถูก
}

/** เลเวลจากคะแนนรวม (เลเวล 1 = 0 แต้ม, 2 = 12, 3 = 48, 4 = 108 …) */
export const levelFor = (points) => Math.floor(Math.sqrt(Math.max(0, points) / 12)) + 1
export const levelStart = (level) => 12 * (level - 1) ** 2

export const emptyStats = () => ({
  played: 0,
  wins: 0,
  spyPlayed: 0,
  spyWins: 0,
  points: 0,
  streak: 0, // ชนะติดต่อกันตอนนี้
  bestStreak: 0,
  correctVotes: 0, // โหวตโดนตัวปลอมทั้งหมด
  guessWins: 0, // เดาคำลับถูกตอนเป็นตัวปลอม
})

/**
 * เงื่อนไขความสำเร็จ: check(stats, ctx) → boolean
 *  ctx = ผลของเกมล่าสุด { won, spy, alive, guessedRight, playerCount, votesCast, correctVotes }
 */
export const ACHIEVEMENTS = [
  { id: 'first_game', icon: '🎮', check: (s) => s.played >= 1 },
  { id: 'first_win', icon: '🏅', check: (s) => s.wins >= 1 },
  { id: 'veteran', icon: '🎖️', check: (s) => s.played >= 10 },
  { id: 'addict', icon: '🔥', check: (s) => s.played >= 50 },
  { id: 'winner', icon: '🏆', check: (s) => s.wins >= 10 },
  { id: 'streak3', icon: '⚡', check: (s) => s.bestStreak >= 3 },
  { id: 'faker_win', icon: '🎭', check: (s) => s.spyWins >= 1 },
  { id: 'master_faker', icon: '🦊', check: (s) => s.spyWins >= 5 },
  { id: 'detective', icon: '🔎', check: (s) => s.correctVotes >= 10 },
  { id: 'mind_reader', icon: '🧠', check: (s) => s.guessWins >= 1 },
  { id: 'ghost', icon: '👻', check: (_s, c) => c.spy && c.won && c.alive && !c.guessedRight },
  {
    id: 'flawless',
    icon: '💎',
    check: (_s, c) => !c.spy && c.won && c.votesCast >= 2 && c.correctVotes === c.votesCast,
  },
  { id: 'full_house', icon: '🏠', check: (_s, c) => c.playerCount >= 8 },
  { id: 'rising_star', icon: '⭐', check: (s) => levelFor(s.points) >= 5 },
]

/**
 * บันทึกผลเกมลงบัญชี (แก้ acc.stats / acc.achievements ตรง ๆ)
 * คืน { points, level, leveledUp, achievements: [id ที่เพิ่งปลดล็อก] }
 */
export function applyGameResult(acc, ctx) {
  acc.stats = { ...emptyStats(), ...(acc.stats ?? {}) }
  acc.achievements = acc.achievements ?? {}
  const s = acc.stats
  const levelBefore = levelFor(s.points)

  let gained = POINTS.play + ctx.correctVotes * POINTS.correctVote
  s.played++
  if (ctx.won) {
    s.wins++
    s.streak++
    s.bestStreak = Math.max(s.bestStreak, s.streak)
    gained += POINTS.win
  } else {
    s.streak = 0
  }
  if (ctx.spy) {
    s.spyPlayed++
    if (ctx.won) {
      s.spyWins++
      gained += POINTS.spyWinBonus
    }
  }
  if (ctx.guessedRight) {
    s.guessWins++
    gained += POINTS.guessBonus
  }
  s.correctVotes += ctx.correctVotes
  s.points += gained

  const unlocked = []
  for (const a of ACHIEVEMENTS) {
    if (!acc.achievements[a.id] && a.check(s, ctx)) {
      acc.achievements[a.id] = Date.now()
      unlocked.push(a.id)
    }
  }
  const level = levelFor(s.points)
  return { points: gained, level, leveledUp: level > levelBefore, achievements: unlocked }
}

/* ---------- บัญชีระดับตำนาน (ผู้สร้าง) ---------- */
export const LEGEND_LEVEL = 999

/** ตั้งสถิติ/เลเวล/ความสำเร็จให้บัญชีระดับตำนาน: เลเวล 999 + ปลดล็อกความสำเร็จครบทุกอัน */
export function grantLegend(acc) {
  const base = emptyStats()
  const s = { ...base, ...(acc.stats ?? {}) }
  // คะแนนขั้นต่ำที่ทำให้ได้เลเวล LEGEND_LEVEL พอดี (ไม่ลดคะแนนที่มีอยู่แล้วถ้าสูงกว่า)
  s.points = Math.max(s.points, levelStart(LEGEND_LEVEL))
  // สถิติให้สอดคล้องกับเงื่อนไขความสำเร็จทุกอัน
  s.played = Math.max(s.played, 999)
  s.wins = Math.max(s.wins, 888)
  s.spyPlayed = Math.max(s.spyPlayed, 300)
  s.spyWins = Math.max(s.spyWins, 250)
  s.bestStreak = Math.max(s.bestStreak, 50)
  s.streak = Math.max(s.streak, 12)
  s.correctVotes = Math.max(s.correctVotes, 500)
  s.guessWins = Math.max(s.guessWins, 100)
  acc.stats = s
  acc.achievements = acc.achievements ?? {}
  const now = Date.now()
  for (const a of ACHIEVEMENTS) acc.achievements[a.id] ??= now
  acc.legend = true
  return acc
}
