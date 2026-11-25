import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import PageShell from '../components/PageShell'
import Logo from '../components/Logo'
import Button from '../components/Button'
import TextField from '../components/TextField'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../i18n/LanguageContext'
import { cx } from '../lib/utils'

export default function LoginPage() {
  const navigate = useNavigate()
  const { t } = useLang()
  const { account, ready, login, register, setGuest } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (ready && account) return <Navigate to="/" replace />

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    const r = await (mode === 'login' ? login : register)(username.trim(), password)
    setBusy(false)
    if (!r.ok) return setError(t(`err.${r.error}`))
    navigate('/')
  }

  const playGuest = () => {
    setGuest(true)
    navigate('/')
  }

  return (
    <PageShell>
      <div className="animate-fade-up">
        <Logo className="mb-8" />

        <form onSubmit={submit} className="card space-y-5 p-6 sm:p-8">
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-ink-900/70 p-1">
            {['login', 'register'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m)
                  setError('')
                }}
                className={cx(
                  'h-11 rounded-xl font-display text-sm font-bold transition',
                  mode === m ? 'bg-gradient-to-r from-neon-blue to-neon-violet text-white' : 'text-slate-400 hover:text-white',
                )}
              >
                {t(`auth.${m}`)}
              </button>
            ))}
          </div>

          <TextField
            label={t('auth.username')}
            hint={mode === 'register' ? t('auth.usernameHint') : undefined}
            maxLength={16}
            autoCapitalize="none"
            autoComplete="username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value)
              setError('')
            }}
          />
          <TextField
            label={t('auth.password')}
            hint={mode === 'register' ? t('auth.passwordHint') : undefined}
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={password}
            error={error}
            onChange={(e) => {
              setPassword(e.target.value)
              setError('')
            }}
          />

          <Button type="submit" variant="neon" className="w-full" disabled={busy || !username || !password}>
            {busy ? t('auth.loading') : mode === 'login' ? t('auth.submitLogin') : t('auth.submitRegister')}
          </Button>
        </form>

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={playGuest}
            className="text-sm font-bold text-slate-300 underline-offset-4 transition hover:text-neon-blue hover:underline"
          >
            {t('auth.guest')}
          </button>
          <p className="mt-1 text-xs text-slate-500">{t('auth.guestNote')}</p>
        </div>
      </div>
    </PageShell>
  )
}
