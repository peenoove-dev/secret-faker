import { accountAvatarUrl } from '../lib/api'
import { colorFromText, cx, initial } from '../lib/utils'

/** รูปโปรไฟล์ของบัญชี (ถ้าไม่มีรูปจะแสดงตัวอักษรแรกของชื่อบนสีประจำตัว) */
export default function AccountAvatar({ account, className }) {
  return (
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
}
