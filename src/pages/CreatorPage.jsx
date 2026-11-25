import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import PageShell from '../components/PageShell'
import Button from '../components/Button'
import TextField from '../components/TextField'
import Loading from '../components/Loading'
import Toast from '../components/Toast'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../i18n/LanguageContext'
import { get, post } from '../lib/api'
import { cx } from '../lib/utils'

/** ระบบผู้สร้าง: ดูคำทั้งหมดในเกม + เพิ่มคำใหม่เข้าหมวดที่เลือก */
export default function CreatorPage() {
  const { t, loc } = useLang()
  const { account, ready, token } = useAuth()
  const [cats, setCats] = useState(null)
  const [catKey, setCatKey] = useState('Places')
  const [word, setWord] = useState('')
  const [translation, setTranslation] = useState('')
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')
  const importRef = useRef(null)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 2600)
    return () => clearTimeout(timer)
  }, [toast])

  const load = useCallback(async () => {
    const r = await get('/api/creator/words', token)
    if (r.ok) setCats(r.categories)
    else setError(t(`err.${r.error}`))
  }, [token, t])

  useEffect(() => {
    if (account?.creator) load()
  }, [account?.creator, load])

  const q = query.trim().toLowerCase()
  const total = useMemo(() => cats?.reduce((n, c) => n + c.words.length, 0) ?? 0, [cats])

  if (!ready) return <Loading />
  if (!account) return <Navigate to="/login" replace />
  if (!account.creator) return <Navigate to="/profile" replace />
  if (!cats) return error ? <p className="p-8 text-center text-red-400">{error}</p> : <Loading />

  const add = async (e) => {
    e.preventDefault()
    const w = word.trim()
    if (!w) return
    setError('')
    setBusy(true)
    const r = await post('/api/creator/words', { category: catKey, word: w, translation: translation.trim() }, token)
    setBusy(false)
    if (!r.ok) return setError(t(`err.${r.error}`))
    setCats(r.categories)
    setWord('')
    setTranslation('')
    setToast(t('creator.added', { word: w }))
  }

  const remove = async (id) => {
    const r = await post('/api/creator/words/delete', { id }, token)
    if (r.ok) setCats(r.categories)
    else setToast(t(`err.${r.error}`))
  }

  const exportBackup = async () => {
    const r = await get('/api/creator/export', token)
    if (!r.ok) return setToast(t(`err.${r.error}`))
    const { ok, ...data } = r
    const url = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `secret-faker-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importBackup = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const data = JSON.parse(await file.text())
      const r = await post('/api/creator/import', { data }, token)
      if (!r.ok) return setToast(t(`err.${r.error}`))
      setCats(r.categories)
      setToast(t('creator.imported', { w: r.addedWords, a: r.addedAccounts }))
    } catch {
      setToast(t('err.badRequest'))
    }
  }

  const current = cats.find((c) => c.key === catKey)

  return (
    <PageShell backTo="/profile" maxWidth="max-w-2xl">
      <div className="animate-fade-up space-y-5">
        <div>
          <h1 className="font-display text-3xl font-bold">{t('creator.title')}</h1>
          <p className="mt-1 text-sm text-slate-400">{t('creator.total', { n: total, c: cats.length })}</p>
        </div>

        <form onSubmit={add} className="card space-y-4 p-5 sm:p-6">
          <p className="font-display text-lg font-bold">{t('creator.add')}</p>

          <div>
            <p className="label-tiny mb-2">{t('creator.category')}</p>
            <div className="flex flex-wrap gap-2">
              {cats.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCatKey(c.key)}
                  className={cx(
                    'rounded-full border px-4 py-2 text-sm font-bold transition',
                    c.key === catKey
                      ? 'border-neon-blue bg-neon-blue/20 text-white shadow-glow-blue'
                      : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/30',
                  )}
                >
                  {loc(c.category)}
                </button>
              ))}
            </div>
          </div>

          <TextField
            label={t('creator.word')}
            placeholder={t('creator.wordPh')}
            maxLength={30}
            value={word}
            error={error}
            onChange={(e) => {
              setWord(e.target.value)
              setError('')
            }}
          />
          <TextField
            label={t('creator.translation')}
            hint={t('creator.translationHint')}
            maxLength={30}
            value={translation}
            onChange={(e) => setTranslation(e.target.value)}
          />

          <Button type="submit" variant="neon" className="w-full" disabled={busy || !word.trim()}>
            {t('creator.addBtn', { cat: loc(current.category) })}
          </Button>
        </form>

        <div className="card space-y-3 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="font-display text-lg font-bold">{t('creator.all')}</p>
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('creator.search')}
            className="h-12 w-full rounded-2xl border border-white/10 bg-ink-900/80 px-4 text-sm text-white placeholder-slate-600 outline-none focus:border-neon-blue"
          />

          {cats.map((c) => {
            const words = q ? c.words.filter((w) => w.th.toLowerCase().includes(q) || w.en.toLowerCase().includes(q)) : c.words
            if (q && !words.length) return null
            const customCount = c.words.filter((w) => w.custom).length
            return (
              <details key={c.key} open={q ? true : c.key === catKey} className="rounded-2xl border border-white/10 bg-ink-900/50 p-3">
                <summary className="cursor-pointer select-none font-bold">
                  {loc(c.category)} <span className="text-sm font-normal text-slate-500">· {c.words.length}</span>
                  {customCount > 0 && <span className="ml-2 text-xs text-amber-300">+{customCount}</span>}
                </summary>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {words.map((w) => (
                    <span
                      key={w.id ?? w.th}
                      className={cx(
                        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold',
                        w.custom ? 'border-amber-400/50 bg-amber-400/10 text-amber-100' : 'border-white/10 bg-white/5 text-slate-200',
                      )}
                      title={`${w.th} / ${w.en}`}
                    >
                      {loc(w)}
                      {w.custom && (
                        <button
                          type="button"
                          onClick={() => remove(w.id)}
                          aria-label={t('creator.delete')}
                          className="grid h-4 w-4 place-items-center rounded-full bg-black/30 text-[10px] leading-none hover:bg-red-500/70"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </details>
            )
          })}
          <p className="text-xs text-slate-500">{t('creator.legend')}</p>
        </div>

        <div className="card space-y-3 p-5 sm:p-6">
          <p className="font-display text-lg font-bold">{t('creator.backup')}</p>
          <p className="text-xs leading-relaxed text-slate-400">{t('creator.backupNote')}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="secondary" size="md" className="flex-1" onClick={exportBackup}>
              {t('creator.export')}
            </Button>
            <input ref={importRef} type="file" accept="application/json,.json" className="hidden" onChange={importBackup} />
            <Button variant="secondary" size="md" className="flex-1" onClick={() => importRef.current?.click()}>
              {t('creator.import')}
            </Button>
          </div>
        </div>
      </div>
      <Toast message={toast} />
    </PageShell>
  )
}
