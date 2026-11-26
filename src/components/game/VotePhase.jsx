import { useState } from 'react'
import Button from '../Button'
import Avatar from './Avatar'
import ClueBoard from './ClueBoard'
import DrawingBoard, { ColorDot } from './DrawingBoard'
import { drawColor } from '../../../shared/drawing.js'
import { CheckIcon } from '../Icons'
import { alivePlayers, getPlayer } from '../../../shared/gameLogic.js'
import { useLang } from '../../i18n/LanguageContext'
import { cx } from '../../lib/utils'
import { sfx } from '../../lib/sound'

export default function VotePhase({ game, act }) {
  const { t, loc } = useLang()
  const drawMode = game.mode === 'draw'
  const [choice, setChoice] = useState(null)
  const me = getPlayer(game, game.meId)
  const alive = alivePlayers(game)
  const targets = alive.filter((p) => p.id !== game.meId)
  const voted = game.voteCount
  const myVote = game.votes[game.meId]
  const canVote = me.alive && !myVote

  return (
    <div className="mx-auto max-w-xl animate-fade-in">
      <h2 className="font-display text-3xl leading-tight">{t('vote.title')}</h2>
      <p className="mt-1 text-base text-felt-200">{t(drawMode ? 'vote.descDraw' : 'vote.desc')}</p>

      {drawMode ? (
        <div className="mt-4">
          <DrawingBoard game={game} />
        </div>
      ) : (
        <details className="panel mt-4 p-4">
          <summary className="cursor-pointer text-base font-bold text-felt-200 hover:text-paper">{t('vote.review')}</summary>
          <div className="mt-4">
            <ClueBoard game={game} />
          </div>
        </details>
      )}

      {!me.alive && (
        <p className="mt-4 rounded-lg border-2 border-felt-600 bg-felt-800 p-3 text-center text-base text-felt-200">
          {t('vote.spectator')}
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
        {(me.alive ? targets : alive).map((p) => {
          const selected = (myVote ?? choice) === p.id
          return (
            <button
              key={p.id}
              disabled={!canVote}
              aria-pressed={selected}
              onClick={() => {
                sfx.click()
                setChoice(p.id)
              }}
              className={cx(
                'paper relative flex flex-col items-center gap-1.5 px-3 pb-4 pt-5 transition-transform duration-100',
                selected && '-translate-y-1 ring-4 ring-ember ring-offset-2 ring-offset-felt-900',
                canVote && !selected && 'hover:-translate-y-0.5',
                !canVote && !selected && 'opacity-60',
              )}
            >
              {selected && (
                <span className="absolute -right-2 -top-2.5 grid h-8 w-8 place-items-center rounded-full border-2 border-ink bg-ember text-paper">
                  <CheckIcon size={17} />
                </span>
              )}
              <Avatar player={p} />
              <span className="max-w-full truncate font-display text-lg leading-tight">{p.name}</span>
              {drawMode ? (
                <span className="flex max-w-full items-center gap-1.5 truncate text-base text-ink-soft">
                  <ColorDot player={p} />
                  {loc(drawColor(p.colorIndex))}
                </span>
              ) : (
                <span className="max-w-full truncate text-base text-ink-soft">
                  “{game.clues.find((c) => c.playerId === p.id)?.text}”
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-7">
        {canVote ? (
          <Button className="w-full" disabled={!choice} onClick={() => act('CAST_VOTE', { targetId: choice })}>
            {choice ? t('vote.for', { name: getPlayer(game, choice).name }) : t('vote.select')}
          </Button>
        ) : (
          <div className="text-center">
            <div className="flex justify-center gap-2" aria-hidden>
              {alive.map((p, i) => (
                <span
                  key={p.id}
                  className={cx(
                    'h-[30px] w-[21px] rounded-[4px] border-2 transition-colors duration-300',
                    i < voted ? 'card-back !shadow-none !rounded-[4px] border-transparent' : 'border-dashed border-felt-500',
                  )}
                  style={i < voted ? { boxShadow: 'inset 0 0 0 2px #f2e9d8' } : undefined}
                />
              ))}
            </div>
            <p className="mt-3 text-base text-felt-200">{t('vote.count', { a: voted, n: alive.length })}</p>
          </div>
        )}
      </div>
    </div>
  )
}
