import { useState } from 'react'
import { useLang } from '../../i18n/LanguageContext'
import { getPlayer } from '../../../shared/gameLogic.js'
import { ArrowRightIcon, CloseIcon, EyeIcon } from '../Icons'

/** แผงลับเฉพาะผู้สร้าง: เห็นคำลับตลอด / ตาทิพย์ (1 ครั้งต่อเกม) / แอบดูโหวต */
export default function CreatorPanel({ game, act }) {
  const { t, loc } = useLang()
  const [open, setOpen] = useState(false)
  const c = game.cheat
  if (!c) return null

  const name = (id) => getPlayer(game, id)?.name ?? '?'
  const votes = c.votes ? Object.entries(c.votes) : []

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[min(92vw,20rem)]">
      {open ? (
        <div className="panel border-gold p-4 text-base shadow-card-lg">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 font-display text-xl text-gold">
              <EyeIcon size={20} /> {t('cheat.title')}
            </p>
            <button onClick={() => setOpen(false)} className="text-felt-300 hover:text-paper" aria-label={t('cheat.hide')}>
              <CloseIcon size={18} />
            </button>
          </div>

          <p className="mt-3">
            <span className="label">{t('cheat.word')}</span>
            <br />
            <b className="font-display text-xl font-normal">{loc(c.word)}</b>
          </p>

          <div className="mt-3">
            {c.peeked ? (
              <>
                <span className="label !text-ember-soft">{t('cheat.fakers')}</span>
                <ul className="mt-1 space-y-1">
                  {c.fakerIds.map((id) => (
                    <li key={id} className={getPlayer(game, id)?.alive ? 'font-bold text-ember-soft' : 'text-felt-300 line-through'}>
                      {name(id)}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <button
                onClick={() => act('CREATOR_PEEK')}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-gold bg-gold/10 py-2 font-bold text-gold hover:bg-gold/20 active:scale-[0.98]"
              >
                <EyeIcon size={18} /> {t('cheat.peek')}
              </button>
            )}
          </div>

          {game.phase === 'voting' && (
            <div className="mt-3">
              <span className="label">{t('cheat.votes')}</span>
              {votes.length ? (
                <ul className="mt-1 space-y-1">
                  {votes.map(([voter, target]) => (
                    <li key={voter} className="flex items-center gap-2 text-felt-200">
                      {name(voter)} <ArrowRightIcon size={14} className="text-felt-500" /> <b className="text-paper">{name(target)}</b>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-felt-300">{t('cheat.noVotes')}</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="paper ml-auto flex items-center gap-2 rounded-full px-4 py-2 text-base font-bold hover:bg-paper-dim"
        >
          <EyeIcon size={18} /> {t('cheat.title')}
        </button>
      )}
    </div>
  )
}
