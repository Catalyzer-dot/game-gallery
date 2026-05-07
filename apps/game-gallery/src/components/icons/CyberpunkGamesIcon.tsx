interface GamesIconProps {
  size?: number
  className?: string
}

/** Cyberpunk gamepad — sharp angular strokes, neon accent dots */
function GamesIcon({ size = 18, className }: GamesIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" className={className}>
      <path
        d="M9 3.5C5.5 3.5 3.5 5 2.5 7C1.5 9 1.5 11.5 2.8 13C3.5 13.8 4.5 13.8 5.5 12.8L6.5 11.5C6.8 11.2 7.2 11 7.6 11H10.4C10.8 11 11.2 11.2 11.5 11.5L12.5 12.8C13.5 13.8 14.5 13.8 15.2 13C16.5 11.5 16.5 9 15.5 7C14.5 5 12.5 3.5 9 3.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="bevel"
        fill="none"
      />
      {/* D-pad as sharp cross */}
      <path d="M6 6.5V9.5M4.5 8H7.5" stroke="currentColor" strokeWidth="1" strokeLinecap="square" />
      {/* Action dots */}
      <circle cx="12" cy="7" r="0.8" fill="#F43F5E" />
      <circle cx="13.5" cy="8.5" r="0.8" fill="#7C3AED" />
    </svg>
  )
}

export { GamesIcon }
