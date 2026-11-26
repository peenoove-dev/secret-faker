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
import { ACHIEVEMENTS, levelFor, levelStart } from '../../shared/achievements.js'
import { cx } from '../lib/utils'
import { AchievementIcon, CameraIcon, LockIcon } from '../components/Icons'

function Stat({ label, value }) {
  return (
    <div className="paper-flat px-3 py-2.5 text-center">
      <p className="font-display text-3xl leading-tight">{value}</p>
      <p className="label-ink">{label}</p>
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
  const level = levelFor(s.points)
  const lo = levelStart(level)
  const hi = levelStart(level + 1)
  const pct = Math.min(100, Math.round(((s.points - lo) / (hi - lo)) * 100))
  const owned = new Set(account.achievements ?? [])

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
      <div className="space-y-5">
        <div className="panel p-6 text-center sm:p-8">
          <div className="relative mx-auto h-24 w-24">
            <AccountAvatar account={account} className="h-24 w-24 rounded-2xl text-5xl" />
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
            <button
              type="button"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
              aria-label={t('profile.change')}
              className="absolute -bottom-2 -right-2 grid h-10 w-10 place-items-center rounded-full border-2 border-felt-800 bg-gold text-ink transition-transform hover:scale-105 active:scale-90 disabled:opacity-50"
            >
              {busy ? '…' : <CameraIcon size={18} />}
            </button>
          </div>
          {account.avatarV && (
            <button
              type="button"
              onClick={() => uploadAvatar(null)}
              className="mt-3 text-[15px] text-felt-300 underline hover:text-paper"
            >
              {t('profile.remove')}
            </button>
          )}
          <p className="mt-3 text-base text-felt-300">@{account.username}</p>
          {account.creator && (
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border-2 border-gold bg-gold/10 px-3 py-0.5 text-sm font-bold text-gold">
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
              variant="paper"
              size="md"
              className="mt-3 w-full"
              disabled={!shownName.trim() || shownName.trim() === account.displayName}
              onClick={save}
            >
              {t('profile.save')}
            </Button>
          </div>
        </div>

        <div className="panel p-5 sm:p-6">
          <p className="font-display text-2xl leading-tight">{t('profile.stats')}</p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label={t('stat.played')} value={s.played} />
            <Stat label={t('stat.wins')} value={s.wins} />
            <Stat label={t('stat.winRate')} value={rate} />
            <Stat label={t('stat.spyPlayed')} value={s.spyPlayed} />
            <Stat label={t('stat.spyWins')} value={s.spyWins} />
            <Stat label={t('stat.bestStreak')} value={s.bestStreak} />
          </div>
        </div>

        <div className="panel p-5 sm:p-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="label">{t('profile.level')}</p>
              <p className="font-display text-6xl leading-none text-gold">{level}</p>
            </div>
            <p className="text-right text-base text-felt-200">
              <b className="font-display text-2xl font-normal text-paper">{s.points}</b> {t('stat.points')}
              <br />
              {t('profile.nextLevel', { n: hi - s.points })}
            </p>
          </div>
          <div className="mt-4 h-4 overflow-hidden rounded-md border-2 border-felt-600 bg-felt-950 p-0.5">
            <div
              className="h-full rounded-[3px] bg-gold transition-[width] duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="panel p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <p className="font-display text-2xl leading-tight">{t('profile.achievements')}</p>
            <p className="text-base font-bold text-felt-200">
              {owned.size}/{ACHIEVEMENTS.length}
            </p>
          </div>
          <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {ACHIEVEMENTS.map((a) => {
              const has = owned.has(a.id)
              return (
                <li
                  key={a.id}
                  className={cx(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5',
                    has ? 'paper-flat' : 'border-2 border-dashed border-felt-600',
                  )}
                >
                  <span
                    className={cx(
                      'grid h-11 w-11 shrink-0 place-items-center rounded-full border-2',
                      has ? 'border-ink bg-gold text-ink' : 'border-felt-600 text-felt-500',
                    )}
                  >
                    {has ? <AchievementIcon id={a.id} size={24} /> : <LockIcon size={20} />}
                  </span>
                  <span className="min-w-0">
                    <span className={cx('block truncate font-display text-lg leading-tight', has ? 'text-ink' : 'text-felt-200')}>
                      {t(`ach.${a.id}.name`)}
                    </span>
                    <span className={cx('block text-[15px] leading-snug', has ? 'text-ink-soft' : 'text-felt-300')}>
                      {t(`ach.${a.id}.desc`)}
                    </span>
                  </span>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="panel p-5 sm:p-6">
          <p className="font-display text-2xl leading-tight">{t('creator.title')}</p>
          {account.creator ? (
            <Link to="/creator" className="mt-3 block">
              <Button className="w-full">
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
