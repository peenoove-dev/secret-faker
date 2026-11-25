import { cx } from '../lib/utils'
import { MaskIcon } from './Icons'

export default function Logo({ size = 'md', className }) {
  const big = size === 'lg'
  return (
    <div className={cx('flex flex-col items-center text-center', className)}>
      <div
        className={cx(
          'mb-4 grid place-items-center rounded-3xl bg-gradient-to-br from-neon-violet to-neon-pink text-white shadow-glow-purple',
          big ? 'h-20 w-20 animate-float' : 'h-12 w-12',
        )}
      >
        <MaskIcon width={big ? 40 : 24} height={big ? 40 : 24} />
      </div>
      <h1
        className={cx(
          'font-display font-bold leading-none tracking-tight',
          big ? 'text-5xl sm:text-7xl' : 'text-3xl',
        )}
      >
        SECRET <span className="text-gradient">FAKER</span>
      </h1>
    </div>
  )
}
