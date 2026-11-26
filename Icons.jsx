/**
 * ชุดไอคอนวาดเองทั้งหมด (ไม่ใช้อีโมจิ/ไอคอนสำเร็จรูป)
 * สไตล์: เส้นหนา ปลายมน + เงาพิมพ์เหลื่อมสีเดียวกันจาง ๆ เหมือนงานสกรีนที่ซ้อนไม่ตรงเป๊ะ
 */
function Icon({ tint, size = 20, children, strokeWidth = 1.9, ...p }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...p}
    >
      {tint && <path d={tint} fill="currentColor" stroke="none" opacity=".22" transform="translate(1.6 1.6)" />}
      {children}
    </svg>
  )
}

/* ---------- การกระทำทั่วไป ---------- */

export const PlayIcon = (p) => (
  <Icon tint="M7.5 5.5v13l11-6.5z" {...p}>
    <path d="M7.5 5.5v13l11-6.5z" fill="currentColor" />
  </Icon>
)

export const PlusIcon = (p) => (
  <Icon strokeWidth={2.4} {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
)

/** ประตู — ใช้กับ "เข้าห้อง" */
export const LoginIcon = (p) => (
  <Icon tint="M6.5 4h10v17h-10z" {...p}>
    <path d="M6.5 21V4.5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1V21M3.5 21h17" />
    <path d="M13.8 12.5h.01" strokeWidth="3" />
  </Icon>
)

export const LogoutIcon = (p) => (
  <Icon {...p}>
    <path d="M10 20.5H6a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2h4M15.5 16.5 20 12l-4.500-4.500M20 12H9.500" />
  </Icon>
)

export const ArrowLeftIcon = (p) => (
  <Icon strokeWidth={2.2} {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Icon>
)

export const ArrowRightIcon = (p) => (
  <Icon strokeWidth={2.2} {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icon>
)

export const ArrowUpIcon = (p) => (
  <Icon strokeWidth={2.4} {...p}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </Icon>
)

export const CopyIcon = (p) => (
  <Icon tint="M8.500 8.500h12v12h-12z" {...p}>
    <rect x="8.500" y="8.500" width="12" height="12" rx="2" />
    <path d="M15.500 8.500v-3a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3" />
  </Icon>
)

export const CheckIcon = (p) => (
  <Icon strokeWidth={2.6} {...p}>
    <path d="m4.500 12.500 5 5L19.500 7" />
  </Icon>
)

export const CloseIcon = (p) => (
  <Icon strokeWidth={2.3} {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icon>
)

export const SearchIcon = (p) => (
  <Icon tint="M4 4h12v12H4z" {...p}>
    <circle cx="10.500" cy="10.500" r="6.500" />
    <path d="m15.500 15.500 5 5" strokeWidth="2.400" />
  </Icon>
)

export const CameraIcon = (p) => (
  <Icon tint="M4 8.500h16V19H4z" {...p}>
    <path d="M4 8.500a2 2 0 0 1 2-2h1.500l1.200-2h6.600l1.200 2H18a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
    <circle cx="12" cy="12.800" r="3.200" />
  </Icon>
)

export const SoundOnIcon = (p) => (
  <Icon tint="M4 9.500h3.500L12 5.500v13l-4.500-4H4z" {...p}>
    <path d="M4 9.500h3.500L12 5.500v13l-4.500-4H4z" />
    <path d="M15.500 9a4 4 0 0 1 0 6M18.200 6.500a7.500 7.500 0 0 1 0 11" />
  </Icon>
)

export const SoundOffIcon = (p) => (
  <Icon tint="M4 9.500h3.500L12 5.500v13l-4.500-4H4z" {...p}>
    <path d="M4 9.500h3.500L12 5.500v13l-4.500-4H4z" />
    <path d="m16 9.500 5 5M21 9.500l-5 5" />
  </Icon>
)

export const ChatIcon = (p) => (
  <Icon tint="M4 6.500A2.500 2.500 0 0 1 6.500 4h11A2.500 2.500 0 0 1 20 6.500v7a2.500 2.500 0 0 1-2.500 2.500H11l-4.500 3.500V16A2.500 2.500 0 0 1 4 13.500z" {...p}>
    <path d="M4 6.500A2.500 2.500 0 0 1 6.500 4h11A2.500 2.500 0 0 1 20 6.500v7a2.500 2.500 0 0 1-2.500 2.500H11l-4.500 3.500V16A2.500 2.500 0 0 1 4 13.500z" />
  </Icon>
)

export const EyeIcon = (p) => (
  <Icon tint="M2.500 12S6 5.500 12 5.500 21.500 12 21.500 12 18 18.500 12 18.500 2.500 12 2.500 12z" {...p}>
    <path d="M2.500 12S6 5.500 12 5.500 21.500 12 21.500 12 18 18.500 12 18.500 2.500 12 2.500 12z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
)

export const PencilIcon = (p) => (
  <Icon tint="M4 20l1-4L16.500 4.500l3 3L8 19z" {...p}>
    <path d="M4 20l1-4L16.500 4.500a2.100 2.100 0 0 1 3 3L8 19zM14.500 6.500l3 3" />
  </Icon>
)

export const GlobeIcon = (p) => (
  <Icon tint="M3.500 12a8.500 8.500 0 1 0 17 0 8.500 8.500 0 0 0-17 0" {...p}>
    <circle cx="12" cy="12" r="8.500" />
    <path d="M3.500 12h17M12 3.500c2.600 2.400 3.800 5.300 3.800 8.500s-1.200 6.100-3.800 8.500C9.400 18.100 8.200 15.200 8.200 12S9.400 5.900 12 3.500z" />
  </Icon>
)

export const LockIcon = (p) => (
  <Icon tint="M5 11h14v9.500H5z" {...p}>
    <rect x="5" y="10.500" width="14" height="10" rx="2" />
    <path d="M8 10.500V8a4 4 0 0 1 8 0v2.500" />
    <path d="M12 15.500h.01" strokeWidth="3" />
  </Icon>
)

export const CrownIcon = (p) => (
  <Icon strokeWidth={1.4} {...p}>
    <path d="M3.500 8.500 8 12l4-7 4 7 4.500-3.500-1.800 10H5.300z" fill="currentColor" />
  </Icon>
)

export const TrophyIcon = (p) => (
  <Icon tint="M7.500 4.500h9v5a4.500 4.500 0 0 1-9 0z" {...p}>
    <path d="M7.500 4.500h9v5a4.500 4.500 0 0 1-9 0zM7.500 6.500h-3c0 3 1.200 4.500 3.500 5M16.500 6.500h3c0 3-1.200 4.500-3.500 5M12 14v3.500M8.500 20h7M9.500 17.500h5" />
  </Icon>
)

export const MedalIcon = (p) => (
  <Icon tint="M7 9.500a5 5 0 1 0 10 0 5 5 0 0 0-10 0" {...p}>
    <circle cx="12" cy="14.500" r="5" />
    <path d="M8.500 3.500 10.800 9.800M15.500 3.500l-2.300 6.300M12 12.500v4" />
  </Icon>
)

export const TargetIcon = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.500" />
    <circle cx="12" cy="12" r="4.500" />
    <path d="M12 12h.01" strokeWidth="3" />
  </Icon>
)

export const EmptyCardIcon = (p) => (
  <Icon {...p}>
    <rect x="6" y="3.500" width="12" height="17" rx="2.200" strokeDasharray="3 3" transform="rotate(-8 12 12)" />
    <path d="M10 10.500c.4-1.300 3.600-1.300 4 .2.300 1.300-1.400 1.700-1.800 2.800M12.200 16h.01" strokeWidth="2.100" />
  </Icon>
)

/* ---------- หน้ากาก: สัญลักษณ์หลักของเกม ---------- */

export const MaskIcon = (p) => (
  <Icon tint="M3.500 7.500c3 1.300 5.300 1.800 8.500 1.800s5.500-.5 8.500-1.800v5.500c0 4-3.800 7.200-8.500 7.200S3.500 17 3.500 13z" {...p}>
    <path d="M3.500 7.500c3 1.300 5.300 1.800 8.500 1.800s5.500-.5 8.500-1.800v5.500c0 4-3.800 7.200-8.500 7.200S3.500 17 3.500 13z" />
    <path d="M7.200 12.800c1-1.200 2.600-1.200 3.600-.2M13.200 12.600c1-1 2.600-1 3.600.2M9.500 16.500c1.500 1 3.500 1 5 0" />
  </Icon>
)

export const MaskXIcon = (p) => (
  <Icon tint="M3.500 7.500c3 1.300 5.300 1.800 8.500 1.800s5.500-.5 8.500-1.800v5.500c0 4-3.800 7.200-8.500 7.200S3.500 17 3.500 13z" {...p}>
    <path d="M3.500 7.500c3 1.300 5.300 1.800 8.500 1.800s5.500-.5 8.500-1.800v5.500c0 4-3.800 7.200-8.500 7.200S3.500 17 3.500 13z" />
    <path d="m7 11.500 3.500 3M10.500 11.500 7 14.500M13.500 11.500l3.500 3M17 11.500l-3.500 3M9.500 17.500c1.500-.8 3.500-.8 5 0" />
  </Icon>
)

/* ---------- ไอคอนตามแต้มไพ่ (ใช้เป็นสัญลักษณ์ประจำที่นั่งผู้เล่น) ---------- */

export const SPADE = 'M12 2.500C7 8 3.500 10.500 3.500 14a4.200 4.200 0 0 0 7.300 2.800c-.1 2-.7 3.300-1.800 4.700h6c-1.100-1.400-1.700-2.700-1.800-4.700A4.200 4.200 0 0 0 20.500 14C20.500 10.500 17 8 12 2.500z'
export const HEART = 'M12 20.500C5 15.500 3 12 3 8.800A4.800 4.800 0 0 1 12 6.800 4.800 4.800 0 0 1 21 8.800C21 12 19 15.500 12 20.500z'
export const DIAMOND = 'M12 2.500 19.500 12 12 21.500 4.500 12z'
export const CLUB = 'M12 3a4 4 0 0 0-3.300 6.200A4.200 4.200 0 1 0 11 15.800c-.1 2-.7 3.200-1.800 4.700h5.600c-1.100-1.500-1.700-2.700-1.800-4.700a4.200 4.200 0 1 0 2.300-6.600A4 4 0 0 0 12 3z'

export const SUITS = [
  { d: SPADE, red: false },
  { d: HEART, red: true },
  { d: CLUB, red: false },
  { d: DIAMOND, red: true },
]

export function SuitIcon({ index = 0, size = 16, className }) {
  const s = SUITS[index % SUITS.length]
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
      <path d={s.d} fill="currentColor" />
    </svg>
  )
}

/* ---------- ไอคอนความสำเร็จ ---------- */

const CardsIcon = (p) => (
  <Icon {...p}>
    <rect x="4.500" y="5" width="10" height="14" rx="1.800" transform="rotate(-12 9.500 12)" />
    <rect x="9.500" y="5" width="10" height="14" rx="1.800" transform="rotate(10 14.500 12)" fill="currentColor" fillOpacity=".18" />
  </Icon>
)

const ChevronsIcon = (p) => (
  <Icon strokeWidth={2.300} {...p}>
    <path d="m6 12 6-6 6 6M6 19l6-6 6 6" />
  </Icon>
)

const FlameIcon = (p) => (
  <Icon tint="M12 3c.5 3.500 5 5.500 5 10.500a5 5 0 0 1-10 0c0-2 .9-3.300 2-4.300.2 1.300.8 2 1.700 2.300C10.300 8.500 11 5.500 12 3z" {...p}>
    <path d="M12 3c.5 3.500 5 5.500 5 10.500a5 5 0 0 1-10 0c0-2 .9-3.300 2-4.300.2 1.300.8 2 1.700 2.300C10.300 8.500 11 5.500 12 3z" />
  </Icon>
)

const BoltIcon = (p) => (
  <Icon tint="M13 3 5.500 13.500H11L10 21l8-11h-5.500z" {...p}>
    <path d="M13 3 5.500 13.500H11L10 21l8-11h-5.500z" />
  </Icon>
)

const FoxIcon = (p) => (
  <Icon tint="M4 4.500 9 8h6l5-3.500c.5 4-.2 8-3 11l-4 4.500-4-4.500c-2.800-3-3.500-7-3-11z" {...p}>
    <path d="M4 4.500 9 8h6l5-3.500c.5 4-.2 8-3 11l-4 4.500-4-4.500c-2.800-3-3.500-7-3-11z" />
    <path d="M9 12.500h.01M15 12.500h.01M11 16.500h2" strokeWidth="2.600" />
  </Icon>
)

const BulbIcon = (p) => (
  <Icon tint="M12 3.500a6 6 0 0 0-3.500 10.900c.6.5 1 1.200 1 2.100h5c0-.9.4-1.600 1-2.100A6 6 0 0 0 12 3.500z" {...p}>
    <path d="M12 3.500a6 6 0 0 0-3.500 10.900c.6.5 1 1.200 1 2.100h5c0-.9.4-1.600 1-2.100A6 6 0 0 0 12 3.500zM9.500 19h5M10.500 21h3" />
  </Icon>
)

const GhostIcon = (p) => (
  <Icon tint="M5.500 20V10.500a6.500 6.500 0 0 1 13 0V20l-2.200-1.800L14.200 20 12 18.200 9.800 20l-2.100-1.800z" {...p}>
    <path d="M5.500 20V10.500a6.500 6.500 0 0 1 13 0V20l-2.200-1.800L14.200 20 12 18.200 9.800 20l-2.100-1.800z" />
    <path d="M9.500 10.500h.01M14.500 10.500h.01" strokeWidth="2.800" />
  </Icon>
)

const GemIcon = (p) => (
  <Icon tint="M6.500 4.500h11l3.500 5-9 10.500L3 9.500z" {...p}>
    <path d="M6.500 4.500h11l3.500 5-9 10.500L3 9.500zM3 9.500h18M9.500 4.500 12 9.500l2.500-5M12 9.500V20" />
  </Icon>
)

const HouseIcon = (p) => (
  <Icon tint="M6 9.500 12 4.500l6 5V20H6z" {...p}>
    <path d="M3.500 11 12 4l8.500 7M6 9.500V20h12V9.500M10 20v-5.500h4V20" />
  </Icon>
)

const StarIcon = (p) => (
  <Icon tint="m12 3.500 2.600 5.400 5.900.8-4.300 4.100 1 5.800L12 16.800l-5.200 2.800 1-5.800L3.500 9.700l5.900-.8z" {...p}>
    <path d="m12 3.500 2.600 5.400 5.900.8-4.300 4.100 1 5.800L12 16.800l-5.200 2.800 1-5.800L3.500 9.700l5.900-.8z" />
  </Icon>
)

const ACH_ICONS = {
  first_game: CardsIcon,
  first_win: MedalIcon,
  veteran: ChevronsIcon,
  addict: FlameIcon,
  winner: TrophyIcon,
  streak3: BoltIcon,
  faker_win: MaskIcon,
  master_faker: FoxIcon,
  detective: SearchIcon,
  mind_reader: BulbIcon,
  ghost: GhostIcon,
  flawless: GemIcon,
  full_house: HouseIcon,
  rising_star: StarIcon,
}

export function AchievementIcon({ id, ...p }) {
  const C = ACH_ICONS[id] ?? StarIcon
  return <C {...p} />
}
