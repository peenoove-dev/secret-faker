import Button from '../Button'
import Avatar from './Avatar'
import { didIWin } from '../../../shared/gameLogic.js'
import { useLang } from '../../i18n/LanguageContext'
import { cx } from '../../lib/utils'

export default function GameOverPhase({ game, isHost, onPlayAgain, onBackToLobby }) {
  const { t, loc } = useLang()
  const won = didIWin(game)
  const civiliansWon = game.winner === 'civilians'

  return (
    <div className="mx-auto max-w-md text-center animate-fade-up">
      <p className="text-5xl animate-float">{won ? '🏆' : '💀'}</p>
      <h2
        className={cx(
          'mt-3 font-display text-4xl font-bold',
          civiliansWon ? 'text-neon-blue' : 'text-neon-pink',
        )}
      >
        {civiliansWon ? t('over.civiliansWin') : t('over.fakersWin')}
      </h2>
      <p className="mt-2 text-sm text-slate-400">{won ? t('over.won') : t('over.lost')}</p>

      <div className="card mt-6 p-5">
        <p className="label-tiny">{t('over.secretWas')}</p>
        <p className="mt-1 font-display text-4xl font-bold text-white">{loc(game.word)}</p>
        <p className="mt-1 text-xs text-slate-500">{t('over.category', { c: loc(game.category) })}</p>
      </div>

      <div className="card mt-4 divide-y divide-white/5 p-2 text-left">
        {game.players.map((p) => (
          <div key={p.id} className="flex items-center gap-3 px-3 py-2.5">
            <Avatar player={p} size="sm" />
            <span className="flex-1 truncate text-sm font-bold">
              {p.name}
              {p.id === game.meId && <span className="text-neon-blue"> ({t('common.you')})</span>}
            </span>
            {!p.alive && <span className="text-[10px] uppercase tracking-wider text-slate-500">{t('over.out')}</span>}
            <span
              className={cx(
                'rounded-full px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest',
                p.role === 'imposter' ? 'bg-neon-pink/15 text-neon-pink' : 'bg-neon-blue/15 text-neon-blue',
              )}
            >
              {p.role === 'imposter' ? t('over.faker') : t('over.civilian')}
            </span>
          </div>
        ))}
      </div>

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
        <p className="mt-6 text-sm text-slate-400">{t('over.waitHost')}</p>
      )}
    </div>
  )
}
