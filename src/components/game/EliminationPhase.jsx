import Button from '../Button'
import Avatar from './Avatar'
import { getPlayer } from '../../../shared/gameLogic.js'
import { useLang } from '../../i18n/LanguageContext'
import { cx } from '../../lib/utils'

export default function EliminationPhase({ game, act, isHost }) {
  const { t } = useLang()
  const { eliminatedId, votes, tally, tie } = game.lastResult
  const out = getPlayer(game, eliminatedId)
  const wasFaker = out.role === 'imposter'
  const top = Math.max(...Object.values(tally))

  return (
    <div className="mx-auto max-w-md text-center animate-fade-up">
      <p className="label-tiny">{t('elim.votedOut')}</p>

      <div className="mt-6 flex flex-col items-center">
        <Avatar player={{ ...out, alive: true }} size="lg" className="animate-pop-in" />
        <h2 className="mt-4 font-display text-3xl font-bold">
          {out.name}
          {out.id === game.meId && <span className="text-neon-blue"> ({t('common.you')})</span>}
        </h2>
        <p
          className={cx(
            'mt-3 rounded-full border px-4 py-1.5 font-display text-sm font-bold uppercase tracking-widest',
            wasFaker
              ? 'border-neon-pink/50 bg-neon-pink/10 text-neon-pink'
              : 'border-neon-blue/50 bg-neon-blue/10 text-neon-blue',
          )}
        >
          {wasFaker ? t('elim.wasFaker') : t('elim.wasCivilian')}
        </p>
        {tie && <p className="mt-3 text-xs text-slate-500">{t('elim.tie')}</p>}
      </div>

      <div className="card mt-8 divide-y divide-white/5 p-2 text-left">
        {Object.entries(votes).map(([voterId, targetId]) => {
          const voter = getPlayer(game, voterId)
          const target = getPlayer(game, targetId)
          return (
            <div key={voterId} className="flex items-center justify-between px-3 py-2 text-sm">
              <span className="text-slate-300">{voter.name}</span>
              <span className="text-slate-500">→</span>
              <span className={cx('font-bold', tally[targetId] === top ? 'text-white' : 'text-slate-400')}>
                {target.name}
              </span>
            </div>
          )
        })}
      </div>

      {isHost ? (
        <Button className="mt-6 w-full" onClick={() => act('CONTINUE')}>
          {t('elim.continue')}
        </Button>
      ) : (
        <p className="mt-6 text-sm text-slate-400">{t('elim.waitHost')}</p>
      )}
    </div>
  )
}
