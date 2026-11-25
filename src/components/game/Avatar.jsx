import { avatarColor, cx, initial } from '../../lib/utils'

const SIZES = {
  sm: 'h-10 w-10 rounded-xl text-base',
  md: 'h-14 w-14 rounded-2xl text-xl',
  lg: 'h-20 w-20 rounded-3xl text-3xl',
}

export default function Avatar({ player, size = 'md', className }) {
  return (
    <div
      className={cx(
        'grid shrink-0 place-items-center bg-gradient-to-br font-display font-bold text-white shadow-lg',
        SIZES[size],
        avatarColor(player.colorIndex),
        !player.alive && 'opacity-40 grayscale',
        className,
      )}
    >
      {initial(player.name)}
    </div>
  )
}
