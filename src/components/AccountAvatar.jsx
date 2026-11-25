import { accountAvatarUrl } from '../lib/api'
import { cx, initial } from '../lib/utils'

/** รูปโปรไฟล์ของบัญชี (ถ้าไม่มีรูปจะแสดงตัวอักษรแรกของชื่อ) */
export default function AccountAvatar({ account, className }) {
  return (
    <div
      className={cx(
        'relative grid shrink-0 place-items-center overflow-hidden bg-gradient-to-br from-violet-500 to-purple-600 font-display font-bold text-white shadow-lg',
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
