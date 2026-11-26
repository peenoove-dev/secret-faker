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
import { CloseIcon } from '../components/Icons'

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
  if (!cats) return error ? <p className="p-8 text-center font-semibold text-ember-soft">{error}</p> : <Loading />

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
      <div className="space-y-5">
        <div>
          <h1 className="font-display text-4xl leading-tight">{t('creator.title')}</h1>
          <p className="mt-1 text-base text-felt-200">{t('creator.total', { n: total, c: cats.length })}</p>
        </div>

        <form onSubmit={add} className="panel space-y-4 p-5 sm:p-6">
          <p className="font-display text-2xl leading-tight">{t('creator.add')}</p>

          <div>
            <p className="label mb-2">{t('creator.category')}</p>
            <div className="flex flex-wrap gap-2">
              {cats.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCatKey(c.key)}
                  className={cx(
                    'rounded-full border-2 px-4 py-1.5 text-base font-bold transition-colors',
                    c.key === catKey
                      ? 'border-gold-deep bg-gold text-ink'
                      : 'border-felt-600 bg-felt-950 text-felt-200 hover:border-felt-500 hover:text-paper',
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

          <Button type="submit" variant="paper" className="w-full" disabled={busy || !word.trim()}>
            {t('creator.addBtn', { cat: loc(current.category) })}
          </Button>
        </form>

        <div className="panel space-y-3 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="font-display text-2xl leading-tight">{t('creator.all')}</p>
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('creator.search')}
            className="h-12 w-full rounded-lg border-2 border-paper-edge bg-paper px-4 text-base text-ink placeholder-ink-faint outline-none focus:border-gold"
          />

          {cats.map((c) => {
            const words = q ? c.words.filter((w) => w.th.toLowerCase().includes(q) || w.en.toLowerCase().includes(q)) : c.words
            if (q && !words.length) return null
            const customCount = c.words.filter((w) => w.custom).length
            return (
              <details key={c.key} open={q ? true : c.key === catKey} className="rounded-xl border-2 border-felt-700 bg-felt-950/60 p-3">
                <summary className="cursor-pointer select-none font-bold">
                  {loc(c.category)} <span className="ml-1 text-base font-normal text-felt-300">{c.words.length}</span>
                  {customCount > 0 && <span className="ml-2 text-sm text-gold">+{customCount}</span>}
                </summary>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {words.map((w) => (
                    <span
                      key={w.id ?? w.th}
                      className={cx(
                        'inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-0.5 text-base font-semibold',
                        w.custom ? 'border-gold bg-gold/15 text-gold-soft' : 'border-felt-600 bg-felt-800 text-felt-200',
                      )}
                      title={`${w.th} / ${w.en}`}
                    >
                      {loc(w)}
                      {w.custom && (
                        <button
                          type="button"
                          onClick={() => remove(w.id)}
                          aria-label={t('creator.delete')}
                          className="grid h-5 w-5 place-items-center rounded-full bg-felt-950 hover:bg-ember"
                        >
                          <CloseIcon size={11} />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </details>
            )
          })}
          <p className="text-[15px] text-felt-300">{t('creator.legend')}</p>
        </div>

        <div className="panel space-y-3 p-5 sm:p-6">
          <p className="font-display text-2xl leading-tight">{t('creator.backup')}</p>
          <p className="text-[15px] leading-relaxed text-felt-200">{t('creator.backupNote')}</p>
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
