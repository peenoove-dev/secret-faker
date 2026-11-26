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
      <div>
        <Logo className="mb-8" />

        <form onSubmit={submit} className="panel space-y-5 p-6 sm:p-8">
          <div className="grid grid-cols-2 gap-1.5 rounded-xl border-2 border-felt-600 bg-felt-950 p-1">
            {['login', 'register'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m)
                  setError('')
                }}
                className={cx(
                  'h-11 rounded-lg text-base font-bold transition-colors',
                  mode === m ? 'bg-gold text-ink shadow-[0_2px_0_0_#8a5f0b]' : 'text-felt-200 hover:bg-felt-800 hover:text-paper',
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

          <Button type="submit" variant="paper" className="w-full" disabled={busy || !username || !password}>
            {busy ? t('auth.loading') : mode === 'login' ? t('auth.submitLogin') : t('auth.submitRegister')}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={playGuest}
            className="text-base font-bold text-gold underline decoration-2 underline-offset-4 hover:text-gold-soft"
          >
            {t('auth.guest')}
          </button>
          <p className="mt-1 text-[15px] text-felt-300">{t('auth.guestNote')}</p>
        </div>
      </div>
    </PageShell>
  )
}
