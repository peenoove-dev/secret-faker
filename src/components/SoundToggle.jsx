import { setMuted, useSoundPrefs } from '../lib/sound'
import { useLang } from '../i18n/LanguageContext'
import { SoundOffIcon, SoundOnIcon } from './Icons'
import { cx } from '../lib/utils'

/** ปุ่มเปิด/ปิดเสียง (ปิดแล้วจะไม่สั่นด้วย) */
export default function SoundToggle({ className }) {
  const { muted } = useSoundPrefs()
  const { t } = useLang()
  return (
    <button
      type="button"
      onClick={() => setMuted(!muted)}
      aria-pressed={!muted}
      aria-label={muted ? t('sound.on') : t('sound.off')}
      title={muted ? t('sound.on') : t('sound.off')}
      className={cx(
        'grid h-9 w-9 place-items-center rounded-lg border-2 border-felt-600 bg-felt-950 hover:border-felt-500',
        muted ? 'text-felt-300' : 'text-gold',
        className,
      )}
    >
      {muted ? <SoundOffIcon size={18} /> : <SoundOnIcon size={18} />}
    </button>
  )
}
