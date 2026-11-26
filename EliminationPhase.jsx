import { useEffect, useState } from 'react'
import Button from '../Button'
import Avatar from './Avatar'
import ScreenFlash from '../ScreenFlash'
import { ArrowRightIcon } from '../Icons'
import { sfx } from '../../lib/sound'
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

  // นับถอยหลัง 5 วินาทีสุดท้ายของการเดาคำ มีเสียงติ๊ก
  useEffect(() => {
    if (secs !== null && secs > 0 && secs <= 5) sfx.tick()
  }, [secs])

  return (
    <div className={cx('mx-auto max-w-md animate-fade-in', !wasFaker && 'animate-shake')}>
      <ScreenFlash tone={wasFaker ? 'green' : 'pink'} />
      <p className="text-center text-lg font-semibold text-felt-200">{t('elim.votedOut')}</p>

      {/* ใบประวัติผู้ถูกไล่ออก พร้อมตราประทับ */}
      <div className="paper relative mx-auto mt-5 flex w-full max-w-xs flex-col items-center px-6 pb-8 pt-8">
        <Avatar player={{ ...out, alive: true }} size="lg" className="animate-pop-in" />
        <h2 className="mt-4 break-words text-center font-display text-4xl leading-tight">{out.name}</h2>
        {out.id === game.meId && <p className="text-base font-semibold text-ink-soft">({t('common.you')})</p>}
        <span
          key={String(wasFaker)}
          className={cx(
            'stamp mt-5 animate-stamp px-4 text-2xl',
            wasFaker ? 'border-ember text-ember' : 'border-mint-deep text-mint-deep',
          )}
        >
          {wasFaker ? t('elim.wasFaker') : t('elim.wasCivilian')}
        </span>
        {tie && <p className="mt-4 text-center text-base text-ink-soft">{t('elim.tie')}</p>}
      </div>

      {guess && (
        <div className="panel mt-6 border-ember p-4 text-center">
          {guess.status === 'pending' && guess.by === game.meId && guess.options ? (
            <>
              <p className="font-display text-2xl leading-tight text-ember-soft">{t('elim.guessTitle')}</p>
              {secs !== null && <p className="mt-1 text-base text-felt-200">{t('elim.guessTimer', { s: secs })}</p>}
              <div className="mt-4 grid gap-2.5">
                {guess.options.map((w, i) => (
                  <button
                    key={w.th}
                    disabled={picked}
                    onClick={() => {
                      sfx.click()
                      setPicked(true)
                      act('GUESS_WORD', { index: i })
                    }}
                    className="paper px-4 py-2.5 font-display text-xl hover:-translate-y-0.5 active:translate-y-0.5 disabled:opacity-50"
                  >
                    {loc(w)}
                  </button>
                ))}
              </div>
            </>
          ) : guess.status === 'pending' ? (
            <>
              <p className="text-base font-bold">{t('elim.guessing', { name: out.name })}</p>
              {secs !== null && <p className="mt-1 text-base text-felt-200">{t('elim.guessTimer', { s: secs })}</p>}
            </>
          ) : guess.status === 'wrong' ? (
            <p className="text-base font-bold text-mint">
              {guess.picked
                ? t('elim.guessWrong', { name: out.name, word: loc(guess.picked) })
                : t('elim.guessTimeout', { name: out.name })}
            </p>
          ) : null}
        </div>
      )}

      <ul className="panel mt-7 divide-y-2 divide-felt-700 p-1.5">
        {Object.entries(votes).map(([voterId, targetId]) => {
          const voter = getPlayer(game, voterId)
          const target = getPlayer(game, targetId)
          return (
            <li key={voterId} className="flex items-center justify-between gap-3 px-3 py-2 text-base">
              <span className="min-w-0 flex-1 truncate text-felt-200">{voter.name}</span>
              <ArrowRightIcon size={16} className="shrink-0 text-felt-500" />
              <span className={cx('min-w-0 flex-1 truncate text-right font-bold', tally[targetId] === top ? 'text-gold' : 'text-felt-200')}>
                {target.name}
              </span>
            </li>
          )
        })}
      </ul>

      {guess?.status === 'pending' ? null : isHost ? (
        <Button className="mt-6 w-full" onClick={() => act('CONTINUE')}>
          {t('elim.continue')}
        </Button>
      ) : (
        <p className="mt-6 text-center text-base text-felt-200">{t('elim.waitHost')}</p>
      )}
    </div>
  )
}
