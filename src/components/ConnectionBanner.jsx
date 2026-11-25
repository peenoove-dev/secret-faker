import { useRoom } from '../context/RoomContext'
import { useLang } from '../i18n/LanguageContext'

/** แถบเตือนเมื่อเน็ตหลุด (จะเชื่อมต่อใหม่อัตโนมัติ) */
export default function ConnectionBanner() {
  const { online } = useRoom()
  const { t } = useLang()
  if (online) return null
  return (
    <div className="fixed inset-x-0 top-0 z-50 bg-amber-400 px-4 py-2 text-center text-sm font-bold text-amber-950">
      {t('lobby.reconnecting')}
    </div>
  )
}
