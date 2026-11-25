import { useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import PageShell from '../components/PageShell'
import Button from '../components/Button'
import TextField from '../components/TextField'
import AccountAvatar from '../components/AccountAvatar'
import Loading from '../components/Loading'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../i18n/LanguageContext'
import { fileToAvatar } from '../lib/image'

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-ink-900/60 p-3 text-center">
      <p className="font-display text-2xl font-bold text-white">{value}</p>
      <p className="label-tiny mt-1 !text-[9px]">{label}</p>
    </div>
  )
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { t } = useLang()
  const { account, ready, saveProfile, uploadAvatar, unlockCreator, logout } = useAuth()
  const fileRef = useRef(null)
  const [name, setName] = useState(null)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [code, setCode] = useState('')
  const [codeErr, setCodeErr] = useState('')

  if (!ready) return <Loading />
  if (!account) return <Navigate to="/login" replace />

  const shownName = name ?? account.displayName
  const s = account.stats
  const rate = s.played ? `${Math.round((s.wins / s.played) * 100)}%` : '–'

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setErr('')
    setBusy(true)
    try {
      const r = await uploadAvatar(await fileToAvatar(file))
      if (!r.ok) setErr(t(`err.${r.error}`))
    } catch {
      setErr(t('err.badImage'))
    }
    setBusy(false)
  }

  const save = async () => {
    setErr('')
    setMsg('')
    const r = await saveProfile(shownName)
    if (!r.ok) return setErr(t(`err.${r.error}`))
    setName(null)
    setMsg(t('profile.saved'))
  }

  const unlock = async (e) => {
    e.preventDefault()
    setCodeErr('')
    const r = await unlockCreator(code.trim())
    if (!r.ok) return setCodeErr(t(`err.${r.error}`))
    navigate('/creator')
  }

  const out = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <PageShell backTo="/">
      <div className="animate-fade-up space-y-5">
        <div className="card p-6 text-center sm:p-8">
          <div className="relative mx-auto h-24 w-24">
            <AccountAvatar account={account} className="h-24 w-24 rounded-3xl text-4xl" />
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
            <button
              type="button"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
              aria-label={t('profile.change')}
              className="absolute -bottom-2 -right-2 grid h-9 w-9 place-items-center rounded-full border-2 border-ink-800 bg-neon-blue text-base shadow-lg transition hover:brightness-110 active:scale-90 disabled:opacity-50"
            >
              {busy ? '…' : '📷'}
            </button>
          </div>
          {account.avatarV && (
            <button
              type="button"
              onClick={() => uploadAvatar(null)}
              className="mt-3 text-[11px] text-slate-500 underline hover:text-slate-300"
            >
              {t('profile.remove')}
            </button>
          )}
          <p className="mt-3 font-mono text-xs text-slate-500">@{account.username}</p>
          {account.creator && (
            <span className="mt-2 inline-block rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-300">
              {t('creator.badge')}
            </span>
          )}

          <div className="mt-6 text-left">
            <TextField
              label={t('profile.displayName')}
              maxLength={16}
              value={shownName}
              error={err}
              hint={msg}
              onChange={(e) => {
                setName(e.target.value)
                setMsg('')
                setErr('')
              }}
            />
            <Button
              variant="neon"
              size="md"
              className="mt-3 w-full"
              disabled={!shownName.trim() || shownName.trim() === account.displayName}
              onClick={save}
            >
              {t('profile.save')}
            </Button>
          </div>
        </div>

        <div className="card p-5 sm:p-6">
          <p className="label-tiny">{t('profile.stats')}</p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label={t('stat.played')} value={s.played} />
            <Stat label={t('stat.wins')} value={s.wins} />
            <Stat label={t('stat.winRate')} value={rate} />
            <Stat label={t('stat.spyPlayed')} value={s.spyPlayed} />
            <Stat label={t('stat.spyWins')} value={s.spyWins} />
          </div>
        </div>

        <div className="card p-5 sm:p-6">
          <p className="label-tiny">{t('creator.title')}</p>
          {account.creator ? (
            <Link to="/creator" className="mt-3 block">
              <Button variant="primary" className="w-full">
                {t('creator.open')}
              </Button>
            </Link>
          ) : (
            <form onSubmit={unlock} className="mt-3 space-y-3">
              <TextField
                label={t('creator.code')}
                type="password"
                autoComplete="off"
                value={code}
                error={codeErr}
                onChange={(e) => {
                  setCode(e.target.value)
                  setCodeErr('')
                }}
              />
              <Button type="submit" variant="secondary" size="md" className="w-full" disabled={!code}>
                {t('creator.unlock')}
              </Button>
            </form>
          )}
        </div>

        <Button variant="ghost" className="w-full" onClick={out}>
          {t('profile.logout')}
        </Button>
      </div>
    </PageShell>
  )
}
