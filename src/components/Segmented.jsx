import { cx } from '../lib/utils'

/** ตัวเลือกแบบแถบ: อันที่เลือกเป็นป้ายทองยกขึ้น. options: [{ value, label }] */
export default function Segmented({ label, options, value, onChange, className }) {
  return (
    <div className={className}>
      {label && <span className="label mb-1.5 block">{label}</span>}
      <div className="flex gap-1.5 rounded-xl border-2 border-felt-600 bg-felt-950 p-1">
        {options.map((opt) => {
          const active = opt.value === value
          return (
            <button
              key={String(opt.value)}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(opt.value)}
              className={cx(
                'h-11 flex-1 rounded-lg text-base font-bold transition-colors',
                active ? 'bg-gold text-ink shadow-[0_2px_0_0_#8a5f0b]' : 'text-felt-200 hover:bg-felt-800 hover:text-paper',
              )}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
