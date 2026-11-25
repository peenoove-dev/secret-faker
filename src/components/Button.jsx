import { cx } from '../lib/utils'

const VARIANTS = {
  primary:
    'bg-gradient-to-r from-neon-purple to-neon-pink text-white shadow-glow-pink hover:brightness-110',
  neon:
    'bg-gradient-to-r from-neon-blue to-neon-violet text-white shadow-glow-blue hover:brightness-110',
  secondary:
    'border border-white/15 bg-white/5 text-slate-100 hover:border-neon-blue/60 hover:bg-white/10 hover:shadow-glow-blue',
  ghost: 'text-slate-300 hover:bg-white/5 hover:text-white',
  disabled: 'cursor-not-allowed bg-ink-700 text-slate-500 shadow-none',
}

const SIZES = {
  md: 'h-12 px-6 text-sm',
  lg: 'h-14 px-8 text-base',
}

export default function Button({
  variant = 'primary',
  size = 'lg',
  icon,
  className,
  disabled,
  children,
  ...props
}) {
  return (
    <button
      disabled={disabled}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-2xl font-display font-bold uppercase tracking-wide',
        'transition duration-200 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue',
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
