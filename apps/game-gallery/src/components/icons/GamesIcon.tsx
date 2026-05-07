interface GamesIconProps {
  size?: number
  className?: string
}

/** Pixel-art gamepad — 2x2 block style matching favicon */
function GamesIcon({ size = 18, className }: GamesIconProps) {
  // Pixel grid: each block is 2x2 in a 16x16 viewBox
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      {/* Body top row */}
      <rect x="4" y="3" width="2" height="2" rx="0.3" fill="currentColor" />
      <rect x="6" y="3" width="2" height="2" rx="0.3" fill="currentColor" />
      <rect x="8" y="3" width="2" height="2" rx="0.3" fill="currentColor" />
      <rect x="10" y="3" width="2" height="2" rx="0.3" fill="currentColor" />
      {/* Body sides */}
      <rect x="2" y="5" width="2" height="2" rx="0.3" fill="currentColor" />
      <rect x="12" y="5" width="2" height="2" rx="0.3" fill="currentColor" />
      <rect x="2" y="7" width="2" height="2" rx="0.3" fill="currentColor" />
      <rect x="12" y="7" width="2" height="2" rx="0.3" fill="currentColor" />
      {/* Grips */}
      <rect x="2" y="9" width="2" height="2" rx="0.3" fill="currentColor" opacity="0.6" />
      <rect x="12" y="9" width="2" height="2" rx="0.3" fill="currentColor" opacity="0.6" />
      {/* D-pad */}
      <rect x="5" y="5" width="2" height="1.5" rx="0.2" fill="currentColor" opacity="0.5" />
      <rect x="4" y="6.5" width="1.5" height="2" rx="0.2" fill="currentColor" opacity="0.5" />
      <rect x="6.5" y="6.5" width="1.5" height="2" rx="0.2" fill="currentColor" opacity="0.5" />
      <rect x="5" y="8.5" width="2" height="1.5" rx="0.2" fill="currentColor" opacity="0.5" />
      {/* Buttons */}
      <rect x="10" y="5.5" width="1.5" height="1.5" rx="0.2" fill="#F43F5E" />
      <rect x="12" y="7" width="1.5" height="1.5" rx="0.2" fill="#7C3AED" />
    </svg>
  )
}

export { GamesIcon }
