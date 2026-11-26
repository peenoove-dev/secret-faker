import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageShell from '../components/PageShell'
import Logo from '../components/Logo'
import Button from '../components/Button'
import TextField from '../components/TextField'
import Segmented from '../components/Segmented'
import { PlusIcon } from '../components/Icons'
import { useRoom } from '../context/RoomContext'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../i18n/LanguageContext'
import { MAX_PLAYERS_OPTIONS } from '../../shared/gameLogic.js'

export default function CreateRoomPage() {
  const navigate = useNavigate()
  const { createRoom } = useRoom()
  const { t } = useLang()
  const { account } = useAuth()

  const [nickname, setNickname] = useState('')
  const [roomName, setRoomName] = useState('')
  const [maxPlayers, setMaxPlayers] = useState(8)
  const [isPrivate, setIsPrivate] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const name = account ? account.displayName : nickname.trim()
    if (!name) {
      setError(t('create.nicknameErr'))
      return
    }
    setBusy(true)
    const result = await createRoom({
      nickname: name,
      roomName: roomName.trim() || t('room.defaultName', { name }),
      maxPlayers,
      isPrivate,
    })
    setBusy(false)
    if (!result.ok) return setError(t(`err.${result.error}`))
    navigate(`/lobby/${result.code}`)
  }

  return (
    <PageShell backTo="/">
      <div>
        <Logo className="mb-8" />

        <form onSubmit={submit} className="panel space-y-5 p-6 sm:p-8">
          <h2 className="font-display text-3xl leading-tight">{t('create.title')}</h2>

          {account ? (
            <p className="rounded-lg border-2 border-felt-600 bg-felt-950 px-4 py-3 text-base text-felt-200">
              {t('auth.playingAs')} <b className="text-paper">{account.displayName}</b>
              {error && <span className="mt-2 block text-[15px] font-semibold text-ember-soft">{error}</span>}
            </p>
          ) : (
            <TextField
              label={t('create.nickname')}
              placeholder={t('create.nicknamePh')}
              maxLength={16}
              value={nickname}
              error={error}
              onChange={(e) => {
                setNickname(e.target.value)
                setError('')
              }}
            />
          )}

          <TextField
            label={t('create.roomName')}
            placeholder={t('create.roomNamePh')}
            maxLength={24}
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
          />

          <Segmented
            label={t('create.maxPlayers')}
            value={maxPlayers}
            onChange={setMaxPlayers}
            options={MAX_PLAYERS_OPTIONS.map((n) => ({ value: n, label: n }))}
          />

          <Segmented
            label={t('create.visibility')}
            value={isPrivate}
            onChange={setIsPrivate}
            options={[
              { value: true, label: t('create.private') },
              { value: false, label: t('create.public') },
            ]}
          />

          <Button type="submit" className="w-full" disabled={busy} icon={<PlusIcon />}>
            {busy ? t('create.loading') : t('create.submit')}
          </Button>
        </form>
      </div>
    </PageShell>
  )
}
