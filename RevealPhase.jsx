import { useState } from 'react'
import Button from '../Button'
import SpyHint from './SpyHint'
import { CheckIcon, MaskIcon, SuitIcon } from '../Icons'
import { getPlayer } from '../../../shared/gameLogic.js'
import { useLang } from '../../i18n/LanguageContext'

function Corners({ suit = 0 }) {
  return (
    <>
      <span className="absolute left-3 top-2.5 flex flex-col items-center leading-none text-ink">
        <SuitIcon index={suit} size={18} />
      </span>
      <span className="absolute bottom-2.5 right-3 flex rotate-180 flex-col items-center leading-none text-ink">
        <SuitIcon index={suit} size={18} />
      </span>
    </>
  )
}

/** การ์ดบทบาทลับ: แตะเพื่อพลิกดู แตะอีกครั้งเพื่อคว่ำ */
export default function RevealPhase({ game, act }) {
  const { t, loc } = useLang()
  const [shown, setShown] = useState(false)
  const me = getPlayer(game, game.meId)
  const isFaker = me.role === 'imposter'
  const total = game.players.filter((p) => p.alive).length

  return (
    <div className="mx-auto max-w-md animate-fade-in">
      <h2 className="font-display text-3xl leading-tight">{t('reveal.title')}</h2>
      <p className="mt-1 text-base text-felt-200">{t('reveal.summary', { n: game.players.length, f: game.fakerCount })}</p>

      <div className="flip-scene mx-auto mt-7 max-w-[340px]">
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          aria-pressed={shown}
          className="block w-full rounded-xl text-center"
        >
          <span className="flip-inner" data-flipped={shown}>
            {/* หลังไพ่ */}
            <span
              aria-hidden={shown}
              className="flip-face card-back flex min-h-[360px] flex-col items-center justify-center gap-5 px-8"
            >
              <span className="grid h-24 w-24 place-items-center rounded-full border-[3px] border-ink bg-paper text-ember">
                <MaskIcon size={50} strokeWidth={1.7} />
              </span>
              <span className="block">
                <span className="block font-display text-2xl leading-tight text-paper">{t('reveal.tap')}</span>
                <span className="mt-1 block text-base text-paper/80">{t('reveal.makeSure')}</span>
              </span>
            </span>

            {/* หน้าไพ่ */}
            <span
              aria-hidden={!shown}
              className="flip-face back paper relative flex min-h-[360px] flex-col items-center justify-center px-8 py-10"
              style={{ boxShadow: '3px 4px 0 0 #04120f, inset 0 0 0 1px rgba(42,31,26,.1)' }}
            >
              <Corners suit={isFaker ? 0 : 1} />
              {isFaker ? (
                <>
                  <span className="label-ink">{t('reveal.youAreThe')}</span>
                  <span className="mt-1 block font-display text-6xl leading-tight text-ember">{t('reveal.faker')}</span>
                  <span className="mt-4 block text-lg text-ink">
                    {t('reveal.category')} <b>{loc(game.category)}</b>
                  </span>
                  <span className="mt-1 block text-base text-ink-soft">{t('reveal.fakerHint')}</span>
                  <SpyHint candidates={game.candidates} />
                </>
              ) : (
                <>
                  <span className="label-ink">{t('reveal.youAreThe')}</span>
                  <span className="mt-0.5 block font-display text-3xl leading-tight text-mint-deep">{t('reveal.civilian')}</span>
                  <span className="mt-5 block text-lg text-ink">
                    {t('reveal.category')} <b>{loc(game.category)}</b>
                  </span>
                  <span className="label-ink mt-5">{t('reveal.secretWord')}</span>
                  <span className="mt-1 block break-words border-b-4 border-double border-ink/40 px-2 pb-1 font-display text-5xl leading-tight text-ink">
                    {loc(game.word)}
                  </span>
                </>
              )}
            </span>
          </span>
        </button>
      </div>

      <p className="mt-3 h-6 text-center text-base text-felt-300">{shown ? t('reveal.tapHide') : ''}</p>

      {game.iAcked ? (
        <p className="mt-3 rounded-lg border-2 border-felt-600 bg-felt-800 p-3 text-center text-base text-felt-200">
          {t('reveal.waiting', { a: game.ackCount, n: total })}
        </p>
      ) : (
        <Button className="mt-3 w-full" disabled={!shown} icon={<CheckIcon size={22} />} onClick={() => act('ACK_REVEAL')}>
          {t('reveal.gotIt')}
        </Button>
      )}
    </div>
  )
}
