import { useState } from 'react'
import Button from '../Button'
import TextField from '../TextField'
import Avatar from './Avatar'
import ClueBoard from './ClueBoard'
import SpyHint from './SpyHint'
import { currentSpeaker, getPlayer, validateClue } from '../../../shared/gameLogic.js'
import { useLang } from '../../i18n/LanguageContext'
import { cx } from '../../lib/utils'
import { sfx } from '../../lib/sound'

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
    if (code) {
      sfx.error()
      return setError(t(`err.${code}`))
    }
    setBusy(true)
    const r = await act('SUBMIT_CLUE', { text })
    setBusy(false)
    if (!r.ok) {
      sfx.error()
      return setError(t(`err.${r.error}`))
    }
    setText('')
  }

  return (
    <div className="mx-auto max-w-xl animate-fade-in">
      <h2 className="font-display text-3xl leading-tight">{t('clue.title')}</h2>
      <p className="mt-1 text-base text-felt-200">{t('clue.desc')}</p>

      {game.candidates && (
        <div className="paper-flat mt-4 p-4">
          <SpyHint candidates={game.candidates} compact />
        </div>
      )}

      {/* ลำดับการพูด */}
      <div className="mt-6 flex gap-4 overflow-x-auto px-1 pb-3 pt-1">
        {game.turnOrder.map((id, i) => {
          const p = getPlayer(game, id)
          const done = i < game.turnIndex
          const active = i === game.turnIndex
          return (
            <div key={id} className="flex shrink-0 flex-col items-center gap-1.5">
              <Avatar
                player={p}
                size="sm"
                className={cx(
                  active && 'ring-4 ring-gold ring-offset-2 ring-offset-felt-900',
                  done && 'opacity-50',
                )}
              />
              <span
                className={cx(
                  'max-w-[64px] truncate text-sm',
                  active ? 'font-bold text-gold' : done ? 'text-felt-500' : 'text-felt-200',
                )}
              >
                {p.id === game.meId ? t('clue.you') : p.name}
              </span>
            </div>
          )
        })}
      </div>

      <div className="panel mt-3 p-4 sm:p-5">
        <ClueBoard game={game} />
        {game.clues.length === 0 && game.history.length === 0 && (
          <p className="py-4 text-center text-base text-felt-300">{t('clue.none')}</p>
        )}
      </div>

      <div className="mt-5">
        {myTurn ? (
          <form onSubmit={submit} className="panel space-y-4 border-gold p-4 sm:p-5">
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
            <Button type="submit" className="w-full" disabled={busy}>
              {t('clue.send')}
            </Button>
          </form>
        ) : speaker ? (
          <p className="py-3 text-center text-base text-felt-200">
            <span className="font-bold text-paper">{t('clue.thinking', { name: speaker.name })}</span>
            <span className="animate-blink">…</span>
          </p>
        ) : null}
      </div>
    </div>
  )
}
