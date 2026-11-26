import { useEffect } from 'react'
import Button from '../Button'
import Avatar from './Avatar'
import Confetti from '../Confetti'
import ScreenFlash from '../ScreenFlash'
import { AchievementIcon, ArrowUpIcon, ChatIcon, MaskXIcon, TargetIcon, TrophyIcon } from '../Icons'
import { didIWin, getPlayer } from '../../../shared/gameLogic.js'
import { sfx } from '../../lib/sound'
import { useLang } from '../../i18n/LanguageContext'
import { cx } from '../../lib/utils'

/** คะแนนที่ได้ + เลเวล + ความสำเร็จที่เพิ่งปลดล็อก (เฉพาะผู้เล่นที่ล็อกอิน) */
function Rewards({ rewards, t }) {
  const hasNew = rewards.achievements.length > 0
  useEffect(() => {
    if (!hasNew) return
    const timer = setTimeout(() => sfx.achievement(), 900) // รอเสียงชนะ/แพ้จบก่อน
    return () => clearTimeout(timer)
  }, [hasNew])

  return (
    <div className="panel mt-5 border-gold p-4 text-left">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="label">{t('over.rewards')}</p>
          <p className="flex items-center gap-2 text-base text-felt-200">
            {t('lb.level', { n: rewards.level })}
            {rewards.leveledUp && (
              <span className="inline-flex items-center gap-1 rounded-md bg-mint px-2 py-0.5 text-sm font-bold text-ink">
                <ArrowUpIcon size={13} />
                {t('over.levelUp')}
              </span>
            )}
          </p>
        </div>
        <p className="font-display text-5xl leading-none text-gold">+{rewards.points}</p>
      </div>
      {hasNew && (
        <ul className="mt-4 space-y-2">
          {rewards.achievements.map((id, i) => (
            <li
              key={id}
              className="paper-flat flex animate-pop-in items-center gap-3 px-3 py-2"
              style={{ animationDelay: `${600 + i * 150}ms` }}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-ink bg-gold text-ink">
                <AchievementIcon id={id} size={22} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-ember-deep">{t('over.newBadge')}</span>
                <span className="block truncate font-display text-lg leading-tight text-ink">{t(`ach.${id}.name`)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function GameOverPhase({ game, isHost, onPlayAgain, onBackToLobby }) {
  const { t, loc } = useLang()
  const won = didIWin(game)
  const civiliansWon = game.winner === 'civilians'
  const stat = (id) => game.summary?.find((x) => x.id === id)

  return (
    <div className="mx-auto max-w-md animate-fade-in text-center">
      {won && <Confetti />}
      <ScreenFlash tone={won ? (civiliansWon ? 'blue' : 'pink') : 'pink'} />
      <span
        className={cx(
          'mx-auto grid h-24 w-24 place-items-center rounded-full border-4 border-ink shadow-card',
          won ? 'bg-gold text-ink' : 'bg-ember text-paper',
        )}
      >
        {won ? <TrophyIcon size={50} /> : <MaskXIcon size={50} />}
      </span>
      <h2 className={cx('mt-5 font-display text-5xl leading-tight', civiliansWon ? 'text-mint' : 'text-ember-soft')}>
        {civiliansWon ? t('over.civiliansWin') : t('over.fakersWin')}
      </h2>
      <p className="mt-1 text-lg text-felt-200">{won ? t('over.won') : t('over.lost')}</p>

      {game.guess?.status === 'correct' && (
        <p className="mt-5 rounded-lg border-2 border-ember bg-ember/15 p-3 text-base font-bold text-ember-soft">
          {t('over.guessedRight', { name: getPlayer(game, game.guess.by).name, word: loc(game.guess.picked) })}
        </p>
      )}

      {game.rewards && <Rewards rewards={game.rewards} t={t} />}

      <div className="paper mt-6 px-5 py-6">
        <p className="label-ink">{t('over.secretWas')}</p>
        <p className="mt-1 break-words font-display text-5xl leading-tight">{loc(game.word)}</p>
        <p className="mt-1 text-base text-ink-soft">{t('over.category', { c: loc(game.category) })}</p>
      </div>

      <ul className="panel mt-5 divide-y-2 divide-felt-700 p-1.5 text-left">
        {game.players.map((p) => (
          <li key={p.id} className="flex items-center gap-3 px-3 py-2.5">
            <Avatar player={p} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-base font-bold">
                {p.name}
                {p.id === game.meId && <span className="font-normal text-felt-300"> ({t('common.you')})</span>}
              </span>
              {stat(p.id) && (
                <span className="mt-0.5 flex items-center gap-3 text-sm text-felt-300">
                  <span className="inline-flex items-center gap-1">
                    <ChatIcon size={14} />
                    {stat(p.id).clues}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <TargetIcon size={14} />
                    {stat(p.id).correct}/{stat(p.id).votes}
                  </span>
                </span>
              )}
            </span>
            {!p.alive && <span className="text-sm text-felt-300">{t('over.out')}</span>}
            <span
              className={cx(
                'rounded-md px-2.5 py-0.5 text-sm font-bold',
                p.role === 'imposter' ? 'bg-ember text-paper' : 'bg-mint text-ink',
              )}
            >
              {p.role === 'imposter' ? t('over.faker') : t('over.civilian')}
            </span>
          </li>
        ))}
      </ul>

      {isHost ? (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button className="flex-1" onClick={onPlayAgain}>
            {t('over.again')}
          </Button>
          <Button className="flex-1" variant="secondary" onClick={onBackToLobby}>
            {t('over.lobby')}
          </Button>
        </div>
      ) : (
        <p className="mt-6 text-base text-felt-200">{t('over.waitHost')}</p>
      )}
    </div>
  )
}
