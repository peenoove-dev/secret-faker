import { useRef, useState } from 'react'
import { cx } from '../lib/utils'
import { fileToAvatar } from '../lib/image'
import { useRoom } from '../context/RoomContext'
import { AvatarFace } from './game/Avatar'
import { useLang } from '../i18n/LanguageContext'
import { CrownIcon } from './Icons'

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
        'relative flex flex-col items-center rounded-3xl border bg-ink-800/70 px-3 pb-4 pt-5 animate-pop-in',
        isMe ? 'border-neon-blue/50 shadow-glow-blue' : 'border-white/10',
        offline && 'opacity-50',
      )}
      style={{ animationDelay: `${index * 70}ms` }}
    >
      {player.isHost && (
        <span className="absolute -top-3 grid h-7 w-7 place-items-center rounded-full bg-amber-400 text-amber-950 shadow-lg shadow-amber-400/40">
          <CrownIcon width={14} height={14} />
        </span>
      )}

      <div className="relative">
        <AvatarFace
          id={player.id}
          name={player.name}
          colorIndex={index}
          className="h-16 w-16 rounded-2xl text-2xl sm:h-[72px] sm:w-[72px]"
        />
        {isMe && (
          <>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
            <button
              type="button"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
              aria-label={t('profile.change')}
              className="absolute -bottom-1 -left-1 grid h-7 w-7 place-items-center rounded-full border-2 border-ink-800 bg-neon-blue text-sm shadow-lg transition hover:brightness-110 active:scale-90 disabled:opacity-50"
            >
              {busy ? '…' : '📷'}
            </button>
          </>
        )}
        <span
          className={cx(
            'absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-ink-800',
            player.ready ? 'bg-neon-green' : 'bg-slate-500',
          )}
        />
      </div>

      <p className="mt-3 max-w-full truncate font-display text-sm font-bold text-white">
        {player.name}
        {isMe && <span className="ml-1 text-neon-blue">({t('common.you')})</span>}
      </p>
      <p
        className={cx(
          'mt-1 font-mono text-[10px] font-bold uppercase tracking-widest',
          offline ? 'text-amber-300' : player.ready ? 'text-neon-green' : 'text-slate-500',
        )}
      >
        {offline ? t('common.offline') : player.ready ? t('lobby.readyLabel') : t('lobby.notReady')}
      </p>
      {isMe && player.avatarV && (
        <button type="button" onClick={removeAvatar} className="mt-1 text-[10px] text-slate-500 underline hover:text-slate-300">
          {t('profile.remove')}
        </button>
      )}
      {err && <p className="mt-1 text-center text-[10px] text-neon-pink">{err}</p>}
    </div>
  )
}

export function EmptySlot({ index }) {
  const { t } = useLang()
  return (
    <div
      className="flex min-h-[148px] items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02] animate-pop-in"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <span className="text-xs italic text-slate-600">{t('lobby.waiting')}</span>
    </div>
  )
}
