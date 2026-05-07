interface PlaygroundIconProps {
  size?: number
  className?: string
}

/** Cyberpunk rocket — sharp angular body, bevel joints, neon flame */
function PlaygroundIcon({ size = 18, className }: PlaygroundIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" className={className}>
      {/* Rocket body */}
      <path
        d="M9 2L6.5 7V11L7.5 13H10.5L11.5 11V7Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="bevel"
        fill="none"
      />
      {/* Window */}
      <circle cx="9" cy="7.5" r="1.2" stroke="currentColor" strokeWidth="0.8" fill="none" />
      {/* Fins */}
      <path
        d="M6.5 9.5L4 12L6 12.5"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinejoin="bevel"
        fill="none"
      />
      <path
        d="M11.5 9.5L14 12L12 12.5"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinejoin="bevel"
        fill="none"
      />
      {/* Flame */}
      <path
        d="M8 13L7.5 15.5L9 14.5L10.5 15.5L10 13"
        stroke="#F43F5E"
        strokeWidth="0.9"
        strokeLinejoin="bevel"
        fill="none"
      />
    </svg>
  )
}

export { PlaygroundIcon }
