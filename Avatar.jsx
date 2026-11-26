import { useRoom } from '../../context/RoomContext'
import { avatarUrl } from '../../lib/api'
import { avatarColor, cx, initial } from '../../lib/utils'

const SIZES = {
  sm: 'h-10 w-10 rounded-lg text-lg',
  md: 'h-14 w-14 rounded-xl text-2xl',
  lg: 'h-20 w-20 rounded-xl text-4xl',
}

/** รูปโปรไฟล์ (ถ้ามี) หรือตัวอักษรแรกของชื่อ — ใช้ได้ทั้งในห้องรอและในเกม */
export function AvatarFace({ id, name, colorIndex = 0, className, dim }) {
  const { session, room } = useRoom()
  const v = room?.players.find((p) => p.id === id)?.avatarV
  return (
    <div
      className={cx(
        'relative grid shrink-0 place-items-center overflow-hidden border-2 border-ink font-display text-ink',
        avatarColor(colorIndex),
        dim && 'opacity-40 grayscale',
        className,
      )}
    >
      {v && session ? (
        <img
          src={avatarUrl(session.code, id, v)}
          alt={name}
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        initial(name)
      )}
    </div>
  )
}

export default function Avatar({ player, size = 'md', className }) {
  return (
    <AvatarFace
      id={player.id}
      name={player.name}
      colorIndex={player.colorIndex}
      dim={!player.alive}
      className={cx(SIZES[size], className)}
    />
  )
}
