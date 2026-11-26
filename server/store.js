// เก็บข้อมูลถาวร (บัญชีผู้ใช้ + เซสชัน + คำศัพท์ที่ผู้สร้างเพิ่ม)
//
// ที่เก็บมี 2 แบบ:
//  1) Upstash Redis (ฟรี, อยู่ถาวร) — ใช้เมื่อตั้งตัวแปร UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
//  2) ไฟล์ JSON ใน DATA_DIR (หรือ /var/data ถ้ามี Render Disk, หรือโฟลเดอร์ ./data)
//     ⚠ Render แพลนฟรีลบไฟล์ทุกครั้งที่ deploy ใหม่หรือเซิร์ฟเวอร์หลับ/รีสตาร์ท (หลับหลังไม่มีคนใช้ ~15 นาที)
//
// หลักการ:
//  - save()     = สั่งบันทึกแบบหน่วงสั้น ๆ (ใช้กับข้อมูลที่ไม่สำคัญมาก เช่น สถิติ)
//  - flush()    = บันทึกเดี๋ยวนี้และ "รอจนเขียนสำเร็จ" (ใช้ตอนสมัครสมาชิก/ล็อกอิน — ตอบสำเร็จหลังข้อมูลลงที่เก็บแล้วเท่านั้น)
//  - ถ้าตั้ง Upstash แล้วแต่ต่อไม่ได้ตอนเปิดเซิร์ฟเวอร์ → ไม่เริ่มทำงานด้วยข้อมูลว่าง (กันเขียนทับของจริง) ให้ Render เปิดใหม่เอง
import fs from 'node:fs'
import path from 'node:path'

const KEY = 'secret-faker:data:v1'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export async function createStore(defaultDir) {
  const explicitDir = process.env.DATA_DIR || (fs.existsSync('/var/data') ? '/var/data' : '')
  const dir = explicitDir || defaultDir
  const file = path.join(dir, 'data.json')
  const url = (process.env.UPSTASH_REDIS_REST_URL || '').replace(/\/$/, '')
  const rtoken = process.env.UPSTASH_REDIS_REST_TOKEN || ''
  const remote = !!(url && rtoken)

  const redis = async (cmd) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${rtoken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(cmd),
      signal: AbortSignal.timeout(10_000),
    })
    const j = await res.json()
    if (!res.ok || j.error) throw new Error(j.error || `HTTP ${res.status}`)
    return j.result
  }

  const data = { accounts: {}, sessions: {}, customWords: [] }

  /* ---------- โหลดข้อมูลตอนเปิดเซิร์ฟเวอร์ ---------- */
  if (remote) {
    let loaded = false
    for (let i = 0; i < 6 && !loaded; i++) {
      try {
        const raw = await redis(['GET', KEY])
        if (raw) Object.assign(data, JSON.parse(raw))
        loaded = true
      } catch (e) {
        console.error(`[store] Upstash load failed (try ${i + 1}/6):`, e.message)
        await sleep(1000 * 2 ** i)
      }
    }
    if (!loaded) {
      console.error('[store] FATAL: ต่อ Upstash ไม่ได้ — ไม่เริ่มเซิร์ฟเวอร์ด้วยข้อมูลว่างเพื่อกันบัญชีถูกเขียนทับ (ตรวจ URL/TOKEN แล้วเปิดใหม่)')
      process.exit(1)
    }
  } else {
    try {
      fs.mkdirSync(dir, { recursive: true })
      if (fs.existsSync(file)) {
        try {
          Object.assign(data, JSON.parse(fs.readFileSync(file, 'utf8')))
        } catch (e) {
          // ไฟล์เสีย → เก็บไว้ดู ไม่เขียนทับเงียบ ๆ
          const bad = `${file}.corrupt-${Date.now()}`
          fs.renameSync(file, bad)
          console.error(`[store] data.json อ่านไม่ได้ (${e.message}) — ย้ายไปเก็บที่ ${bad}`)
        }
      }
    } catch (e) {
      console.error('[store] cannot prepare data dir:', e.message)
    }
  }
  data.accounts ??= {}
  data.sessions ??= {}
  data.customWords ??= []

  const mode = remote ? 'redis' : 'file'
  // ไม่มี Upstash และไม่มีดิสก์ถาวร (Render แพลนฟรีไม่มี) → ข้อมูลจะหายเมื่อเซิร์ฟเวอร์หลับ/deploy
  const ephemeral = !remote && !explicitDir && !!process.env.RENDER
  console.log(`[store] mode=${mode} accounts=${Object.keys(data.accounts).length} sessions=${Object.keys(data.sessions).length}`)
  if (ephemeral) {
    console.warn(
      '[store] ⚠⚠ ยังไม่ได้ตั้ง UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN — บน Render แพลนฟรีบัญชีจะหายทุกครั้งที่เซิร์ฟเวอร์หลับหรือ deploy ใหม่',
    )
  }

  /* ---------- บันทึก ---------- */
  async function persist() {
    const json = JSON.stringify(data)
    let fileErr = null
    try {
      fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(`${file}.tmp`, json)
      fs.renameSync(`${file}.tmp`, file) // เขียนไฟล์ชั่วคราวก่อนแล้วสลับชื่อ → ไฟล์ไม่พังครึ่งทางถ้าดับกลางคัน
    } catch (e) {
      fileErr = e
    }
    if (remote) await redis(['SET', KEY, json])
    else if (fileErr) throw fileErr
  }

  let chain = Promise.resolve() // เรียงคิวการเขียน ไม่ให้ทับกันเอง
  let timer = null
  let retry = null

  function flush() {
    clearTimeout(timer)
    const p = chain.then(persist)
    chain = p.catch(() => {})
    return p
  }

  function save() {
    clearTimeout(timer)
    timer = setTimeout(() => {
      flush().then(
        () => clearTimeout(retry),
        (e) => {
          console.error('[store] save failed — จะลองใหม่ใน 5 วินาที:', e.message)
          clearTimeout(retry)
          retry = setTimeout(save, 5000)
        },
      )
    }, 300)
  }

  return { data, save, flush, file, mode, remote, ephemeral }
}
