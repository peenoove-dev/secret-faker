import { useState } from 'react'
import Button from '../Button'
import SpyHint from './SpyHint'
import { getPlayer } from '../../../shared/gameLogic.js'
import { useLang } from '../../i18n/LanguageContext'
import { cx } from '../../lib/utils'

export default function RevealPhase({ game, act }) {
  const { t, loc } = useLang()
  const [shown, setShown] = useState(false)
  const me = getPlayer(game, game.meId)
  const isFaker = me.role === 'imposter'
  const total = game.players.filter((p) => p.alive).length

  return (
    <div className="mx-auto max-w-md text-center animate-fade-up">
      <h2 className="font-display text-3xl font-bold">{t('reveal.title')}</h2>
      <p className="mt-2 text-sm text-slate-400">
        {t('reveal.summary', { n: game.players.length, f: game.fakerCount })}
      </p>

      <button
        onClick={() => setShown((s) => !s)}
        className={cx(
          'mt-8 flex min-h-[260px] w-full flex-col items-center justify-center rounded-3xl border p-8 transition duration-300',
          !shown && 'border-white/10 bg-ink-800/70 hover:border-neon-purple/50',
          shown && isFaker && 'border-neon-pink/60 bg-neon-pink/10 shadow-glow-pink',
          shown && !isFaker && 'border-neon-blue/60 bg-neon-blue/10 shadow-glow-blue',
        )}
      >
        {!shown ? (
          <>
            <span className="text-5xl animate-float">🎭</span>
            <p className="mt-4 font-display text-xl font-bold">{t('reveal.tap')}</p>
            <p className="mt-1 text-xs text-slate-500">{t('reveal.makeSure')}</p>
          </>
        ) : isFaker ? (
          <div className="animate-pop-in">
            <p className="label-tiny !text-neon-pink">{t('reveal.youAreThe')}</p>
            <p className="mt-1 font-display text-5xl font-bold text-neon-pink">{t('reveal.faker')}</p>
            <p className="mt-5 text-sm text-slate-300">
              {t('reveal.category')} <b className="text-white">{loc(game.category)}</b>
            </p>
            <p className="mt-2 text-sm text-slate-400">{t('reveal.fakerHint')}</p>
            <SpyHint candidates={game.candidates} />
          </div>
        ) : (
          <div className="animate-pop-in">
            <p className="label-tiny !text-neon-blue">{t('reveal.youAreThe')}</p>
            <p className="mt-1 font-display text-3xl font-bold text-neon-blue">{t('reveal.civilian')}</p>
            <p className="mt-5 text-sm text-slate-300">
              {t('reveal.category')} <b className="text-white">{loc(game.category)}</b>
            </p>
            <p className="label-tiny mt-4">{t('reveal.secretWord')}</p>
            <p className="font-display text-4xl font-bold text-white">{loc(game.word)}</p>
          </div>
        )}
      </button>

      <p className="mt-3 h-4 text-xs text-slate-500">{shown ? t('reveal.tapHide') : ''}</p>

      {game.iAcked ? (
        <p className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
          {t('reveal.waiting', { a: game.ackCount, n: total })}
        </p>
      ) : (
        <Button className="mt-4 w-full" disabled={!shown} onClick={() => act('ACK_REVEAL')}>
          {t('reveal.gotIt')}
        </Button>
      )}
    </div>
  )
}
