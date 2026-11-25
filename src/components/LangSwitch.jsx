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
      className={cx('inline-flex rounded-xl border border-white/10 bg-ink-900/80 p-1 text-xs font-bold', className)}
    >
      {opts.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => setLang(o.v)}
          aria-pressed={lang === o.v}
          className={cx(
            'rounded-lg px-3 py-1.5 transition',
            lang === o.v ? 'bg-neon-violet text-white' : 'text-slate-400 hover:text-white',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
