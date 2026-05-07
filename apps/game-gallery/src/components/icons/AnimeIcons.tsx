/**
 * Anime / Kawaii icon set — filled solid shapes, rounded, bubbly, cute.
 * No strokes, pure fill. Same API as other sets.
 */

interface IconProps {
  size?: number
  className?: string
  strokeWidth?: number
}

function SettingsIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path
        d="M6.2 1C5.9 1 5.6 1.2 5.5 1.5L5.1 3.1C4.6 3.3 4.2 3.6 3.8 3.9L2.2 3.4C1.9 3.3 1.6 3.4 1.4 3.7L0.6 5.1C0.4 5.4 0.5 5.7 0.7 5.9L2 7C2 7.3 2 7.7 2 8L0.7 9.1C0.5 9.3 0.4 9.6 0.6 9.9L1.4 11.3C1.6 11.6 1.9 11.7 2.2 11.6L3.8 11.1C4.2 11.4 4.6 11.7 5.1 11.9L5.5 13.5C5.6 13.8 5.9 14 6.2 14H7.8C8.1 14 8.4 13.8 8.5 13.5L8.9 11.9C9.4 11.7 9.8 11.4 10.2 11.1L11.8 11.6C12.1 11.7 12.4 11.6 12.6 11.3L13.4 9.9C13.6 9.6 13.5 9.3 13.3 9.1L12 8C12 7.7 12 7.3 12 7L13.3 5.9C13.5 5.7 13.6 5.4 13.4 5.1L12.6 3.7C12.4 3.4 12.1 3.3 11.8 3.4L10.2 3.9C9.8 3.6 9.4 3.3 8.9 3.1L8.5 1.5C8.4 1.2 8.1 1 7.8 1Z"
        fill="currentColor"
        opacity="0.85"
      />
      <circle cx="7" cy="7.5" r="2.2" fill="currentColor" opacity="0.3" />
    </svg>
  )
}

function Loader2({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <circle cx="8" cy="2.5" r="1.5" fill="currentColor" />
      <circle cx="12" cy="4" r="1.3" fill="currentColor" opacity="0.85" />
      <circle cx="13.5" cy="8" r="1.2" fill="currentColor" opacity="0.7" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" opacity="0.5" />
      <circle cx="8" cy="13.5" r="1" fill="currentColor" opacity="0.35" />
      <circle cx="4" cy="12" r="1.1" fill="currentColor" opacity="0.2" />
      <circle cx="2.5" cy="8" r="1.2" fill="currentColor" opacity="0.4" />
      <circle cx="4" cy="4" r="1.3" fill="currentColor" opacity="0.6" />
    </svg>
  )
}

function Play({ size = 14, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className}>
      <path
        d="M4 2.5C4 2 4.6 1.7 5 2L11.5 6.5C11.8 6.8 11.8 7.2 11.5 7.5L5 12C4.6 12.3 4 12 4 11.5Z"
        fill="currentColor"
      />
    </svg>
  )
}

function Bookmark({ size = 14, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className}>
      <path
        d="M3 1.5C3 1.2 3.2 1 3.5 1H10.5C10.8 1 11 1.2 11 1.5V12.8C11 13.2 10.5 13.4 10.2 13.1L7 10.5L3.8 13.1C3.5 13.4 3 13.2 3 12.8Z"
        fill="currentColor"
      />
    </svg>
  )
}

function CheckCircle({ size = 14, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className}>
      <circle cx="7" cy="7" r="6" fill="currentColor" opacity="0.85" />
      <path
        d="M4.5 7L6.2 8.8L9.5 5"
        stroke="#0F0F23"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

function PackageOpen({ size = 48, className, strokeWidth: _sw }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <path d="M16 5L4 11V23L16 29L28 23V11Z" fill="currentColor" opacity="0.2" />
      <path d="M4 11L16 17L28 11" fill="currentColor" opacity="0.15" />
      <path d="M16 17V29" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <path d="M4 11L16 5L28 11L16 17Z" fill="currentColor" opacity="0.4" />
      <circle cx="22" cy="7" r="1.5" fill="currentColor" opacity="0.3" />
    </svg>
  )
}

function Plus({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="6.5" y="2.5" width="3" height="11" rx="1.5" fill="currentColor" />
      <rect x="2.5" y="6.5" width="11" height="3" rx="1.5" fill="currentColor" />
    </svg>
  )
}

function Trash2({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="2.5" y="3" width="11" height="2" rx="1" fill="currentColor" />
      <rect x="6" y="1" width="4" height="2.5" rx="1" fill="currentColor" opacity="0.6" />
      <path d="M4 5H12L11.2 14H4.8Z" fill="currentColor" opacity="0.75" />
      <rect x="6.2" y="7" width="1.2" height="4.5" rx="0.6" fill="#0F0F23" opacity="0.3" />
      <rect x="8.6" y="7" width="1.2" height="4.5" rx="0.6" fill="#0F0F23" opacity="0.3" />
    </svg>
  )
}

function Pin({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <circle cx="8" cy="5.5" r="4" fill="currentColor" opacity="0.85" />
      <rect x="7" y="9" width="2" height="5.5" rx="1" fill="currentColor" opacity="0.6" />
      <circle cx="8" cy="5.5" r="1.5" fill="#0F0F23" opacity="0.25" />
    </svg>
  )
}

function AlertTriangle({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path
        d="M7.1 2.5C7.5 1.8 8.5 1.8 8.9 2.5L14.5 12.5C14.9 13.2 14.4 14 13.6 14H2.4C1.6 14 1.1 13.2 1.5 12.5Z"
        fill="currentColor"
        opacity="0.85"
      />
      <rect x="7.2" y="6" width="1.6" height="4" rx="0.8" fill="#0F0F23" opacity="0.5" />
      <circle cx="8" cy="11.5" r="0.9" fill="#0F0F23" opacity="0.5" />
    </svg>
  )
}

function LogIn({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="8" y="1.5" width="6.5" height="13" rx="1.5" fill="currentColor" opacity="0.4" />
      <rect x="1" y="6.5" width="9" height="3" rx="1.5" fill="currentColor" />
      <path d="M8 4.5L11 8L8 11.5" fill="currentColor" opacity="0.9" />
    </svg>
  )
}

function LogOut({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="1.5" y="1.5" width="6.5" height="13" rx="1.5" fill="currentColor" opacity="0.4" />
      <rect x="6" y="6.5" width="9" height="3" rx="1.5" fill="currentColor" />
      <path d="M12 4.5L15 8L12 11.5" fill="currentColor" opacity="0.9" />
    </svg>
  )
}

function X({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect
        x="2.6"
        y="4"
        width="2"
        height="12"
        rx="1"
        fill="currentColor"
        transform="rotate(-45 3.6 4)"
      />
      <rect
        x="11"
        y="2.6"
        width="2"
        height="12"
        rx="1"
        fill="currentColor"
        transform="rotate(45 12 3.6)"
      />
    </svg>
  )
}

function Search({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <circle cx="6.5" cy="6.5" r="5" fill="currentColor" opacity="0.3" />
      <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.8" fill="none" />
      <rect
        x="10.5"
        y="10"
        width="2.2"
        height="5"
        rx="1.1"
        fill="currentColor"
        transform="rotate(-45 11.5 10.5)"
      />
    </svg>
  )
}

function GamesIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" className={className}>
      <path
        d="M9 3.5C5.5 3.5 3.5 5 2.5 7C1.5 9 1.5 11.5 2.8 13C3.5 13.8 4.5 13.8 5.5 12.8L6.5 11.5C6.8 11.2 7.2 11 7.6 11H10.4C10.8 11 11.2 11.2 11.5 11.5L12.5 12.8C13.5 13.8 14.5 13.8 15.2 13C16.5 11.5 16.5 9 15.5 7C14.5 5 12.5 3.5 9 3.5Z"
        fill="currentColor"
        opacity="0.85"
      />
      {/* D-pad cutout */}
      <rect x="5" y="7.5" width="3" height="1" rx="0.5" fill="#0F0F23" opacity="0.35" />
      <rect x="6" y="6.5" width="1" height="3" rx="0.5" fill="#0F0F23" opacity="0.35" />
      {/* Buttons */}
      <circle cx="12" cy="7" r="1" fill="#F43F5E" />
      <circle cx="13.8" cy="8.8" r="1" fill="#A78BFA" />
    </svg>
  )
}

function PlaygroundIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" className={className}>
      {/* Body */}
      <path d="M9 1.5L5.5 8V12L7 14H11L12.5 12V8Z" fill="currentColor" opacity="0.85" />
      {/* Window */}
      <circle cx="9" cy="7.5" r="1.5" fill="#0F0F23" opacity="0.3" />
      {/* Fins */}
      <path d="M5.5 10L3 13.5L5.5 13Z" fill="currentColor" opacity="0.5" />
      <path d="M12.5 10L15 13.5L12.5 13Z" fill="currentColor" opacity="0.5" />
      {/* Flame */}
      <ellipse cx="8.2" cy="15" rx="1" ry="1.5" fill="#F43F5E" opacity="0.9" />
      <ellipse cx="9.8" cy="15.3" rx="0.8" ry="1.2" fill="#fbbf24" opacity="0.8" />
    </svg>
  )
}

// === Logo: Anime bubbly filled "G" ===
function LogoIcon({ size = 32, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <path
        d="M16 3C10.5 3 7 5 5 8.5C3.5 11.5 3.5 15 5 18C5.5 19 6.5 19.5 7.5 19H16V16H8C7.5 15 7.5 12.5 8.5 10.5C9.5 8.5 12 7 16 7C20 7 22.5 8.5 23.5 10.5C24.5 12.5 24.5 15 23.5 17C22.5 19 20 20.5 16 20.5V24.5C21.5 24.5 25 22.5 27 19.5C28.5 16.5 28.5 13 27 10C25 6 21.5 3 16 3Z"
        fill="#A78BFA"
        opacity="0.85"
      />
      <rect x="14" y="15" width="12" height="4" rx="2" fill="#F43F5E" />
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
  GamesIcon,
  PlaygroundIcon,
  LogoIcon,
}
