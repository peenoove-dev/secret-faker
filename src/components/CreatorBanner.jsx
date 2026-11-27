import { useEffect } from 'react'
import { useRoom } from '../context/RoomContext'
import { useLang } from '../i18n/LanguageContext'
import { sfx, vibrate } from '../lib/sound'
import { cx } from '../lib/utils'

/**
 * แจ้งเตือนเกี่ยวกับผู้สร้างให้ทุกคนในห้อง
 *  - แบนเนอร์ใหญ่ + เสียง เมื่อผู้สร้างเพิ่งเข้าห้อง (เซิร์ฟเวอร์ส่งอีเวนต์ creator-alert)
 *  - ป้ายเล็กคงอยู่ด้านบนตลอดเวลาที่ผู้สร้างออนไลน์อยู่ในห้อง
 */
export default function CreatorBanner() {
  const { t } = useLang()
  const { room, me, creatorAlert, clearCreatorAlert } = useRoom()

  useEffect(() => {
    if (!creatorAlert) return
    sfx.creator()
    vibrate([60, 40, 60])
    const timer = setTimeout(clearCreatorAlert, 6000)
    return () => clearTimeout(timer)
  }, [creatorAlert, clearCreatorAlert])

  const online = room?.players.filter((p) => p.creator && p.connected && p.id !== me?.id) ?? []

  return (
    <>
      {creatorAlert && (
        <div key={creatorAlert.key} role="alert" className="creator-alert motion-reduce:!animate-none">
          <p className="text-2xl leading-none">👑 ✦ 👑</p>
          <p className={cx('mt-1 font-display text-xl leading-tight', creatorAlert.legend && 'legend-name')}>
            {creatorAlert.name}
          </p>
          <p className="text-base font-bold">{t('creator.alert')}</p>
        </div>
      )}
      {!creatorAlert && online.length > 0 && (
        <p className="creator-chip" aria-live="polite">
          👑 {t('creator.online', { name: online.map((p) => p.name).join(', ') })}
        </p>
      )}
    </>
  )
}
