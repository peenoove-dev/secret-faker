import { useId } from 'react'
import { cx } from '../lib/utils'

export default function TextField({ label, error, hint, className, inputClassName, ...props }) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="label-tiny mb-2 block">
        {label}
      </label>
      <input
        id={id}
        autoComplete="off"
        className={cx(
          'h-14 w-full rounded-2xl border bg-ink-900/80 px-4 text-base text-white placeholder-slate-600 outline-none transition',
          'focus:border-neon-blue focus:shadow-glow-blue',
          error ? 'border-red-500/70' : 'border-white/10',
          inputClassName,
        )}
        {...props}
      />
      {error ? (
        <p className="mt-2 text-xs font-medium text-red-400">{error}</p>
      ) : hint ? (
        <p className="mt-2 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  )
}
