// เก็บข้อมูลถาวร (บัญชีผู้ใช้ + คำศัพท์ที่ผู้สร้างเพิ่ม)
//
// ที่เก็บมี 2 แบบ:
//  1) Upstash Redis (ฟรี, อยู่ถาวร) — ใช้เมื่อตั้งตัวแปร UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
//  2) ไฟล์ JSON ใน DATA_DIR (หรือ /var/data ถ้ามี Render Disk, หรือโฟลเดอร์ ./data)
//     ⚠ Render แพลนฟรีลบไฟล์ทุกครั้งที่ deploy ใหม่หรือเซิร์ฟเวอร์หลับ/รีสตาร์ท
//
// ผู้สร้างมีปุ่ม "สำรอง/กู้คืน" ในหน้า Creator เป็นตาข่ายกันข้อมูลหาย
import fs from 'node:fs'
import path from 'node:path'

const KEY = 'secret-faker:data:v1'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export async function createStore(defaultDir) {
  const dir = process.env.DATA_DIR || (fs.existsSync('/var/data') ? '/var/data' : defaultDir)
  const file = path.join(dir, 'data.json')
  const url = (process.env.UPSTASH_REDIS_REST_URL || '').replace(/\/$/, '')
  const rtoken = process.env.UPSTASH_REDIS_REST_TOKEN || ''
  let remote = !!(url && rtoken)

  const redis = async (cmd) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${rtoken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(cmd),
    })
    const j = await res.json()
    if (!res.ok || j.error) throw new Error(j.error || `HTTP ${res.status}`)
    return j.result
  }

  const data = { accounts: {}, sessions: {}, customWords: [] }
  let loaded = false

  if (remote) {
    for (let i = 0; i < 3 && !loaded; i++) {
      try {
        const raw = await redis(['GET', KEY])
        if (raw) Object.assign(data, JSON.parse(raw))
        loaded = true
        console.log(`[store] Upstash Redis connected (${Object.keys(data.accounts).length} accounts)`)
      } catch (e) {
        console.error('[store] Upstash load failed:', e.message)
        await sleep(800)
      }
    }
    if (!loaded) {
      // โหลดไม่สำเร็จ → ห้ามเขียนทับของเดิมบน Redis
      console.error('[store] Upstash unavailable — remote saving disabled for this run')
      remote = false
    }
  }
  if (!loaded) {
    try {
      fs.mkdirSync(dir, { recursive: true })
      Object.assign(data, JSON.parse(fs.readFileSync(file, 'utf8')))
    } catch {
      /* ยังไม่มีไฟล์ — เริ่มใหม่ */
    }
  }

  let timer = null
  let pushing = false
  let dirty = false

  async function push() {
    if (pushing) {
      dirty = true
      return
    }
    pushing = true
    try {
      do {
        dirty = false
        await redis(['SET', KEY, JSON.stringify(data)])
      } while (dirty)
    } catch (e) {
      console.error('[store] Upstash save failed:', e.message)
    }
    pushing = false
  }

  const save = () => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      const json = JSON.stringify(data)
      try {
        fs.mkdirSync(dir, { recursive: true })
        fs.writeFileSync(`${file}.tmp`, json)
        fs.renameSync(`${file}.tmp`, file)
      } catch (e) {
        if (!remote) console.error('[store] file save failed:', e.message)
      }
      if (remote) push()
    }, 300)
  }
  return { data, save, file, remote }
}
