import { useLang } from '../i18n/LanguageContext'
import { cx } from '../lib/utils'

/** ปุ่มสลับภาษา ไทย / EN */
export default function LangSwitch({ className }) {
  const { lang, setLang } = useLang()
  const opts = [
    { v: 'th', label: 'ไทย' },
    { v: 'en', label: 'EN' },
  ]
  return (
    <div
      role="group"
      aria-label="Language"
      className={cx('inline-flex h-9 rounded-lg border-2 border-felt-600 bg-felt-950 p-0.5 text-sm font-bold', className)}
    >
      {opts.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => setLang(o.v)}
          aria-pressed={lang === o.v}
          className={cx(
            'rounded-md px-3 transition-colors',
            lang === o.v ? 'bg-paper text-ink' : 'text-felt-200 hover:text-paper',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
