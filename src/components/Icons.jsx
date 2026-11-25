const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export const PlayIcon = (p) => (
  <svg {...base} fill="currentColor" stroke="none" {...p}>
    <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5Z" />
  </svg>
)

export const PlusIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const LoginIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
  </svg>
)

export const ArrowLeftIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)

export const CopyIcon = (p) => (
  <svg {...base} {...p}>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
  </svg>
)

export const CheckIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

export const CrownIcon = (p) => (
  <svg {...base} fill="currentColor" stroke="none" {...p}>
    <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8Z" />
  </svg>
)

export const LogoutIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </svg>
)

export const MaskIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M4 5c2.5 1.5 5 2 8 2s5.5-.5 8-2v8c0 4-3.5 7-8 7s-8-3-8-7V5Z" />
    <path d="M8 11h.01M16 11h.01M9 15c1.8 1.2 4.2 1.2 6 0" />
  </svg>
)
