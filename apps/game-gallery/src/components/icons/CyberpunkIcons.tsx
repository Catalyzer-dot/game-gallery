/**
 * Cyberpunk icon set — sharp angled strokes, neon accents, cut corners.
 * Same API as PixelIcons (size + className). Drop-in replacement.
 */

interface IconProps {
  size?: number
  className?: string
  strokeWidth?: number
}

// Sharp cut-corner style: lines at 45deg corners, thin strokes, neon accents

function SettingsIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path
        d="M6.5 1.5H9.5L10 3.5L12 4.5L14 3.5L15 5.5L13.5 7V9L15 10.5L14 12.5L12 11.5L10 12.5L9.5 14.5H6.5L6 12.5L4 11.5L2 12.5L1 10.5L2.5 9V7L1 5.5L2 3.5L4 4.5L6 3.5Z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="bevel"
        fill="none"
      />
      <path
        d="M6.5 8A1.5 1.5 0 1 0 9.5 8A1.5 1.5 0 1 0 6.5 8"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />
    </svg>
  )
}

function Loader2({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M8 2V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
      <path
        d="M8 12V14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="square"
        opacity="0.3"
      />
      <path
        d="M3.8 3.8L5.2 5.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="square"
        opacity="0.7"
      />
      <path
        d="M10.8 10.8L12.2 12.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="square"
        opacity="0.2"
      />
      <path
        d="M2 8H4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="square"
        opacity="0.5"
      />
      <path
        d="M12 8H14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="square"
        opacity="0.8"
      />
      <path
        d="M3.8 12.2L5.2 10.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="square"
        opacity="0.4"
      />
      <path
        d="M10.8 5.2L12.2 3.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="square"
        opacity="0.9"
      />
    </svg>
  )
}

function Play({ size = 14, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className}>
      <path
        d="M4 2L4 12L11 7Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="bevel"
        fill="none"
      />
    </svg>
  )
}

function Bookmark({ size = 14, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className}>
      <path
        d="M3 1.5H11V12L7 9L3 12Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="bevel"
        fill="none"
      />
    </svg>
  )
}

function CheckCircle({ size = 14, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className}>
      <path
        d="M2 3L6 2L12 2L12 8L12 12L6 12L2 12Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="bevel"
        fill="none"
      />
      <path
        d="M4 7L6 9.5L10 4.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="square"
        strokeLinejoin="bevel"
        fill="none"
      />
    </svg>
  )
}

function PackageOpen({ size = 48, className, strokeWidth: _sw }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <path
        d="M4 10L16 5L28 10V24L16 28L4 24Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="bevel"
        fill="none"
      />
      <path
        d="M4 10L16 15L28 10"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="bevel"
        fill="none"
      />
      <path d="M16 15V28" stroke="currentColor" strokeWidth="1.2" fill="none" />
      <path d="M10 7.5L22 12.5" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
    </svg>
  )
}

function Plus({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M8 3V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
      <path d="M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
    </svg>
  )
}

function Trash2({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M3 4H13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="square" />
      <path
        d="M6 4V2.5H10V4"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="bevel"
        fill="none"
      />
      <path
        d="M4.5 4L5 14H11L11.5 4"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="bevel"
        fill="none"
      />
      <path d="M6.5 6.5V11.5" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
      <path d="M9.5 6.5V11.5" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
    </svg>
  )
}

function Pin({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path
        d="M5 2L11 2L11.5 7.5L9 9V12L8 14L7 12V9L4.5 7.5Z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="bevel"
        fill="none"
      />
      <path d="M4.5 7.5H11.5" stroke="currentColor" strokeWidth="0.8" />
    </svg>
  )
}

function AlertTriangle({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path
        d="M8 2L14.5 13.5H1.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="bevel"
        fill="none"
      />
      <path d="M8 6.5V9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="square" />
      <rect x="7.3" y="11" width="1.4" height="1.4" fill="currentColor" />
    </svg>
  )
}

function LogIn({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path
        d="M9 2H14V14H9"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="bevel"
        fill="none"
      />
      <path d="M1 8H10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="square" />
      <path
        d="M7 5L10 8L7 11"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="bevel"
        fill="none"
      />
    </svg>
  )
}

function LogOut({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path
        d="M7 2H2V14H7"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="bevel"
        fill="none"
      />
      <path d="M6 8H15" stroke="currentColor" strokeWidth="1.2" strokeLinecap="square" />
      <path
        d="M12 5L15 8L12 11"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="bevel"
        fill="none"
      />
    </svg>
  )
}

function X({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M3 3L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
      <path d="M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
    </svg>
  )
}

function Search({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path
        d="M3 7A4 4 0 1 0 11 7A4 4 0 1 0 3 7"
        stroke="currentColor"
        strokeWidth="1.3"
        fill="none"
      />
      <path d="M10 10L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
    </svg>
  )
}

// === Logo: Cyberpunk angular "G" ===
function LogoIcon({ size = 32, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <path
        d="M22 5H10L6 9V23L10 27H22L26 23V17H16V19H24V22L21 25H11L8 22V10L11 7H21L24 10V13H26V9Z"
        stroke="#A78BFA"
        strokeWidth="1.5"
        strokeLinejoin="bevel"
        fill="none"
      />
      <path d="M14 17H26V19H14Z" fill="#F43F5E" />
    </svg>
  )
}

export {
  SettingsIcon,
  Loader2,
  Play,
  Bookmark,
  CheckCircle,
  PackageOpen,
  Plus,
  Trash2,
  Pin,
  AlertTriangle,
  LogIn,
  LogOut,
  X,
  Search,
  LogoIcon,
}
