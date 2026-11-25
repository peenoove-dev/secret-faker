import { useState } from 'react'
import { CheckIcon, CopyIcon } from './Icons'
import { useLang } from '../i18n/LanguageContext'

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
    <div className="flex items-center justify-between rounded-full border border-white/10 bg-ink-800/80 py-3 pl-6 pr-3 backdrop-blur-md">
      <div>
        <p className="label-tiny !text-[9px]">{t('roomCode.label')}</p>
        <p className="mt-1 font-mono text-2xl font-bold tracking-[0.18em] text-white">{code}</p>
      </div>
      <button
        onClick={copy}
        aria-label={t('roomCode.copy')}
        className="grid h-11 w-11 place-items-center rounded-2xl bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-neon-blue"
      >
        {copied ? <CheckIcon className="text-neon-green" /> : <CopyIcon />}
      </button>
    </div>
  )
}
