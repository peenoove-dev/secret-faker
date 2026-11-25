import { useState } from 'react'
import Button from '../Button'
import TextField from '../TextField'
import Avatar from './Avatar'
import ClueBoard from './ClueBoard'
import SpyHint from './SpyHint'
import { currentSpeaker, getPlayer, validateClue } from '../../../shared/gameLogic.js'
import { useLang } from '../../i18n/LanguageContext'
import { cx } from '../../lib/utils'

export default function CluePhase({ game, act }) {
  const { t } = useLang()
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const speaker = currentSpeaker(game)
  const myTurn = speaker?.id === game.meId

  const submit = async (e) => {
    e.preventDefault()
    const code = validateClue(game, text, game.meId)
    if (code) return setError(t(`err.${code}`))
    setBusy(true)
    const r = await act('SUBMIT_CLUE', { text })
    setBusy(false)
    if (!r.ok) return setError(t(`err.${r.error}`))
    setText('')
  }

  return (
    <div className="mx-auto max-w-xl animate-fade-up">
      <h2 className="font-display text-2xl font-bold">{t('clue.title')}</h2>
      <p className="mt-1 text-sm text-slate-400">{t('clue.desc')}</p>

      {game.candidates && (
        <div className="card mt-4 border-neon-pink/30 p-4">
          <SpyHint candidates={game.candidates} compact />
        </div>
      )}

      {/* turn order */}
      <div className="mt-5 flex gap-3 overflow-x-auto pb-2">
        {game.turnOrder.map((id, i) => {
          const p = getPlayer(game, id)
          const done = i < game.turnIndex
          const active = i === game.turnIndex
          return (
            <div key={id} className="flex shrink-0 flex-col items-center gap-1">
              <Avatar
                player={p}
                size="sm"
                className={cx(active && 'ring-2 ring-neon-blue ring-offset-2 ring-offset-ink-900 animate-glow-pulse', done && 'opacity-60')}
              />
              <span className={cx('max-w-[56px] truncate text-[10px]', active ? 'text-neon-blue' : 'text-slate-500')}>
                {p.id === game.meId ? t('clue.you') : p.name}
              </span>
            </div>
          )
        })}
      </div>

      <div className="card mt-4 p-4 sm:p-5">
        <ClueBoard game={game} />
        {game.clues.length === 0 && game.history.length === 0 && (
          <p className="py-4 text-center text-sm italic text-slate-500">{t('clue.none')}</p>
        )}
      </div>

      <div className="mt-4">
        {myTurn ? (
          <form onSubmit={submit} className="card space-y-4 border-neon-blue/40 p-4 shadow-glow-blue sm:p-5">
            <TextField
              label={t('clue.yourTurn')}
              placeholder={t('clue.placeholder')}
              maxLength={20}
              autoFocus
              value={text}
              error={error}
              onChange={(e) => {
                setText(e.target.value)
                setError('')
              }}
            />
            <Button type="submit" variant="neon" className="w-full" disabled={busy}>
              {t('clue.send')}
            </Button>
          </form>
        ) : speaker ? (
          <p className="py-3 text-center text-sm text-slate-400">
            <span className="font-bold text-white">{t('clue.thinking', { name: speaker.name })}</span>
            <span className="animate-glow-pulse">…</span>
          </p>
        ) : null}
      </div>
    </div>
  )
}
