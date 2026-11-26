import { useRef, useState } from 'react'
import { cx } from '../lib/utils'
import { fileToAvatar } from '../lib/image'
import { useRoom } from '../context/RoomContext'
import { AvatarFace } from './game/Avatar'
import { useLang } from '../i18n/LanguageContext'
import { CameraIcon, CrownIcon, SUITS, SuitIcon } from './Icons'

export function PlayerCard({ player, index, isMe }) {
  const { t } = useLang()
  const offline = player.connected === false
  const { uploadAvatar } = useRoom()
  const fileRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setErr('')
    setBusy(true)
    try {
      const r = await uploadAvatar(await fileToAvatar(file))
      if (!r.ok) setErr(t(`err.${r.error}`))
    } catch {
      setErr(t('err.badImage'))
    }
    setBusy(false)
  }
  const removeAvatar = async () => {
    setBusy(true)
    await uploadAvatar(null)
    setBusy(false)
  }
  return (
    <div
      className={cx(
        'paper relative flex flex-col items-center px-3 pb-4 pt-5 animate-pop-in',
        isMe && 'ring-4 ring-gold ring-offset-2 ring-offset-felt-900',
        offline && 'opacity-60 grayscale',
      )}
    >
      {/* แต้มไพ่ประจำที่นั่ง */}
      <span
        className={cx('absolute left-2.5 top-2.5', SUITS[index % SUITS.length].red ? 'text-ember' : 'text-ink')}
        aria-hidden
      >
        <SuitIcon index={index} size={16} />
      </span>

      {player.isHost && (
        <span
          title="Host"
          className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full border-2 border-ink bg-gold text-ink"
        >
          <CrownIcon size={14} />
        </span>
      )}

      <div className="relative">
        <AvatarFace
          id={player.id}
          name={player.name}
          colorIndex={index}
          className="h-[68px] w-[68px] rounded-xl text-3xl sm:h-[76px] sm:w-[76px]"
        />
        {isMe && (
          <>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
            <button
              type="button"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
              aria-label={t('profile.change')}
              className="absolute -bottom-2 -right-2 grid h-8 w-8 place-items-center rounded-full border-2 border-paper bg-ink text-paper transition-transform hover:scale-105 active:scale-90 disabled:opacity-50"
            >
              {busy ? <span className="text-xs">…</span> : <CameraIcon size={15} />}
            </button>
          </>
        )}
      </div>

      <p className="mt-3.5 max-w-full truncate font-display text-lg leading-tight text-ink">
        {player.name}
      </p>
      {isMe && <p className="text-sm font-semibold text-ink-soft">({t('common.you')})</p>}

      <div className="mt-2 flex h-8 items-center">
        {offline ? (
          <span className="text-sm font-bold text-ember-deep">{t('common.offline')}</span>
        ) : player.ready ? (
          <span key="ready" className="stamp animate-stamp border-mint-deep text-base text-mint-deep">
            {t('lobby.readyLabel')}
          </span>
        ) : (
          <span className="text-sm font-semibold text-ink-faint">{t('lobby.notReady')}</span>
        )}
      </div>

      {isMe && player.avatarV && (
        <button type="button" onClick={removeAvatar} className="mt-1 text-sm text-ink-soft underline hover:text-ink">
          {t('profile.remove')}
        </button>
      )}
      {err && <p className="mt-1 text-center text-sm font-semibold text-ember-deep">{err}</p>}
    </div>
  )
}

export function EmptySlot() {
  const { t } = useLang()
  return (
    <div className="flex min-h-[188px] items-center justify-center rounded-xl border-2 border-dashed border-felt-600 px-3">
      <span className="text-center text-base text-felt-300">{t('lobby.waiting')}</span>
    </div>
  )
}
