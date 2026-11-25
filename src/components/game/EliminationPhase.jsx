import { useEffect, useState } from 'react'
import Button from '../Button'
import Avatar from './Avatar'
import { getPlayer } from '../../../shared/gameLogic.js'
import { useLang } from '../../i18n/LanguageContext'
import { cx } from '../../lib/utils'

function useCountdown(deadline) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!deadline) return
    const i = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(i)
  }, [deadline])
  return deadline ? Math.max(0, Math.ceil((deadline - now) / 1000)) : null
}

export default function EliminationPhase({ game, act, isHost }) {
  const { t, loc } = useLang()
  const [picked, setPicked] = useState(false)
  const guess = game.guess
  const secs = useCountdown(guess?.status === 'pending' ? guess.deadline : null)
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

      {guess && (
        <div className="card mt-6 border-neon-pink/40 p-4 text-center">
          {guess.status === 'pending' && guess.by === game.meId && guess.options ? (
            <>
              <p className="font-display text-lg font-bold text-neon-pink">{t('elim.guessTitle')}</p>
              {secs !== null && <p className="mt-1 text-xs text-slate-400">{t('elim.guessTimer', { s: secs })}</p>}
              <div className="mt-4 grid gap-2">
                {guess.options.map((w, i) => (
                  <button
                    key={w.th}
                    disabled={picked}
                    onClick={() => {
                      setPicked(true)
                      act('GUESS_WORD', { index: i })
                    }}
                    className="rounded-2xl border border-white/10 bg-ink-800/80 px-4 py-3 font-display text-base font-bold text-white transition hover:border-neon-pink/60 active:scale-[0.98] disabled:opacity-50"
                  >
                    {loc(w)}
                  </button>
                ))}
              </div>
            </>
          ) : guess.status === 'pending' ? (
            <>
              <p className="text-sm font-bold text-white">{t('elim.guessing', { name: out.name })}</p>
              {secs !== null && <p className="mt-1 text-xs text-slate-400">{t('elim.guessTimer', { s: secs })}</p>}
            </>
          ) : guess.status === 'wrong' ? (
            <p className="text-sm font-bold text-neon-green">
              {guess.picked
                ? t('elim.guessWrong', { name: out.name, word: loc(guess.picked) })
                : t('elim.guessTimeout', { name: out.name })}
            </p>
          ) : null}
        </div>
      )}

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

      {guess?.status === 'pending' ? null : isHost ? (
        <Button className="mt-6 w-full" onClick={() => act('CONTINUE')}>
          {t('elim.continue')}
        </Button>
      ) : (
        <p className="mt-6 text-sm text-slate-400">{t('elim.waitHost')}</p>
      )}
    </div>
  )
}
