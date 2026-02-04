import {
  STEAM_SEARCH_API,
  STEAM_APP_DETAILS_API,
  STEAM_REVIEWS_API_BASE,
  CORS_PROXIES,
} from '../constants/api'

// ==================== Request Types ====================
interface SearchGamesRequest {
  query: string
}

interface GetGameDetailsRequest {
  appId: number
}

interface GetGameReviewsRequest {
  appId: number
}

interface GetGameReleaseDateRequest {
  appId: number
}

// ==================== Response Types ====================
interface SteamGame {
  id: number
  name: string
  steamUrl: string
  coverImage: string
  tags: string[]
  positivePercentage: number | null
  totalReviews: number | null
  averagePlaytime: number | null
  releaseDate: string | null
  comingSoon: boolean | null
  isEarlyAccess: boolean | null
  genres: { id: string; description: string }[] | null
}

interface GameReleaseInfo {
  releaseDate: string | null
  comingSoon: boolean | null
  isEarlyAccess: boolean | null
  genres: { id: string; description: string }[] | null
}

interface GameReviewsInfo {
  positivePercentage: number | null // 全球好评率
  totalReviews: number | null // 全球评论数
  chinesePositivePercentage: number | null // 中文区好评率
  chineseTotalReviews: number | null // 中文区评论数
}

// ==================== Steam API Types ====================
interface SteamSearchItem {
  id: number
  type: string
  name: string
  tiny_image: string
  steamUrl: string
  coverImage: string
  tags: string[]
}

interface SteamSearchResponse {
  items: SteamSearchItem[]
}

interface SteamReviewSummary {
  total_positive: number
  total_negative: number
  total_reviews: number
}

interface SteamReviewsResponse {
  query_summary: SteamReviewSummary
}

interface SteamAppDetailsData {
  name: string
  steam_appid: number
  header_image: string
  short_description: string
  background: string
  genres: { id: string; description: string }[]
  categories: { id: number; description: string }[]
  release_date: {
    coming_soon: boolean
    date: string
  }
}

interface SteamAppDetails {
  [appId: string]: {
    success: boolean
    data: SteamAppDetailsData
  }
}

class SteamService {
  /**
   * 通过 CORS 代理请求 URL，失败时自动重试其他代理
   * @param url 要请求的目标 URL
   * @param context 上下文信息，用于日志记录
   * @returns 成功时返回 Response 对象，失败时返回 null
   */
  private async fetchWithProxy(url: string, context: string): Promise<Response | null> {
    for (let i = 0; i < CORS_PROXIES.length; i++) {
      const proxy = CORS_PROXIES[i]
      try {
        const proxyUrl = `${proxy}${encodeURIComponent(url)}`
        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        })

        if (!response.ok) {
          console.warn(
            `[SteamService] Proxy ${i + 1}/${CORS_PROXIES.length} failed for ${context}: ${response.status}`
          )
          continue
        }

        console.log(`[SteamService] Proxy ${i + 1}/${CORS_PROXIES.length} succeeded for ${context}`)
        return response
      } catch (error) {
        console.error(
          `[SteamService] Proxy ${i + 1}/${CORS_PROXIES.length} error for ${context}:`,
          error
        )
        continue
      }
    }

    console.error(`[SteamService] All proxies failed for ${context}`)
    return null
  }

  /**
   * 搜索 Steam 游戏
   * @param params 搜索参数
   * @returns 成功时返回游戏列表，失败时返回 null
   */
  async search(params: SearchGamesRequest): Promise<SteamGame[] | null> {
    const { query } = params

    if (!query.trim()) {
      return []
    }

    const searchUrl = `${STEAM_SEARCH_API}?term=${encodeURIComponent(query)}&l=schinese&cc=CN`
    const response = await this.fetchWithProxy(searchUrl, `search: ${query}`)

    if (!response) {
      return null
    }

    try {
      const data = (await response.json()) as SteamSearchResponse

      if (!data.items || data.items.length === 0) {
        console.log('[SteamService] No items found in search response')
        return []
      }

      const games: SteamGame[] = data.items
        .filter((item) => item.type === 'app')
        .slice(0, 10)
        .map((item) => ({
          id: item.id,
          name: item.name,
          steamUrl: `https://store.steampowered.com/app/${item.id}`,
          coverImage:
            item.tiny_image ||
            `https://cdn.cloudflare.steamstatic.com/steam/apps/${item.id}/capsule_sm_120.jpg`,
          tags: [],
          positivePercentage: null,
          totalReviews: null,
          averagePlaytime: null,
          releaseDate: null,
          comingSoon: null,
          isEarlyAccess: null,
          genres: null,
        }))

      console.log(`[SteamService] Successfully found ${games.length} games`)
      return games
    } catch (error) {
      console.error('[SteamService] Error parsing search response:', error)
      return null
    }
  }

  /**
   * 获取游戏详细信息
   * @param params 请求参数
   * @returns 成功时返回游戏详情，失败时返回 null
   */
  async getGameDetails(params: GetGameDetailsRequest): Promise<SteamAppDetailsData | null> {
    const { appId } = params
    const detailsUrl = `${STEAM_APP_DETAILS_API}?appids=${appId}&l=schinese&cc=CN`
    const response = await this.fetchWithProxy(detailsUrl, `appdetails: ${appId}`)

    if (!response) {
      return null
    }

    try {
      const data = (await response.json()) as SteamAppDetails

      if (!data[appId]?.success) {
        console.warn(`[SteamService] Steam API returned unsuccessful for app ${appId}`)
        return null
      }

      return data[appId].data
    } catch (error) {
      console.error(`[SteamService] Error parsing appdetails response for ${appId}:`, error)
      return null
    }
  }

  /**
   * 获取游戏发布日期和抢先体验状态
   * @param params 请求参数
   * @returns 成功时返回发布信息，失败时返回各字段为 null 的对象
   */
  async getGameReleaseDate(params: GetGameReleaseDateRequest): Promise<GameReleaseInfo> {
    const { appId } = params
    const details = await this.getGameDetails({ appId })

    if (!details) {
      return { releaseDate: null, comingSoon: null, isEarlyAccess: null, genres: null }
    }

    const isEarlyAccess = details.genres?.some((genre) => genre.id === '70') || false

    console.log(
      `[SteamService] Game ${appId} - isEarlyAccess: ${isEarlyAccess}, genres:`,
      details.genres?.map((g) => `${g.id}:${g.description}`).join(', ')
    )

    return {
      releaseDate: details.release_date?.date || null,
      comingSoon: details.release_date?.coming_soon ?? null,
      isEarlyAccess,
      genres: details.genres || null,
    }
  }

  /**
   * 获取游戏评论统计（同时获取全球和中文评论）
   * @param params 请求参数
   * @returns 成功时返回评论信息，失败时返回各字段为 null 的对象
   */
  async getGameReviews(params: GetGameReviewsRequest): Promise<GameReviewsInfo> {
    const { appId } = params

    // 并行获取全球评论和中文评论
    const [globalReviews, chineseReviews] = await Promise.all([
      this.fetchReviewsByLanguage(appId, 'all'),
      this.fetchReviewsByLanguage(appId, 'schinese'),
    ])

    return {
      positivePercentage: globalReviews.positivePercentage,
      totalReviews: globalReviews.totalReviews,
      chinesePositivePercentage: chineseReviews.positivePercentage,
      chineseTotalReviews: chineseReviews.totalReviews,
    }
  }

  /**
   * 根据语言获取评论统计
   * @param appId 游戏ID
   * @param language 语言代码（all=全球, schinese=简体中文）
   * @returns 好评率和评论数
   */
  private async fetchReviewsByLanguage(
    appId: number,
    language: string
  ): Promise<{ positivePercentage: number | null; totalReviews: number | null }> {
    const reviewsUrl = `${STEAM_REVIEWS_API_BASE}/${appId}?json=1&language=${language}&purchase_type=all&num_per_page=0`
    const response = await this.fetchWithProxy(reviewsUrl, `reviews: ${appId} (${language})`)

    if (!response) {
      return { positivePercentage: null, totalReviews: null }
    }

    try {
      const data = (await response.json()) as SteamReviewsResponse

      if (!data.query_summary) {
        console.warn(
          `[SteamService] No query_summary in reviews response for app ${appId} (${language})`
        )
        return { positivePercentage: null, totalReviews: null }
      }

      const { total_positive, total_negative, total_reviews } = data.query_summary

      let positivePercentage: number | null = null
      const totalReviews = total_reviews || null

      if (total_positive !== undefined && total_negative !== undefined) {
        const total = total_positive + total_negative
        if (total > 0) {
          positivePercentage = Math.round((total_positive / total) * 100)
        }
      }

      return { positivePercentage, totalReviews }
    } catch (error) {
      console.error(
        `[SteamService] Error parsing reviews response for ${appId} (${language}):`,
        error
      )
      return { positivePercentage: null, totalReviews: null }
    }
  }
}

// ==================== Service Instance ====================

const steamService = new SteamService()

// ==================== Exports ====================

export type {
  SearchGamesRequest,
  GetGameDetailsRequest,
  GetGameReviewsRequest,
  GetGameReleaseDateRequest,
  SteamGame,
  GameReleaseInfo,
  GameReviewsInfo,
}

export { SteamService, steamService }
