// ใช้ในเครื่อง: node scripts/seed-creator.js <ชื่อบัญชี> <รหัสผ่าน>
// สร้าง/อัปเกรดบัญชีผู้สร้างระดับตำนานลง data/data.json (หยุดเซิร์ฟเวอร์ก่อนรัน)
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createStore } from '../server/store.js'
import { createAccounts } from '../server/accounts.js'
import { levelFor } from '../shared/achievements.js'

const [user, pass] = process.argv.slice(2)
if (!user) {
  console.error('วิธีใช้: node scripts/seed-creator.js <ชื่อบัญชี> <รหัสผ่าน>')
  process.exit(1)
}
const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../data')
const store = await createStore(dir)
const accounts = createAccounts(store)
const a = await accounts.ensureLegend(user, pass)
console.log(`พร้อมแล้ว: @${a.username} เลเวล ${levelFor(a.stats.points)} ความสำเร็จ ${Object.keys(a.achievements).length} อัน`)
process.exit(0)
