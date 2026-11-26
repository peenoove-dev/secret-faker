import { getPlayer } from '../../../shared/gameLogic.js'
import { useLang } from '../../i18n/LanguageContext'
import Avatar from './Avatar'
import { cx } from '../../lib/utils'

/** รายการคำใบ้ทั้งหมดแยกตามรอบ — แต่ละคำเป็นโน้ตกระดาษที่วางเอียงเล็กน้อย */
export default function ClueBoard({ game }) {
  const { t } = useLang()
  const rounds = [...game.history, game.clues]

  return (
    <div className="space-y-6">
      {rounds.map(
        (clues, ri) =>
          clues.length > 0 && (
            <div key={ri}>
              <p className="label mb-2.5">{t('clue.round', { n: ri + 1 })}</p>
              <div className="space-y-3">
                {clues.map((c, ci) => {
                  const p = getPlayer(game, c.playerId)
                  return (
                    <div key={c.playerId + c.text} className="flex items-center gap-3 animate-pop-in">
                      <Avatar player={p} size="sm" />
                      <div
                        className={cx(
                          'paper-flat min-w-0 px-4 py-1.5 shadow-card-sm',
                          ci % 2 ? 'rotate-[0.7deg]' : '-rotate-[0.7deg]',
                        )}
                      >
                        <p className="truncate text-sm font-semibold leading-tight text-ink-soft">
                          {p.name}
                          {p.id === game.meId ? t('clue.youTag') : ''}
                        </p>
                        <p className="break-words font-display text-xl leading-snug text-ink">{c.text}</p>
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
