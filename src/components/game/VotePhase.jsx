import { useState } from 'react'
import Button from '../Button'
import Avatar from './Avatar'
import ClueBoard from './ClueBoard'
import { alivePlayers, getPlayer } from '../../../shared/gameLogic.js'
import { useLang } from '../../i18n/LanguageContext'
import { cx } from '../../lib/utils'

export default function VotePhase({ game, act }) {
  const { t } = useLang()
  const [choice, setChoice] = useState(null)
  const me = getPlayer(game, game.meId)
  const alive = alivePlayers(game)
  const targets = alive.filter((p) => p.id !== game.meId)
  const voted = game.voteCount
  const myVote = game.votes[game.meId]
  const canVote = me.alive && !myVote

  return (
    <div className="mx-auto max-w-xl animate-fade-up">
      <h2 className="font-display text-2xl font-bold">{t('vote.title')}</h2>
      <p className="mt-1 text-sm text-slate-400">{t('vote.desc')}</p>

      <details className="card mt-4 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-300">{t('vote.review')}</summary>
        <div className="mt-4">
          <ClueBoard game={game} />
        </div>
      </details>

      {!me.alive && (
        <p className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-center text-sm text-slate-400">
          {t('vote.spectator')}
        </p>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {(me.alive ? targets : alive).map((p) => {
          const selected = (myVote ?? choice) === p.id
          return (
            <button
              key={p.id}
              disabled={!canVote}
              onClick={() => setChoice(p.id)}
              className={cx(
                'flex flex-col items-center gap-2 rounded-3xl border p-4 transition',
                selected
                  ? 'border-neon-pink/70 bg-neon-pink/10 shadow-glow-pink'
                  : 'border-white/10 bg-ink-800/70',
                canVote && !selected && 'hover:border-neon-blue/50 hover:bg-white/5',
                !canVote && !selected && 'opacity-60',
              )}
            >
              <Avatar player={p} />
              <span className="max-w-full truncate font-display text-sm font-bold">{p.name}</span>
              <span className="truncate text-[11px] text-slate-400">
                “{game.clues.find((c) => c.playerId === p.id)?.text}”
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-6">
        {canVote ? (
          <Button
            className="w-full"
            disabled={!choice}
            onClick={() => act('CAST_VOTE', { targetId: choice })}
          >
            {choice ? t('vote.for', { name: getPlayer(game, choice).name }) : t('vote.select')}
          </Button>
        ) : (
          <div className="text-center">
            <div className="mx-auto h-2 w-full max-w-xs overflow-hidden rounded-full bg-ink-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-neon-blue to-neon-purple transition-all duration-500"
                style={{ width: `${(voted / alive.length) * 100}%` }}
              />
            </div>
            <p className="label-tiny mt-3">{t('vote.count', { a: voted, n: alive.length })}</p>
          </div>
        )}
      </div>
    </div>
  )
}
