export type GameStatus = 'playing' | 'queueing' | 'completion'

export interface Game {
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
}

export interface GameQueueData {
  games: Game[]
}
