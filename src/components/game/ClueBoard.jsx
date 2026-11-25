import { getPlayer } from '../../../shared/gameLogic.js'
import { useLang } from '../../i18n/LanguageContext'
import Avatar from './Avatar'

/** Chat-style list of every clue given so far, grouped by round. */
export default function ClueBoard({ game }) {
  const { t } = useLang()
  const rounds = [...game.history, game.clues]

  return (
    <div className="space-y-5">
      {rounds.map(
        (clues, ri) =>
          clues.length > 0 && (
            <div key={ri}>
              <p className="label-tiny mb-2">{t('clue.round', { n: ri + 1 })}</p>
              <div className="space-y-2">
                {clues.map((c) => {
                  const p = getPlayer(game, c.playerId)
                  return (
                    <div key={c.playerId + c.text} className="flex items-center gap-3 animate-pop-in">
                      <Avatar player={p} size="sm" />
                      <div className="rounded-2xl rounded-tl-sm bg-ink-700/80 px-4 py-2">
                        <p className="text-[11px] text-slate-400">
                          {p.name}
                          {p.id === game.meId ? t('clue.youTag') : ''}
                        </p>
                        <p className="font-display text-lg font-bold leading-tight text-white">{c.text}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ),
      )}
    </div>
  )
}
