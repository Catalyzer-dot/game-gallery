import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

type IconStyle = 'pixel' | 'cyberpunk' | 'anime'

interface IconStyleContextValue {
  style: IconStyle
  setStyle: (s: IconStyle) => void
  toggle: () => void
}

const STORAGE_KEY = 'icon-style'

function getInitialStyle(): IconStyle {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'pixel' || saved === 'cyberpunk' || saved === 'anime') return saved
  return 'cyberpunk'
}

const FAVICONS: Record<IconStyle, string> = {
  pixel: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none"><rect x="10" y="4" width="4" height="4" rx=".5" fill="#A78BFA"/><rect x="14" y="4" width="4" height="4" rx=".5" fill="#A78BFA"/><rect x="18" y="4" width="4" height="4" rx=".5" fill="#7C3AED"/><rect x="6" y="8" width="4" height="4" rx=".5" fill="#A78BFA"/><rect x="6" y="12" width="4" height="4" rx=".5" fill="#7C3AED"/><rect x="6" y="16" width="4" height="4" rx=".5" fill="#7C3AED"/><rect x="14" y="16" width="4" height="4" rx=".5" fill="#F43F5E"/><rect x="18" y="16" width="4" height="4" rx=".5" fill="#F43F5E"/><rect x="22" y="16" width="4" height="4" rx=".5" fill="#F43F5E"/><rect x="6" y="20" width="4" height="4" rx=".5" fill="#A78BFA"/><rect x="22" y="20" width="4" height="4" rx=".5" fill="#7C3AED"/><rect x="10" y="24" width="4" height="4" rx=".5" fill="#A78BFA"/><rect x="14" y="24" width="4" height="4" rx=".5" fill="#7C3AED"/><rect x="18" y="24" width="4" height="4" rx=".5" fill="#7C3AED"/><rect x="22" y="24" width="4" height="4" rx=".5" fill="#A78BFA"/></svg>`,
  cyberpunk: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M22 5H10L6 9V23L10 27H22L26 23V17H16V19H24V22L21 25H11L8 22V10L11 7H21L24 10V13H26V9Z" stroke="#A78BFA" stroke-width="1.5" stroke-linejoin="bevel" fill="none"/><path d="M14 17H26V19H14Z" fill="#F43F5E"/></svg>`,
  anime: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M16 3C10.5 3 7 5 5 8.5C3.5 11.5 3.5 15 5 18C5.5 19 6.5 19.5 7.5 19H16V16H8C7.5 15 7.5 12.5 8.5 10.5C9.5 8.5 12 7 16 7C20 7 22.5 8.5 23.5 10.5C24.5 12.5 24.5 15 23.5 17C22.5 19 20 20.5 16 20.5V24.5C21.5 24.5 25 22.5 27 19.5C28.5 16.5 28.5 13 27 10C25 6 21.5 3 16 3Z" fill="#A78BFA" opacity=".85"/><rect x="14" y="15" width="12" height="4" rx="2" fill="#F43F5E"/></svg>`,
}

const IconStyleContext = createContext<IconStyleContextValue>({
  style: 'cyberpunk',
  setStyle: () => {},
  toggle: () => {},
})

function IconStyleProvider({ children }: { children: React.ReactNode }) {
  const [style, setStyleState] = useState<IconStyle>(getInitialStyle)

  const setStyle = useCallback((s: IconStyle) => {
    setStyleState(s)
    localStorage.setItem(STORAGE_KEY, s)
  }, [])

  const STYLES: IconStyle[] = ['pixel', 'cyberpunk', 'anime']

  const toggle = useCallback(() => {
    const idx = STYLES.indexOf(style)
    setStyle(STYLES[(idx + 1) % STYLES.length])
  }, [style, setStyle])

  // Sync favicon with icon style
  useEffect(() => {
    const svg = FAVICONS[style]
    const url = `data:image/svg+xml,${encodeURIComponent(svg)}`
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.type = 'image/svg+xml'
    link.href = url
  }, [style])

  return (
    <IconStyleContext.Provider value={{ style, setStyle, toggle }}>
      {children}
    </IconStyleContext.Provider>
  )
}

function useIconStyle() {
  return useContext(IconStyleContext)
}

export { IconStyleProvider, useIconStyle }
export type { IconStyle }
