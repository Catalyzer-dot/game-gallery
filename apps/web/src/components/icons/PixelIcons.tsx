/**
 * Pixel-art icon set matching the game-gallery favicon style.
 * All icons use currentColor for stroke, with optional accent fills.
 * Drop-in replacements for Lucide icons (same size/className props).
 */

import React from 'react'

interface IconProps {
  size?: number
  className?: string
  strokeWidth?: number
}

// === Settings (gear) ===
function SettingsIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="6" y="1" width="4" height="3" rx="0.5" fill="currentColor" opacity="0.7" />
      <rect x="6" y="12" width="4" height="3" rx="0.5" fill="currentColor" opacity="0.7" />
      <rect x="1" y="6" width="3" height="4" rx="0.5" fill="currentColor" opacity="0.7" />
      <rect x="12" y="6" width="3" height="4" rx="0.5" fill="currentColor" opacity="0.7" />
      <rect
        x="4"
        y="4"
        width="8"
        height="8"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <rect x="6.5" y="6.5" width="3" height="3" rx="1.5" fill="currentColor" />
    </svg>
  )
}

// === Loader (spinning) ===
function Loader2({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="7" y="1" width="2" height="3" rx="0.5" fill="currentColor" />
      <rect x="7" y="12" width="2" height="3" rx="0.5" fill="currentColor" opacity="0.3" />
      <rect x="1" y="7" width="3" height="2" rx="0.5" fill="currentColor" opacity="0.5" />
      <rect x="12" y="7" width="3" height="2" rx="0.5" fill="currentColor" opacity="0.7" />
      <rect
        x="2.5"
        y="2.5"
        width="2.5"
        height="2.5"
        rx="0.5"
        fill="currentColor"
        opacity="0.6"
        transform="rotate(0 3.75 3.75)"
      />
      <rect x="11" y="11" width="2.5" height="2.5" rx="0.5" fill="currentColor" opacity="0.2" />
      <rect x="11" y="2.5" width="2.5" height="2.5" rx="0.5" fill="currentColor" opacity="0.8" />
      <rect x="2.5" y="11" width="2.5" height="2.5" rx="0.5" fill="currentColor" opacity="0.4" />
    </svg>
  )
}

// === Play (triangle) ===
function Play({ size = 14, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className}>
      <rect x="3" y="2" width="2" height="10" rx="0.3" fill="currentColor" />
      <rect x="5" y="3" width="2" height="8" rx="0.3" fill="currentColor" />
      <rect x="7" y="4" width="2" height="6" rx="0.3" fill="currentColor" />
      <rect x="9" y="5" width="2" height="4" rx="0.3" fill="currentColor" />
    </svg>
  )
}

// === Bookmark (flag) ===
function Bookmark({ size = 14, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className}>
      <rect x="3" y="1" width="8" height="2" rx="0.3" fill="currentColor" />
      <rect x="3" y="3" width="2" height="8" rx="0.3" fill="currentColor" />
      <rect x="9" y="3" width="2" height="8" rx="0.3" fill="currentColor" />
      <rect x="5" y="11" width="4" height="2" rx="0.3" fill="currentColor" />
      <rect x="5" y="5" width="4" height="2" rx="0.3" fill="currentColor" opacity="0.4" />
    </svg>
  )
}

// === CheckCircle (checkmark in square) ===
function CheckCircle({ size = 14, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className}>
      <rect
        x="2"
        y="2"
        width="10"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <rect x="3" y="7" width="2" height="2" rx="0.3" fill="currentColor" />
      <rect x="5" y="8" width="2" height="2" rx="0.3" fill="currentColor" />
      <rect x="7" y="6" width="2" height="2" rx="0.3" fill="currentColor" />
      <rect x="9" y="4" width="2" height="2" rx="0.3" fill="currentColor" />
    </svg>
  )
}

// === PackageOpen (open box) ===
function PackageOpen({ size = 48, className, strokeWidth: _sw }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <rect
        x="6"
        y="12"
        width="20"
        height="14"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <rect x="14" y="12" width="4" height="14" rx="0.3" fill="currentColor" opacity="0.15" />
      <rect
        x="4"
        y="8"
        width="24"
        height="4"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <rect x="8" y="5" width="3" height="3" rx="0.3" fill="currentColor" opacity="0.5" />
      <rect x="21" y="5" width="3" height="3" rx="0.3" fill="currentColor" opacity="0.5" />
    </svg>
  )
}

// === Plus ===
function Plus({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="7" y="3" width="2" height="10" rx="0.5" fill="currentColor" />
      <rect x="3" y="7" width="10" height="2" rx="0.5" fill="currentColor" />
    </svg>
  )
}

// === Trash2 (trash can) ===
function Trash2({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="3" y="3" width="10" height="2" rx="0.5" fill="currentColor" />
      <rect x="6" y="1" width="4" height="2" rx="0.5" fill="currentColor" />
      <rect
        x="4"
        y="5"
        width="8"
        height="9"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
      />
      <rect x="6" y="7" width="1.2" height="4" rx="0.3" fill="currentColor" opacity="0.5" />
      <rect x="8.8" y="7" width="1.2" height="4" rx="0.3" fill="currentColor" opacity="0.5" />
    </svg>
  )
}

// === Pin (thumbtack) ===
function Pin({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect
        x="5"
        y="2"
        width="6"
        height="5"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
      />
      <rect x="7" y="7" width="2" height="4" rx="0.3" fill="currentColor" />
      <rect x="6" y="11" width="4" height="1.5" rx="0.3" fill="currentColor" opacity="0.5" />
      <rect x="7.25" y="12.5" width="1.5" height="2" rx="0.3" fill="currentColor" opacity="0.7" />
    </svg>
  )
}

// === AlertTriangle (warning) ===
function AlertTriangle({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="7" y="2" width="2" height="2" rx="0.3" fill="currentColor" />
      <rect x="6" y="4" width="4" height="2" rx="0.3" fill="currentColor" />
      <rect x="5" y="6" width="6" height="2" rx="0.3" fill="currentColor" />
      <rect x="4" y="8" width="8" height="2" rx="0.3" fill="currentColor" />
      <rect x="3" y="10" width="10" height="2" rx="0.3" fill="currentColor" />
      <rect x="2" y="12" width="12" height="2" rx="0.5" fill="currentColor" />
      <rect x="7.25" y="5.5" width="1.5" height="3" rx="0.3" fill="currentColor" opacity="0" />
    </svg>
  )
}

// === LogIn (arrow into door) ===
function LogIn({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect
        x="8"
        y="2"
        width="6"
        height="12"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
      />
      <rect x="2" y="7" width="7" height="2" rx="0.5" fill="currentColor" />
      <rect x="6" y="5" width="2" height="2" rx="0.3" fill="currentColor" />
      <rect x="6" y="9" width="2" height="2" rx="0.3" fill="currentColor" />
    </svg>
  )
}

// === LogOut (arrow out of door) ===
function LogOut({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect
        x="2"
        y="2"
        width="6"
        height="12"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
      />
      <rect x="7" y="7" width="7" height="2" rx="0.5" fill="currentColor" />
      <rect x="11" y="5" width="2" height="2" rx="0.3" fill="currentColor" />
      <rect x="11" y="9" width="2" height="2" rx="0.3" fill="currentColor" />
    </svg>
  )
}

// === X (close) ===
function X({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="3" y="3" width="2" height="2" rx="0.3" fill="currentColor" />
      <rect x="5" y="5" width="2" height="2" rx="0.3" fill="currentColor" />
      <rect x="7" y="7" width="2" height="2" rx="0.3" fill="currentColor" />
      <rect x="9" y="9" width="2" height="2" rx="0.3" fill="currentColor" />
      <rect x="11" y="11" width="2" height="2" rx="0.3" fill="currentColor" />
      <rect x="11" y="3" width="2" height="2" rx="0.3" fill="currentColor" />
      <rect x="9" y="5" width="2" height="2" rx="0.3" fill="currentColor" />
      <rect x="5" y="9" width="2" height="2" rx="0.3" fill="currentColor" />
      <rect x="3" y="11" width="2" height="2" rx="0.3" fill="currentColor" />
    </svg>
  )
}

// === Search (magnifying glass) ===
function Search({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <rect x="4" y="2" width="5" height="2" rx="0.3" fill="currentColor" />
      <rect x="2" y="4" width="2" height="5" rx="0.3" fill="currentColor" />
      <rect x="9" y="4" width="2" height="5" rx="0.3" fill="currentColor" />
      <rect x="4" y="9" width="5" height="2" rx="0.3" fill="currentColor" />
      <rect x="10" y="10" width="2" height="2" rx="0.3" fill="currentColor" />
      <rect x="12" y="12" width="2" height="2" rx="0.3" fill="currentColor" />
    </svg>
  )
}

// === Logo: Pixel "G" ===
function LogoIcon({ size = 32, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <rect x="10" y="4" width="4" height="4" rx="0.5" fill="#A78BFA" />
      <rect x="14" y="4" width="4" height="4" rx="0.5" fill="#A78BFA" />
      <rect x="18" y="4" width="4" height="4" rx="0.5" fill="#7C3AED" />
      <rect x="6" y="8" width="4" height="4" rx="0.5" fill="#A78BFA" />
      <rect x="6" y="12" width="4" height="4" rx="0.5" fill="#7C3AED" />
      <rect x="6" y="16" width="4" height="4" rx="0.5" fill="#7C3AED" />
      <rect x="14" y="16" width="4" height="4" rx="0.5" fill="#F43F5E" />
      <rect x="18" y="16" width="4" height="4" rx="0.5" fill="#F43F5E" />
      <rect x="22" y="16" width="4" height="4" rx="0.5" fill="#F43F5E" />
      <rect x="6" y="20" width="4" height="4" rx="0.5" fill="#A78BFA" />
      <rect x="22" y="20" width="4" height="4" rx="0.5" fill="#7C3AED" />
      <rect x="10" y="24" width="4" height="4" rx="0.5" fill="#A78BFA" />
      <rect x="14" y="24" width="4" height="4" rx="0.5" fill="#7C3AED" />
      <rect x="18" y="24" width="4" height="4" rx="0.5" fill="#7C3AED" />
      <rect x="22" y="24" width="4" height="4" rx="0.5" fill="#A78BFA" />
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
