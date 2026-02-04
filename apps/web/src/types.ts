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
  positivePercentage?: number // 全球好评率
  totalReviews?: number // 全球评论数
  chinesePositivePercentage?: number // 中文区好评率
  chineseTotalReviews?: number // 中文区评论数
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
