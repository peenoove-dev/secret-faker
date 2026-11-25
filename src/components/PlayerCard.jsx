import { avatarColor, cx, initial } from '../lib/utils'
import { useLang } from '../i18n/LanguageContext'
import { CrownIcon } from './Icons'

export function PlayerCard({ player, index, isMe }) {
  const { t } = useLang()
  const offline = player.connected === false
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
        <div
          className={cx(
            'grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br font-display text-2xl font-bold text-white shadow-lg sm:h-[72px] sm:w-[72px]',
            avatarColor(index),
          )}
        >
          {initial(player.name)}
        </div>
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
