import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { translations } from './translations'

const STORAGE_KEY = 'secret-faker:lang'
const LanguageContext = createContext(null)

function initialLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'th' || saved === 'en') return saved
  } catch {
    /* ignore */
  }
  return 'th' // ค่าเริ่มต้นเป็นภาษาไทย
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(initialLang)

  useEffect(() => {
    document.documentElement.lang = lang
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      /* ignore */
    }
  }, [lang])

  const setLang = useCallback((l) => setLangState(l === 'en' ? 'en' : 'th'), [])

  /** t('key', { name: 'x' }) — ถ้าไม่มีคำแปลจะใช้ภาษาอังกฤษ แล้วใช้ชื่อ key */
  const t = useCallback(
    (key, params) => {
      let s = translations[lang][key] ?? translations.en[key] ?? key
      if (params) for (const [k, v] of Object.entries(params)) s = s.replaceAll(`{${k}}`, v)
      return s
    },
    [lang],
  )

  /** เลือกข้อความตามภาษาจาก object แบบ { th, en } (ใช้กับหมวด/คำลับ) */
  const loc = useCallback((obj) => (obj ? (obj[lang] ?? obj.en) : ''), [lang])

  const value = useMemo(() => ({ lang, setLang, t, loc }), [lang, setLang, t, loc])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLang() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLang must be used inside <LanguageProvider>')
  return ctx
}
