// ==================== Types ====================

// Auth Types
interface User {
  id: string
  steam_id: string
  username: string
  avatar_url: string
  profile_url: string
  is_active: boolean
  last_login_at: string
  created_at: string
  updated_at: string
}

interface AuthResponse {
  user: User
  token: string
}

interface LoginUrlResponse {
  login_url: string
}

interface RefreshTokenResponse {
  token: string
}

interface LogoutResponse {
  message: string
}

// Game Types
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

export type {
  User,
  AuthResponse,
  LoginUrlResponse,
  RefreshTokenResponse,
  LogoutResponse,
  GameStatus,
  Genre,
  Game,
  GameQueueData,
}
