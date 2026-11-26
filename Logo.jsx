import { cx } from '../lib/utils'
import { MaskIcon } from './Icons'

/** ไพ่สองใบซ้อนกัน: หลังไพ่ + ไพ่หงายที่มีหน้ากาก */
export function LogoMark({ size = 48, className }) {
  const w = size * 0.62
  const h = size * 0.86
  return (
    <span aria-hidden className={cx('relative inline-block shrink-0', className)} style={{ width: size, height: size }}>
      <span className="card-back absolute" style={{ width: w, height: h, left: 0, top: size * 0.1, transform: 'rotate(-13deg)' }} />
      <span
        className="paper absolute grid place-items-center text-ember"
        style={{ width: w, height: h, right: 0, top: size * 0.02, transform: 'rotate(9deg)' }}
      >
        <MaskIcon size={size * 0.38} strokeWidth={2.2} />
      </span>
    </span>
  )
}

export default function Logo({ size = 'md', className }) {
  if (size === 'lg') {
    return (
      <h1 className={cx('font-display leading-[0.95] text-paper', className)}>
        <span className="block text-[clamp(3.5rem,13vw,6.5rem)]">Secret</span>
        <span className="block -rotate-2 text-[clamp(3.5rem,13vw,6.5rem)]">Faker</span>
      </h1>
    )
  }
  return (
    <div className={cx('flex items-center gap-4', className)}>
      <LogoMark size={52} />
      <h1 className="font-display text-3xl leading-none text-paper">Secret Faker</h1>
    </div>
  )
}
