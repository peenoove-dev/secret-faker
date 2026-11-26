import { cx } from '../lib/utils'
import { sfx } from '../lib/sound'

// ปุ่มทุกแบบมี "ขอบล่างหนา" เหมือนปุ่มจริง กดแล้วยุบลงไป
const VARIANTS = {
  primary:
    'bg-gold text-ink shadow-btn-gold hover:-translate-y-px hover:shadow-btn-gold-up active:translate-y-[3px] active:shadow-[0_1px_0_0_#8a5f0b]',
  paper:
    'bg-paper text-ink shadow-btn-paper hover:-translate-y-px hover:shadow-btn-paper-up active:translate-y-[3px] active:shadow-[0_1px_0_0_#a39571]',
  secondary:
    'border-felt-500 bg-felt-800 text-paper shadow-btn-felt hover:-translate-y-px hover:bg-felt-700 hover:shadow-btn-felt-up active:translate-y-[3px] active:shadow-[0_1px_0_0_#061512]',
  danger:
    'bg-ember text-paper shadow-btn-ember hover:-translate-y-px active:translate-y-[3px] active:shadow-[0_1px_0_0_#6a1912]',
  ghost: 'text-felt-200 hover:bg-felt-800 hover:text-paper',
  disabled: 'cursor-not-allowed bg-felt-700 text-felt-300',
}

const SIZES = {
  md: 'h-11 px-5 text-base',
  lg: 'h-14 px-7 text-lg',
}

export default function Button({
  variant = 'primary',
  size = 'lg',
  icon,
  className,
  disabled,
  children,
  onClick,
  ...props
}) {
  return (
    <button
      disabled={disabled}
      onClick={(e) => {
        sfx.click()
        onClick?.(e)
      }}
      className={cx(
        'inline-flex items-center justify-center gap-2.5 rounded-xl border-2 border-transparent font-sans font-bold',
        'transition-[transform,box-shadow,background-color] duration-100',
        SIZES[size],
        disabled ? VARIANTS.disabled : VARIANTS[variant],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}
