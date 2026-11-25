import { cx } from '../lib/utils'

/** Pill-style option picker. options: [{ value, label }] */
export default function Segmented({ label, options, value, onChange, className }) {
  return (
    <div className={className}>
      {label && <span className="label-tiny mb-2 block">{label}</span>}
      <div className="flex gap-2 rounded-2xl border border-white/10 bg-ink-900/80 p-1.5">
        {options.map((opt) => {
          const active = opt.value === value
          return (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cx(
                'h-11 flex-1 rounded-xl font-display text-sm font-bold transition',
                active
                  ? 'bg-gradient-to-r from-neon-violet to-neon-purple text-white shadow-glow-purple'
                  : 'text-slate-400 hover:text-white',
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
