import type { GameQueueData, Game } from '../types'
import { GITHUB_USER_API, getGitHubRepoApiUrl, getGitHubFileApiUrl } from '../constants/api'

// ==================== Types ====================

interface GitHubConfig {
  token: string
  owner: string
  repo: string
}

interface GitHubFileResponse {
  content: string
  sha: string
}

interface FetchGamesResult {
  data: GameQueueData | null
  error?: string
}

interface UpdateGamesResult {
  success: boolean
  games?: Game[]
  error?: string
}

// ==================== Constants ====================

const STORAGE_KEY = 'github_config'
const FILE_PATH = 'games.json'

class GitHubService {
  private config: GitHubConfig | null = null

  constructor() {
    this.loadConfig()
  }

  loadConfig(): GitHubConfig | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)

      // Happy Path: 没有配置直接返回
      if (!stored) {
        return null
      }

      this.config = JSON.parse(stored)

      // Happy Path: 配置解析失败
      if (!this.config) {
        return null
      }

      // 强制修正为正确的owner和repo
      if (this.config.owner !== 'catalyzer-dot' || this.config.repo !== 'game-gallery') {
        this.config.owner = 'catalyzer-dot'
        this.config.repo = 'game-gallery'
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config))
      }

      return this.config
    } catch (error) {
      console.error('[GitHubService] Failed to load config:', error)
      return null
    }
  }

  saveConfig(config: GitHubConfig): void {
    this.config = config
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  }

  clearConfig(): void {
    this.config = null
    localStorage.removeItem(STORAGE_KEY)
  }

  isConfigured(): boolean {
    return this.config !== null && !!this.config.token && !!this.config.owner && !!this.config.repo
  }

  getConfig(): GitHubConfig | null {
    return this.config
  }

  private getApiUrl(path: string = ''): string | null {
    if (!this.config) {
      console.error('[GitHubService] Cannot get API URL: GitHub not configured')
      return null
    }

    return getGitHubFileApiUrl(this.config.owner, this.config.repo, path)
  }

  private getHeaders(): HeadersInit | null {
    if (!this.config) {
      console.error('[GitHubService] Cannot get headers: GitHub not configured')
      return null
    }

    return {
      Authorization: `Bearer ${this.config.token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    }
  }

  /**
   * 从 GitHub 获取游戏列表
   * @returns 成功时返回游戏数据，失败时返回 null
   */
  async fetchGames(): Promise<GameQueueData | null> {
    // Happy Path: GitHub 未配置
    if (!this.isConfigured()) {
      console.error('[GitHubService] Cannot fetch games: GitHub not configured')
      return null
    }

    const apiUrl = this.getApiUrl(FILE_PATH)
    const headers = this.getHeaders()

    // Happy Path: 无法获取 API URL 或 headers
    if (!apiUrl || !headers) {
      return null
    }

    try {
      const response = await fetch(apiUrl, { headers })

      // Happy Path: 文件不存在，返回空数据（这是正常情况）
      if (response.status === 404) {
        console.log('[GitHubService] Games file not found, returning empty data')
        return { games: [] }
      }

      // Happy Path: API 请求失败
      if (!response.ok) {
        console.error(`[GitHubService] GitHub API error: ${response.status} ${response.statusText}`)
        return null
      }

      const data = await response.json()

      // Happy Path: 响应数据无效
      if (!data || !data.content) {
        console.error('[GitHubService] Invalid response data from GitHub')
        return null
      }

      // 解码 base64 内容，支持中文字符
      const content = decodeURIComponent(escape(atob(data.content)))
      const gameData: GameQueueData = JSON.parse(content)

      return gameData
    } catch (error) {
      console.error('[GitHubService] Failed to fetch games:', error)
      return null
    }
  }

  /**
   * 更新 GitHub 上的游戏列表
   * @param gameData - 游戏数据
   * @param commitMessage - 提交消息
   * @returns 成功时返回更新后的游戏列表，失败时返回 null
   */
  async updateGames(gameData: GameQueueData, commitMessage: string): Promise<Game[] | null> {
    return this.concurrentUpdateGames(() => gameData.games, commitMessage)
  }

  /**
   * 并发安全地更新 GitHub 上的游戏列表
   * 使用 SHA 进行乐观锁控制，防止并发写入时数据丢失
   * @param updater - 更新函数，接收当前游戏列表，返回新的游戏列表
   * @param commitMessage - Git 提交消息
   * @returns 成功时返回更新后的游戏列表，失败时返回 null
   */
  async concurrentUpdateGames(
    updater: (currentGames: Game[]) => Game[],
    commitMessage: string
  ): Promise<Game[] | null> {
    // Happy Path: GitHub 未配置
    if (!this.isConfigured()) {
      console.error('[GitHubService] Cannot update games: GitHub not configured')
      return null
    }

    const apiUrl = this.getApiUrl(FILE_PATH)
    const headers = this.getHeaders()

    // Happy Path: 无法获取 API URL 或 headers
    if (!apiUrl || !headers) {
      return null
    }

    try {
      // 1. 获取最新内容和 SHA
      const fileData = await this.fetchRawFile()

      // Happy Path: 获取文件失败
      if (!fileData) {
        return null
      }

      const { data, sha } = fileData

      // 解析当前游戏列表
      let currentGames: Game[] = []
      if (data) {
        try {
          const content = decodeURIComponent(escape(atob(data.content)))
          const parsed: GameQueueData = JSON.parse(content)
          currentGames = parsed.games
        } catch (error) {
          console.error('[GitHubService] Failed to parse current games data:', error)
          return null
        }
      }

      // 2. 应用更新函数
      const newGames = updater(currentGames)
      const newGameData: GameQueueData = { games: newGames }

      // 3. 使用 SHA 进行乐观锁保存
      const content = JSON.stringify(newGameData, null, 2)
      const base64Content = btoa(unescape(encodeURIComponent(content)))

      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          message: commitMessage,
          content: base64Content,
          sha: sha, // 包含 SHA 防止文件在获取后被修改
        }),
      })

      // Happy Path: 冲突检测
      if (response.status === 409) {
        console.error('[GitHubService] Conflict detected: Remote file has changed')
        return null
      }

      // Happy Path: API 请求失败
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error(
          `[GitHubService] GitHub API error: ${response.status} ${errorData.message || response.statusText}`
        )
        return null
      }

      console.log('[GitHubService] Successfully updated games.json on GitHub')
      return newGames
    } catch (error) {
      console.error('[GitHubService] Failed to update games:', error)
      return null
    }
  }

  /**
   * 获取 GitHub 上的原始文件内容
   * @returns 成功时返回文件数据和 SHA，失败时返回 null
   */
  private async fetchRawFile(): Promise<{ data: GitHubFileResponse | null; sha?: string } | null> {
    const apiUrl = this.getApiUrl(FILE_PATH)
    const headers = this.getHeaders()

    // Happy Path: 无法获取 API URL 或 headers
    if (!apiUrl || !headers) {
      return null
    }

    try {
      const response = await fetch(apiUrl, { headers })

      // Happy Path: 文件不存在（这是正常情况，返回空数据）
      if (response.status === 404) {
        console.log('[GitHubService] File not found, will create new file')
        return { data: null }
      }

      // Happy Path: API 请求失败
      if (!response.ok) {
        console.error(`[GitHubService] GitHub API error: ${response.status} ${response.statusText}`)
        return null
      }

      const data = await response.json()

      // Happy Path: 响应数据无效
      if (!data) {
        console.error('[GitHubService] Invalid response data')
        return null
      }

      return { data, sha: data.sha }
    } catch (error) {
      console.error('[GitHubService] Failed to fetch raw file:', error)
      return null
    }
  }

  /**
   * 获取当前 GitHub 用户信息
   * @param token - GitHub Personal Access Token
   * @returns 成功时返回用户名，失败时返回 null
   */
  async getCurrentUser(token: string): Promise<string | null> {
    // Happy Path: token 无效
    if (!token || token.trim() === '') {
      console.error('[GitHubService] Cannot get current user: Invalid token')
      return null
    }

    try {
      const response = await fetch(GITHUB_USER_API, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      })

      // Happy Path: API 请求失败
      if (!response.ok) {
        console.error(
          `[GitHubService] Failed to get user: ${response.status} ${response.statusText}`
        )
        return null
      }

      const data = await response.json()

      // Happy Path: 响应数据无效
      if (!data || !data.login) {
        console.error('[GitHubService] Invalid user data response')
        return null
      }

      return data.login
    } catch (error) {
      console.error('[GitHubService] Failed to get current user:', error)
      return null
    }
  }

  /**
   * 测试 GitHub 连接是否正常
   * @returns 连接成功返回 true，失败返回 false
   */
  async testConnection(): Promise<boolean> {
    // Happy Path: GitHub 未配置
    if (!this.isConfigured()) {
      console.error('[GitHubService] Cannot test connection: GitHub not configured')
      return false
    }

    // Happy Path: config 不存在（理论上不会发生，但为了类型安全）
    if (!this.config) {
      console.error('[GitHubService] Config is null')
      return false
    }

    const headers = this.getHeaders()

    // Happy Path: 无法获取 headers
    if (!headers) {
      return false
    }

    try {
      const repoUrl = getGitHubRepoApiUrl(this.config.owner, this.config.repo)
      const response = await fetch(repoUrl, { headers })

      // Happy Path: API 请求失败
      if (!response.ok) {
        console.error(
          `[GitHubService] Connection test failed: ${response.status} ${response.statusText}`
        )
        return false
      }

      console.log('[GitHubService] Connection test succeeded')
      return true
    } catch (error) {
      console.error('[GitHubService] Connection test failed:', error)
      return false
    }
  }
}

// ==================== Service Instance ====================

const githubService = new GitHubService()

// ==================== Exports ====================

export type { FetchGamesResult, UpdateGamesResult }
export { GitHubService, githubService }
