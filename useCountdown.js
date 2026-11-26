import { useEffect, useState } from 'react'

/** นับถอยหลังเป็นวินาทีถึงเวลา deadline (เวลาของเซิร์ฟเวอร์, ms) — คืน null ถ้าไม่มี deadline */
export default function useCountdown(deadline) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!deadline) return
    setNow(Date.now())
    const i = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(i)
  }, [deadline])
  return deadline ? Math.max(0, Math.ceil((deadline - now) / 1000)) : null
}
