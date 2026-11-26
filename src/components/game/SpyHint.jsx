import { useLang } from '../../i18n/LanguageContext'

/** ตัวช่วยของตัวปลอม: คำลับคือหนึ่งในคำเหล่านี้ (วางบนพื้นกระดาษเสมอ) */
export default function SpyHint({ candidates, compact }) {
  const { t, loc } = useLang()
  if (!candidates?.length) return null
  return (
    <div className={compact ? 'text-left' : 'mt-4 text-left'}>
      <p className="label-ink">{t('spy.hintTitle')}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {candidates.map((w) => (
          <span
            key={w.th}
            className="rounded-md border-2 border-ember/60 bg-ember/10 px-2.5 py-0.5 text-base font-bold text-ink"
          >
            {loc(w)}
          </span>
        ))}
      </div>
    </div>
  )
}
