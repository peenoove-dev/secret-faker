import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PageShell from '../components/PageShell'
import Logo from '../components/Logo'
import Button from '../components/Button'
import TextField from '../components/TextField'
import { LoginIcon } from '../components/Icons'
import { useRoom } from '../context/RoomContext'
import { useLang } from '../i18n/LanguageContext'
import { isValidRoomCode, normalizeRoomCode, ROOM_CODE_LENGTH } from '../lib/utils'

export default function JoinRoomPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams() // รองรับลิงก์ชวน: /join?code=ABC123
  const { joinRoom } = useRoom()
  const { t } = useLang()

  const [nickname, setNickname] = useState('')
  const [code, setCode] = useState(normalizeRoomCode(params.get('code') ?? ''))
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const next = {}
    const name = nickname.trim()
    if (!name) next.nickname = t('create.nicknameErr')
    if (!isValidRoomCode(code)) next.code = t('join.codeErr', { n: ROOM_CODE_LENGTH })
    setErrors(next)
    if (Object.keys(next).length) return

    setBusy(true)
    const result = await joinRoom({ nickname: name, code })
    setBusy(false)
    if (!result.ok) {
      // ข้อผิดพลาดเรื่องชื่อแสดงที่ช่องชื่อ ที่เหลือแสดงที่ช่องรหัส
      const key = result.error === 'nameTaken' || result.error === 'nameEmpty' ? 'nickname' : 'code'
      setErrors({ [key]: t(`err.${result.error}`) })
      return
    }
    navigate(`/lobby/${result.code}`)
  }

  return (
    <PageShell backTo="/">
      <div className="animate-fade-up">
        <Logo className="mb-8" />

        <form onSubmit={submit} className="card space-y-5 p-6 sm:p-8">
          <h2 className="font-display text-2xl font-bold">{t('join.title')}</h2>

          <TextField
            label={t('join.code')}
            placeholder="6A8FMA"
            value={code}
            error={errors.code}
            inputClassName="text-center font-mono text-2xl font-bold uppercase tracking-[0.3em]"
            onChange={(e) => {
              setCode(normalizeRoomCode(e.target.value))
              setErrors((x) => ({ ...x, code: undefined }))
            }}
          />

          <TextField
            label={t('join.nickname')}
            placeholder={t('join.nicknamePh')}
            maxLength={16}
            value={nickname}
            error={errors.nickname}
            onChange={(e) => {
              setNickname(e.target.value)
              setErrors((x) => ({ ...x, nickname: undefined }))
            }}
          />

          <Button type="submit" variant="neon" className="w-full" disabled={busy} icon={<LoginIcon />}>
            {busy ? t('join.loading') : t('join.submit')}
          </Button>

          <p className="text-center text-xs text-slate-500">{t('join.hint')}</p>
        </form>
      </div>
    </PageShell>
  )
}
