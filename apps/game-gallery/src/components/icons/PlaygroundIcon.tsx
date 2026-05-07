interface PlaygroundIconProps {
  size?: number
  className?: string
}

/** Pixel-art rocket — block style matching favicon */
function PlaygroundIcon({ size = 18, className }: PlaygroundIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      {/* Nose */}
      <rect x="7" y="1" width="2" height="2" rx="0.3" fill="currentColor" />
      {/* Body */}
      <rect x="6" y="3" width="4" height="2" rx="0.3" fill="currentColor" />
      <rect x="5" y="5" width="6" height="2" rx="0.3" fill="currentColor" />
      <rect x="5" y="7" width="6" height="2" rx="0.3" fill="currentColor" opacity="0.8" />
      <rect x="6" y="9" width="4" height="2" rx="0.3" fill="currentColor" opacity="0.6" />
      {/* Window */}
      <rect
        x="7"
        y="5.5"
        width="2"
        height="2"
        rx="0.8"
        fill="currentColor"
        opacity="0"
        stroke="currentColor"
        strokeWidth="0.6"
      />
      {/* Fins */}
      <rect x="3" y="8" width="2" height="3" rx="0.3" fill="currentColor" opacity="0.5" />
      <rect x="11" y="8" width="2" height="3" rx="0.3" fill="currentColor" opacity="0.5" />
      {/* Flame */}
      <rect x="6" y="11" width="2" height="2" rx="0.3" fill="#F43F5E" />
      <rect x="8" y="11" width="2" height="2" rx="0.3" fill="#fbbf24" />
      <rect x="7" y="13" width="2" height="1.5" rx="0.3" fill="#F43F5E" opacity="0.6" />
    </svg>
  )
}

export { PlaygroundIcon }
