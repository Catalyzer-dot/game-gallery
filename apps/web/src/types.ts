// ==================== Types ====================

type GameStatus = 'playing' | 'queueing' | 'completion'

interface Genre {
  id: string
  description: string
}

interface Game {
  id: string
  name: string
  status: GameStatus
  addedAt: string
  lastUpdated: string
  steamUrl?: string
  coverImage?: string
  positivePercentage?: number
  totalReviews?: number
  releaseDate?: string
  comingSoon?: boolean
  isEarlyAccess?: boolean
  genres?: Genre[]
  isPinned?: boolean
}

interface GameQueueData {
  games: Game[]
}

// ==================== Exports ====================

export type { GameStatus, Genre, Game, GameQueueData }
