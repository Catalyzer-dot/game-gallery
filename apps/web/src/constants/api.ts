// ==================== Steam API ====================

/**
 * Steam Store 搜索 API
 * 用于搜索 Steam 商店中的游戏
 * @param term - 搜索关键词（需要 URL 编码）
 * @param l - 语言代码（如 schinese 表示简体中文）
 * @param cc - 国家/地区代码（如 CN 表示中国）
 * @returns 返回游戏搜索结果列表，包含游戏基本信息
 */
export const STEAM_SEARCH_API = 'https://store.steampowered.com/api/storesearch/'

/**
 * Steam App 详情 API
 * 用于获取指定游戏的详细信息
 * @param appids - 游戏 ID（逗号分隔可查询多个）
 * @param l - 语言代码（如 schinese）
 * @param cc - 国家/地区代码（如 CN）
 * @returns 返回游戏详细信息，包括名称、描述、分类、发布日期等
 */
export const STEAM_APP_DETAILS_API = 'https://store.steampowered.com/api/appdetails'

/**
 * Steam 评论统计 API
 * 用于获取游戏的评论统计数据（好评率、总评论数等）
 * @param appId - 游戏 ID（需要拼接到 URL 路径中，如 /appreviews/{appId}）
 * @param json - 返回格式（固定为 1 表示 JSON）
 * @param language - 评论语言筛选（all 表示所有语言）
 * @param purchase_type - 购买类型筛选（all 表示所有类型）
 * @param num_per_page - 每页数量（设为 0 仅获取统计信息，不返回评论内容）
 * @note 该 API 无需认证，但有速率限制，建议请求间隔至少 1 秒
 * @returns 返回评论统计信息（好评数、差评数、总评论数）
 */
export const STEAM_REVIEWS_API_BASE = 'https://store.steampowered.com/appreviews'

// ==================== CORS 代理 ====================

/**
 * CORS 代理列表
 * 用于解决浏览器跨域请求 Steam API 的问题
 * @note 按优先级排序，请求失败时自动切换到下一个代理
 * @note 代理服务可能不稳定，建议定期检查可用性
 */
export const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
]

// ==================== GitHub API ====================

/**
 * GitHub API 基础地址
 * 用于访问 GitHub REST API v3
 */
export const GITHUB_API_BASE = 'https://api.github.com'

/**
 * GitHub 用户信息 API
 * 用于获取当前认证用户的信息
 * @requires Authorization header with Bearer token
 * @returns 返回用户信息（login, name, avatar_url 等）
 */
export const GITHUB_USER_API = `${GITHUB_API_BASE}/user`

/**
 * 获取 GitHub 仓库 API 地址
 * @param owner - 仓库所有者
 * @param repo - 仓库名称
 * @returns 返回仓库 API 完整地址
 */
export const getGitHubRepoApiUrl = (owner: string, repo: string) =>
  `${GITHUB_API_BASE}/repos/${owner}/${repo}`

/**
 * 获取 GitHub 仓库文件内容 API 地址
 * @param owner - 仓库所有者
 * @param repo - 仓库名称
 * @param path - 文件路径
 * @returns 返回文件内容 API 完整地址
 */
export const getGitHubFileApiUrl = (owner: string, repo: string, path: string) =>
  `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`

// ==================== Backend API ====================

/**
 * 后端 API 基础地址
 * 根据环境变量自动选择正确的 API 地址
 * 开发环境: http://localhost:8080
 * 生产环境: 通过 VITE_API_URL 环境变量配置
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://degenerates.site'

// ==================== Auth API ====================

/**
 * 获取 Steam 登录 URL
 * 用于获取 Steam OpenID 登录链接
 * @param return_url - 可选，登录成功后的前端回调 URL
 * @returns 返回包含 login_url 的响应对象
 * @note 需要将用户重定向到返回的 login_url
 */
export const AUTH_LOGIN_API = `${API_BASE_URL}/api/auth/login`

/**
 * Steam 登录回调处理
 * Steam OpenID 验证成功后会重定向到此接口
 * @note 此接口由后端处理，前端通常不直接调用
 * @returns 返回用户信息和 JWT token
 */
export const AUTH_CALLBACK_API = `${API_BASE_URL}/api/auth/callback`

/**
 * 刷新 JWT Token
 * 使用当前 token 获取新的 JWT token
 * @requires Authorization header with Bearer token
 * @returns 返回新的 JWT token
 * @note Token 有效期 24 小时，建议在过期前 1 小时刷新
 */
export const AUTH_REFRESH_API = `${API_BASE_URL}/api/auth/refresh`

/**
 * 用户登出
 * 退出登录（客户端应删除本地存储的 token）
 * @requires Authorization header with Bearer token
 * @returns 返回成功消息
 * @note 服务端不维护 token 黑名单，token 失效由客户端处理
 */
export const AUTH_LOGOUT_API = `${API_BASE_URL}/api/auth/logout`
