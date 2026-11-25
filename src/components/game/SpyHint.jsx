import { useLang } from '../../i18n/LanguageContext'

/** ตัวช่วยของตัวปลอม: คำลับคือหนึ่งในคำเหล่านี้ */
export default function SpyHint({ candidates, compact }) {
  const { t, loc } = useLang()
  if (!candidates?.length) return null
  return (
    <div className={compact ? 'text-left' : 'mt-4 text-left'}>
      <p className="label-tiny !text-neon-pink">{t('spy.hintTitle')}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {candidates.map((w) => (
          <span
            key={w.th}
            className="rounded-full border border-neon-pink/30 bg-neon-pink/10 px-2.5 py-1 text-xs font-bold text-white"
          >
            {loc(w)}
          </span>
        ))}
      </div>
    </div>
  )
}
