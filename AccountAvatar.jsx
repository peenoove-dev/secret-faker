import { accountAvatarUrl } from '../lib/api'
import { colorFromText, cx, initial } from '../lib/utils'

const SPARKS = [
  { left: '-6%', top: '55%', delay: '0s', ch: '✦' },
  { left: '98%', top: '40%', delay: '.7s', ch: '✧' },
  { left: '82%', top: '-4%', delay: '1.4s', ch: '✦' },
  { left: '8%', top: '2%', delay: '2s', ch: '✧' },
]

/** รูปโปรไฟล์ของบัญชี (ถ้าไม่มีรูปจะแสดงตัวอักษรแรกของชื่อบนสีประจำตัว)
 *  บัญชีระดับตำนาน (account.legend): วงแหวนรุ้ง + ออร่า + มงกุฎ + ประกาย (showFx=false เพื่อซ่อนมงกุฎ/ประกายในที่เล็ก ๆ) */
export default function AccountAvatar({ account, className, showFx = true }) {
  const face = (
    <div
      className={cx(
        'relative grid shrink-0 place-items-center overflow-hidden border-2 border-ink font-display text-ink',
        colorFromText(account.username ?? account.displayName),
        className,
      )}
    >
      {account.avatarV ? (
        <img
          src={accountAvatarUrl(account.id, account.avatarV)}
          alt={account.displayName}
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        initial(account.displayName)
      )}
    </div>
  )
  if (!account.legend) return face
  return (
    <div className={cx('legend-wrap shrink-0', className?.match(/rounded-\S+/)?.[0])}>
      {face}
      {showFx && (
        <>
          <span className="legend-crown" aria-hidden>👑</span>
          {SPARKS.map((p, i) => (
            <span key={i} className="legend-spark text-gold-soft" style={{ left: p.left, top: p.top, animationDelay: p.delay }} aria-hidden>
              {p.ch}
            </span>
          ))}
        </>
      )}
    </div>
  )
}
