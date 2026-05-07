/**
 * Unified icon exports that switch between pixel, cyberpunk, and anime style
 * based on IconStyleContext. All consumers import from here.
 */

import React from 'react'
import { useIconStyle } from './IconStyleContext'
import type { IconStyle } from './IconStyleContext'

import * as Pixel from './PixelIcons'
import * as Cyberpunk from './CyberpunkIcons'
import * as Anime from './AnimeIcons'
import { GamesIcon as PixelGames } from './GamesIcon'
import { GamesIcon as CyberpunkGames } from './CyberpunkGamesIcon'
import { PlaygroundIcon as PixelPlayground } from './PlaygroundIcon'
import { PlaygroundIcon as CyberpunkPlayground } from './CyberpunkPlaygroundIcon'

interface IconProps {
  size?: number
  className?: string
  strokeWidth?: number
}

type IconComponent = React.FC<IconProps>

function createSwitchIcon(variants: Record<IconStyle, IconComponent>, displayName: string) {
  function SwitchIcon(props: IconProps) {
    const { style } = useIconStyle()
    const Component = variants[style]
    return <Component {...props} />
  }
  SwitchIcon.displayName = displayName
  return SwitchIcon
}

const SettingsIcon = createSwitchIcon(
  { pixel: Pixel.SettingsIcon, cyberpunk: Cyberpunk.SettingsIcon, anime: Anime.SettingsIcon },
  'SettingsIcon'
)
const Loader2 = createSwitchIcon(
  { pixel: Pixel.Loader2, cyberpunk: Cyberpunk.Loader2, anime: Anime.Loader2 },
  'Loader2'
)
const Play = createSwitchIcon(
  { pixel: Pixel.Play, cyberpunk: Cyberpunk.Play, anime: Anime.Play },
  'Play'
)
const Bookmark = createSwitchIcon(
  { pixel: Pixel.Bookmark, cyberpunk: Cyberpunk.Bookmark, anime: Anime.Bookmark },
  'Bookmark'
)
const CheckCircle = createSwitchIcon(
  { pixel: Pixel.CheckCircle, cyberpunk: Cyberpunk.CheckCircle, anime: Anime.CheckCircle },
  'CheckCircle'
)
const PackageOpen = createSwitchIcon(
  { pixel: Pixel.PackageOpen, cyberpunk: Cyberpunk.PackageOpen, anime: Anime.PackageOpen },
  'PackageOpen'
)
const Plus = createSwitchIcon(
  { pixel: Pixel.Plus, cyberpunk: Cyberpunk.Plus, anime: Anime.Plus },
  'Plus'
)
const Trash2 = createSwitchIcon(
  { pixel: Pixel.Trash2, cyberpunk: Cyberpunk.Trash2, anime: Anime.Trash2 },
  'Trash2'
)
const Pin = createSwitchIcon(
  { pixel: Pixel.Pin, cyberpunk: Cyberpunk.Pin, anime: Anime.Pin },
  'Pin'
)
const AlertTriangle = createSwitchIcon(
  { pixel: Pixel.AlertTriangle, cyberpunk: Cyberpunk.AlertTriangle, anime: Anime.AlertTriangle },
  'AlertTriangle'
)
const LogIn = createSwitchIcon(
  { pixel: Pixel.LogIn, cyberpunk: Cyberpunk.LogIn, anime: Anime.LogIn },
  'LogIn'
)
const LogOut = createSwitchIcon(
  { pixel: Pixel.LogOut, cyberpunk: Cyberpunk.LogOut, anime: Anime.LogOut },
  'LogOut'
)
const X = createSwitchIcon({ pixel: Pixel.X, cyberpunk: Cyberpunk.X, anime: Anime.X }, 'X')
const Search = createSwitchIcon(
  { pixel: Pixel.Search, cyberpunk: Cyberpunk.Search, anime: Anime.Search },
  'Search'
)
const GamesIcon = createSwitchIcon(
  { pixel: PixelGames, cyberpunk: CyberpunkGames, anime: Anime.GamesIcon },
  'GamesIcon'
)
const PlaygroundIcon = createSwitchIcon(
  { pixel: PixelPlayground, cyberpunk: CyberpunkPlayground, anime: Anime.PlaygroundIcon },
  'PlaygroundIcon'
)
const LogoIcon = createSwitchIcon(
  { pixel: Pixel.LogoIcon, cyberpunk: Cyberpunk.LogoIcon, anime: Anime.LogoIcon },
  'LogoIcon'
)

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
