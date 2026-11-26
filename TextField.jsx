import { useId } from 'react'
import { cx } from '../lib/utils'

/** ช่องกรอกเป็นกระดาษโน้ต: พื้นครีม ตัวหมึก */
export default function TextField({ label, error, hint, className, inputClassName, ...props }) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="label mb-1.5 block">
        {label}
      </label>
      <input
        id={id}
        autoComplete="off"
        aria-invalid={error ? true : undefined}
        className={cx(
          'h-13 w-full rounded-lg border-2 bg-paper px-4 text-lg text-ink placeholder-ink-faint shadow-inset outline-none transition-colors',
          'focus:border-gold focus-visible:outline-gold',
          error ? 'border-ember' : 'border-paper-edge',
          inputClassName,
        )}
        style={{ height: '3.25rem' }}
        {...props}
      />
      {error ? (
        <p className="mt-2 text-[15px] font-semibold text-ember-soft">{error}</p>
      ) : hint ? (
        <p className="mt-2 text-[15px] text-felt-300">{hint}</p>
      ) : null}
    </div>
  )
}
