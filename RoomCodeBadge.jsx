import { useState } from 'react'
import { CheckIcon, CopyIcon } from './Icons'
import { useLang } from '../i18n/LanguageContext'

/** ตั๋วรหัสห้อง: ตัวรหัสใหญ่ ๆ ฝั่งซ้าย รอยปรุตรงกลาง ปุ่มคัดลอกฝั่งขวา */
export default function RoomCodeBadge({ code }) {
  const [copied, setCopied] = useState(false)
  const { t } = useLang()

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      /* clipboard blocked — still show feedback */
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="paper -rotate-1 flex items-stretch">
      <div className="min-w-0 flex-1 px-5 py-3">
        <p className="label-ink">{t('roomCode.label')}</p>
        <p className="font-display text-4xl leading-tight tracking-[0.12em] text-ink">{code}</p>
      </div>
      <button
        onClick={copy}
        aria-label={t('roomCode.copy')}
        className="grid w-16 shrink-0 place-items-center rounded-r-xl border-l-2 border-dashed border-ink/30 text-ink-soft hover:bg-paper-dim hover:text-ink"
      >
        {copied ? <CheckIcon size={24} className="text-mint-deep" /> : <CopyIcon size={24} />}
      </button>
    </div>
  )
}
